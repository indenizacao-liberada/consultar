<?php
/**
 * Bootstrap da API Pepper
 * Inicialização de sessões seguras, cabeçalhos, funções utilitárias e sanitização.
 * Sem dependência de banco de dados.
 */

if (isset($_SERVER['SCRIPT_FILENAME']) && realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'])) {
    http_response_code(403);
    exit('Acesso direto proibido.');
}

if (!defined('PEPPER_EXEC')) {
    define('PEPPER_EXEC', true);
}

// Carregar configurações
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/qr-code-helper.php';

// Configuração segura de Sessão PHP (sem banco de dados)
if (session_status() === PHP_SESSION_NONE) {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
               || (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

    ini_set('session.use_only_cookies', 1);
    ini_set('session.use_strict_mode', 1);
    
    session_set_cookie_params([
        'lifetime' => 86400, // 24 horas
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    @session_start();
}

// Cabeçalhos de Segurança Padrão
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

/**
 * Retorna uma resposta JSON padronizada e encerra o script.
 */
function pepper_json_response(int $statusCode, array $data): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Sanitiza strings gerais para evitar injeções e caracteres perigosos.
 */
function pepper_sanitize(?string $val): string {
    if ($val === null) return '';
    $val = trim($val);
    return htmlspecialchars(strip_tags($val), ENT_QUOTES, 'UTF-8');
}

/**
 * Remove qualquer caractere não numérico do CPF.
 */
function pepper_clean_cpf(?string $cpf): string {
    if (!$cpf) return '';
    return preg_replace('/\D/', '', $cpf);
}

/**
 * Validação do algoritmo do CPF brasileiro.
 */
function pepper_validate_cpf(string $cpf): bool {
    $cpf = pepper_clean_cpf($cpf);
    if (strlen($cpf) !== 11) return false;
    if (preg_match('/(\d)\1{10}/', $cpf)) return false;

    for ($t = 9; $t < 11; $t++) {
        for ($d = 0, $c = 0; $c < $t; $c++) {
            $d += (int)$cpf[$c] * (($t + 1) - $c);
        }
        $d = ((10 * $d) % 11) % 10;
        if ((int)$cpf[$c] !== $d) return false;
    }
    return true;
}

/**
 * Validação de e-mail.
 */
function pepper_validate_email(?string $email): bool {
    if (!$email) return false;
    return (bool)filter_var(trim($email), FILTER_VALIDATE_EMAIL);
}

/**
 * Validação e formatação de telefone celular brasileiro (10 a 11 dígitos numéricos).
 */
function pepper_clean_phone(?string $phone): string {
    if (!$phone) return '';
    $nums = preg_replace('/\D/', '', $phone);
    if (strlen($nums) === 13 && str_starts_with($nums, '55')) {
        $nums = substr($nums, 2);
    }
    return $nums;
}

/**
 * Rate Limiting simples e seguro baseado em sessão (sem banco de dados).
 */
function pepper_rate_limit(string $action, int $maxHits = 30, int $windowSeconds = 60): bool {
    if (!isset($_SESSION['rate_limits'])) {
        $_SESSION['rate_limits'] = [];
    }

    $now = time();
    if (!isset($_SESSION['rate_limits'][$action])) {
        $_SESSION['rate_limits'][$action] = ['hits' => 1, 'start' => $now];
        return true;
    }

    $record = &$_SESSION['rate_limits'][$action];
    if ($now - $record['start'] > $windowSeconds) {
        $record = ['hits' => 1, 'start' => $now];
        return true;
    }

    $record['hits']++;
    if ($record['hits'] > $maxHits) {
        return false;
    }
    return true;
}

/**
 * Geração de token CSRF para a sessão.
 */
function pepper_csrf_token(): string {
    if (empty($_SESSION['pepper_csrf_token'])) {
        $_SESSION['pepper_csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['pepper_csrf_token'];
}

/**
 * Validação de token CSRF.
 */
function pepper_verify_csrf(?string $token): bool {
    if (empty($_SESSION['pepper_csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['pepper_csrf_token'], $token);
}
