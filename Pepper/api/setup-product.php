<?php
/**
 * Procedimento Administrativo Protegido de Setup de Produto e Oferta
 * Executado UMA ÚNICA VEZ para consultar ou cadastrar o produto na Pepper.
 * 
 * Uso via Navegador: /api/setup-product.php?admin_key=admin_pepper_setup_2026
 * Uso via CLI: php api/setup-product.php
 */

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/pepper-client.php';

// Proteção de Acesso
$isCli = (php_sapi_name() === 'cli');
$adminKey = $_GET['admin_key'] ?? $_POST['admin_key'] ?? '';

if (!$isCli && !hash_equals(PEPPER_ADMIN_SECRET, $adminKey)) {
    pepper_json_response(403, [
        'status' => 'error',
        'message' => 'Acesso negado. Forneça o parâmetro ?admin_key correto definido em PEPPER_ADMIN_SECRET.'
    ]);
}

$client = new PepperClient();

// Se estiver em modo simulado
if (PEPPER_MOCK_MODE) {
    $response = [
        'status' => 'info',
        'mode' => 'MOCK / SIMULADO',
        'message' => 'O sistema está em modo de teste simulado seguro (sem cobranças reais).',
        'product' => [
            'title' => PEPPER_PRODUCT_TITLE,
            'description' => PEPPER_PRODUCT_DESCRIPTION,
            'product_hash' => PEPPER_PRODUCT_HASH ?: 'prod_mock_ebook_receitas',
            'offer_hash' => PEPPER_OFFER_HASH ?: 'off_mock_receitas_3582',
            'price_cents' => PEPPER_DEFAULT_AMOUNT,
            'price_formatted' => 'R$ ' . number_format(PEPPER_DEFAULT_AMOUNT / 100, 2, ',', '.')
        ],
        'instructions' => 'Para ativar o modo de produção real, insira seu PEPPER_API_TOKEN no arquivo api/config.php ou em um arquivo .env na raiz do projeto.'
    ];
    pepper_json_response(200, $response);
}

// 1. Consultar produtos existentes na conta Pepper
$productsResponse = $client->listProducts();
$targetProduct = null;
$targetOffer = null;

if ($productsResponse['success'] && !empty($productsResponse['data'])) {
    $items = $productsResponse['data']['data'] ?? $productsResponse['data'];
    if (is_array($items)) {
        foreach ($items as $prod) {
            $prodTitle = $prod['title'] ?? $prod['name'] ?? '';
            if (mb_stripos($prodTitle, 'receitas') !== false || mb_stripos($prodTitle, 'emagrecimento') !== false) {
                $targetProduct = $prod;
                break;
            }
        }
    }
}

// 2. Se não existir, cadastrar o produto
if (!$targetProduct) {
    $newProductPayload = [
        'title' => PEPPER_PRODUCT_TITLE,
        'description' => PEPPER_PRODUCT_DESCRIPTION,
        'support_email' => 'suporte@pepperpay.com.br',
        'type' => 'digital',
        'category' => 'Saúde e Bem-Estar'
    ];
    $createProdResponse = $client->createProduct($newProductPayload);
    if ($createProdResponse['success'] && !empty($createProdResponse['data'])) {
        $targetProduct = $createProdResponse['data']['data'] ?? $createProdResponse['data'];
    }
}

$productHash = $targetProduct['hash'] ?? $targetProduct['id'] ?? PEPPER_PRODUCT_HASH;

// 3. Consultar ou criar oferta correspondente (R$ 35,82 = 3582 centavos)
if ($productHash && empty(PEPPER_OFFER_HASH)) {
    $offerPayload = [
        'title' => 'Oferta Oficial - E-book de Receitas para Emagrecimento',
        'price' => PEPPER_DEFAULT_AMOUNT,
        'payment_methods' => ['pix']
    ];
    $createOfferResponse = $client->createOffer($productHash, $offerPayload);
    if ($createOfferResponse['success'] && !empty($createOfferResponse['data'])) {
        $targetOffer = $createOfferResponse['data']['data'] ?? $createOfferResponse['data'];
    }
}

$offerHash = $targetOffer['hash'] ?? $targetOffer['id'] ?? PEPPER_OFFER_HASH;

pepper_json_response(200, [
    'status' => 'success',
    'message' => 'Procedimento de consulta e configuração do produto concluído com sucesso.',
    'product_title' => PEPPER_PRODUCT_TITLE,
    'product_description' => PEPPER_PRODUCT_DESCRIPTION,
    'product_hash' => $productHash,
    'offer_hash' => $offerHash,
    'price_cents' => PEPPER_DEFAULT_AMOUNT,
    'price_formatted' => 'R$ ' . number_format(PEPPER_DEFAULT_AMOUNT / 100, 2, ',', '.')
]);
