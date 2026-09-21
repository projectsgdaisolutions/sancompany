<?php
/**
 * CORS Configuration
 * backend/php/config/cors.php
 */

function handleCors(): void
{
    $allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'https://sanphoto.com',
    ];

    $configuredOrigin = trim((string) (getenv('FRONTEND_URL') ?: ''));
    if ($configuredOrigin !== '') {
        $allowedOrigins[] = rtrim($configuredOrigin, '/');
    }

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array(rtrim($origin, '/'), array_unique($allowedOrigins), true)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Access-Control-Allow-Credentials: true');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}