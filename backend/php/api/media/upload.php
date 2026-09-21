<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/media.php';
require_once __DIR__ . '/../../helpers/response.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed.', 405);
}

requireAdminAuth();

if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
    errorResponse('No file was uploaded.', 400);
}

$folder = trim((string) ($_POST['folder'] ?? $_GET['folder'] ?? 'general'));
$category = trim((string) ($_POST['category'] ?? $_GET['category'] ?? 'general'));

try {
    $metadata = saveServerMedia($_FILES['file'], $folder, $category);
    successResponse('Media uploaded successfully.', ['media' => $metadata]);
} catch (Throwable $e) {
    error_log('Media upload failed: ' . $e->getMessage());
    errorResponse('Media upload failed.', 400);
}
