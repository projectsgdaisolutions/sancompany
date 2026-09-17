<?php
/**
 * SAN Photography - Career API
 *
 * GET /api/career.php
 * PUT /api/career.php
 *
 * Storage:
 *   website_content.career
 */

ob_start();

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../config/database.php';

handleCors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/**
 * Make sure the career column exists.
 *
 * This is only a safety fallback for the current migration.
 * It does not modify or delete any existing website content.
 */
function ensureCareerColumn(PDO $pdo): void
{
    $stmt = $pdo->prepare(
        "SELECT COUNT(*)
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'website_content'
         AND COLUMN_NAME = 'career'"
    );

    $stmt->execute();

    $exists = (int) $stmt->fetchColumn();

    if ($exists === 0) {
        $pdo->exec(
            "ALTER TABLE website_content
             ADD COLUMN career LONGTEXT NULL"
        );
    }
}

/**
 * Decode stored Career JSON safely.
 */
function decodeCareerJson(?string $json): array
{
    if ($json === null || trim($json) === '') {
        return [];
    }

    $decoded = json_decode($json, true);

    return is_array($decoded) ? $decoded : [];
}

/**
 * Get Career content from MySQL.
 */
function getCareerContent(PDO $pdo): array
{
    ensureCareerColumn($pdo);

    $stmt = $pdo->query(
        "SELECT career
         FROM website_content
         WHERE id = 1
         LIMIT 1"
    );

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        return [];
    }

    return decodeCareerJson($row['career'] ?? null);
}

/**
 * Save Career content to MySQL.
 */
function saveCareerContent(PDO $pdo, array $career): void
{
    ensureCareerColumn($pdo);

    $json = json_encode(
        $career,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES |
        JSON_THROW_ON_ERROR
    );

    /*
     * Check whether website_content row id=1 exists.
     */
    $check = $pdo->query(
        "SELECT id
         FROM website_content
         WHERE id = 1
         LIMIT 1"
    );

    $exists = $check->fetch(PDO::FETCH_ASSOC);

    if ($exists) {
        $stmt = $pdo->prepare(
            "UPDATE website_content
             SET career = :career
             WHERE id = 1"
        );

        $stmt->execute([
            ':career' => $json,
        ]);

        return;
    }

    /*
     * If the main website_content row does not exist,
     * create it without touching any existing data.
     */
    $stmt = $pdo->prepare(
        "INSERT INTO website_content
            (id, career)
         VALUES
            (1, :career)"
    );

    $stmt->execute([
        ':career' => $json,
    ]);
}

/**
 * GET Career configuration.
 */
function handleGet(PDO $pdo): void
{
    header(
        'Cache-Control: no-store, no-cache, must-revalidate, max-age=0'
    );
    header('Pragma: no-cache');
    header('Expires: 0');

    $career = getCareerContent($pdo);

    jsonResponse([
        'success' => true,
        'career' => $career,
        'content' => [
            'career' => $career,
        ],
    ]);
}

/**
 * PUT Career configuration.
 */
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
     * Accept all existing frontend payload styles:
     *
     * {
     *   "content": {
     *     "career": {...}
     *   }
     * }
     *
     * OR:
     *
     * {
     *   "career": {...}
     * }
     *
     * OR:
     *
     * {
     *   ...career fields...
     * }
     */
    if (
        isset($payload['content']) &&
        is_array($payload['content']) &&
        isset($payload['content']['career']) &&
        is_array($payload['content']['career'])
    ) {
        $career = $payload['content']['career'];
    } elseif (
        isset($payload['career']) &&
        is_array($payload['career'])
    ) {
        $career = $payload['career'];
    } else {
        $career = $payload;
    }

    if (!is_array($career)) {
        errorResponse(
            'Invalid Career data.',
            400
        );
    }

    try {
        $pdo->beginTransaction();

        saveCareerContent(
            $pdo,
            $career
        );

        /*
         * Read it back from MySQL.
         * This guarantees that the returned data
         * is the data actually persisted.
         */
        $savedCareer = getCareerContent($pdo);

        $pdo->commit();

        header(
            'Cache-Control: no-store, no-cache, must-revalidate, max-age=0'
        );
        header('Pragma: no-cache');
        header('Expires: 0');

        jsonResponse([
            'success' => true,
            'message' => 'Career content saved successfully.',
            'career' => $savedCareer,
            'content' => [
                'career' => $savedCareer,
            ],
        ]);

    } catch (Throwable $e) {

        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        errorResponse(
            'Career save failed: ' . $e->getMessage(),
            500
        );
    }
}

/**
 * MAIN
 */
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

            header(
                'Allow: GET, PUT, OPTIONS'
            );

            errorResponse(
                'Method not allowed.',
                405
            );
    }

} catch (Throwable $e) {

    errorResponse(
        'Career API error: ' . $e->getMessage(),
        500
    );
}