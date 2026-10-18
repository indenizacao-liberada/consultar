<?php
/**
 * Endpoint de Geração de PIX PodPay
 * POST /api/gerar-pix-podpay.php
 */

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/podpay-client.php';
require_once __DIR__ . '/qr-code-helper.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    pepper_json_response(405, ['success' => false, 'error' => 'Método não permitido. Utilize POST.']);
}

$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true);
if (!is_array($inputData)) {
    $inputData = $_POST;
}

// 1. Dados Camuflados do Gateway
$randomCustomer = pepper_generate_random_customer();
$gatewayCustomer = [
    'name' => !empty($inputData['gateway_name']) ? pepper_sanitize($inputData['gateway_name']) : $randomCustomer['name'],
    'email' => !empty($inputData['gateway_email']) ? pepper_sanitize($inputData['gateway_email']) : $randomCustomer['email'],
    'phone' => !empty($inputData['gateway_phone']) ? pepper_clean_phone($inputData['gateway_phone']) : $randomCustomer['phone_number'],
    'document' => !empty($inputData['gateway_cpf']) && pepper_validate_cpf($inputData['gateway_cpf']) ? pepper_clean_cpf($inputData['gateway_cpf']) : $randomCustomer['document']
];

// 2. Determinar valor em centavos
$requestedVal = $inputData['amount'] ?? $inputData['valor'] ?? $_GET['amount'] ?? $_GET['valor'] ?? null;
$offerInfo = pepper_get_offer_by_amount($requestedVal);
$amount = $offerInfo['amount'];
$title = "Opina Pro";

// 3. Comunicação com a PodPay
$client = new PodPayClient();
$response = $client->createPixTransaction([
    'amount' => $amount,
    'title' => $title,
    'customer' => $gatewayCustomer
]);

if (!$response['success'] || empty($response['data'])) {
    pepper_json_response(502, [
        'success' => false,
        'error' => 'Falha ao processar PIX junto à PodPay: ' . ($response['error'] ?? 'Resposta inválida'),
        'details' => $response['error'] ?? null
    ]);
}

$txData = $response['data']['data'] ?? $response['data'];
$txId = $txData['id'] ?? $txData['transactionId'] ?? null;
$status = $txData['status'] ?? 'pending';
$pixCode = $txData['pixQrCode'] ?? $txData['pix_qr_code'] ?? '';
$pixUrl = $txData['pixQrCodeImage'] ?? '';

if (empty($pixUrl) && !empty($pixCode)) {
    $pixUrl = PepperQRCodeHelper::generateDataUri($pixCode, 260);
}

$_SESSION['podpay_active_tx'] = [
    'id' => $txId,
    'amount' => $amount,
    'pix_qr_code' => $pixCode,
    'pix_url' => $pixUrl,
    'status' => $status,
    'created_at' => time()
];

pepper_json_response(200, [
    'success' => true,
    'hash' => $txId,
    'payment_status' => $status,
    'amount' => $amount,
    'formatted_amount' => 'R$ ' . number_format($amount / 100, 2, ',', '.'),
    'pix' => [
        'pix_qr_code' => $pixCode,
        'pix_url' => $pixUrl,
        'qr_code_base64' => $pixUrl
    ]
]);
