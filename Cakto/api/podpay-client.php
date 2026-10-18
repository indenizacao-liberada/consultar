<?php
/**
 * Cliente HTTP para a API PodPay
 * Comunicação direta via cURL HTTPS com suporte a TLS e Header x-api-key.
 * Produto Oficial: Opina Pro
 */

if (!defined('PEPPER_EXEC') && !defined('PODPAY_EXEC')) {
    define('PODPAY_EXEC', true);
}

class PodPayClient {
    private string $secretKey;
    private string $publicKey;
    private string $baseUrl;

    public function __construct(?string $secretKey = null, ?string $baseUrl = null, ?string $publicKey = null) {
        $this->secretKey = $secretKey ?? (defined('PODPAY_SECRET_KEY') ? PODPAY_SECRET_KEY : 'sk_live_Tbluwv5UG1NXfzdke6LTu2Tjx6uf2v5');
        $this->publicKey = $publicKey ?? (defined('PODPAY_PUBLIC_KEY') ? PODPAY_PUBLIC_KEY : 'pk_live_jWEWIFENNCwR5C6u');
        $this->baseUrl   = rtrim($baseUrl ?? (defined('PODPAY_API_BASE_URL') ? PODPAY_API_BASE_URL : 'https://api.podpay.app'), '/');
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
            'x-api-key: ' . $this->secretKey,
            'User-Agent: PodPay-PHP-Client/1.0'
        ];

        // Idempotency Key se for POST
        $methodUpper = strtoupper($method);
        if ($methodUpper === 'POST') {
            $headers[] = 'X-Idempotency-Key: ' . sprintf(
                '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );
        }

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

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
            'error' => $isSuccess ? null : ($decoded['error']['message'] ?? $decoded['message'] ?? "Erro HTTP {$httpCode}"),
            'raw' => $rawResponse
        ];
    }

    /**
     * Cria transação PIX na PodPay
     * POST /v1/transactions
     */
    public function createPixTransaction(array $params): array {
        $amount = (int)($params['amount'] ?? 6190);
        $customer = $params['customer'] ?? [];

        $cleanCpf = preg_replace('/\D/', '', (string)($customer['document'] ?? $customer['cpf'] ?? ''));
        $cleanPhone = preg_replace('/\D/', '', (string)($customer['phone'] ?? $customer['phone_number'] ?? ''));
        if (strlen($cleanPhone) < 10) {
            $cleanPhone = '11987654321';
        }

        $payload = [
            'paymentMethod' => 'pix',
            'amount' => $amount,
            'customer' => [
                'name' => (string)($customer['name'] ?? 'Cliente Opina Pro'),
                'email' => (string)($customer['email'] ?? 'cliente@gmail.com'),
                'phone' => $cleanPhone,
                'document' => [
                    'type' => 'cpf',
                    'number' => $cleanCpf
                ]
            ],
            'items' => [
                [
                    'title' => (string)($params['title'] ?? 'Opina Pro'),
                    'unitPrice' => $amount,
                    'quantity' => 1,
                    'tangible' => false
                ]
            ]
        ];

        return $this->request('POST', 'v1/transactions', $payload);
    }

    /**
     * Consulta transação na PodPay pelo ID
     * GET /v1/transactions/{id}
     */
    public function getTransaction(string $txId): array {
        return $this->request('GET', 'v1/transactions/' . urlencode($txId));
    }
}
