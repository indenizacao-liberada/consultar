<?php
/**
 * Configurações da API Pepper
 * 
 * Este arquivo define as credenciais e o catálogo de produtos e ofertas da Pepper.
 * Em nenhum momento dados reais do site (nomes de taxas, governo, indenização ou dados reais do cliente)
 * são transmitidos à Pepper. Todos os itens aparecem no gateway como "Dramas Clube: Plano Vitalício".
 */

if (!defined('PEPPER_EXEC')) {
    http_response_code(403);
    exit('Acesso direto proibido.');
}

// Função auxiliar para obter variáveis de ambiente
if (!function_exists('pepper_env')) {
    function pepper_env(string $key, ?string $default = null): ?string {
        $val = getenv($key);
        if ($val !== false && $val !== '') {
            return $val;
        }
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
            return $_ENV[$key];
        }
        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
            return $_SERVER[$key];
        }
        return $default;
    }
}

// Carregar .env se existir na raiz do projeto ou na pasta api
$envPaths = [
    __DIR__ . '/.env',
    dirname(__DIR__) . '/.env'
];
foreach ($envPaths as $envPath) {
    if (file_exists($envPath) && is_readable($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            if (str_contains($line, '=')) {
                [$k, $v] = explode('=', $line, 2);
                $k = trim($k);
                $v = trim($v, " \t\n\r\0\x0B\"'");
                if (getenv($k) === false) {
                    putenv("{$k}={$v}");
                    $_ENV[$k] = $v;
                }
            }
        }
        break;
    }
}

// 1. URL Base Oficial da API Pepper
define('PEPPER_API_BASE_URL', pepper_env('PEPPER_API_BASE_URL', 'https://api.cloud.pepperpay.com.br/public/v1'));

// 2. Credenciais Oficiais Pepper
define('PEPPER_API_TOKEN', pepper_env('PEPPER_API_TOKEN', 'iZhIOl3xL2T1wQGcu5J3dFEjpJo4NlGFYLxsdIDpoAM6ljBN5dqL5OjgZLbs'));
define('PEPPER_WEBHOOK_SECRET', pepper_env('PEPPER_WEBHOOK_SECRET', 'EKSpolloP8nglVP7EmbRy3xezXLT0Shp66AoRPrQ4VEJQEgrUaAgpaKq4pyh'));

// 3. Produto e Ofertas Oficiais Cadastrados na Pepper
define('PEPPER_PRODUCT_HASH', pepper_env('PEPPER_PRODUCT_HASH', 'puyx0gjeg1'));
define('PEPPER_PRODUCT_TITLE', pepper_env('PEPPER_PRODUCT_TITLE', 'Dramas Clube: Plano Vitalício'));
define('PEPPER_PRODUCT_COVER', 'https://d1dtnm4cmgaw4x.cloudfront.net/3810833441/products/pvlgar06hux2g8p2gmuco9h6u');

// Mapeamento Oficial das 5 Ofertas (Checkout Principal + 4 Upsells)
// Nunca envia dados do site real para a Pepper!
const PEPPER_OFFERS = [
    'main' => [
        'amount'     => 6190, // R$ 61,90
        'offer_hash' => 'cyatn',
        'title'      => 'Plano: Vitalicio',
        'step'       => 'checkout_principal'
    ],
    'upsell_01' => [
        'amount'     => 3582, // R$ 35,82
        'offer_hash' => 'vzoyc',
        'title'      => '35,82',
        'step'       => 'upsell_01'
    ],
    'upsell_02' => [
        'amount'     => 2790, // R$ 27,90
        'offer_hash' => 'iv24z',
        'title'      => '27,90',
        'step'       => 'upsell_02'
    ],
    'upsell_03' => [
        'amount'     => 1970, // R$ 19,70
        'offer_hash' => 'wynlc',
        'title'      => '19,70',
        'step'       => 'upsell_03'
    ],
    'upsell_04' => [
        'amount'     => 4560, // R$ 45,60
        'offer_hash' => 'wag3k',
        'title'      => '45,60',
        'step'       => 'upsell_04'
    ]
];

// Valor padrão caso nenhum seja informado (Main: 61,90 = 6190 centavos)
define('PEPPER_DEFAULT_AMOUNT', 6190);
define('PEPPER_OFFER_HASH', 'cyatn');

/**
 * Localiza a oferta exata na Pepper por valor (em centavos ou decimal) ou chave de etapa.
 */
function pepper_get_offer_by_amount($val): array {
    // Se for string de etapa ('main', 'upsell_01', etc.)
    if (is_string($val) && isset(PEPPER_OFFERS[$val])) {
        return PEPPER_OFFERS[$val];
    }

    // Normaliza para centavos inteiros
    $cents = 0;
    if (is_numeric($val)) {
        $floatVal = (float)$val;
        // Se já está em centavos (ex: 6190)
        if ($floatVal >= 1000) {
            $cents = (int)round($floatVal);
        } else {
            // Se está em reais (ex: 61.90)
            $cents = (int)round($floatVal * 100);
        }
    }

    foreach (PEPPER_OFFERS as $offer) {
        if (abs($offer['amount'] - $cents) <= 2) {
            return $offer;
        }
    }

    // Padrão: Checkout Principal
    return PEPPER_OFFERS['main'];
}

// URL de Webhook pública (pode ser sobrescrita via env)
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
define('PEPPER_WEBHOOK_URL', pepper_env('PEPPER_WEBHOOK_URL', "{$protocol}://{$host}/api/webhook-pepper.php"));

// Modo Simulado (Mock Mode): desligado por padrão pois agora possuímos credenciais oficiais válidas
$isMockConfigured = (bool)filter_var(pepper_env('PEPPER_MOCK_MODE', 'false'), FILTER_VALIDATE_BOOLEAN);
$hasNoToken = (empty(PEPPER_API_TOKEN) || PEPPER_API_TOKEN === 'SEU_TOKEN_AQUI');
define('PEPPER_MOCK_MODE', $isMockConfigured || $hasNoToken);
