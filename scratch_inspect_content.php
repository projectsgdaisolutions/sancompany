<?php
require_once __DIR__ . '/backend/php/config/database.php';
$pdo = getDbConnection();

$row = $pdo->query("SELECT * FROM home_content LIMIT 1")->fetch(PDO::FETCH_ASSOC);
echo "HOME_CONTENT:\n";
print_r(json_decode($row['content'], true));

$row2 = $pdo->query("SELECT home, about, services, portfolio, portfolio_page, gallery, films, blog, contact, career FROM website_content WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
echo "\nWEBSITE_CONTENT:\n";
foreach ($row2 as $k => $v) {
    echo "$k: " . (empty($v) ? "[EMPTY]" : substr($v, 0, 100) . "...") . "\n";
}
