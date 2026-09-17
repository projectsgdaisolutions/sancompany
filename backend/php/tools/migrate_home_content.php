<?php
// backend/php/tools/migrate_home_content.php
// One-time script to initialize Home content in MySQL.
require_once __DIR__ . '/../config/database.php';
$pdo = getDbConnection();

// Ensure table exists
$pdo->exec("CREATE TABLE IF NOT EXISTS home_content (id INT PRIMARY KEY AUTO_INCREMENT, content JSON NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB;");

$homeJson = json_encode([], JSON_UNESCAPED_UNICODE);

// Upsert into MySQL (single row assumed)
$stmt = $pdo->prepare('SELECT id FROM home_content ORDER BY id DESC LIMIT 1');
$stmt->execute();
$existing = $stmt->fetchColumn();
if ($existing) {
    $stmt = $pdo->prepare('UPDATE home_content SET content = :content WHERE id = :id');
    $stmt->execute([':content' => $homeJson, ':id' => $existing]);
    echo "Updated existing home_content row.\n";
} else {
    $stmt = $pdo->prepare('INSERT INTO home_content (content) VALUES (:content)');
    $stmt->execute([':content' => $homeJson]);
    echo "Inserted new home_content row.\n";
}
?>
