<?php
/**
 * Admin Login API Endpoint
 * URL: http://localhost:8000/api/auth/login.php
 */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

// Ensure request is JSON
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) {
    errorResponse('Invalid Content-Type, expecting application/json', 400);
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
if (!is_array($data) || empty($data['username']) || empty($data['password'])) {
    errorResponse('Username and password are required', 400);
}

$username = $data['username'];
$password = $data['password'];

try {
    $pdo = getDbConnection();
    $stmt = $pdo->prepare('SELECT id, username, password FROM admins WHERE username = :username OR LOWER(email) = LOWER(:email) LIMIT 1');
    $stmt->execute([
        ':username' => $username,
        ':email' => $username,
    ]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin || !verifyPassword($password, $admin['password'])) {
        // Generic auth failure
        errorResponse('Invalid username or password', 401);
    }

    // Create session token
    $token = createAdminSession($pdo, (int)$admin['id']);

    // Respond with token and admin info
    successResponse('Login successful', [
        'token' => $token,
        'admin' => [
            'id'       => (int)$admin['id'],
            'username' => $admin['username'],
        ],
    ]);
} catch (Throwable $e) {
    error_log('Login error: ' . $e->getMessage());
    errorResponse('Server error', 500);
}
?>
