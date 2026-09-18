<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/media.php';
require_once __DIR__ . '/../../helpers/response.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    errorResponse('Method not allowed.', 405);
}

requireAdminAuth();

$path = trim((string) ($_GET['path'] ?? $_POST['path'] ?? ''));
if ($path === '') {
    errorResponse('Missing file path to delete.', 400);
}

$deleted = deleteMediaFileByRelativePath($path);
if (!$deleted) {
    errorResponse('File was not found or could not be deleted.', 404);
}

successResponse('Media deleted successfully.', ['path' => $path]);
