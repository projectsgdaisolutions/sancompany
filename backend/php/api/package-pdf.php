<?php
/**
 * Public Contact package PDF endpoint.
 *
 * GET /api/package-pdf.php?file=<stored-filename>
 */

ob_start();

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/media.php';

handleCors();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET' && ($_SERVER['REQUEST_METHOD'] ?? '') !== 'HEAD') {
    header('Allow: GET, HEAD, OPTIONS');
    errorResponse('Method not allowed.', 405);
}

$filename = (string) ($_GET['file'] ?? '');
$path = packagePdfStoragePath($filename);
if ($path === null) {
    errorResponse('Package PDF not found.', 404);
}

if (ob_get_level() > 0) {
    ob_end_clean();
}

header('Content-Type: application/pdf');
header('Content-Length: ' . (string) filesize($path));
header('Content-Disposition: inline; filename="' . str_replace('"', '', basename($filename)) . '"');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: public, max-age=3600');
header('Accept-Ranges: bytes');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    readfile($path);
}
