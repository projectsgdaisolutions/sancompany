<?php
/**
 * Database Connection via PDO
 * backend/php/config/database.php
 */

/**
 * Load environment variables from a .env file if it exists
 *
 * @param string $path Path to the .env file
 * @return void
 */
function loadEnv(string $path): void {
    if (!file_exists($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        $parts = explode('=', $trimmed, 2);
        if (count($parts) === 2) {
            $key = trim($parts[0]);
            $val = trim($parts[1]);
            // Strip matching surrounding quotes
            if (
                (str_starts_with($val, '"') && str_ends_with($val, '"')) ||
                (str_starts_with($val, "'") && str_ends_with($val, "'"))
            ) {
                $val = substr($val, 1, -1);
            }

            if (!array_key_exists($key, $_SERVER) && !array_key_exists($key, $_ENV)) {
                putenv("{$key}={$val}");
                $_ENV[$key] = $val;
                $_SERVER[$key] = $val;
            }
        }
    }
}

// Auto-load .env from backend/php/.env, backend/.env, or the project root.
loadEnv(__DIR__ . '/../.env');
loadEnv(__DIR__ . '/../../.env');
loadEnv(__DIR__ . '/../../../.env');

/**
 * Obtain a shared PDO MySQL connection
 *
 * @return PDO
 * @throws PDOException If connection fails
 */
function getDbConnection(): PDO {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? '127.0.0.1');
    $port = getenv('DB_PORT') ?: ($_ENV['DB_PORT'] ?? '3306');
    $dbName = getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? 'san_photography');
    $user = getenv('DB_USER') ?: ($_ENV['DB_USER'] ?? 'root');
    $password = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : ($_ENV['DB_PASSWORD'] ?? '');

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
