<?php
/**
 * Database Connection via PDO
 * backend/php/config/database.php
 */

ini_set('display_errors', '0');
ini_set('log_errors', '1');

/**
 * Load environment variables from a .env file.
 *
 * Values loaded from the file intentionally override
 * existing server environment variables. Local development
 * loads backend/php/.env.local after the production defaults.
 *
 * @param string $path Path to the .env file
 * @return void
 */
function loadEnv(string $path): void
{
    if (!file_exists($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        $trimmed = trim($line);

        // Ignore empty lines and comments
        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        $parts = explode('=', $trimmed, 2);

        if (count($parts) !== 2) {
            continue;
        }

        $key = trim($parts[0]);
        $val = trim($parts[1]);

        // Strip matching surrounding quotes
        if (
            (str_starts_with($val, '"') && str_ends_with($val, '"')) ||
            (str_starts_with($val, "'") && str_ends_with($val, "'"))
        ) {
            $val = substr($val, 1, -1);
        }

        // Always use the value from the production .env file
        putenv("{$key}={$val}");
        $_ENV[$key] = $val;
        $_SERVER[$key] = $val;
    }
}

/**
 * Load production defaults first. When using PHP's built-in
 * development server, load the local overrides afterwards.
 * Production PHP runtimes never load .env.local.
 */
loadEnv(__DIR__ . '/../.env');

if (PHP_SAPI === 'cli-server') {
    loadEnv(__DIR__ . '/../.env.local');
}

/**
 * Obtain a shared PDO MySQL connection.
 *
 * @return PDO
 * @throws PDOException If connection fails
 */
function getDbConnection(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $dbName = getenv('DB_NAME') ?: 'san_photography';
    $user = getenv('DB_USER') ?: 'root';
    $password = getenv('DB_PASSWORD') !== false
        ? getenv('DB_PASSWORD')
        : '';

    $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_TIMEOUT             => 5,
    ];

    $pdo = new PDO($dsn, $user, $password, $options);

    return $pdo;
}