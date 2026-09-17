<?php
/**
 * Me endpoint – returns the authenticated admin information.
 * URL: http://localhost:8000/api/auth/me.php
 */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

// Authenticate the request; on failure this function sends a 401 response and exits.
$admin = requireAdminAuth();

// Return admin info (id and username only)
successResponse('Authenticated', [
    'admin' => [
        'id'       => (int)$admin['id'],
        'username' => $admin['username'],
    ],
]);
?>
