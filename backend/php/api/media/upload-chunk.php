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

$action = trim((string) ($_POST['action'] ?? $_GET['action'] ?? 'upload'));
$sessionId = trim((string) ($_POST['session_id'] ?? $_GET['session_id'] ?? ''));
$folder = trim((string) ($_POST['folder'] ?? $_GET['folder'] ?? 'general'));
$category = trim((string) ($_POST['category'] ?? $_GET['category'] ?? 'general'));
$totalChunks = (int) ($_POST['total_chunks'] ?? $_GET['total_chunks'] ?? 0);

if ($action === 'finalize') {
    if ($sessionId === '') {
        errorResponse('Missing upload session.', 400);
    }

    $filename = trim((string) ($_POST['filename'] ?? $_GET['filename'] ?? 'upload'));

    try {
        $metadata = finalizeChunkUpload($sessionId, $filename, $folder, $category, $totalChunks);
        successResponse('Chunk upload finalized.', ['media' => $metadata]);
    } catch (Throwable $e) {
        error_log('Chunk upload finalization failed: ' . $e->getMessage());
        errorResponse('Chunk upload finalization failed.', 400);
    }
}

if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
    errorResponse('No chunk was uploaded.', 400);
}

$chunkIndex = (int) ($_POST['chunk_index'] ?? $_GET['chunk_index'] ?? 0);
if ($chunkIndex < 0) {
    errorResponse('Chunk index is invalid.', 400);
}
if ($totalChunks < 1) {
    errorResponse('Total chunk count is required.', 400);
}
if ((int) ($_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    errorResponse('Chunk upload failed.', 400);
}
if ($sessionId === '') {
    $sessionId = bin2hex(random_bytes(16));
}

try {
    $partPath = writeChunkFile($sessionId, $chunkIndex, $_FILES['file']);
    $sessionDir = mediaStorageRoot() . DIRECTORY_SEPARATOR . '.tmp' . DIRECTORY_SEPARATOR . preg_replace('/[^A-Za-z0-9._-]+/', '-', $sessionId);
    $chunkCount = count(glob($sessionDir . DIRECTORY_SEPARATOR . 'chunk-*.part'));

    successResponse('Chunk uploaded.', [
        'sessionId' => $sessionId,
        'chunkIndex' => $chunkIndex,
        'totalChunks' => $totalChunks,
        'receivedChunks' => $chunkCount,
        'file' => basename($partPath),
    ]);
} catch (Throwable $e) {
    error_log('Chunk upload failed: ' . $e->getMessage());
    errorResponse('Chunk upload failed.', 400);
}
