<?php
/**
 * SAN Photography - About API
 *
 * GET /api/about.php
 * PUT /api/about.php
 *
 * Storage:
 *   website_content.about
 *
 * Media URLs are stored inside the About JSON.
 * Cloudinary remains the external media storage.
 */

ob_start();

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../config/database.php';

handleCors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/* =========================================================
   HELPERS
========================================================= */

function decodeAboutJson(?string $json): array
{
    if ($json === null || trim($json) === '') {
        return [];
    }

    $decoded = json_decode($json, true);

    return is_array($decoded) ? $decoded : [];
}

function getAboutContent(PDO $pdo): array
{
    $stmt = $pdo->query(
        'SELECT about
         FROM website_content
         WHERE id = 1
         LIMIT 1'
    );

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        return [];
    }

    return decodeAboutJson($row['about'] ?? null);
}

function saveAboutContent(PDO $pdo, array $about): void
{
    $json = json_encode(
        $about,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES |
        JSON_THROW_ON_ERROR
    );

    $check = $pdo->query(
        'SELECT id
         FROM website_content
         WHERE id = 1
         LIMIT 1'
    );

    $exists = $check->fetch(PDO::FETCH_ASSOC);

    if ($exists) {
        $stmt = $pdo->prepare(
            'UPDATE website_content
             SET about = :about
             WHERE id = 1'
        );

        $stmt->execute([
            ':about' => $json,
        ]);

        return;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO website_content
            (id, about)
         VALUES
            (1, :about)'
    );

    $stmt->execute([
        ':about' => $json,
    ]);
}

/* =========================================================
   GET
========================================================= */

function handleGet(PDO $pdo): void
{
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');

    $about = getAboutContent($pdo);

    jsonResponse([
        'success' => true,
        'about' => $about,
        'content' => [
            'about' => $about,
        ],
    ]);

    exit;
}

/* =========================================================
   PUT
========================================================= */

function handlePut(PDO $pdo): void
{
    requireAdminAuth();

    $raw = file_get_contents('php://input');

    if ($raw === false || trim($raw) === '') {
        errorResponse(
            'Empty request body.',
            400
        );
    }

    $payload = json_decode(
        $raw,
        true
    );

    if (!is_array($payload)) {
        errorResponse(
            'Invalid JSON payload.',
            400
        );
    }

    /*
     * Accept:
     * { "content": { "about": {...} } }
     * or:
     * { "about": {...} }
     * or direct About object.
     */
    if (
        isset($payload['content']) &&
        is_array($payload['content']) &&
        isset($payload['content']['about']) &&
        is_array($payload['content']['about'])
    ) {
        $about = $payload['content']['about'];
    } elseif (
        isset($payload['about']) &&
        is_array($payload['about'])
    ) {
        $about = $payload['about'];
    } else {
        $about = $payload;
    }

    if (!is_array($about)) {
        errorResponse(
            'Invalid About data.',
            400
        );
    }

    try {
        $pdo->beginTransaction();

        saveAboutContent(
            $pdo,
            $about
        );

        /*
         * Read the value back from MySQL before responding.
         * Guarantees response represents persisted data.
         */
        $savedAbout = getAboutContent($pdo);

        $pdo->commit();

        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');

        jsonResponse([
            'success' => true,
            'message' => 'About content saved successfully.',
            'about' => $savedAbout,
            'content' => [
                'about' => $savedAbout,
            ],
        ]);

        exit;

    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        error_log('About save failed: ' . $e->getMessage());
        errorResponse('About save failed.', 500);
    }
}

/* =========================================================
   MAIN
========================================================= */

try {
    $pdo = getDbConnection();

    switch ($method) {
        case 'GET':
            handleGet($pdo);
            break;

        case 'PUT':
            handlePut($pdo);
            break;

        case 'OPTIONS':
            exit;

        default:
            header('Allow: GET, PUT, OPTIONS');

            errorResponse(
                'Method not allowed.',
                405
            );
    }

} catch (Throwable $e) {
    error_log('About API error: ' . $e->getMessage());
    errorResponse('About API error.', 500);
}
