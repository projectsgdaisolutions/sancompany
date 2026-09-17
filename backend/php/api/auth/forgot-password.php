<?php
/**
 * Forgot Password API Endpoint
 */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/email.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) {
    errorResponse('Invalid Content-Type, expecting application/json', 400);
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
if (!is_array($data) || empty($data['email'])) {
    errorResponse('Email is required', 400);
}

$email = trim((string) $data['email']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    errorResponse('Please enter a valid email address.', 400);
}

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare('SELECT id, username, email FROM admins WHERE LOWER(email) = LOWER(:email) LIMIT 1');
    $stmt->execute([':email' => $email]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($admin) {
        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $expiresAt = (new DateTime('+30 minutes'))->format('Y-m-d H:i:s');

        $invalidate = $pdo->prepare('UPDATE password_reset_tokens SET used_at = NOW() WHERE admin_id = :admin_id AND used_at IS NULL');
        $invalidate->execute([':admin_id' => (int) $admin['id']]);

        $insert = $pdo->prepare('INSERT INTO password_reset_tokens (admin_id, token_hash, expires_at) VALUES (:admin_id, :token_hash, :expires_at)');
        $insert->execute([
            ':admin_id' => (int) $admin['id'],
            ':token_hash' => $tokenHash,
            ':expires_at' => $expiresAt,
        ]);

        $frontendBase = getEnvValue('FRONTEND_URL', 'http://localhost:5173');
        $resetUrl = rtrim($frontendBase, '/') . '/admin/reset-password?token=' . urlencode($token);

        $sendResult = sendPasswordResetEmail($email, $resetUrl);
        if (!$sendResult) {
            error_log('Password reset email delivery failed for admin_id=' . (int) $admin['id']);
        }
    }

    successResponse('If an account exists for this email, a password reset link has been sent.');
} catch (Throwable $e) {
    error_log('Forgot password error: ' . $e->getMessage());
    errorResponse('Unable to process password reset request at this time.', 500);
}
