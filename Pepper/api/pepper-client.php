<?php
/**
 * Cliente HTTP para a API Pepper
 * Comunicação direta via cURL HTTPS com suporte a TLS e Bearer Token.
 * Sem banco de dados.
 */

if (!defined('PEPPER_EXEC')) {
    http_response_code(403);
    exit('Acesso direto proibido.');
}

class PepperClient {
    private string $apiToken;
    private string $baseUrl;
    private bool $isMock;

    public function __construct(?string $apiToken = null, ?string $baseUrl = null) {
        $this->apiToken = $apiToken ?? PEPPER_API_TOKEN;
        $this->baseUrl = rtrim($baseUrl ?? PEPPER_API_BASE_URL, '/');
        $this->isMock = (defined('PEPPER_MOCK_MODE') && PEPPER_MOCK_MODE);
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
                'error' => 'A extensão PHP cURL não está instalada ou habilitada no servidor.',
                'data' => null
            ];
        }

        $ch = curl_init();

        $headers = [
            'Accept: application/json',
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiToken,
            'User-Agent: Pepper-PHP-Pure/1.0'
        ];

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 7);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $methodUpper = strtoupper($method);
        if ($methodUpper === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($body !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_SLASHES));
            }
        } elseif ($methodUpper === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            if ($body !== null) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_SLASHES));
            }
        } elseif ($methodUpper !== 'GET') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $methodUpper);
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
            'error' => $isSuccess ? null : ($decoded['message'] ?? $decoded['error'] ?? "Erro HTTP {$httpCode}"),
            'raw' => $rawResponse
        ];
    }

    /**
     * Cria uma transação PIX na Pepper.
     * Endpoint oficial: POST /transactions
     */
    public function createPixTransaction(array $params): array {
        // Se estiver em modo simulado (para testes sem cobranças reais)
        if ($this->isMock) {
            return $this->mockCreatePixTransaction($params);
        }

        $payload = [
            'payment_method' => 'pix',
            'amount' => (int)$params['amount'],
            'installments' => 1,
            'cart' => [
                [
                    'offer_hash' => $params['offer_hash'],
                    'price' => (int)$params['amount'],
                    'quantity' => 1,
                    'operation_type' => 1,
                    'title' => $params['title'] ?? PEPPER_PRODUCT_TITLE
                ]
            ],
            'customer' => [
                'name' => $params['customer']['name'],
                'email' => $params['customer']['email'],
                'phone_number' => $params['customer']['phone_number'],
                'document' => $params['customer']['document']
            ],
            'webhook_url' => $params['webhook_url'] ?? PEPPER_WEBHOOK_URL
        ];

        // Rastreamento UTM caso disponível
        if (!empty($params['tracking'])) {
            $payload['tracking'] = $params['tracking'];
        }

        $res = $this->request('POST', '/transactions', $payload);

        // Gera QR Code Base64 caso a API da Pepper retorne null
        if ($res['success'] && !empty($res['data']['pix']['pix_qr_code']) && empty($res['data']['pix']['qr_code_base64'])) {
            $res['data']['pix']['qr_code_base64'] = PepperQRCodeHelper::generateDataUri($res['data']['pix']['pix_qr_code'], 260);
        }

        return $res;
    }

    /**
     * Consulta uma transação pelo Hash oficial.
     * Endpoint oficial: GET /transactions/{hash}
     */
    public function getTransaction(string $hash): array {
        if ($this->isMock) {
            return $this->mockGetTransaction($hash);
        }

        return $this->request('GET', '/transactions/' . urlencode($hash));
    }

    /**
     * Lista produtos cadastrados na conta Pepper.
     * Endpoint oficial: GET /products
     */
    public function listProducts(): array {
        return $this->request('GET', '/products');
    }

    /**
     * Cria um novo produto na Pepper.
     * Endpoint oficial: POST /products
     */
    public function createProduct(array $productData): array {
        return $this->request('POST', '/products', $productData);
    }

    /**
     * Cria uma oferta para um produto existente.
     */
    public function createOffer(string $productHash, array $offerData): array {
        // Tenta endpoint de oferta
        $res = $this->request('POST', '/products/' . urlencode($productHash) . '/offers', $offerData);
        if (!$res['success']) {
            $res = $this->request('POST', '/offers', array_merge(['product_hash' => $productHash], $offerData));
        }
        return $res;
    }

    // -------------------------------------------------------------
    // MOCK SIMULATOR (Testes Seguros Sem Cobranças Reais)
    // -------------------------------------------------------------
    private function mockCreatePixTransaction(array $params): array {
        $mockHash = 'tx_mock_' . bin2hex(random_bytes(8));
        $pixPayload = '00020126580014br.gov.bcb.pix0136' . bin2hex(random_bytes(16)) . '5204000053039865405' . number_format($params['amount'] / 100, 2, '.', '') . '5802BR5925PEPPER MEIOS DE PAGAMENTO6009SAO PAULO62070503***6304' . strtoupper(bin2hex(random_bytes(2)));

        $svgDataUri = PepperQRCodeHelper::generateDataUri($pixPayload, 260);

        $mockData = [
            'hash' => $mockHash,
            'transaction' => $mockHash,
            'payment_status' => 'waiting_payment',
            'amount' => (int)$params['amount'],
            'payment_method' => 'pix',
            'pix' => [
                'pix_qr_code' => $pixPayload,
                'pix_url' => 'https://pix.pepperpay.com.br/pay/' . $mockHash,
                'qr_code_base64' => $svgDataUri
            ],
            '_mock' => true,
            '_message' => 'Modo Simulado Ativo (Nenhuma cobrança real efetuada. Configure PEPPER_API_TOKEN para modo produção).'
        ];

        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION['mock_transactions'][$mockHash] = [
                'status' => 'waiting_payment',
                'amount' => (int)$params['amount'],
                'offer_hash' => $params['offer_hash'],
                'created_at' => time()
            ];
        }

        return [
            'success' => true,
            'status_code' => 200,
            'data' => $mockData,
            'error' => null
        ];
    }

    private function mockGetTransaction(string $hash): array {
        $tx = $_SESSION['mock_transactions'][$hash] ?? null;
        $status = 'waiting_payment';

        if ($tx) {
            // No modo de simulação, se o usuário aguardar 15 segundos ou se passar ?simulate_paid=1,
            // podemos simular a aprovação sem cobrar nada, testando a transição de estado completa.
            if (!empty($_GET['simulate_paid']) || (time() - $tx['created_at'] >= 18)) {
                $status = 'paid';
                $_SESSION['mock_transactions'][$hash]['status'] = 'paid';
            } else {
                $status = $tx['status'];
            }
            $amount = $tx['amount'];
            $offerHash = $tx['offer_hash'];
        } else {
            $amount = PEPPER_DEFAULT_AMOUNT;
            $offerHash = PEPPER_OFFER_HASH;
        }

        return [
            'success' => true,
            'status_code' => 200,
            'data' => [
                'hash' => $hash,
                'transaction' => $hash,
                'payment_status' => $status,
                'amount' => $amount,
                'offer_hash' => $offerHash,
                'payment_method' => 'pix',
                '_mock' => true
            ],
            'error' => null
        ];
    }
}
