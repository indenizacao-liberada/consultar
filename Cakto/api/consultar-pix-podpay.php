<?php
/**
 * Endpoint de Consulta de PIX PodPay
 * GET ou POST /api/consultar-pix-podpay.php?id=tx_...
 */

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/podpay-client.php';

$txId = $_GET['id'] ?? $_GET['hash'] ?? null;
if (!$txId) {
    $rawInput = file_get_contents('php://input');
    $inputData = json_decode($rawInput, true);
    $txId = $inputData['id'] ?? $inputData['hash'] ?? null;
}

if (!$txId && !empty($_SESSION['podpay_active_tx']['id'])) {
    $txId = $_SESSION['podpay_active_tx']['id'];
}

if (!$txId) {
    pepper_json_response(400, ['success' => false, 'error' => 'ID da transação não fornecido.']);
}

$client = new PodPayClient();
$response = $client->getTransaction((string)$txId);

if (!$response['success'] || empty($response['data'])) {
    pepper_json_response(502, [
        'success' => false,
        'error' => 'Falha ao consultar transação na PodPay.',
        'details' => $response['error'] ?? null
    ]);
}

$txData = $response['data']['data'] ?? $response['data'];
$status = strtolower($txData['status'] ?? 'pending');
$isPaid = ($status === 'paid' || $status === 'completed' || $status === 'approved');

pepper_json_response(200, [
    'success' => true,
    'id' => $txId,
    'status' => $status,
    'payment_status' => $status,
    'is_paid' => $isPaid,
    'amount' => $txData['amount'] ?? null
]);
