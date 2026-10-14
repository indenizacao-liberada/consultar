<?php
/**
 * Configurações da API Pepper
 * 
 * Este arquivo define as constantes e credenciais da Pepper.
 * Não exponha este arquivo nem coloque credenciais no frontend.
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

// 2. Credenciais Pepper
// Insira seu token ou defina na variável de ambiente PEPPER_API_TOKEN
define('PEPPER_API_TOKEN', pepper_env('PEPPER_API_TOKEN', ''));

// Segredo do Webhook (Configurações > Webhooks na Pepper)
define('PEPPER_WEBHOOK_SECRET', pepper_env('PEPPER_WEBHOOK_SECRET', ''));

// 3. Produto e Oferta Cadastrados na Pepper
define('PEPPER_PRODUCT_HASH', pepper_env('PEPPER_PRODUCT_HASH', ''));
define('PEPPER_OFFER_HASH', pepper_env('PEPPER_OFFER_HASH', ''));

// Informações Oficiais do Produto
define('PEPPER_PRODUCT_TITLE', 'E-book de Receitas para Emagrecimento');
define('PEPPER_PRODUCT_DESCRIPTION', 'Material digital com receitas culinárias e sugestões de refeições para uma alimentação equilibrada.');

// Valor oficial definido pelo backend (em centavos: 3582 = R$ 35,82)
define('PEPPER_DEFAULT_AMOUNT', (int)pepper_env('PEPPER_DEFAULT_AMOUNT', '3582'));

// URL de Webhook pública (pode ser sobrescrita via env)
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
define('PEPPER_WEBHOOK_URL', pepper_env('PEPPER_WEBHOOK_URL', "{$protocol}://{$host}/api/webhook-pepper.php"));

// Chave administrativa para o script único de setup de produto/oferta
define('PEPPER_ADMIN_SECRET', pepper_env('PEPPER_ADMIN_SECRET', 'admin_pepper_setup_2026'));

// Modo Simulado (Mock Mode): ativado automaticamente se o token estiver vazio ou for 'mock'
// Permite testar todo o fluxo visual (QR Code, Copia e Cola, polling e aprovação) com 100% de segurança
// sem gerar cobranças reais não autorizadas.
$isMockConfigured = (bool)filter_var(pepper_env('PEPPER_MOCK_MODE', 'false'), FILTER_VALIDATE_BOOLEAN);
$hasNoToken = (empty(PEPPER_API_TOKEN) || PEPPER_API_TOKEN === 'SEU_TOKEN_AQUI');
define('PEPPER_MOCK_MODE', $isMockConfigured || $hasNoToken);
