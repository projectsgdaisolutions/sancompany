<?php
/**
 * SAN Photography - Blog API
 *
 * GET /api/blog.php
 * PUT /api/blog.php
 *
 * Storage:
 *   website_content.blog
 *
 * Blog media URLs are stored inside the Blog JSON.
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

function decodeBlogJson(?string $json): array
{
    if ($json === null || trim($json) === '') {
        return [];
    }

    $decoded = json_decode($json, true);

    return is_array($decoded) ? $decoded : [];
}

function getBlogContent(PDO $pdo): array
{
    $stmt = $pdo->query(
        'SELECT blog
         FROM website_content
         WHERE id = 1
         LIMIT 1'
    );

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        return [];
    }

    return decodeBlogJson($row['blog'] ?? null);
}

function saveBlogContent(PDO $pdo, array $blog): void
{
    $json = json_encode(
        $blog,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES |
        JSON_THROW_ON_ERROR
    );

    /*
     * Do NOT use ON DUPLICATE KEY with two different named
     * placeholders here. First update the existing website_content
     * row; if it does not exist, insert it.
     */
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
             SET blog = :blog
             WHERE id = 1'
        );

        $stmt->execute([
            ':blog' => $json,
        ]);

        return;
    }

    $stmt = $pdo->prepare(
        'INSERT INTO website_content
            (id, blog)
         VALUES
            (1, :blog)'
    );

    $stmt->execute([
        ':blog' => $json,
    ]);
}

/* =========================================================
   GET
========================================================= */

function handleGet(PDO $pdo): void
{
    /*
     * Blog must never be served from browser/proxy cache while
     * the admin is editing content.
     */
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');

    $blog = getBlogContent($pdo);

    jsonResponse([
        'success' => true,
        'blog' => $blog,
        'content' => [
            'blog' => $blog,
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
     *
     * {
     *   "content": {
     *     "blog": {...}
     *   }
     * }
     *
     * or:
     *
     * {
     *   "blog": {...}
     * }
     *
     * or direct Blog object.
     */
    if (
        isset($payload['content']) &&
        is_array($payload['content']) &&
        isset($payload['content']['blog']) &&
        is_array($payload['content']['blog'])
    ) {
        $blog = $payload['content']['blog'];
    } elseif (
        isset($payload['blog']) &&
        is_array($payload['blog'])
    ) {
        $blog = $payload['blog'];
    } else {
        $blog = $payload;
    }

    if (!is_array($blog)) {
        errorResponse(
            'Invalid Blog data.',
            400
        );
    }

    if (
        !isset($blog['posts']) ||
        !is_array($blog['posts'])
    ) {
        errorResponse(
            'Blog must contain a posts array.',
            400
        );
    }

    try {
        $pdo->beginTransaction();

        saveBlogContent(
            $pdo,
            $blog
        );

        /*
         * IMPORTANT:
         * Read the value back from MySQL before responding.
         * This guarantees the response represents persisted data.
         */
        $savedBlog = getBlogContent($pdo);

        $pdo->commit();

        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');

        jsonResponse([
            'success' => true,
            'message' => 'Blog saved successfully.',
            'blog' => $savedBlog,
            'content' => [
                'blog' => $savedBlog,
            ],
        ]);

        exit;

    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        errorResponse(
            'Blog save failed: ' . $e->getMessage(),
            500
        );
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
    errorResponse(
        'Blog API error: ' . $e->getMessage(),
        500
    );
}
