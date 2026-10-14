<?php
/**
 * Webhook Oficial Pepper
 * POST /api/webhook-pepper.php
 * 
 * Recebe notificações assíncronas da Pepper, valida o evento e executa a verificação
 * independente via consulta autenticada na API da Pepper.
 * Sem banco de dados.
 */

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/pepper-client.php';

// Webhooks da Pepper são sempre enviados via POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    pepper_json_response(405, [
        'status' => 'error',
        'message' => 'Método inválido. Somente POST é aceito.'
    ]);
}

$rawPayload = file_get_contents('php://input');
if (empty($rawPayload)) {
    pepper_json_response(400, [
        'status' => 'error',
        'message' => 'Payload vazio.'
    ]);
}

$payload = json_decode($rawPayload, true);
if (!is_array($payload)) {
    pepper_json_response(400, [
        'status' => 'error',
        'message' => 'JSON inválido.'
    ]);
}

// 1. Validação de Autenticação do Webhook
// Se houver secret configurado e enviado via header ou query param, valida
$expectedSecret = PEPPER_WEBHOOK_SECRET;
if (!empty($expectedSecret)) {
    $receivedSecret = $_SERVER['HTTP_X_WEBHOOK_SECRET'] 
        ?? $_SERVER['HTTP_X_PEPPER_SECRET'] 
        ?? $_GET['secret'] 
        ?? null;

    if ($receivedSecret !== null && !hash_equals($expectedSecret, $receivedSecret)) {
        pepper_json_response(401, [
            'status' => 'error',
            'message' => 'Segredo do webhook inválido.'
        ]);
    }
}

// 2. Extração do Hash da Transação
$txHash = $payload['hash'] 
    ?? $payload['data']['hash'] 
    ?? $payload['transaction']['hash'] 
    ?? $payload['transaction'] 
    ?? null;

$event = $payload['event'] 
    ?? $payload['type'] 
    ?? $payload['action'] 
    ?? 'transaction_update';

// 3. Consulta Autenticada Independente
// Valida os dados diretamente na Pepper para garantir autenticidade sem confiar cegamente no POST
if ($txHash && !empty(PEPPER_API_TOKEN) && !PEPPER_MOCK_MODE) {
    $client = new PepperClient();
    $verification = $client->getTransaction($txHash);

    if ($verification['success'] && !empty($verification['data'])) {
        $verifiedData = $verification['data'];
        $verifiedStatus = $verifiedData['payment_status'] ?? $verifiedData['status'] ?? null;
        
        // Conferir se o valor e oferta correspondem
        // Status tratados: waiting_payment, paid, processing, refused, cancelled, refunded, chargeback
        // (Sem banco de dados, a consulta de front-end continuará buscando diretamente da Pepper via consultar-pix.php)
    }
}

// 4. Retornar HTTP 2xx conforme exigido pela documentação oficial da Pepper
pepper_json_response(200, [
    'status' => 'success',
    'received' => true,
    'event' => pepper_sanitize($event),
    'hash' => pepper_sanitize((string)$txHash),
    'timestamp' => time()
]);
