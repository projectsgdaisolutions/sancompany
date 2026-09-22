<?php
/**
 * ServerByt media helper
 * backend/php/helpers/media.php
 */

require_once __DIR__ . '/response.php';

const MEDIA_ALLOWED_IMAGE_TYPES = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/avif' => 'avif',
];

const MEDIA_ALLOWED_VIDEO_TYPES = [
    'video/mp4' => 'mp4',
    'video/webm' => 'webm',
    'video/quicktime' => 'mov',
    'video/x-m4v' => 'm4v',
    'video/3gpp' => '3gp',
    'video/x-msvideo' => 'avi',
];

const MEDIA_BLOCKLIST_EXTENSIONS = [
    'php', 'php3', 'php4', 'php5', 'php7', 'phtml', 'phar', 'pht',
    'exe', 'bat', 'cmd', 'com', 'scr', 'js', 'jar', 'vbs', 'ps1', 'sh',
    'html', 'htm', 'svg', 'xml', 'xhtml', 'jsp', 'asp', 'aspx'
];

function mediaStorageRoot(): string {
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

function mediaPublicBaseUrl(): string {
    return rtrim((string) getenv('APP_BASE_URL') ?: '', '/');
}

function normalizeMediaFolder(string $folder): string {
    $trimmed = trim((string) $folder, "/\\");
    if ($trimmed === '') {
        return '';
    }

    $segments = preg_split('#[\\/]+#', $trimmed);
    $safeSegments = [];

    if (strcasecmp((string) ($segments[0] ?? ''), 'san-photography') === 0) {
        array_shift($segments);
    }

    foreach ($segments as $segment) {
        $segment = trim((string) $segment);
        if ($segment === '') {
            continue;
        }

        $segment = preg_replace('/[^A-Za-z0-9._-]+/', '-', $segment);
        $segment = trim((string) $segment, ".-_ ");
        if ($segment === '') {
            continue;
        }

        $safeSegments[] = $segment;
    }

    return implode(DIRECTORY_SEPARATOR, $safeSegments);
}

function ensureDirectory(string $dir): void {
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        throw new RuntimeException('Unable to create upload directory: ' . $dir);
    }

    if (!is_writable($dir)) {
        chmod($dir, 0775);
    }
}

function normalizeUploadedName(string $filename): string {
    $name = basename((string) $filename);
    $name = preg_replace('/[^A-Za-z0-9._-]+/', '-', $name);
    $name = trim((string) $name, '.-_ ');

    if ($name === '') {
        $name = 'upload';
    }

    return $name;
}

function mediaMimeForFile(string $filePath): string {
    $mime = mime_content_type($filePath) ?: '';
    if (is_string($mime) && $mime !== '') {
        return strtolower(trim($mime));
    }

    return '';
}

function detectMediaExtension(string $mimeType, string $filename): string {
    $lookup = array_merge(MEDIA_ALLOWED_IMAGE_TYPES, MEDIA_ALLOWED_VIDEO_TYPES);

    if (isset($lookup[$mimeType])) {
        return (string) $lookup[$mimeType];
    }

    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    if ($ext !== '') {
        return $ext;
    }

    return 'bin';
}

function isAllowedMediaExtension(string $extension): bool {
    $ext = strtolower(trim((string) $extension, '.'));
    if ($ext === '') {
        return false;
    }

    if (in_array($ext, MEDIA_BLOCKLIST_EXTENSIONS, true)) {
        return false;
    }

    return true;
}

function validateMediaFile(array $file, string $resourceType): array {
    if (!isset($file['tmp_name']) || !is_string($file['tmp_name']) || $file['tmp_name'] === '') {
        throw new InvalidArgumentException('Uploaded file is missing.');
    }

    if (!is_uploaded_file($file['tmp_name'])) {
        throw new InvalidArgumentException('Invalid uploaded file source.');
    }

    if (!isset($file['error']) || (int) $file['error'] !== UPLOAD_ERR_OK) {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds server upload limit.',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds form upload limit.',
            UPLOAD_ERR_PARTIAL => 'Upload was interrupted.',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded.',
            UPLOAD_ERR_NO_TMP_DIR => 'Temporary upload folder is missing.',
            UPLOAD_ERR_CANT_WRITE => 'Unable to write uploaded file.',
            UPLOAD_ERR_EXTENSION => 'Upload was blocked by PHP extension.',
        ];

        $message = $errors[(int) $file['error']] ?? 'Upload failed.';
        throw new InvalidArgumentException($message);
    }

    $size = isset($file['size']) ? (int) $file['size'] : 0;
    $maxSize = $resourceType === 'video' ? 2000 * 1024 * 1024 : 25 * 1024 * 1024;

    if ($size <= 0) {
        throw new InvalidArgumentException('Uploaded file is empty.');
    }

    if ($size > $maxSize) {
        throw new InvalidArgumentException('File exceeds the allowed size for this upload.' );
    }

    $originalName = normalizeUploadedName($file['name'] ?? 'upload');
    $mime = mediaMimeForFile($file['tmp_name']);
    $allowedMap = $resourceType === 'video' ? MEDIA_ALLOWED_VIDEO_TYPES : MEDIA_ALLOWED_IMAGE_TYPES;
    $extension = detectMediaExtension($mime, $originalName);

    if ($mime === '' || !isset($allowedMap[$mime])) {
        if (!isAllowedMediaExtension($extension)) {
            throw new InvalidArgumentException('Unsupported file type for this media upload.');
        }
    }

    if (!isAllowedMediaExtension($extension)) {
        throw new InvalidArgumentException('Unsafe or executable file type is not allowed.');
    }

    $content = file_get_contents($file['tmp_name']);
    if ($content === false) {
        throw new RuntimeException('Unable to read uploaded file contents.');
    }

    if (preg_match('/<\?\s*php|<script|javascript:|vbscript:/i', $content) === 1) {
        throw new InvalidArgumentException('The uploaded file contains executable content and is not allowed.');
    }

    $safeMime = strtolower((string) $mime);
    if ($resourceType === 'image' && !in_array($safeMime, array_keys(MEDIA_ALLOWED_IMAGE_TYPES), true)) {
        throw new InvalidArgumentException('Only supported image types are allowed.');
    }

    if ($resourceType === 'video' && !in_array($safeMime, array_keys(MEDIA_ALLOWED_VIDEO_TYPES), true)) {
        throw new InvalidArgumentException('Only supported video types are allowed.');
    }

    return [
        'originalName' => $originalName,
        'mime' => $safeMime,
        'extension' => $extension,
        'size' => $size,
    ];
}

function generateSecureMediaName(string $originalName, string $resourceType): string {
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $safeBase = preg_replace('/[^A-Za-z0-9._-]+/', '-', basename($originalName));
    $safeBase = preg_replace('/\.[^.]+$/', '', (string) $safeBase);
    $safeBase = trim((string) $safeBase, '.-_ ');
    if ($safeBase === '') {
        $safeBase = $resourceType;
    }

    $randomSuffix = bin2hex(random_bytes(12));

    if ($ext !== '' && isAllowedMediaExtension($ext)) {
        return $randomSuffix . '-' . $safeBase . '.' . $ext;
    }

    return $randomSuffix . '-' . $safeBase;
}

function saveServerMedia(array $file, string $folder, string $category = ''): array {
    $resourceType = str_starts_with((string) ($file['type'] ?? ''), 'video/') ? 'video' : 'image';
    $validated = validateMediaFile($file, $resourceType);

    $safeFolder = normalizeMediaFolder($folder);
    $baseDir = mediaStorageRoot() . DIRECTORY_SEPARATOR . ($resourceType === 'video' ? 'videos' : 'images');

    $targetDir = $baseDir;
    if ($safeFolder !== '') {
        $targetDir .= DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $safeFolder);
    }

    ensureDirectory($targetDir);

    $filename = generateSecureMediaName($validated['originalName'], $resourceType);
    $targetPath = $targetDir . DIRECTORY_SEPARATOR . $filename;
    $finalPath = $targetPath;

    if (file_exists($finalPath)) {
        $filename = uniqid('media-', true) . '.' . $validated['extension'];
        $finalPath = $targetDir . DIRECTORY_SEPARATOR . $filename;
    }

    if (!move_uploaded_file($file['tmp_name'], $finalPath)) {
        throw new RuntimeException('Unable to move uploaded file to server storage.');
    }

    $relativePath = '/uploads/' . ($resourceType === 'video' ? 'videos' : 'images');
    if ($safeFolder !== '') {
        $relativePath .= '/' . str_replace('\\', '/', $safeFolder);
    }
    $relativePath .= '/' . basename($finalPath);

    $metadata = [
        'filename' => basename($finalPath),
        'path' => $relativePath,
        'url' => mediaPublicBaseUrl() . $relativePath,
        'mimeType' => $validated['mime'],
        'extension' => strtolower($validated['extension']),
        'size' => $validated['size'],
        'category' => $category,
        'resourceType' => $resourceType,
    ];

    if ($resourceType === 'image') {
        $imageInfo = @getimagesize($finalPath);
        if (is_array($imageInfo)) {
            $metadata['width'] = (int) $imageInfo[0];
            $metadata['height'] = (int) $imageInfo[1];
        }
    }

    return $metadata;
}

function deleteMediaFileByRelativePath(string $relativePath): bool {
    if ($relativePath === '') {
        return false;
    }

    $normalized = str_replace(['\\', '//'], ['/', '/'], (string) $relativePath);
    if (!str_starts_with($normalized, '/uploads/')) {
        return false;
    }

    $location = mediaStorageRoot() . str_replace('/', DIRECTORY_SEPARATOR, substr($normalized, strlen('/uploads')));
    if (!is_file($location)) {
        return false;
    }

    return unlink($location);
}

function chunkSessionDirectory(string $sessionId): string {
    return mediaStorageRoot() . DIRECTORY_SEPARATOR . '.tmp' . DIRECTORY_SEPARATOR . preg_replace('/[^A-Za-z0-9._-]+/', '-', $sessionId);
}

function writeChunkFile(string $sessionId, int $chunkIndex, array $file, array $manifest): string {
    $root = mediaStorageRoot() . DIRECTORY_SEPARATOR . '.tmp';
    ensureDirectory($root);

    $sessionDir = chunkSessionDirectory($sessionId);
    ensureDirectory($sessionDir);

    $manifestPath = $sessionDir . DIRECTORY_SEPARATOR . 'manifest.json';
    if (is_file($manifestPath)) {
        $existing = json_decode((string) file_get_contents($manifestPath), true);
        if (!is_array($existing) || $existing !== $manifest) {
            throw new InvalidArgumentException('Upload session metadata does not match.');
        }
    } elseif (file_put_contents($manifestPath, json_encode($manifest, JSON_THROW_ON_ERROR), LOCK_EX) === false) {
        throw new RuntimeException('Unable to create upload session metadata.');
    }

    $partPath = $sessionDir . DIRECTORY_SEPARATOR . 'chunk-' . $chunkIndex . '.part';
    if (!move_uploaded_file($file['tmp_name'], $partPath)) {
        throw new RuntimeException('Unable to save chunk to temporary storage.');
    }

    return $partPath;
}

function cleanupChunkSession(string $sessionId): void {
    $sessionDir = chunkSessionDirectory($sessionId);
    if (!is_dir($sessionDir)) {
        return;
    }

    foreach (glob($sessionDir . DIRECTORY_SEPARATOR . '*') ?: [] as $file) {
        if (is_file($file)) {
            @unlink($file);
        }
    }
    @rmdir($sessionDir);
}

function finalizeChunkUpload(string $sessionId, string $filename, string $folder, string $category, int $totalChunks): array {
    $sessionDir = chunkSessionDirectory($sessionId);
    if (!is_dir($sessionDir)) {
        throw new InvalidArgumentException('Upload session not found or expired.');
    }

    $chunkFiles = [];
    foreach (glob($sessionDir . DIRECTORY_SEPARATOR . 'chunk-*.part') ?: [] as $chunkFile) {
        $chunkFiles[] = $chunkFile;
    }

    sort($chunkFiles, SORT_NATURAL);
    if ($chunkFiles === []) {
        throw new InvalidArgumentException('No upload chunks were received.');
    }

    if ($totalChunks < 1 || count($chunkFiles) !== $totalChunks) {
        throw new InvalidArgumentException('Upload is incomplete. Please retry the missing chunks.');
    }

    $manifest = json_decode((string) @file_get_contents($sessionDir . DIRECTORY_SEPARATOR . 'manifest.json'), true);
    if (!is_array($manifest) || (int) ($manifest['totalChunks'] ?? 0) !== $totalChunks) {
        throw new InvalidArgumentException('Upload session metadata is missing or invalid.');
    }
    if ((string) ($manifest['filename'] ?? '') !== normalizeUploadedName($filename)) {
        throw new InvalidArgumentException('Final filename does not match the upload session.');
    }

    foreach ($chunkFiles as $index => $chunkFile) {
        $expected = $sessionDir . DIRECTORY_SEPARATOR . 'chunk-' . $index . '.part';
        if ($chunkFile !== $expected) {
            throw new InvalidArgumentException('Upload chunks are incomplete or out of order.');
        }
    }

    $filenameExtension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $videoExtensions = array_values(MEDIA_ALLOWED_VIDEO_TYPES);
    $resourceType = in_array($filenameExtension, $videoExtensions, true) ? 'video' : 'image';
    $safeFilename = generateSecureMediaName($filename, $resourceType);
    $baseDir = mediaStorageRoot() . DIRECTORY_SEPARATOR . ($resourceType === 'video' ? 'videos' : 'images');
    $safeFolder = normalizeMediaFolder($folder);
    if ($safeFolder !== '') {
        $baseDir .= DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $safeFolder);
    }
    ensureDirectory($baseDir);

    $targetPath = $baseDir . DIRECTORY_SEPARATOR . $safeFilename;
    $out = fopen($targetPath, 'wb');
    if ($out === false) {
        throw new RuntimeException('Unable to create assembled file.');
    }

    $assembledSize = 0;
    foreach ($chunkFiles as $chunkFile) {
        $chunkSize = filesize($chunkFile);
        if ($chunkSize === false || $chunkSize <= 0) {
            throw new InvalidArgumentException('Upload contains an empty chunk.');
        }
        $assembledSize += $chunkSize;
    }
    if ($assembledSize !== (int) ($manifest['totalSize'] ?? 0)) {
        throw new InvalidArgumentException('Assembled file size does not match the original upload.');
    }

    try {
        foreach ($chunkFiles as $chunkFile) {
        $in = fopen($chunkFile, 'rb');
        if ($in === false) {
            fclose($out);
            unlink($targetPath);
            throw new RuntimeException('Unable to read uploaded chunk.');
        }

        while (!feof($in)) {
            $buffer = fread($in, 1024 * 1024);
            if ($buffer !== false && $buffer !== '') {
                fwrite($out, $buffer);
            }
        }

        fclose($in);
        }
    } catch (Throwable $e) {
        fclose($out);
        @unlink($targetPath);
        cleanupChunkSession($sessionId);
        throw $e;
    }

    fclose($out);

    $assembledSize = filesize($targetPath);
    if ($assembledSize === false || $assembledSize <= 0 || $assembledSize > 2000 * 1024 * 1024) {
        @unlink($targetPath);
        throw new InvalidArgumentException('Assembled file exceeds the allowed video size.');
    }

    $assembledMime = mediaMimeForFile($targetPath);
    if (!in_array($assembledMime, array_keys(MEDIA_ALLOWED_VIDEO_TYPES), true)) {
        @unlink($targetPath);
        throw new InvalidArgumentException('Assembled file is not a supported video.');
    }

    $metadata = [
        'filename' => basename($targetPath),
        'path' => '/uploads/' . ($resourceType === 'video' ? 'videos' : 'images') . ($safeFolder !== '' ? '/' . str_replace('\\', '/', $safeFolder) : '') . '/' . basename($targetPath),
        'url' => mediaPublicBaseUrl() . '/uploads/' . ($resourceType === 'video' ? 'videos' : 'images') . ($safeFolder !== '' ? '/' . str_replace('\\', '/', $safeFolder) : '') . '/' . basename($targetPath),
        'mimeType' => $assembledMime,
        'extension' => strtolower(pathinfo($targetPath, PATHINFO_EXTENSION)),
        'size' => $assembledSize,
        'category' => $category,
        'resourceType' => $resourceType,
    ];

    if ($resourceType === 'image') {
        $imageInfo = @getimagesize($targetPath);
        if (is_array($imageInfo)) {
            $metadata['width'] = (int) $imageInfo[0];
            $metadata['height'] = (int) $imageInfo[1];
        }
    }

    foreach ($chunkFiles as $chunkFile) {
        @unlink($chunkFile);
    }
    @unlink($sessionDir . DIRECTORY_SEPARATOR . 'manifest.json');
    @rmdir($sessionDir);

    return $metadata;
}
