<?php
/**
 * Admin Logout API Endpoint
 * URL: http://localhost:8000/api/auth/logout.php
 */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

// Validate token via helper (will exit with 401 on failure)
$admin = requireAdminAuth(); // we only need token validation, admin info not used here

try {
    $pdo = getDbConnection();
    // Get token from Authorization header again to hash it
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $rawToken = substr($authHeader, 7);
    $tokenHash = hashToken($rawToken);

    $stmt = $pdo->prepare('UPDATE admin_sessions SET revoked_at = NOW() WHERE token_hash = :hash');
    $stmt->execute([':hash' => $tokenHash]);

    successResponse('Logout successful');
} catch (Throwable $e) {
    error_log('Logout error: ' . $e->getMessage());
    errorResponse('Server error', 500);
}
?>
