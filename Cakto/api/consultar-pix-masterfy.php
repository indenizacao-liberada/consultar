<?php
/**
 * Endpoint de Consulta de PIX MasterFy
 * GET ou POST /api/consultar-pix-masterfy.php?id=...
 */

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/masterfy-client.php';

$txId = $_GET['id'] ?? $_GET['hash'] ?? null;
if (!$txId) {
    $rawInput = file_get_contents('php://input');
    $inputData = json_decode($rawInput, true);
    $txId = $inputData['id'] ?? $inputData['hash'] ?? null;
}

if (!$txId && !empty($_SESSION['masterfy_active_tx']['id'])) {
    $txId = $_SESSION['masterfy_active_tx']['id'];
}

if (!$txId) {
    pepper_json_response(400, ['success' => false, 'error' => 'ID da transação não fornecido.']);
}

$client = new MasterFyClient();
$response = $client->getTransaction((string)$txId);

if (!$response['success'] || empty($response['data'])) {
    pepper_json_response(502, [
        'success' => false,
        'error' => 'Falha ao consultar transação na MasterFy.',
        'details' => $response['error'] ?? null
    ]);
}

$resData = $response['data'];
$status = strtoupper($resData['status'] ?? 'PENDING');
$hasPaidAt = !empty($resData['paidAt']);
$isPaid = ($status === 'PAID' || $status === 'APPROVED' || $status === 'COMPLETED' || $hasPaidAt);

pepper_json_response(200, [
    'success' => true,
    'id' => $txId,
    'status' => strtolower($status),
    'payment_status' => strtolower($status),
    'is_paid' => $isPaid,
    'paid_at' => $resData['paidAt'] ?? null,
    'amount' => $resData['amount'] ?? null
]);
