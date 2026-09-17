<?php
/**
 * CLI script to ensure admin_sessions table exists.
 * Run only from command line: php backend/php/tools/setup_sessions.php
 */
if (php_sapi_name() !== 'cli') {
    exit('This script can only be run from CLI.');
}
require_once __DIR__ . '/../config/database.php';

$createSql = "CREATE TABLE IF NOT EXISTS admin_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    last_used_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

try {
    $pdo = getDbConnection();
    $pdo->exec($createSql);
    echo "admin_sessions table ensured.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Error creating admin_sessions: " . $e->getMessage() . "\n");
    exit(1);
}
?>
