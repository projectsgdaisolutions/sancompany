<?php
/**
 * SAN Photography - Portfolio API
 *
 * GET  /api/portfolio.php
 * PUT  /api/portfolio.php
 *
 * Portfolio content:
 *   website_content.portfolio
 *
 * Portfolio media:
 *   portfolio_media
 */

require_once __DIR__ . '/../config/cors.php';

// CORS MUST RUN BEFORE ANY OTHER API OUTPUT
handleCors();

require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../config/database.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/**
 * Portfolio media slots belonging to this module.
 */
function isPortfolioSlot(string $slot): bool
{
    return
        $slot === 'hero-video' ||
        str_starts_with($slot, 'story-') ||
        str_starts_with($slot, 'film-');
}

/**
 * Get saved Portfolio JSON from website_content.portfolio.
 */
function getPortfolioContent(PDO $pdo): array
{
    $stmt = $pdo->query(
        'SELECT portfolio FROM website_content WHERE id = 1 LIMIT 1'
    );

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || $row['portfolio'] === null || $row['portfolio'] === '') {
        return [];
    }

    $decoded = json_decode($row['portfolio'], true);

    return is_array($decoded) ? $decoded : [];
}

/**
 * Get all Portfolio media.
 */
function getPortfolioMedia(PDO $pdo): array
{
    $stmt = $pdo->query(
        'SELECT
            slot,
            title,
            image_url,
            public_id,
            resource_type,
            format,
            width,
            height,
            bytes,
            folder
         FROM portfolio_media
         WHERE slot = "hero-video"
            OR slot LIKE "story-%"
            OR slot LIKE "film-%"
         ORDER BY id ASC'
    );

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $media = [];

    foreach ($rows as $row) {
        $media[$row['slot']] = $row;
    }

    return $media;
}

/**
 * Merge media URLs back into Portfolio JSON.
 */
function mergePortfolio(array $portfolio, array $media): array
{
    // Hero video
    if (isset($media['hero-video'])) {
        $portfolio['heroVideoUrl'] = $media['hero-video']['image_url'];
    }

    // Stories
    if (
        isset($portfolio['stories']) &&
        is_array($portfolio['stories'])
    ) {
        foreach ($portfolio['stories'] as &$story) {
            if (!is_array($story)) {
                continue;
            }

            $id = (string)($story['id'] ?? '');

            if ($id === '') {
                continue;
            }

            $coverSlot = "story-{$id}-cover";
            $videoSlot = "story-{$id}-video";
            $imagePrefix = "story-{$id}-image-";

            if (isset($media[$coverSlot])) {
                $story['coverImageUrl'] =
                    $media[$coverSlot]['image_url'];
            }

            if (isset($media[$videoSlot])) {
                $story['videoUrl'] =
                    $media[$videoSlot]['image_url'];
            }

            // Portfolio story gallery images: maximum 30 per story.
            // Visibility is stored in website_content.portfolio JSON.
            // The portfolio_media rows remain untouched when an image is hidden.
            $savedImages = isset($story['images']) && is_array($story['images'])
                ? $story['images']
                : [];

            $storyImages = [];

            for ($imageIndex = 0; $imageIndex < 30; $imageIndex++) {
                $imageSlot = $imagePrefix . $imageIndex;

                if (
                    isset($media[$imageSlot]) &&
                    !empty($media[$imageSlot]['image_url'])
                ) {
                    $savedImage = $savedImages[$imageIndex] ?? null;

                    $visible = true;

                    if (is_array($savedImage)) {
                        $visible = ($savedImage['visible'] ?? true) !== false;
                    }

                    $storyImages[] = [
                        'url' => $media[$imageSlot]['image_url'],
                        'visible' => $visible,
                    ];
                }
            }

            $story['images'] = $storyImages;
        }

        unset($story);
    }

    // Films
    if (
        isset($portfolio['films']) &&
        is_array($portfolio['films'])
    ) {
        foreach ($portfolio['films'] as &$film) {
            if (!is_array($film)) {
                continue;
            }

            $id = (string)($film['id'] ?? '');

            if ($id === '') {
                continue;
            }

            $slot = "film-{$id}-video";

            if (isset($media[$slot])) {
                $film['videoUrl'] =
                    $media[$slot]['image_url'];
            }
        }

        unset($film);
    }

    return $portfolio;
}

/**
 * Try to derive Cloudinary metadata from a Cloudinary URL.
 *
 * Existing frontend stores URLs in the Portfolio JSON, so this
 * allows the existing portfolio_media schema to be populated
 * without changing cloudinary.js.
 */
function deriveCloudinaryMetadata(string $url): array
{
    $resourceType = 'image';
    $format = 'unknown';
    $publicId = $url;

    if (strpos($url, '/video/upload/') !== false) {
        $resourceType = 'video';
    } elseif (strpos($url, '/image/upload/') !== false) {
        $resourceType = 'image';
    } elseif (strpos($url, '/raw/upload/') !== false) {
        $resourceType = 'raw';
    }

    $parsedPath = parse_url($url, PHP_URL_PATH);

    if (is_string($parsedPath) && $parsedPath !== '') {
        $extension = pathinfo($parsedPath, PATHINFO_EXTENSION);

        if ($extension !== '') {
            $format = strtolower($extension);
        }

        $uploadMarker = '/' . $resourceType . '/upload/';

        $uploadPosition = strpos($parsedPath, $uploadMarker);

        if ($uploadPosition !== false) {
            $afterUpload = substr(
                $parsedPath,
                $uploadPosition + strlen($uploadMarker)
            );

            // Remove Cloudinary transformation segments if present.
            $parts = explode('/', $afterUpload);

            $firstPart = $parts[0] ?? '';

            if (
                str_contains($firstPart, '_') ||
                str_contains($firstPart, ',')
            ) {
                array_shift($parts);
            }

            $publicPath = implode('/', $parts);

            $publicPath = preg_replace(
                '/\.[a-zA-Z0-9]+$/',
                '',
                $publicPath
            );

            if ($publicPath !== '') {
                $publicId = $publicPath;
            }
        }
    }

    return [
        'public_id' => $publicId,
        'resource_type' => $resourceType,
        'format' => $format,
    ];
}

/**
 * Build media map from Portfolio object.
 */
function buildMediaSlots(array $portfolio): array
{
    $mediaSlots = [];

    // Hero video
    if (!empty($portfolio['heroVideoUrl'])) {
        $mediaSlots['hero-video'] = [
            'title' => 'Portfolio Hero Video',
            'url' => trim((string)$portfolio['heroVideoUrl']),
        ];
    }

    // Stories
    if (
        isset($portfolio['stories']) &&
        is_array($portfolio['stories'])
    ) {
        foreach ($portfolio['stories'] as $story) {
            if (!is_array($story)) {
                continue;
            }

            $id = (string)($story['id'] ?? '');

            if ($id === '') {
                continue;
            }

            $title = trim(
                (string)($story['title'] ?? "Story {$id}")
            );

            if (!empty($story['coverImageUrl'])) {
                $mediaSlots["story-{$id}-cover"] = [
                    'title' => "{$title} Cover",
                    'url' => trim(
                        (string)$story['coverImageUrl']
                    ),
                ];
            }

            if (!empty($story['videoUrl'])) {
                $mediaSlots["story-{$id}-video"] = [
                    'title' => "{$title} Video",
                    'url' => trim(
                        (string)$story['videoUrl']
                    ),
                ];
            }

            // Story gallery images: maximum 30.
            $storyImages = $story['images'] ?? [];

            if (!is_array($storyImages)) {
                $storyImages = [];
            }

            if (count($storyImages) > 30) {
                throw new RuntimeException(
                    "Story {$id} cannot contain more than 30 images."
                );
            }

            foreach ($storyImages as $imageIndex => $image) {
                // Backward compatibility: old saved data may still contain plain URLs.
                if (is_string($image)) {
                    $imageUrl = trim($image);
                } elseif (is_array($image)) {
                    $imageUrl = trim((string)($image['url'] ?? ''));
                } else {
                    $imageUrl = '';
                }

                if ($imageUrl === '') {
                    continue;
                }

                // IMPORTANT:
                // Hidden images are still included in mediaSlots.
                // Therefore their Cloudinary/MySQL media record is preserved.
                $mediaSlots["story-{$id}-image-{$imageIndex}"] = [
                    'title' => "{$title} Image " . ($imageIndex + 1),
                    'url' => $imageUrl,
                ];
            }
        }
    }

    // Films
    if (
        isset($portfolio['films']) &&
        is_array($portfolio['films'])
    ) {
        foreach ($portfolio['films'] as $film) {
            if (!is_array($film)) {
                continue;
            }

            $id = (string)($film['id'] ?? '');

            if ($id === '') {
                continue;
            }

            if (!empty($film['videoUrl'])) {
                $title = trim(
                    (string)($film['name'] ?? "Film {$id}")
                );

                $mediaSlots["film-{$id}-video"] = [
                    'title' => "{$title} Video",
                    'url' => trim(
                        (string)$film['videoUrl']
                    ),
                ];
            }
        }
    }

    return $mediaSlots;
}

/**
 * Save/update one portfolio_media row.
 *
 * slot is NOT UNIQUE in the current DB schema, therefore
 * ON DUPLICATE KEY is NOT reliable.
 *
 * We explicitly SELECT first and then UPDATE/INSERT.
 */
function savePortfolioMedia(
    PDO $pdo,
    string $slot,
    string $title,
    string $url
): void {
    $metadata = deriveCloudinaryMetadata($url);

    $stmt = $pdo->prepare(
        'SELECT id
         FROM portfolio_media
         WHERE slot = :slot
         ORDER BY id ASC
         LIMIT 1'
    );

    $stmt->execute([
        ':slot' => $slot,
    ]);

    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $update = $pdo->prepare(
            'UPDATE portfolio_media
             SET
                title = :title,
                image_url = :image_url,
                public_id = :public_id,
                resource_type = :resource_type,
                format = :format,
                folder = :folder
             WHERE id = :id'
        );

        $update->execute([
            ':title' => $title,
            ':image_url' => $url,
            ':public_id' => $metadata['public_id'],
            ':resource_type' => $metadata['resource_type'],
            ':format' => $metadata['format'],
            ':folder' => 'san-photography/portfolio',
            ':id' => $existing['id'],
        ]);

        // Remove accidental duplicate rows for the same slot.
        $deleteDuplicates = $pdo->prepare(
            'DELETE FROM portfolio_media
             WHERE slot = :slot
             AND id <> :id'
        );

        $deleteDuplicates->execute([
            ':slot' => $slot,
            ':id' => $existing['id'],
        ]);

        return;
    }

    $insert = $pdo->prepare(
        'INSERT INTO portfolio_media (
            slot,
            title,
            image_url,
            public_id,
            resource_type,
            format,
            folder
         ) VALUES (
            :slot,
            :title,
            :image_url,
            :public_id,
            :resource_type,
            :format,
            :folder
         )'
    );

    $insert->execute([
        ':slot' => $slot,
        ':title' => $title,
        ':image_url' => $url,
        ':public_id' => $metadata['public_id'],
        ':resource_type' => $metadata['resource_type'],
        ':format' => $metadata['format'],
        ':folder' => 'san-photography/portfolio',
    ]);
}

/**
 * Delete Portfolio media rows that are no longer present.
 *
 * IMPORTANT:
 * Only Portfolio slots are touched.
 * Gallery media is never touched.
 */
function deleteRemovedPortfolioMedia(
    PDO $pdo,
    array $currentSlots
): void {
    $stmt = $pdo->query(
        'SELECT id, slot
         FROM portfolio_media
         WHERE slot = "hero-video"
            OR slot LIKE "story-%"
            OR slot LIKE "film-%"'
    );

    $existingRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $currentSlotLookup = array_fill_keys(
        array_keys($currentSlots),
        true
    );

    $delete = $pdo->prepare(
        'DELETE FROM portfolio_media WHERE id = :id'
    );

    foreach ($existingRows as $row) {
        $slot = (string)$row['slot'];

        if (!isset($currentSlotLookup[$slot])) {
            $delete->execute([
                ':id' => $row['id'],
            ]);
        }
    }
}

/**
 * GET
 */
function handleGet(PDO $pdo): void
{
    $portfolio = getPortfolioContent($pdo);
    $media = getPortfolioMedia($pdo);

    $portfolio = mergePortfolio(
        $portfolio,
        $media
    );

    jsonResponse([
        'success' => true,
        'portfolio' => $portfolio,

        // Compatibility for current React implementation.
        'content' => [
            'portfolio' => $portfolio,
        ],
    ]);

    exit;
}

/**
 * PUT
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
     * Accept BOTH:
     *
     * {
     *   "portfolio": {...}
     * }
     *
     * and:
     *
     * {
     *   "content": {
     *      "portfolio": {...}
     *   }
     * }
     *
     * This keeps compatibility with the current React code.
     */
    if (
        isset($payload['content']) &&
        is_array($payload['content']) &&
        isset($payload['content']['portfolio']) &&
        is_array($payload['content']['portfolio'])
    ) {
        $portfolio = $payload['content']['portfolio'];
    } elseif (
        isset($payload['portfolio']) &&
        is_array($payload['portfolio'])
    ) {
        $portfolio = $payload['portfolio'];
    } else {
        // Also allow direct Portfolio object.
        $portfolio = $payload;
    }

    if (!is_array($portfolio)) {
        errorResponse(
            'Invalid Portfolio data.',
            400
        );
    }

    // Normalize story images to:
    // { url: "...", visible: true|false }
    // This keeps visibility persistent in website_content.portfolio.
    if (
        isset($portfolio['stories']) &&
        is_array($portfolio['stories'])
    ) {
        foreach ($portfolio['stories'] as $storyIndex => &$story) {
            if (!is_array($story)) {
                continue;
            }

            $rawImages = $story['images'] ?? [];

            if (!is_array($rawImages)) {
                errorResponse(
                    'Invalid images data for Portfolio story #' . ($storyIndex + 1) . '.',
                    400
                );
            }

            if (count($rawImages) > 30) {
                $storyTitle = (string)($story['title'] ?? ('Story #' . ($storyIndex + 1)));

                errorResponse(
                    "{$storyTitle} cannot contain more than 30 images.",
                    400
                );
            }

            $normalizedImages = [];

            foreach ($rawImages as $image) {
                if (is_string($image)) {
                    $url = trim($image);
                    $visible = true;
                } elseif (is_array($image)) {
                    $url = trim((string)($image['url'] ?? ''));
                    $visible = ($image['visible'] ?? true) !== false;
                } else {
                    continue;
                }

                if ($url === '') {
                    continue;
                }

                $normalizedImages[] = [
                    'url' => $url,
                    'visible' => $visible,
                ];
            }

            $story['images'] = $normalizedImages;
        }
        unset($story);
    }

    // Server-side validation: maximum 30 gallery images per story.
    if (
        isset($portfolio['stories']) &&
        is_array($portfolio['stories'])
    ) {
        foreach ($portfolio['stories'] as $storyIndex => $story) {
            if (!is_array($story)) {
                continue;
            }

            $storyImages = $story['images'] ?? [];

            if (!is_array($storyImages)) {
                errorResponse(
                    'Invalid images data for Portfolio story #' . ($storyIndex + 1) . '.',
                    400
                );
            }

            if (count($storyImages) > 30) {
                $storyTitle = (string)($story['title'] ?? ('Story #' . ($storyIndex + 1)));

                errorResponse(
                    "{$storyTitle} cannot contain more than 30 images.",
                    400
                );
            }
        }
    }

    $portfolioJson = json_encode(
        $portfolio,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES |
        JSON_THROW_ON_ERROR
    );

    $mediaSlots = buildMediaSlots(
        $portfolio
    );

    try {
        $pdo->beginTransaction();

        /*
         * Update ONLY website_content.portfolio.
         *
         * Do NOT touch:
         * home
         * about
         * services
         * gallery
         * films
         * blog
         * contact
         * etc.
         */
        $update = $pdo->prepare(
            'UPDATE website_content
             SET portfolio = :portfolio
             WHERE id = 1'
        );

        $update->execute([
            ':portfolio' => $portfolioJson,
        ]);

        /*
         * If the row does not exist, create it.
         */
        if ($update->rowCount() === 0) {
            $check = $pdo->query(
                'SELECT id FROM website_content
                 WHERE id = 1 LIMIT 1'
            );

            $exists = $check->fetch(PDO::FETCH_ASSOC);

            if (!$exists) {
                $insertContent = $pdo->prepare(
                    'INSERT INTO website_content
                     (id, portfolio)
                     VALUES (1, :portfolio)'
                );

                $insertContent->execute([
                    ':portfolio' => $portfolioJson,
                ]);
            }
        }

        /*
         * Save/update current media.
         */
        foreach ($mediaSlots as $slot => $media) {
            savePortfolioMedia(
                $pdo,
                $slot,
                $media['title'],
                $media['url']
            );
        }

        /*
         * Delete media removed from the submitted Portfolio.
         */
        deleteRemovedPortfolioMedia(
            $pdo,
            $mediaSlots
        );

        $pdo->commit();

        /*
         * Return complete updated Portfolio object.
         */
        $media = getPortfolioMedia($pdo);

        $updatedPortfolio = mergePortfolio(
            $portfolio,
            $media
        );

        jsonResponse([
            'success' => true,
            'message' => 'Portfolio saved successfully.',
            'portfolio' => $updatedPortfolio,

            // Compatibility with current frontend.
            'content' => [
                'portfolio' => $updatedPortfolio,
            ],
        ]);

        exit;

    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        errorResponse(
            'Portfolio save failed: ' . $e->getMessage(),
            500
        );
    }
}

/**
 * Main
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
        'Portfolio API error: ' . $e->getMessage(),
        500
    );
}