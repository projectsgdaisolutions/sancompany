<?php

ob_start();

/**
 * SAN Photography - Content API
 * backend/php/api/content.php
 *
 * Supports:
 *   GET
 *   PUT
 *
 * Stores:
 *   - Home content       -> website_content.home
 *   - Gallery content    -> website_content.gallery
 *   - Films content      -> website_content.gallery.films
 *   - About content      -> website_content.about
 *
 * GALLERY STRUCTURE:
 *
 * website_content.gallery
 *
 * {
 *   "heroEyebrow": "...",
 *   "heroHeadingLine1": "...",
 *   "heroHeadingLine2": "...",
 *
 *   "couples": [
 *      {
 *        "id": "...",
 *        "slug": "...",
 *        "name": "...",
 *        "location": "...",
 *        "image": "...",
 *        "order": 0
 *      }
 *   ],
 *
 *   "recentAlbums": [
 *      {
 *        "id": "...",
 *        "slug": "...",
 *        "name": "...",
 *        "location": "...",
 *        "image": "...",
 *        "order": 0
 *      }
 *   ]
 * }
 *
 * IMPORTANT:
 *   Maximum TOTAL gallery cards = 16
 *
 *   couples + recentAlbums <= 16
 *
 * PHOTO LIMIT:
 *   Maximum 40 photos per individual album/card.
 *   The 40-photo limit is enforced by gallery.php.
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../config/database.php';

handleCors();

$method = $_SERVER['REQUEST_METHOD'];

const MAX_GALLERY_CARDS = 16;
const MAX_COUPLES_CARDS = 12;
const MAX_RECENT_CARDS = 4;
const MAX_FILMS = 16;

const ALLOWED_FILM_CATEGORIES = [
    "Recent Cinema",
    "Wedding Films",
    "Cinematic Stories",
];

const FILM_CATEGORY_LIMITS = [
    'Recent Cinema' => 4,
    'Wedding Films' => 8,
    'Cinematic Stories' => 4,
];


/* =========================================================
   HELPERS
========================================================= */

/**
 * Safely read JSON request body.
 */
function getJsonBody(): array
{
    $raw = file_get_contents('php://input');

    if (!$raw) {
        return [];
    }

    $data = json_decode($raw, true);

    return is_array($data) ? $data : [];
}


/**
 * Safely decode JSON.
 */
function decodeJsonArray(?string $json): array
{
    if (!$json) {
        return [];
    }

    $decoded = json_decode($json, true);

    return is_array($decoded)
        ? $decoded
        : [];
}


/**
 * Get current gallery object.
 */
function getGalleryContent(PDO $pdo): array
{
    $stmt = $pdo->query(
        'SELECT gallery FROM website_content WHERE id = 1 LIMIT 1'
    );

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || empty($row['gallery'])) {
        return [];
    }

    return decodeJsonArray($row['gallery']);
}


/**
 * Save gallery object.
 */
function saveGalleryContent(
    PDO $pdo,
    array $gallery
): void {

    $json = json_encode(
        $gallery,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    if ($json === false) {
        throw new Exception(
            'Unable to encode gallery content.'
        );
    }

    $stmt = $pdo->prepare(
        '
        INSERT INTO website_content
        (
            id,
            gallery
        )
        VALUES
        (
            1,
            :gallery
        )
        ON DUPLICATE KEY UPDATE
            gallery = :gallery_update
        '
    );

    $executed = $stmt->execute([
        ':gallery' => $json,
        ':gallery_update' => $json,
    ]);

    if (!$executed) {
        throw new RuntimeException('Gallery content write failed.');
    }

    $saved = getGalleryContent($pdo);

    if ($saved !== $gallery) {
        throw new RuntimeException('Gallery content was not persisted.');
    }
}


/**
 * Normalize album/card data.
 */
function normalizeGalleryCard(
    array $card,
    int $index,
    string $prefix
): array {

    $id = trim(
        (string) (
            $card['id']
            ?? "{$prefix}-" . ($index + 1)
        )
    );

    $name = trim(
        (string) (
            $card['name']
            ?? ''
        )
    );

    $slug = trim(
        (string) (
            $card['slug']
            ?? ''
        )
    );

    $location = trim(
        (string) (
            $card['location']
            ?? ''
        )
    );

    $image = trim(
        (string) (
            $card['image']
            ?? ''
        )
    );

    $order = isset($card['order'])
        ? (int) $card['order']
        : $index;

    return [
        'id' => $id,
        'slug' => $slug,
        'name' => $name,
        'location' => $location,
        'image' => $image,
        'order' => $order,
    ];
}


/**
 * Validate gallery cards.
 *
 * TOTAL:
 *   couples + recentAlbums <= 16
 *
 * Slugs must be unique across both sections.
 */
function validateGalleryCards(
    array $couples,
    array $recentAlbums
): void {

    $totalCards =
        count($couples) +
        count($recentAlbums);

    if (count($couples) > MAX_COUPLES_CARDS) {
        errorResponse(
            'Maximum ' .
            MAX_COUPLES_CARDS .
            ' Photo Gallery cards are allowed. You currently have ' .
            count($couples) .
            ' cards.',
            400
        );
    }

    if (count($recentAlbums) > MAX_RECENT_CARDS) {
        errorResponse(
            'Maximum ' .
            MAX_RECENT_CARDS .
            ' Recent cards are allowed. You currently have ' .
            count($recentAlbums) .
            ' cards.',
            400
        );
    }

    if ($totalCards > MAX_GALLERY_CARDS) {

        errorResponse(
            'Maximum ' .
            MAX_GALLERY_CARDS .
            ' gallery cards are allowed in total. ' .
            'You currently have ' .
            $totalCards .
            ' cards.',
            400
        );
    }


    $slugs = [];


    /* ---------------------------------------------------------
       Validate Photo Gallery albums
    --------------------------------------------------------- */

    foreach (
        $couples
        as $index => $album
    ) {

        if (!is_array($album)) {
            errorResponse(
                'Invalid Photo Gallery album at position ' .
                ($index + 1) .
                '.',
                400
            );
        }

        $name = trim(
            (string) (
                $album['name']
                ?? ''
            )
        );

        $slug = trim(
            (string) (
                $album['slug']
                ?? ''
            )
        );

        if ($name === '') {
            errorResponse(
                'Photo Gallery album name is required at position ' .
                ($index + 1) .
                '.',
                400
            );
        }

        if ($slug === '') {
            errorResponse(
                'Photo Gallery album slug is required for "' .
                $name .
                '".',
                400
            );
        }

        if (
            !preg_match(
                '/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                $slug
            )
        ) {
            errorResponse(
                'Invalid slug "' .
                $slug .
                '". Use lowercase letters, numbers and hyphens only.',
                400
            );
        }

        if (isset($slugs[$slug])) {
            errorResponse(
                'Duplicate gallery slug "' .
                $slug .
                '". Slugs must be unique.',
                409
            );
        }

        $slugs[$slug] = true;
    }


    /* ---------------------------------------------------------
       Validate Recent albums
    --------------------------------------------------------- */

    foreach (
        $recentAlbums
        as $index => $album
    ) {

        if (!is_array($album)) {
            errorResponse(
                'Invalid Recent album at position ' .
                ($index + 1) .
                '.',
                400
            );
        }

        $name = trim(
            (string) (
                $album['name']
                ?? ''
            )
        );

        $slug = trim(
            (string) (
                $album['slug']
                ?? ''
            )
        );

        if ($name === '') {
            errorResponse(
                'Recent album name is required at position ' .
                ($index + 1) .
                '.',
                400
            );
        }

        if ($slug === '') {
            errorResponse(
                'Recent album slug is required for "' .
                $name .
                '".',
                400
            );
        }

        if (
            !preg_match(
                '/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                $slug
            )
        ) {
            errorResponse(
                'Invalid Recent slug "' .
                $slug .
                '". Use lowercase letters, numbers and hyphens only.',
                400
            );
        }

        if (isset($slugs[$slug])) {
            errorResponse(
                'Duplicate gallery slug "' .
                $slug .
                '". Slugs must be unique across Photo Gallery and Recent.',
                409
            );
        }

        $slugs[$slug] = true;
    }
}


/**
 * Sort cards by order.
 */
function sortGalleryCards(
    array $cards
): array {

    usort(
        $cards,
        function ($a, $b) {

            $orderA =
                isset($a['order'])
                    ? (int) $a['order']
                    : 0;

            $orderB =
                isset($b['order'])
                    ? (int) $b['order']
                    : 0;

            return $orderA <=> $orderB;
        }
    );

    return array_values(
        array_map(
            function ($card, $index) {

                $card['order'] = $index;

                return $card;
            },
            $cards,
            array_keys($cards)
        )
    );
}


/**
 * Normalize complete gallery structure.
 */
function normalizeGallery(
    array $gallery
): array {

    $couples =
        isset($gallery['couples']) &&
        is_array($gallery['couples'])
            ? $gallery['couples']
            : [];


    $recentAlbums =
        isset($gallery['recentAlbums']) &&
        is_array($gallery['recentAlbums'])
            ? $gallery['recentAlbums']
            : [];


    $normalizedCouples = [];

    foreach (
        $couples
        as $index => $couple
    ) {

        if (!is_array($couple)) {
            continue;
        }

        $normalizedCouples[] =
            normalizeGalleryCard(
                $couple,
                $index,
                'album'
            );
    }


    $normalizedRecentAlbums = [];

    foreach (
        $recentAlbums
        as $index => $album
    ) {

        if (!is_array($album)) {
            continue;
        }

        $normalizedRecentAlbums[] =
            normalizeGalleryCard(
                $album,
                $index,
                'recent'
            );
    }


    $normalizedCouples =
        sortGalleryCards(
            $normalizedCouples
        );

    $normalizedRecentAlbums =
        sortGalleryCards(
            $normalizedRecentAlbums
        );


    /*
     * Preserve all other gallery fields.
     */
    $normalized = $gallery;

    $normalized['couples'] =
        $normalizedCouples;

    $normalized['recentAlbums'] =
        $normalizedRecentAlbums;


    return $normalized;
}


/**
 * Normalize a single film item.
 */
function normalizeFilm(array $film, int $index): array
{
    $id = trim(
        (string) (
            $film['id'] ?? 'film-' . ($index + 1)
        )
    );

    $videoUrl = trim(
        (string) (
            $film['videoUrl'] ?? ''
        )
    );

    $title = trim(
        (string) (
            $film['title'] ?? ''
        )
    );

    $category = trim(
        (string) (
            $film['category'] ?? 'Recent Cinema'
        )
    );

    $location = trim(
        (string) (
            $film['location'] ?? ''
        )
    );

    $description = trim(
        (string) (
            $film['description'] ?? ''
        )
    );

    $date = trim(
        (string) (
            $film['date'] ?? ''
        )
    );

    $isActive = !array_key_exists('isActive', $film)
        ? true
        : (bool) $film['isActive'];

    return [
        'id' => $id,
        'videoUrl' => $videoUrl,
        'title' => $title,
        'category' => $category,
        'location' => $location,
        'description' => $description,
        'date' => $date,
        'isActive' => $isActive,
        'order' => $index,
    ];
}

function isPopulatedFilm(array $film): bool
{
    return trim((string) ($film['videoUrl'] ?? '')) !== '';
}

function validateFilmCategoryLimits(array $items): void
{
    $counts = array_fill_keys(ALLOWED_FILM_CATEGORIES, 0);

    foreach ($items as $film) {
        if (!isPopulatedFilm($film)) {
            continue;
        }

        $category = $film['category'] ?? '';
        if (array_key_exists($category, $counts)) {
            $counts[$category]++;
        }
    }

    foreach (FILM_CATEGORY_LIMITS as $category => $limit) {
        if ($counts[$category] > $limit) {
            errorResponse(
                $category . ' allows a maximum of ' . $limit . ' videos. Reduce this category before saving.',
                400
            );
        }
    }
}

/**
 * Normalize and validate the Films section.
 *
 * Total maximum = 16, distributed across the three film categories.
 */
function normalizeAndValidateFilms(array $films): array
{
    $items =
        isset($films['items']) &&
        is_array($films['items'])
            ? $films['items']
            : [];

    $populatedItems = array_values(
        array_filter(
            $items,
            static fn ($film) => is_array($film) && isPopulatedFilm($film)
        )
    );

    if (count($populatedItems) > MAX_FILMS) {
        errorResponse(
            'Maximum ' . MAX_FILMS . ' films are allowed. You currently have ' . count($populatedItems) . ' films.',
            400
        );
    }

    $normalizedItems = [];

    foreach ($items as $index => $film) {
        if (!is_array($film)) {
            errorResponse(
                'Invalid film at position ' . ($index + 1) . '.',
                400
            );
        }

        $normalizedFilm = normalizeFilm(
            $film,
            $index
        );

        if (
            isPopulatedFilm($normalizedFilm) &&
            !in_array(
                $normalizedFilm['category'],
                ALLOWED_FILM_CATEGORIES,
                true
            )
        ) {
            errorResponse(
                'Invalid film category for "' .
                ($normalizedFilm['title'] ?: 'Untitled Film') .
                '". Allowed categories: Recent Cinema, Wedding Films, Cinematic Stories.',
                400
            );
        }

        $normalizedItems[] = $normalizedFilm;
    }

    $normalized = $films;

    $normalized['heroVideoUrl'] = trim(
        (string) (
            $films['heroVideoUrl'] ?? ''
        )
    );

    $normalized['heroVideoText'] = trim(
        (string) (
            $films['heroVideoText'] ?? 'Inspired by Cinema.'
        )
    );

    $normalized['statementEyebrow'] = trim(
        (string) (
            $films['statementEyebrow'] ?? 'SAN PHOTOGRAPHY'
        )
    );

    $normalized['statementHeading'] = trim(
        (string) (
            $films['statementHeading'] ?? 'Every love story deserves to be felt again.'
        )
    );

    $normalized['statementText'] = trim(
        (string) (
            $films['statementText'] ?? 'We craft cinematic wedding films with a focus on emotion, atmosphere and authentic moments.'
        )
    );

    $normalized['items'] = $normalizedItems;

    return $normalized;
}

/**
 * Get Films section from the gallery JSON container.
 */
function getFilmsContent(PDO $pdo): array
{
    $gallery = getGalleryContent($pdo);

    if (
        isset($gallery['films']) &&
        is_array($gallery['films'])
    ) {
        return normalizeAndValidateFilms(
            $gallery['films']
        );
    }

    return [
        'heroVideoUrl' => '',
        'heroVideoText' => 'Inspired by Cinema.',
        'items' => [],
        'statementEyebrow' => 'SAN PHOTOGRAPHY',
        'statementHeading' => 'Every love story deserves to be felt again.',
        'statementText' => 'We craft cinematic wedding films with a focus on emotion, atmosphere and authentic moments.',
    ];
}

function getJsonColumnContent(PDO $pdo, string $column): ?array
{
    $allowedColumns = ['home', 'about'];

    if (!in_array($column, $allowedColumns, true)) {
        throw new InvalidArgumentException('Unsupported content column.');
    }

    $stmt = $pdo->query(
        "SELECT {$column} FROM website_content WHERE id = 1 LIMIT 1"
    );
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || $row[$column] === null || $row[$column] === '') {
        return null;
    }

    $decoded = json_decode($row[$column], true, 512, JSON_THROW_ON_ERROR);

    return is_array($decoded) ? $decoded : null;
}

function saveJsonColumnContent(PDO $pdo, string $column, array $content): array
{
    $allowedColumns = ['home', 'about'];

    if (!in_array($column, $allowedColumns, true)) {
        throw new InvalidArgumentException('Unsupported content column.');
    }

    $json = json_encode(
        $content,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
    );

    $check = $pdo->query('SELECT id FROM website_content WHERE id = 1 LIMIT 1');
    $exists = $check->fetch(PDO::FETCH_ASSOC);

    if ($exists) {
        $stmt = $pdo->prepare(
            "UPDATE website_content SET {$column} = :content WHERE id = 1"
        );
        $stmt->execute([':content' => $json]);
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO website_content (id, {$column}) VALUES (1, :content)"
        );
        $stmt->execute([':content' => $json]);
    }

    $saved = getJsonColumnContent($pdo, $column);

    if ($saved === null) {
        throw new RuntimeException("{$column} content was not persisted.");
    }

    return $saved;
}

/* =========================================================
   MAIN REQUEST
========================================================= */

try {

    $pdo = getDbConnection();


    /* =====================================================
       GET
    ===================================================== */

    if ($method === 'GET') {


        /* -------------------------------------------------
           HOME CONTENT
        ------------------------------------------------- */

        $homeContent = null;

        $homeContent = getJsonColumnContent($pdo, 'home');


        /* -------------------------------------------------
           GALLERY CONTENT
        ------------------------------------------------- */

        $galleryContent = [];

        try {

            $galleryContent =
                getGalleryContent(
                    $pdo
                );

            $galleryContent =
                normalizeGallery(
                    $galleryContent
                );

        } catch (Throwable $e) {

            $galleryContent = [];
        }


        /* -------------------------------------------------
           FILMS CONTENT
        ------------------------------------------------- */

        $filmsContent = [];

        try {

            $filmsContent =
                getFilmsContent(
                    $pdo
                );

        } catch (Throwable $e) {

            $filmsContent = [
                'heroVideoUrl' => '',
                'heroVideoText' => 'Inspired by Cinema.',
                'items' => [],
                'statementEyebrow' => 'SAN PHOTOGRAPHY',
                'statementHeading' => 'Every love story deserves to be felt again.',
                'statementText' => 'We craft cinematic wedding films with a focus on emotion, atmosphere and authentic moments.',
            ];
        }

        /* -------------------------------------------------
           ABOUT CONTENT
        ------------------------------------------------- */

        $aboutContent = null;

        $aboutContent = getJsonColumnContent($pdo, 'about');


        /* -------------------------------------------------
           CARD COUNTS
        ------------------------------------------------- */

        $couples =
            isset($galleryContent['couples']) &&
            is_array($galleryContent['couples'])
                ? $galleryContent['couples']
                : [];

        $recentAlbums =
            isset($galleryContent['recentAlbums']) &&
            is_array($galleryContent['recentAlbums'])
                ? $galleryContent['recentAlbums']
                : [];


        $totalGalleryCards =
            count($couples) +
            count($recentAlbums);


        /* -------------------------------------------------
           RESPONSE
        ------------------------------------------------- */

        jsonResponse(
            [
                'success' => true,

                'content' => [
                    'home' =>
                        $homeContent,

                    'gallery' =>
                        $galleryContent,

                    'films' =>
                        $filmsContent,

                    'about' =>
                        $aboutContent,
                ],

                /*
                 * Helpful values for frontend.
                 */
                'galleryLimits' => [
                    'maxCards' =>
                        MAX_GALLERY_CARDS,

                    'photoGalleryCards' =>
                        count($couples),

                    'recentCards' =>
                        count($recentAlbums),

                    'totalCards' =>
                        $totalGalleryCards,

                    'remainingCards' =>
                        max(
                            0,
                            MAX_GALLERY_CARDS -
                            $totalGalleryCards
                        ),

                    'maxPhotosPerCard' =>
                        40,

                    'films' => [
                        'maxFilms' => MAX_FILMS,
                        'totalFilms' => count($filmsContent['items'] ?? []),
                        'remainingFilms' => max(
                            0,
                            MAX_FILMS - count($filmsContent['items'] ?? [])
                        ),
                        'categories' => ALLOWED_FILM_CATEGORIES,
                        'categoryLimits' => FILM_CATEGORY_LIMITS,
                    ],
                ],
            ],
            200
        );

        exit;
    }


    /* =====================================================
       PUT
    ===================================================== */

    if ($method === 'PUT') {

        /*
         * Admin authentication required.
         */
        requireAdminAuth();


        $data =
            getJsonBody();


        if (empty($data)) {

            errorResponse(
                'Invalid JSON payload.',
                400
            );
        }


        $saved = [];


        /* -------------------------------------------------
           HOME CONTENT
        ------------------------------------------------- */

        $homeData =
            $data['content']['home']
            ?? $data['home']
            ?? null;


        if (
            $homeData !== null &&
            is_array($homeData)
        ) {

            $existingHome = getJsonColumnContent($pdo, 'home');
            $mergedHome = is_array($existingHome)
                ? array_replace($existingHome, $homeData)
                : $homeData;
            $saved['home'] = saveJsonColumnContent($pdo, 'home', $mergedHome);
        }


        /* -------------------------------------------------
           GALLERY CONTENT
        ------------------------------------------------- */

        /* -------------------------------------------------
           FILMS CONTENT

           Films are stored inside website_content.gallery.films.
           Hero Video is independent. Only films.items count
           toward MAX_FILMS = 16. Category distribution is free.
        ------------------------------------------------- */

        $filmsData =
            $data['content']['films']
            ?? $data['films']
            ?? null;

        if (
            $filmsData !== null &&
            is_array($filmsData)
        ) {
            $existingGallery =
                getGalleryContent($pdo);

            $normalizedFilms =
                normalizeAndValidateFilms(
                    $filmsData
                );

            validateFilmCategoryLimits(
                $normalizedFilms['items'] ?? []
            );

            $existingGallery['films'] =
                $normalizedFilms;

            saveGalleryContent(
                $pdo,
                $existingGallery
            );

            $saved['films'] =
                $normalizedFilms;
        }


        $galleryData =
            $data['content']['gallery']
            ?? $data['gallery']
            ?? null;


        if (
            $galleryData !== null &&
            is_array($galleryData)
        ) {


            /*
             * Existing gallery is loaded first.
             *
             * This prevents accidental deletion of fields
             * when frontend sends a partial gallery object.
             */
            $existingGallery =
                getGalleryContent(
                    $pdo
                );


            /*
             * Merge incoming gallery with existing gallery.
             */
            $mergedGallery =
                array_merge(
                    $existingGallery,
                    $galleryData
                );


            /* ---------------------------------------------
               Normalize Photo Gallery albums
            --------------------------------------------- */

            if (
                isset(
                    $galleryData['couples']
                )
            ) {

                $incomingCouples =
                    $galleryData['couples'];

                if (
                    !is_array(
                        $incomingCouples
                    )
                ) {

                    errorResponse(
                        'Gallery couples must be an array.',
                        400
                    );
                }


                $normalizedCouples = [];

                foreach (
                    $incomingCouples
                    as $index => $couple
                ) {

                    if (
                        !is_array(
                            $couple
                        )
                    ) {
                        continue;
                    }

                    $normalizedCouples[] =
                        normalizeGalleryCard(
                            $couple,
                            $index,
                            'album'
                        );
                }


                $mergedGallery['couples'] =
                    sortGalleryCards(
                        $normalizedCouples
                    );
            }


            /* ---------------------------------------------
               Normalize Recent albums
            --------------------------------------------- */

            if (
                isset(
                    $galleryData['recentAlbums']
                )
            ) {

                $incomingRecentAlbums =
                    $galleryData['recentAlbums'];

                if (
                    !is_array(
                        $incomingRecentAlbums
                    )
                ) {

                    errorResponse(
                        'Gallery recentAlbums must be an array.',
                        400
                    );
                }


                $normalizedRecentAlbums = [];

                foreach (
                    $incomingRecentAlbums
                    as $index => $album
                ) {

                    if (
                        !is_array(
                            $album
                        )
                    ) {
                        continue;
                    }

                    $normalizedRecentAlbums[] =
                        normalizeGalleryCard(
                            $album,
                            $index,
                            'recent'
                        );
                }


                $mergedGallery['recentAlbums'] =
                    sortGalleryCards(
                        $normalizedRecentAlbums
                    );
            }


            /*
             * Make sure arrays always exist.
             */
            if (
                !isset(
                    $mergedGallery['couples']
                ) ||
                !is_array(
                    $mergedGallery['couples']
                )
            ) {

                $mergedGallery['couples'] =
                    [];
            }


            if (
                !isset(
                    $mergedGallery['recentAlbums']
                ) ||
                !is_array(
                    $mergedGallery['recentAlbums']
                )
            ) {

                $mergedGallery['recentAlbums'] =
                    [];
            }


            /* ---------------------------------------------
               Validate / normalize Films when supplied inside
               the gallery payload as well.
            --------------------------------------------- */

            if (isset($galleryData['films'])) {
                if (!is_array($galleryData['films'])) {
                    errorResponse(
                        'Gallery films must be an object.',
                        400
                    );
                }

                $mergedGallery['films'] =
                    normalizeAndValidateFilms(
                        $galleryData['films']
                    );

                validateFilmCategoryLimits(
                    $mergedGallery['films']['items'] ?? []
                );

                $saved['films'] =
                    $mergedGallery['films'];
            }


            /* ---------------------------------------------
               Validate total 16-card limit
            --------------------------------------------- */

            validateGalleryCards(
                $mergedGallery['couples'],
                $mergedGallery['recentAlbums']
            );


            /*
             * Final normalization.
             */
            $mergedGallery =
                normalizeGallery(
                    $mergedGallery
                );


            /*
             * Save into website_content.gallery
             */
            saveGalleryContent(
                $pdo,
                $mergedGallery
            );


            $saved['gallery'] =
                $mergedGallery;
        }


        /* -------------------------------------------------
           NOTHING TO SAVE
        ------------------------------------------------- */

        if (empty($saved)) {

            errorResponse(
                'Invalid payload: missing recognizable content data (home, gallery or films).',
                400
            );
        }


        /* -------------------------------------------------
           FINAL RESPONSE
        ------------------------------------------------- */

        $responseGallery =
            $saved['gallery']
            ?? getGalleryContent($pdo);

        $responseFilms =
            $saved['films']
            ?? (
                isset($responseGallery['films']) &&
                is_array($responseGallery['films'])
                    ? normalizeAndValidateFilms(
                        $responseGallery['films']
                    )
                    : getFilmsContent($pdo)
            );


        $responseCouples =
            isset(
                $responseGallery['couples']
            ) &&
            is_array(
                $responseGallery['couples']
            )
                ? $responseGallery['couples']
                : [];


        $responseRecentAlbums =
            isset(
                $responseGallery['recentAlbums']
            ) &&
            is_array(
                $responseGallery['recentAlbums']
            )
                ? $responseGallery['recentAlbums']
                : [];


        $totalCards =
            count($responseCouples) +
            count($responseRecentAlbums);


        jsonResponse(
            [
                'success' => true,

                'message' =>
                    'Content saved successfully.',

                'content' =>
                    array_merge(
                        $saved,
                        [
                            'films' => $responseFilms,
                        ]
                    ),

                'galleryLimits' => [
                    'maxCards' =>
                        MAX_GALLERY_CARDS,

                    'photoGalleryCards' =>
                        count($responseCouples),

                    'recentCards' =>
                        count($responseRecentAlbums),

                    'totalCards' =>
                        $totalCards,

                    'remainingCards' =>
                        max(
                            0,
                            MAX_GALLERY_CARDS -
                            $totalCards
                        ),

                    'maxPhotosPerCard' =>
                        40,

                    'films' => [
                        'maxFilms' => MAX_FILMS,
                        'totalFilms' => count($responseFilms['items'] ?? []),
                        'remainingFilms' => max(
                            0,
                            MAX_FILMS - count($responseFilms['items'] ?? [])
                        ),
                        'categories' => ALLOWED_FILM_CATEGORIES,
                        'categoryLimits' => FILM_CATEGORY_LIMITS,
                    ],
                ],
            ],
            200
        );

        exit;
    }


    /* =====================================================
       METHOD NOT ALLOWED
    ===================================================== */

    errorResponse(
        'Method not allowed.',
        405
    );

} catch (Throwable $e) {

    /*
     * IMPORTANT:
     *
     * Never return PHP warning/HTML to frontend.
     * Frontend always receives JSON.
     */

    http_response_code(500);

    if (ob_get_length()) {
        ob_clean();
    }

    header(
        'Content-Type: application/json; charset=utf-8'
    );

    echo json_encode(
        [
            'success' => false,
            'message' => 'Content request failed: ' . $e->getMessage(),
        ],
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    exit;
}