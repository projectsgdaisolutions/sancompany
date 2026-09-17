<?php
require_once __DIR__ . '/../config/database.php';

$pdo = getDbConnection();

// Check if row exists
$stmt = $pdo->query('SELECT about FROM website_content WHERE id = 1');
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if ($row && $row['about'] !== null && trim($row['about']) !== '') {
    echo "About content already exists.\n";
    exit;
}

$defaultAbout = [
    'heroEyebrow' => 'About SAN Photography',
    'heroLine1' => 'We capture',
    'heroLine2' => 'what you feel.',
    'heroLine3' => 'Not just what you see.',
    'introText' => 'At SAN Photography, our team brings together creativity, experience, and passion to capture every special moment beautifully. From candid emotions to the smallest details, we work together to create photographs and films that tell your story.',
    'founderEyebrow' => 'Founder',
    'founderHeadingNormal' => 'The person behind',
    'founderHeadingItalic' => 'SAN.',
    'founderName' => 'SANDEEP BRAHMANKAR',
    'founderRole' => 'Founder & Professional Photographer / Cinematographer',
    'founderDescription' => 'SANDEEP is the founder and creative force behind SAN Photography, with 15+ years of professional experience in photography and cinematography. With a passion for storytelling and an eye for detail, he specializes in capturing weddings, pre-wedding celebrations, maternity moments, birthdays, kids, and other special occasions. His goal is to capture genuine emotions and create timeless photographs and cinematic films that clients can treasure for generations.',
    'founderQuote' => 'Every picture has a story, and our job is to capture it beautifully.',
    'founderImage' => '',
    'teamEyebrow' => 'The Creative Team',
    'teamHeadingNormal' => 'People behind',
    'teamHeadingItalic' => 'the frames.',
    'teamMembers' => [],
    'ctaEyebrow' => 'SAN Photography',
    'ctaLine1' => 'Your story.',
    'ctaLine2' => 'Our frame.',
    'ctaDescription' => 'Every celebration has a story. We are here to preserve yours beautifully.',
    'ctaButtonText' => 'Start Your Story',
    'ctaButtonHref' => '/contact',
];

$json = json_encode($defaultAbout, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

$stmt = $pdo->prepare('INSERT INTO website_content (id, about) VALUES (1, :about)');
$stmt->execute([':about' => $json]);

echo "Default About content seeded.\n";
?>
