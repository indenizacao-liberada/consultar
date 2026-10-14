<?php
/**
 * Endpoint de Consulta de Status PIX Pepper
 * GET /api/consultar-pix.php
 * 
 * Consulta diretamente na Pepper o status da transação vinculada à sessão PHP do visitante.
 * Sem banco de dados. Valida hash, valor e status diretamente da fonte oficial.
 */

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/pepper-client.php';

// Apenas aceitar requisições GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    pepper_json_response(405, [
        'success' => false,
        'error' => 'Método não permitido. Utilize GET.'
    ]);
}

// 1. Identificar a transação associada à sessão do visitante
if (empty($_SESSION['pepper_active_tx']) || empty($_SESSION['pepper_active_tx']['hash'])) {
    pepper_json_response(404, [
        'success' => false,
        'error' => 'Nenhuma transação PIX ativa encontrada na sessão atual.',
        'payment_status' => 'not_found',
        'is_paid' => false
    ]);
}

$activeTx = &$_SESSION['pepper_active_tx'];
$txHash = $activeTx['hash'];

// Se a transação já foi confirmada como paga nesta sessão, retorna imediatamente
if (!empty($activeTx['paid']) && ($activeTx['payment_status'] ?? '') === 'paid') {
    pepper_json_response(200, [
        'success' => true,
        'hash' => $txHash,
        'payment_status' => 'paid',
        'is_paid' => true,
        'amount' => $activeTx['amount'],
        'formatted_amount' => 'R$ ' . number_format($activeTx['amount'] / 100, 2, ',', '.')
    ]);
}

// Rate limiting: evitar excesso de requisições repetitivas na API
if (!pepper_rate_limit('consultar_pix', 40, 60)) {
    pepper_json_response(429, [
        'success' => false,
        'error' => 'Limite de consultas atingido. Aguarde alguns segundos.',
        'payment_status' => $activeTx['payment_status'] ?? 'waiting_payment',
        'is_paid' => false
    ]);
}

// 2. Consultar a Pepper utilizando o token privado e endpoint oficial GET /transactions/{hash}
$client = new PepperClient();
$response = $client->getTransaction($txHash);

if (!$response['success'] || empty($response['data'])) {
    // Retorna o último status conhecido sem quebrar a tela do usuário
    pepper_json_response(200, [
        'success' => false,
        'hash' => $txHash,
        'payment_status' => $activeTx['payment_status'] ?? 'waiting_payment',
        'is_paid' => false,
        'error' => 'Não foi possível atualizar o status junto à Pepper no momento.'
    ]);
}

$pepperData = $response['data'];
$rawStatus = $pepperData['payment_status'] ?? $pepperData['status'] ?? 'waiting_payment';

// Mapeamento e normalização dos status Pepper:
// waiting_payment, paid, processing, refused, cancelled, refunded, chargeback
$currentStatus = strtolower(trim((string)$rawStatus));

// 3. Validação rigorosa de integridade antes de confirmar aprovação
$isApproved = ($currentStatus === 'paid');

if ($isApproved) {
    // Conferir identificador da transação retornado
    $retHash = $pepperData['hash'] ?? $pepperData['transaction'] ?? $txHash;
    if ($retHash !== $txHash) {
        pepper_json_response(400, [
            'success' => false,
            'error' => 'Divergência de identificador de transação retornado pela Pepper.',
            'is_paid' => false
        ]);
    }

    // Conferir valor (se presente na resposta em centavos ou formato decimal)
    if (isset($pepperData['amount'])) {
        $pepperAmount = (int)$pepperData['amount'];
        if ($pepperAmount > 0 && abs($pepperAmount - $activeTx['amount']) > 5) {
            pepper_json_response(400, [
                'success' => false,
                'error' => 'Divergência de valor na confirmação do pagamento.',
                'is_paid' => false
            ]);
        }
    }

    // Atualizar referência na sessão
    $activeTx['payment_status'] = 'paid';
    $activeTx['paid'] = true;
    $activeTx['paid_at'] = time();
} else {
    $activeTx['payment_status'] = $currentStatus;
}

// 4. Retornar ao frontend apenas os campos necessários
pepper_json_response(200, [
    'success' => true,
    'hash' => $txHash,
    'payment_status' => $currentStatus,
    'is_paid' => $isApproved,
    'amount' => $activeTx['amount'],
    'formatted_amount' => 'R$ ' . number_format($activeTx['amount'] / 100, 2, ',', '.')
]);
