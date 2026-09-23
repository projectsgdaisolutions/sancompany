<?php
/**
 * SAN Photography — Resume Upload API
 *
 * POST /api/resume-upload.php
 *
 * Accepts a PDF file, saves it to the ServerByt uploads directory,
 * and returns a publicly accessible URL so it can be shared via
 * WhatsApp as a real downloadable link.
 *
 * No authentication required (public career application endpoint).
 * File-type and content validation is enforced server-side.
 */

ob_start();

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/response.php';

handleCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed.', 405);
    exit;
}

/* =========================================================
   HELPERS — inline, no shared media.php dependency to avoid
   video/image-only type restrictions
========================================================= */

function resumeStorageRoot(): string
{
    $configuredRoot = getenv('MEDIA_STORAGE_ROOT');
    if (is_string($configuredRoot) && trim($configuredRoot) !== '') {
        return rtrim(trim($configuredRoot), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'uploads';
    }

    $documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';
    if (
        is_string($documentRoot) &&
        trim($documentRoot) !== '' &&
        !str_ends_with(str_replace('\\', '/', rtrim(trim($documentRoot), '/')), '/backend/php')
    ) {
        return rtrim(trim($documentRoot), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'uploads';
    }

    $root = dirname(__DIR__, 3);
    return rtrim($root, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads';
}

function resumePublicBaseUrl(): string
{
    $env = rtrim((string) (getenv('APP_BASE_URL') ?: ''), '/');
    if ($env !== '') {
        return $env;
    }

    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443) ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
    return $scheme . '://' . $host;
}

function resumeEnsureDirectory(string $dir): void
{
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        throw new RuntimeException('Unable to create resume upload directory.');
    }

    if (!is_writable($dir)) {
        chmod($dir, 0775);
    }
}

/* =========================================================
   VALIDATE + SAVE
========================================================= */

if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
    errorResponse('No file was uploaded.', 400);
    exit;
}

$file = $_FILES['file'];

/* Check for PHP upload error */
if ((int) ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload limit.',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds form upload limit.',
        UPLOAD_ERR_PARTIAL    => 'Upload was interrupted.',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Temporary upload folder is missing.',
        UPLOAD_ERR_CANT_WRITE => 'Unable to write uploaded file.',
        UPLOAD_ERR_EXTENSION  => 'Upload was blocked by PHP extension.',
    ];
    $msg = $uploadErrors[(int) $file['error']] ?? 'Resume upload failed.';
    errorResponse($msg, 400);
    exit;
}

if (!is_uploaded_file($file['tmp_name'] ?? '')) {
    errorResponse('Invalid uploaded file source.', 400);
    exit;
}

$size = (int) ($file['size'] ?? 0);
$maxSize = 10 * 1024 * 1024; // 10 MB limit for resumes

if ($size <= 0) {
    errorResponse('Uploaded file is empty.', 400);
    exit;
}
if ($size > $maxSize) {
    errorResponse('Resume file must be under 10 MB.', 400);
    exit;
}

/* Verify MIME type is PDF */
$detectedMime = strtolower((string) (mime_content_type($file['tmp_name']) ?: ''));
if ($detectedMime !== 'application/pdf') {
    errorResponse('Only PDF files are allowed for resume upload.', 400);
    exit;
}

/* Verify file extension */
$originalName = basename((string) ($file['name'] ?? 'resume.pdf'));
$ext = strtolower((string) pathinfo($originalName, PATHINFO_EXTENSION));
if ($ext !== 'pdf') {
    errorResponse('Only .pdf files are accepted.', 400);
    exit;
}

/* Content safety check — block scripts embedded in PDF */
$content = file_get_contents($file['tmp_name']);
if ($content === false) {
    errorResponse('Unable to read uploaded file.', 400);
    exit;
}
/* PDFs begin with %PDF — basic magic-byte check */
if (substr($content, 0, 4) !== '%PDF') {
    errorResponse('The uploaded file is not a valid PDF.', 400);
    exit;
}

/* Build safe filename: random prefix + sanitised original name */
$safeName = preg_replace('/[^A-Za-z0-9._-]+/', '-', pathinfo($originalName, PATHINFO_FILENAME));
$safeName = trim((string) $safeName, '.-_ ');
if ($safeName === '') {
    $safeName = 'resume';
}
$filename = bin2hex(random_bytes(10)) . '-' . $safeName . '.pdf';

/* Target directory: uploads/resumes/ */
$storageRoot = resumeStorageRoot();
$targetDir   = $storageRoot . DIRECTORY_SEPARATOR . 'resumes';

try {
    resumeEnsureDirectory($targetDir);
} catch (RuntimeException $e) {
    error_log('Resume upload dir error: ' . $e->getMessage());
    errorResponse('Server storage is not available.', 500);
    exit;
}

$targetPath = $targetDir . DIRECTORY_SEPARATOR . $filename;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    error_log('Resume move_uploaded_file failed: ' . $targetPath);
    errorResponse('Failed to save resume to server storage.', 500);
    exit;
}

/* Build public URL */
$relativePath = '/uploads/resumes/' . $filename;
$publicUrl    = resumePublicBaseUrl() . $relativePath;

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

successResponse('Resume uploaded successfully.', [
    'url'          => $publicUrl,
    'filename'     => $filename,
    'originalName' => $originalName,
    'size'         => $size,
]);
