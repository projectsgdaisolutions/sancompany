<?php
require_once __DIR__ . '/../config/database.php';
$pdo = getDbConnection();

// Get the about data from about_content
$stmt = $pdo->query('SELECT content FROM about_content WHERE id = 1 LIMIT 1');
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row && !empty($row['content'])) {
    $aboutJson = $row['content'];
    // Validate it's valid JSON
    $decoded = json_decode($aboutJson, true);
    if ($decoded && is_array($decoded)) {
        // Update website_content.about
        $update = $pdo->prepare('UPDATE website_content SET about = :about WHERE id = 1');
        $update->execute([':about' => $aboutJson]);
        echo "Successfully migrated about data to website_content.about!\n";
    } else {
        echo "Error: content in about_content is not valid JSON.\n";
    }
} else {
    echo "No content found in about_content.\n";
}

// Check website_content.about now
$stmt = $pdo->query('SELECT id, LENGTH(about) as len, SUBSTRING(about, 1, 100) as preview FROM website_content WHERE id = 1');
print_r($stmt->fetch(PDO::FETCH_ASSOC));
