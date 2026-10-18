<?php
/**
 * Cliente HTTP para a API MasterFy
 * Comunicação direta via cURL HTTPS com suporte a TLS e Header Authorization: Bearer.
 * Produto Oficial: Opina Pro
 */

if (!defined('PEPPER_EXEC') && !defined('MASTERFY_EXEC')) {
    define('MASTERFY_EXEC', true);
}

class MasterFyClient {
    private string $apiKey;
    private string $baseUrl;

    public function __construct(?string $apiKey = null, ?string $baseUrl = null) {
        $this->apiKey  = $apiKey ?? (defined('MASTERFY_API_KEY') ? MASTERFY_API_KEY : 'y1LsIYpJm1MiPqVQKr3PCG2X6XawyRMau8k5OTyVu3c');
        $this->baseUrl = rtrim($baseUrl ?? (defined('MASTERFY_API_BASE_URL') ? MASTERFY_API_BASE_URL : 'https://api.masterfypagamentos.com'), '/');
    }

    /**
     * Executa uma requisição HTTP via cURL com validação TLS ativa.
     */
    public function request(string $method, string $endpoint, ?array $body = null): array {
        $url = $this->baseUrl . '/' . ltrim($endpoint, '/');

        if (!function_exists('curl_init')) {
            return [
                'success' => false,
                'status_code' => 500,
                'error' => 'A extensão PHP cURL não está instalada no servidor.',
                'data' => null
            ];
        }

        $ch = curl_init();

        $headers = [
            'Accept: application/json',
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey,
            'User-Agent: MasterFy-PHP-Client/1.0'
        ];

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $methodUpper = strtoupper($method);
        if ($methodUpper === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($body !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
            }
        } elseif ($methodUpper !== 'GET') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $methodUpper);
            if ($body !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
            }
        }

        $rawResponse = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        $curlErrno = curl_errno($ch);
        curl_close($ch);

        if ($curlErrno !== 0) {
            return [
                'success' => false,
                'status_code' => 0,
                'error' => "Erro de conexão cURL (#{$curlErrno}): {$curlError}",
                'data' => null
            ];
        }

        $decoded = json_decode($rawResponse, true);
        $isSuccess = ($httpCode >= 200 && $httpCode < 300);

        return [
            'success' => $isSuccess,
            'status_code' => $httpCode,
            'data' => $decoded,
            'error' => $isSuccess ? null : ($decoded['message'] ?? "Erro HTTP {$httpCode}"),
            'raw' => $rawResponse
        ];
    }

    /**
     * Cria transação PIX na MasterFy
     * POST /v1/payment
     */
    public function createPixTransaction(array $params): array {
        $amount = (int)($params['amount'] ?? 6190);
        $customer = $params['customer'] ?? [];

        $cleanCpf = preg_replace('/\D/', '', (string)($customer['document'] ?? $customer['taxId'] ?? $customer['cpf'] ?? ''));
        $cleanPhone = preg_replace('/\D/', '', (string)($customer['phone'] ?? $customer['phone_number'] ?? ''));
        if (strlen($cleanPhone) < 10) {
            $cleanPhone = '11987654321';
        }
        $formattedPhone = str_starts_with($cleanPhone, '55') ? ('+' . $cleanPhone) : ('+55' . $cleanPhone);

        $payload = [
            'amount' => $amount,
            'currency' => 'BRL',
            'method' => 'PIX',
            'description' => (string)($params['title'] ?? 'Opina Pro'),
            'externalRef' => 'order_' . time() . '_' . mt_rand(1000, 9999),
            'payer' => [
                'name' => (string)($customer['name'] ?? 'Cliente Opina Pro'),
                'email' => (string)($customer['email'] ?? 'cliente@gmail.com'),
                'phone' => $formattedPhone,
                'taxId' => $cleanCpf
            ],
            'items' => [
                [
                    'name' => (string)($params['title'] ?? 'Opina Pro'),
                    'price' => $amount,
                    'quantity' => 1,
                    'type' => 'DIGITAL'
                ]
            ]
        ];

        return $this->request('POST', 'v1/payment', $payload);
    }

    /**
     * Consulta transação na MasterFy pelo ID
     * GET /v1/payment/{id}
     */
    public function getTransaction(string $txId): array {
        return $this->request('GET', 'v1/payment/' . urlencode($txId));
    }
}
