<?php
require_once __DIR__ . '/backend/php/config/database.php';
try {
    $pdo = getDbConnection();
    echo "CONNECTED TO MYSQL!\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "TABLES:\n" . implode("\n", $tables) . "\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
