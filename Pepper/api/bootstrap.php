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

// Cabeçalhos de Segurança e CORS
if (!headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
 * Gera dados de cliente 100% aleatórios e válidos para envio ao gateway de pagamento.
 * Garante que NENHUM dado oficial do cidadão/funil seja enviado à API externa da adquirente/gateway.
 */
function pepper_generate_random_customer(): array {
    $firstNames = [
        'Gabriel', 'Lucas', 'Matheus', 'Guilherme', 'Rodrigo', 'Felipe', 'Bruno', 'Leonardo',
        'Thiago', 'Gustavo', 'Rafael', 'Eduardo', 'Vinicius', 'Daniel', 'Marcelo', 'Alexandre',
        'Amanda', 'Beatriz', 'Camila', 'Larissa', 'Mariana', 'Juliana', 'Fernanda', 'Patricia',
        'Aline', 'Leticia', 'Jessica', 'Carolina', 'Bruna', 'Renata', 'Vanessa', 'Natalia'
    ];
    $surnames = [
        'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
        'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes',
        'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade',
        'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas', 'Cardoso', 'Ramos'
    ];

    $firstName = $firstNames[array_rand($firstNames)];
    $sur1 = $surnames[array_rand($surnames)];
    $sur2 = $surnames[array_rand($surnames)];
    while ($sur2 === $sur1) {
        $sur2 = $surnames[array_rand($surnames)];
    }
    $name = "{$firstName} {$sur1} {$sur2}";

    // Algoritmo oficial para gerar CPF matematicamente válido (Módulo 11)
    $cpfDigits = [];
    for ($i = 0; $i < 9; $i++) {
        $cpfDigits[$i] = random_int(0, 9);
    }
    // D1
    $sum1 = 0;
    for ($i = 0; $i < 9; $i++) {
        $sum1 += $cpfDigits[$i] * (10 - $i);
    }
    $rem1 = ($sum1 * 10) % 11;
    $d1 = ($rem1 === 10) ? 0 : $rem1;
    $cpfDigits[9] = $d1;

    // D2
    $sum2 = 0;
    for ($i = 0; $i < 10; $i++) {
        $sum2 += $cpfDigits[$i] * (11 - $i);
    }
    $rem2 = ($sum2 * 10) % 11;
    $d2 = ($rem2 === 10) ? 0 : $rem2;
    $cpfDigits[10] = $d2;

    $cpf = implode('', $cpfDigits);

    // E-mail plausível baseado no nome aleatório
    $cleanFirst = strtolower(preg_replace('/[^a-zA-Z]/', '', $firstName));
    $cleanSur1  = strtolower(preg_replace('/[^a-zA-Z]/', '', $sur1));
    $cleanSur2  = strtolower(preg_replace('/[^a-zA-Z]/', '', $sur2));

    $domains = [
        'gmail.com', 'outlook.com', 'hotmail.com',
        'yahoo.com.br', 'yahoo.com', 'icloud.com'
    ];
    $domain = $domains[array_rand($domains)];

    $numFormats = [
        (string)random_int(1, 99),
        (string)random_int(100, 999),
        (string)random_int(1000, 9999),
        ''
    ];
    $num = $numFormats[array_rand($numFormats)];

    $firstInitial = $cleanFirst !== '' ? $cleanFirst[0] : '';
    $sur1Initial  = $cleanSur1 !== '' ? $cleanSur1[0] : '';

    $emailFormats = [
        "{$cleanFirst}.{$cleanSur2}{$num}",
        "{$cleanFirst}_{$cleanSur2}{$num}",
        "{$cleanFirst}{$cleanSur2}{$num}",
        "{$cleanFirst}{$sur1Initial}{$cleanSur2}{$num}",
        "{$cleanFirst}{$num}",
        "{$firstInitial}.{$cleanSur2}{$num}",
        "{$firstInitial}_{$cleanSur2}{$num}",
        "{$cleanSur2}.{$cleanFirst}{$num}",
        "{$cleanFirst}_" . random_int(10, 99) . "_{$cleanSur2}",
        "{$cleanFirst}.{$cleanSur1}{$num}",
        "{$cleanFirst}{$cleanSur2}"
    ];

    $emailUser = $emailFormats[array_rand($emailFormats)];
    $email = "{$emailUser}@{$domain}";

    // Telefone celular com DDD válido e nono dígito
    $ddds = [
        '11', '19', '21', '27', '31', '41', '47', '48', '51', '61', '62', '71', '81', '85', '91'
    ];
    $ddd = $ddds[array_rand($ddds)];
    $phone = $ddd . '9' . random_int(80000000, 99999999);

    return [
        'name' => $name,
        'email' => $email,
        'phone_number' => $phone,
        'document' => $cpf
    ];
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
