<?php
require_once __DIR__ . '/backend/php/config/database.php';
$pdo = getDbConnection();

$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $t) {
    echo "=== TABLE: $t ===\n";
    $cols = $pdo->query("DESCRIBE `$t`")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) {
        echo "  {$c['Field']} ({$c['Type']})\n";
    }
    $count = $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
    echo "  ROW COUNT: $count\n";
    if ($count > 0 && $count <= 5) {
        $rows = $pdo->query("SELECT * FROM `$t`")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) {
            foreach ($r as $k => $v) {
                if (strlen($v) > 80) $v = substr($v, 0, 77) . '...';
                echo "    $k: $v\n";
            }
            echo "    ---\n";
        }
    }
}
