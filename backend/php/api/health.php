<?php
/**
 * Health Check API Endpoint
 * backend/php/api/health.php
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

// 1. Handle CORS
handleCors();

// Only allow GET requests for health check
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

// 2. Test database connection
try {
    $pdo = getDbConnection();

    // Execute lightweight probe query
    $stmt = $pdo->query('SELECT 1');
    $stmt->fetch();

    successResponse('SAN Photography PHP API is running', [
        'database' => 'connected',
    ]);
} catch (Throwable $e) {
    // Log internal error for server monitoring without exposing credentials/trace
    error_log('Database Health Check Failed: ' . $e->getMessage());

    errorResponse('Database connection failed', 500);
}
