<?php
/**
 * Endpoint de Geração de PIX Pepper
 * POST /api/gerar-pix.php
 * 
 * Processa a requisição do frontend, valida os dados, força o valor e oferta definidos no backend,
 * comunica com a Pepper via cURL seguro, salva a referência da transação na sessão PHP
 * e devolve os dados para exibição do QR Code e Copia e Cola.
 */

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/pepper-client.php';

// Apenas aceitar requisições POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    pepper_json_response(405, [
        'success' => false,
        'error' => 'Método não permitido. Utilize POST.'
    ]);
}

// Rate limit: máximo 12 tentativas de geração por minuto por sessão
if (!pepper_rate_limit('gerar_pix', 12, 60)) {
    pepper_json_response(429, [
        'success' => false,
        'error' => 'Muitas requisições. Aguarde alguns instantes antes de tentar novamente.'
    ]);
}

// Obter dados do corpo da requisição (JSON ou Form-Data)
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true);
if (!is_array($inputData)) {
    $inputData = $_POST;
}

// Verificar se já existe uma transação PIX ativa e válida na sessão (menos de 15 minutos)
// Evita criar cobranças duplicadas caso o visitante recarregue a página
$forceNew = !empty($inputData['force_new']) || !empty($_GET['force_new']);
if (!$forceNew && !empty($_SESSION['pepper_active_tx'])) {
    $existing = $_SESSION['pepper_active_tx'];
    $txAge = time() - ($existing['created_at'] ?? 0);
    // Se foi criada há menos de 15 minutos e não está recusada/cancelada
    if ($txAge < 900 && ($existing['payment_status'] ?? '') === 'waiting_payment') {
        pepper_json_response(200, [
            'success' => true,
            'hash' => $existing['hash'],
            'payment_status' => $existing['payment_status'],
            'amount' => $existing['amount'],
            'formatted_amount' => 'R$ ' . number_format($existing['amount'] / 100, 2, ',', '.'),
            'pix' => [
                'pix_qr_code' => $existing['pix_qr_code'],
                'pix_url' => $existing['pix_url'],
                'qr_code_base64' => $existing['qr_code_base64']
            ],
            'reused_session' => true
        ]);
    }
}

// ==============================================================================
// 1. MANOBRA DE PRIVACIDADE E SEGURANÇA DO GATEWAY
// Conforme especificado, NENHUM dado oficial do funil (nome, CPF, e-mail, telefone)
// é enviado para o gateway. Todos os dados enviados para a API de pagamento
// são gerados aleatoriamente (nome plausível, CPF matematicamente válido, e-mail e celular).
// ==============================================================================
$gatewayCustomer = null;
if (!empty($inputData['gateway_name']) && !empty($inputData['gateway_cpf']) && pepper_validate_cpf((string)$inputData['gateway_cpf'])) {
    $gatewayCustomer = [
        'name' => pepper_sanitize((string)$inputData['gateway_name']),
        'email' => !empty($inputData['gateway_email']) ? pepper_sanitize((string)$inputData['gateway_email']) : '',
        'phone_number' => !empty($inputData['gateway_phone']) ? pepper_clean_phone((string)$inputData['gateway_phone']) : '',
        'document' => pepper_clean_cpf((string)$inputData['gateway_cpf'])
    ];
}

$randomCustomer = pepper_generate_random_customer();
if (!$gatewayCustomer || empty($gatewayCustomer['name']) || strlen($gatewayCustomer['document']) !== 11) {
    $gatewayCustomer = $randomCustomer;
} else {
    if (empty($gatewayCustomer['email'])) {
        $gatewayCustomer['email'] = $randomCustomer['email'];
    }
    if (empty($gatewayCustomer['phone_number'])) {
        $gatewayCustomer['phone_number'] = $randomCustomer['phone_number'];
    }
}

// 2. Determinar oferta e valor oficiais cadastrados na Pepper
$requestedVal = $inputData['amount'] ?? $inputData['valor'] ?? $_GET['amount'] ?? $_GET['valor'] ?? $inputData['step'] ?? null;
$offerInfo = pepper_get_offer_by_amount($requestedVal);

$amount = $offerInfo['amount'];
$offerHash = $offerInfo['offer_hash'];
$offerTitle = $offerInfo['title'];

// Rastreamento UTM caso o visitante tenha parâmetros na URL
$tracking = [];
$utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck'];
foreach ($utmParams as $utm) {
    if (!empty($inputData[$utm])) {
        $tracking[$utm] = pepper_sanitize($inputData[$utm]);
    } elseif (!empty($_GET[$utm])) {
        $tracking[$utm] = pepper_sanitize($_GET[$utm]);
    }
}

// 3. Montar requisição oficial para a Pepper
// Produto e Item sempre com a camuflagem "Dramas Clube: Plano Vitalício"
$client = new PepperClient();
$response = $client->createPixTransaction([
    'amount' => $amount,
    'offer_hash' => $offerHash,
    'title' => $offerTitle,
    'customer' => [
        'name' => $gatewayCustomer['name'],
        'email' => $gatewayCustomer['email'],
        'phone_number' => $gatewayCustomer['phone_number'],
        'document' => $gatewayCustomer['document']
    ],
    'tracking' => $tracking,
    'webhook_url' => PEPPER_WEBHOOK_URL
]);

if (!$response['success'] || empty($response['data'])) {
    pepper_json_response(502, [
        'success' => false,
        'error' => 'Falha ao processar PIX junto à Pepper: ' . ($response['error'] ?? 'Resposta inválida'),
        'details' => $response['error'] ?? null
    ]);
}

$resData = $response['data'];
$txHash = $resData['hash'] ?? $resData['transaction'] ?? null;
$paymentStatus = $resData['payment_status'] ?? 'waiting_payment';

// Extrair dados do PIX
$pixData = $resData['pix'] ?? [];
$pixQrCode = $pixData['pix_qr_code'] ?? $pixData['qrcode'] ?? '';
$pixUrl = $pixData['pix_url'] ?? '';
$qrCodeBase64 = $pixData['qr_code_base64'] ?? null;

// Se a Pepper retornar qr_code_base64 como nulo, gerar a imagem a partir do código copia e cola
if ((empty($qrCodeBase64) || $qrCodeBase64 === 'null') && !empty($pixQrCode)) {
    $qrCodeBase64 = PepperQRCodeHelper::generateDataUri($pixQrCode, 260);
}

if (!$txHash || empty($pixQrCode)) {
    pepper_json_response(502, [
        'success' => false,
        'error' => 'A Pepper não retornou o código PIX completo.',
        'raw_response' => $resData
    ]);
}

// 4. Salvar referência temporária na Sessão PHP (sem banco de dados)
$_SESSION['pepper_active_tx'] = [
    'hash' => $txHash,
    'amount' => $amount,
    'offer_hash' => $offerHash,
    'payment_status' => $paymentStatus,
    'pix_qr_code' => $pixQrCode,
    'pix_url' => $pixUrl,
    'qr_code_base64' => $qrCodeBase64,
    'created_at' => time(),
    'paid' => false
];

// 5. Retornar ao frontend apenas as informações necessárias
pepper_json_response(200, [
    'success' => true,
    'hash' => $txHash,
    'payment_status' => $paymentStatus,
    'amount' => $amount,
    'formatted_amount' => 'R$ ' . number_format($amount / 100, 2, ',', '.'),
    'pix' => [
        'pix_qr_code' => $pixQrCode,
        'pix_url' => $pixUrl,
        'qr_code_base64' => $qrCodeBase64
    ]
]);
