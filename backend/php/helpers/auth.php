<?php
/**
 * Auth Helper Functions
 * backend/php/helpers/auth.php
 */

// Load PDO connection helper
require_once __DIR__ . '/../config/database.php';

/**
 * Hash a password using the default algorithm (bcrypt/argon2).
 */
function hashPassword(string $password): string {
    return password_hash($password, PASSWORD_DEFAULT);
}

/**
 * Verify a password against its hash.
 */
function verifyPassword(string $password, string $hash): bool {
    return password_verify($password, $hash);
}

/**
 * Generate a cryptographically secure random token (raw).
 * @param int $length Length in bytes (default 32 => 64‑hex chars).
 */
function generateToken(int $length = 32): string {
    return bin2hex(random_bytes($length));
}

/**
 * Hash a token for storage using SHA‑256.
 */
function hashToken(string $token): string {
    return hash('sha256', $token);
}

/**
 * Create a new admin session and return the raw token.
 *
 * @param PDO $pdo
 * @param int $adminId
 * @return string Raw token
 */
function createAdminSession(PDO $pdo, int $adminId): string {
    $rawToken = generateToken();
    $tokenHash = hashToken($rawToken);
    $expiresAt = (new DateTime('+7 days'))->format('Y-m-d H:i:s');

    $stmt = $pdo->prepare('INSERT INTO admin_sessions (admin_id, token_hash, expires_at) VALUES (:admin_id, :token_hash, :expires_at)');
    $stmt->execute([
        ':admin_id'   => $adminId,
        ':token_hash' => $tokenHash,
        ':expires_at' => $expiresAt,
    ]);

    return $rawToken;
}

/**
 * Verify a bearer token and return the associated admin info.
 * If verification fails, sends a 401 response and exits.
 *
 * @return array ['id'=>int,'username'=>string]
 */
function requireAdminAuth(): array {
    // 1. Get Authorization header
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (strpos($authHeader, 'Bearer ') !== 0) {
        errorResponse('Authentication required', 401);
    }
    $rawToken = substr($authHeader, 7);
    $tokenHash = hashToken($rawToken);

    // 2. Load DB connection
    $pdo = getDbConnection();

    // 3. Find session
    $stmt = $pdo->prepare('SELECT admin_id, revoked_at, expires_at FROM admin_sessions WHERE token_hash = :hash');
    $stmt->execute([':hash' => $tokenHash]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        errorResponse('Authentication required', 401);
    }

    // 4. Check revocation and expiration
    if ($session['revoked_at'] !== null) {
        errorResponse('Authentication required', 401);
    }
    $now = new DateTime();
    $expires = new DateTime($session['expires_at']);
    if ($now > $expires) {
        errorResponse('Authentication required', 401);
    }

    // 5. Update last_used_at (optional, not critical for test)
    $stmt = $pdo->prepare('UPDATE admin_sessions SET last_used_at = NOW() WHERE token_hash = :hash');
    $stmt->execute([':hash' => $tokenHash]);

    // 6. Retrieve admin
    $stmt = $pdo->prepare('SELECT id, username FROM admins WHERE id = :admin_id');
    $stmt->execute([':admin_id' => $session['admin_id']]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$admin) {
        errorResponse('Authentication required', 401);
    }

    return $admin;
}
?>
