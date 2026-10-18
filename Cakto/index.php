<?php
// Funil Unificado Gov.br - Ponto de Entrada PHP
// Entrega index.html de forma ultra-rápida mantendo compatibilidade com servidores Apache/Nginx/cPanel/Hostinger

$htmlFile = __DIR__ . '/index.html';

if (file_exists($htmlFile)) {
    // Garante cabeçalhos de performance e tipos corretos
    header('Content-Type: text/html; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    readfile($htmlFile);
    exit;
} else {
    http_response_code(404);
    echo "Erro: Arquivo index.html não encontrado.";
    exit;
}
