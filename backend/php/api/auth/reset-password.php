<?php
/**
 * Reset Password API Endpoint
 */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) {
    errorResponse('Invalid Content-Type, expecting application/json', 400);
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
if (!is_array($data) || empty($data['token'])) {
    errorResponse('Reset token is required.', 400);
}

$token = trim((string) $data['token']);
$password = (string) ($data['password'] ?? '');
$confirmPassword = (string) ($data['confirmPassword'] ?? '');

if ($password === '' || $confirmPassword === '') {
    errorResponse('Password and confirmation are required.', 400);
}

if (strlen($password) < 8) {
    errorResponse('Password must be at least 8 characters long.', 400);
}

if ($password !== $confirmPassword) {
    errorResponse('Passwords do not match.', 400);
}

$tokenHash = hash('sha256', $token);

try {
    $pdo = getDbConnection();

    $stmt = $pdo->prepare(
        'SELECT id, admin_id, token_hash, expires_at, used_at FROM password_reset_tokens WHERE token_hash = :token_hash ORDER BY created_at DESC LIMIT 1'
    );
    $stmt->execute([':token_hash' => $tokenHash]);
    $resetToken = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$resetToken) {
        errorResponse('This reset link is invalid or has already been used.', 400);
    }

    if ($resetToken['used_at'] !== null) {
        errorResponse('This reset link is invalid or has already been used.', 400);
    }

    $expiresAt = new DateTime($resetToken['expires_at']);
    $now = new DateTime();
    if ($now > $expiresAt) {
        errorResponse('This reset link has expired. Please request a new one.', 400);
    }

    $adminId = (int) $resetToken['admin_id'];
    $newHash = password_hash($password, PASSWORD_DEFAULT);

    $pdo->beginTransaction();

    $updatePassword = $pdo->prepare('UPDATE admins SET password = :password WHERE id = :admin_id');
    $updatePassword->execute([
        ':password' => $newHash,
        ':admin_id' => $adminId,
    ]);

    $markUsed = $pdo->prepare('UPDATE password_reset_tokens SET used_at = NOW() WHERE admin_id = :admin_id AND used_at IS NULL');
    $markUsed->execute([':admin_id' => $adminId]);

    $pdo->commit();

    successResponse('Password reset successful. You can now log in with your new password.');
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Reset password error: ' . $e->getMessage());
    errorResponse('Unable to reset password at this time.', 500);
}
