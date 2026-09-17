<?php

ob_start();

/**
 * SAN Photography - Gallery API
 * backend/php/api/gallery.php
 *
 * =========================================================
 * STORAGE STRUCTURE
 * =========================================================
 *
 * Album/Card metadata:
 *   website_content.gallery
 *
 * Photo Gallery albums:
 *   website_content.gallery.couples[]
 *
 * Recent albums:
 *   website_content.gallery.recentAlbums[]
 *
 * Photo Gallery media:
 *   gallery_media.category = gallery:<slug>
 *
 * Recent media:
 *   gallery_media.category = recent:<slug>
 *
 * =========================================================
 * LIMITS
 * =========================================================
 *
 * Maximum total cards:
 *   couples + recentAlbums = 16
 *
 * Maximum photos per individual card:
 *   40
 *
 * Cover image:
 *   Stored in website_content.gallery
 *   NOT counted as one of the 40 photos.
 *
 * Actual media files:
 *   Cloudinary
 *
 * Database:
 *   MySQL
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
const MAX_PHOTOS_PER_CARD = 40;


/* =========================================================
   HELPERS
========================================================= */

/**
 * Read JSON request body.
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
 * Get gallery metadata from website_content.
 */
function getGalleryMetadata(PDO $pdo): array
{
    $stmt = $pdo->query(
        '
        SELECT gallery
        FROM website_content
        WHERE id = 1
        LIMIT 1
        '
    );

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (
        !$row ||
        empty($row['gallery'])
    ) {
        return [];
    }

    $gallery = json_decode(
        $row['gallery'],
        true
    );

    return is_array($gallery)
        ? $gallery
        : [];
}


/**
 * Save gallery metadata.
 */
function saveGalleryMetadata(
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
            'Unable to encode gallery metadata.'
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

    $stmt->execute([
        ':gallery' =>
            $json,

        ':gallery_update' =>
            $json,
    ]);
}


/**
 * Return all couples.
 */
function getCouples(
    array $gallery
): array {

    if (
        !isset($gallery['couples']) ||
        !is_array($gallery['couples'])
    ) {
        return [];
    }

    return $gallery['couples'];
}


/**
 * Return all recent albums.
 */
function getRecentAlbums(
    array $gallery
): array {

    if (
        !isset($gallery['recentAlbums']) ||
        !is_array($gallery['recentAlbums'])
    ) {
        return [];
    }

    return $gallery['recentAlbums'];
}


/**
 * Determine section from request.
 *
 * Supported:
 *   couples
 *   recentAlbums
 */
function normalizeSection(
    ?string $section
): string {

    $section = trim(
        (string) $section
    );

    if (
        $section === 'recent' ||
        $section === 'recentAlbums'
    ) {
        return 'recentAlbums';
    }

    return 'couples';
}


/**
 * Build media category from section + slug.
 */
function buildCategory(
    string $section,
    string $slug
): string {

    if ($section === 'recentAlbums') {
        return 'recent:' . $slug;
    }

    return 'gallery:' . $slug;
}


/**
 * Determine section from a media category.
 */
function getSectionFromCategory(
    string $category
): string {

    if (
        str_starts_with(
            $category,
            'recent:'
        )
    ) {
        return 'recentAlbums';
    }

    return 'couples';
}


/**
 * Find album/card by slug.
 */
function findAlbumBySlug(
    PDO $pdo,
    string $slug
): ?array {

    $gallery =
        getGalleryMetadata($pdo);

    foreach (
        [
            'couples',
            'recentAlbums'
        ]
        as $section
    ) {

        $items =
            $gallery[$section]
            ?? [];

        if (
            !is_array($items)
        ) {
            continue;
        }

        foreach (
            $items
            as $item
        ) {

            if (
                is_array($item) &&
                ($item['slug'] ?? '') === $slug
            ) {

                $item['_section'] =
                    $section;

                return $item;
            }
        }
    }

    return null;
}


/**
 * Check whether slug exists anywhere.
 */
function slugExists(
    array $gallery,
    string $slug,
    ?string $ignoreSlug = null
): bool {

    foreach (
        [
            'couples',
            'recentAlbums'
        ]
        as $section
    ) {

        $items =
            $gallery[$section]
            ?? [];

        if (
            !is_array($items)
        ) {
            continue;
        }

        foreach (
            $items
            as $item
        ) {

            if (!is_array($item)) {
                continue;
            }

            $existingSlug =
                trim(
                    (string) (
                        $item['slug']
                        ?? ''
                    )
                );

            if (
                $ignoreSlug !== null &&
                $existingSlug === $ignoreSlug
            ) {
                continue;
            }

            if (
                $existingSlug === $slug
            ) {
                return true;
            }
        }
    }

    return false;
}


/**
 * Count ALL media rows for category.
 *
 * We intentionally count all rows, not only active rows.
 * This ensures the hard 40-photo limit cannot be bypassed
 * by changing is_active.
 */
function getPhotoCount(
    PDO $pdo,
    string $category
): int {

    $stmt = $pdo->prepare(
        '
        SELECT COUNT(*)
        FROM gallery_media
        WHERE category = :category
        '
    );

    $stmt->execute([
        ':category' =>
            $category,
    ]);

    return (int) $stmt->fetchColumn();
}


/**
 * Common media SELECT.
 */
function mediaSelectSql(): string
{
    return '
        SELECT
            id,
            category,
            title,
            image_url AS imageUrl,
            public_id AS publicId,
            resource_type AS resourceType,
            format,
            width,
            height,
            bytes,
            folder,
            `order`,
            is_active AS isActive,
            created_at AS createdAt,
            updated_at AS updatedAt
        FROM gallery_media
    ';
}


/**
 * Normalize album/card.
 */
function normalizeAlbum(
    array $album,
    int $index,
    string $prefix
): array {

    return [
        'id' =>
            $album['id']
            ?? (
                $prefix .
                '-' .
                time() .
                '-' .
                ($index + 1)
            ),

        'slug' =>
            trim(
                (string) (
                    $album['slug']
                    ?? ''
                )
            ),

        'name' =>
            trim(
                (string) (
                    $album['name']
                    ?? ''
                )
            ),

        'location' =>
            trim(
                (string) (
                    $album['location']
                    ?? ''
                )
            ),

        'image' =>
            trim(
                (string) (
                    $album['image']
                    ?? ''
                )
            ),

        'order' =>
            isset($album['order'])
                ? (int) $album['order']
                : $index,
    ];
}


/**
 * Sort album list by order.
 */
function sortAlbums(
    array $albums
): array {

    usort(
        $albums,
        function (
            $a,
            $b
        ) {

            return
                ((int) (
                    $a['order']
                    ?? 0
                ))
                <=>
                ((int) (
                    $b['order']
                    ?? 0
                ));
        }
    );

    foreach (
        $albums
        as $index => &$album
    ) {

        $album['order'] =
            $index;
    }

    unset($album);

    return array_values(
        $albums
    );
}


/**
 * Get next order for a section.
 */
function getNextAlbumOrder(
    array $gallery,
    string $section
): int {

    $items =
        $gallery[$section]
        ?? [];

    if (
        !is_array($items) ||
        count($items) === 0
    ) {
        return 0;
    }

    $maxOrder = -1;

    foreach (
        $items
        as $item
    ) {

        if (
            is_array($item) &&
            isset($item['order'])
        ) {

            $maxOrder =
                max(
                    $maxOrder,
                    (int) $item['order']
                );
        }
    }

    return $maxOrder + 1;
}


/**
 * Ensure gallery arrays exist.
 */
function ensureGalleryArrays(
    array &$gallery
): void {

    if (
        !isset($gallery['couples']) ||
        !is_array($gallery['couples'])
    ) {
        $gallery['couples'] = [];
    }

    if (
        !isset($gallery['recentAlbums']) ||
        !is_array($gallery['recentAlbums'])
    ) {
        $gallery['recentAlbums'] = [];
    }
}


/* =========================================================
   MAIN
========================================================= */

try {

    $pdo = getDbConnection();


    /* =====================================================
       GET
    ===================================================== */

    if ($method === 'GET') {

        $slug =
            trim(
                (string) (
                    $_GET['slug']
                    ?? ''
                )
            );

        $type =
            trim(
                (string) (
                    $_GET['type']
                    ?? ''
                )
            );


        /* =================================================
           GET SINGLE ALBUM
        ================================================= */

        if ($slug !== '') {

            $album =
                findAlbumBySlug(
                    $pdo,
                    $slug
                );


            /*
             * Determine category even if metadata
             * is temporarily missing.
             */
            if ($album) {

                $section =
                    $album['_section']
                    ?? 'couples';

                $category =
                    buildCategory(
                        $section,
                        $slug
                    );

            } else {

                /*
                 * Support explicit section query:
                 * ?slug=xxx&section=recentAlbums
                 */
                $section =
                    normalizeSection(
                        $_GET['section']
                        ?? null
                    );

                $category =
                    buildCategory(
                        $section,
                        $slug
                    );
            }


            $includeInactive =
                isset($_GET['include_inactive']) &&
                $_GET['include_inactive'] === '1';

            if ($includeInactive) {
                requireAdminAuth();
            }

            $stmt =
                $pdo->prepare(
                    mediaSelectSql() .
                    '
                    WHERE category = :category
                    ' . ($includeInactive ? '' : 'AND is_active = 1') . '
                    ORDER BY
                        `order` ASC,
                        id ASC
                    '
                );


            $stmt->execute([
                ':category' =>
                    $category,
            ]);


            $photos =
                $stmt->fetchAll(
                    PDO::FETCH_ASSOC
                );


            /*
             * Remove internal helper field.
             */
            if ($album) {
                unset(
                    $album['_section']
                );
            }


            jsonResponse(
                [
                    'success' => true,

                    'album' =>
                        $album,

                    'slug' =>
                        $slug,

                    'section' =>
                        $section,

                    'category' =>
                        $category,

                    'photos' =>
                        $photos,

                    'count' =>
                        count($photos),

                    'maxPhotos' =>
                        MAX_PHOTOS_PER_CARD,
                ],
                200
            );

            exit;
        }


        /* =================================================
           GET RECENT ALBUM LIST
        ================================================= */

        if (
            $type === 'recent' ||
            $type === 'recentAlbums'
        ) {

            $gallery =
                getGalleryMetadata(
                    $pdo
                );

            $recentAlbums =
                getRecentAlbums(
                    $gallery
                );

            $recentAlbums =
                sortAlbums(
                    array_map(
                        function (
                            $album,
                            $index
                        ) {

                            return normalizeAlbum(
                                $album,
                                $index,
                                'recent'
                            );

                        },
                        $recentAlbums,
                        array_keys(
                            $recentAlbums
                        )
                    )
                );


            /*
             * Attach photo counts to each recent album.
             */
            foreach (
                $recentAlbums
                as &$album
            ) {

                $slug =
                    $album['slug'];

                $category =
                    buildCategory(
                        'recentAlbums',
                        $slug
                    );

                $album['photoCount'] =
                    getPhotoCount(
                        $pdo,
                        $category
                    );

                $album['maxPhotos'] =
                    MAX_PHOTOS_PER_CARD;
            }

            unset($album);


            jsonResponse(
                [
                    'success' => true,

                    'recentAlbums' =>
                        $recentAlbums,

                    /*
                     * Backward-compatible key.
                     */
                    'recent' =>
                        $recentAlbums,

                    'count' =>
                        count($recentAlbums),

                    'maxCards' =>
                        MAX_GALLERY_CARDS,

                    'maxPhotosPerCard' =>
                        MAX_PHOTOS_PER_CARD,
                ],
                200
            );

            exit;
        }


        /* =================================================
           GET ALL GALLERY DATA
        ================================================= */

        $gallery =
            getGalleryMetadata(
                $pdo
            );

        ensureGalleryArrays(
            $gallery
        );

        // -----------------------------------------------------
        // GET AGGREGATED RECENT PHOTOS
        // -----------------------------------------------------
        if (
            $type === 'recentPhotos'
        ) {
            $stmt = $pdo->prepare(
                "
                SELECT
                    id,
                    category,
                    title,
                    image_url AS imageUrl,
                    public_id AS publicId,
                    resource_type AS resourceType,
                    format,
                    width,
                    height,
                    bytes,
                    folder,
                    `order`,
                    is_active AS isActive,
                    created_at AS createdAt,
                    updated_at AS updatedAt
                FROM gallery_media
                WHERE category LIKE 'recent:%'
                  AND is_active = 1
                ORDER BY
                    `order` ASC,
                    id ASC
                "
            );
            $stmt->execute();
            $photos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            jsonResponse(
                [
                    'success' => true,
                    'recentPhotos' => $photos,
                    'count' => count($photos),
                    'maxPhotosPerCard' => MAX_PHOTOS_PER_CARD,
                ],
                200
            );
            exit;
        }


        $couples =
            sortAlbums(
                array_map(
                    function (
                        $album,
                        $index
                    ) {

                        return normalizeAlbum(
                            $album,
                            $index,
                            'album'
                        );

                    },
                    $gallery['couples'],
                    array_keys(
                        $gallery['couples']
                    )
                )
            );


        $recentAlbums =
            sortAlbums(
                array_map(
                    function (
                        $album,
                        $index
                    ) {

                        return normalizeAlbum(
                            $album,
                            $index,
                            'recent'
                        );

                    },
                    $gallery['recentAlbums'],
                    array_keys(
                        $gallery['recentAlbums']
                    )
                )
            );


        /*
         * Get all active media.
         */
        $stmt =
            $pdo->query(
                mediaSelectSql() .
                '
                WHERE is_active = 1
                ORDER BY
                    `order` ASC,
                    id ASC
                '
            );


        $rows =
            $stmt->fetchAll(
                PDO::FETCH_ASSOC
            );


        $galleryBySlug = [];
        $recentBySlug = [];


        foreach (
            $rows
            as $row
        ) {

            $category =
                $row['category'];


            if (
                str_starts_with(
                    $category,
                    'gallery:'
                )
            ) {

                $slug =
                    substr(
                        $category,
                        strlen('gallery:')
                    );


                if (
                    !isset(
                        $galleryBySlug[$slug]
                    )
                ) {

                    $galleryBySlug[$slug] =
                        [];
                }


                $galleryBySlug[$slug][] =
                    $row;

                continue;
            }


            if (
                str_starts_with(
                    $category,
                    'recent:'
                )
            ) {

                $slug =
                    substr(
                        $category,
                        strlen('recent:')
                    );


                if (
                    !isset(
                        $recentBySlug[$slug]
                    )
                ) {

                    $recentBySlug[$slug] =
                        [];
                }


                $recentBySlug[$slug][] =
                    $row;
            }
        }


        /*
         * Add photo counts to cards.
         */
        foreach (
            $couples
            as &$album
        ) {

            $slug =
                $album['slug'];

            $category =
                buildCategory(
                    'couples',
                    $slug
                );

            $album['photoCount'] =
                getPhotoCount(
                    $pdo,
                    $category
                );

            $album['maxPhotos'] =
                MAX_PHOTOS_PER_CARD;
        }

        unset($album);


        foreach (
            $recentAlbums
            as &$album
        ) {

            $slug =
                $album['slug'];

            $category =
                buildCategory(
                    'recentAlbums',
                    $slug
                );

            $album['photoCount'] =
                getPhotoCount(
                    $pdo,
                    $category
                );

            $album['maxPhotos'] =
                MAX_PHOTOS_PER_CARD;
        }

        unset($album);


        /*
         * Put normalized arrays back in gallery object.
         */
        $gallery['couples'] =
            $couples;

        $gallery['recentAlbums'] =
            $recentAlbums;


        $totalCards =
            count($couples) +
            count($recentAlbums);


        jsonResponse(
            [
                'success' => true,

                'gallery' =>
                    $gallery,

                'albums' =>
                    $couples,

                'couples' =>
                    $couples,

                'recentAlbums' =>
                    $recentAlbums,

                'galleryBySlug' =>
                    $galleryBySlug,

                'recentBySlug' =>
                    $recentBySlug,

                'all' =>
                    $rows,

                'limits' => [
                    'maxCards' =>
                        MAX_GALLERY_CARDS,

                    'maxPhotosPerCard' =>
                        MAX_PHOTOS_PER_CARD,

                    'totalCards' =>
                        $totalCards,

                    'remainingCards' =>
                        max(
                            0,
                            MAX_GALLERY_CARDS -
                            $totalCards
                        ),
                ],

                /*
                 * Backward-compatible maxPhotos key.
                 */
                'maxPhotos' =>
                    MAX_PHOTOS_PER_CARD,
            ],
            200
        );

        exit;
    }


    /* =====================================================
       AUTH REQUIRED FOR MUTATIONS
    ===================================================== */

    requireAdminAuth();


    /* =====================================================
       POST
    ===================================================== */

    if ($method === 'POST') {

        $data =
            getJsonBody();


        if (empty($data)) {

            errorResponse(
                'Invalid JSON payload.',
                400
            );
        }


        $action =
            trim(
                (string) (
                    $data['action']
                    ?? ''
                )
            );


        /* =================================================
           CREATE ALBUM / CARD
        ================================================= */

        if (
            $action === 'create_album' ||
            $action === 'create_recent_album'
        ) {

            $gallery =
                getGalleryMetadata(
                    $pdo
                );

            ensureGalleryArrays(
                $gallery
            );


            /*
             * Determine section.
             */
            if (
                $action ===
                'create_recent_album'
            ) {

                $section =
                    'recentAlbums';

            } else {

                $section =
                    normalizeSection(
                        $data['section']
                        ?? 'couples'
                    );
            }


            /*
             * Hard maximum 16 cards TOTAL.
             */
            $totalCards =
                count(
                    $gallery['couples']
                ) +
                count(
                    $gallery['recentAlbums']
                );


            if ($section === 'recentAlbums' && count($gallery['recentAlbums']) >= MAX_RECENT_CARDS) {
                errorResponse(
                    'Maximum ' .
                    MAX_RECENT_CARDS .
                    ' Recent cards are allowed.',
                    400
                );
            }

            if ($section === 'couples' && count($gallery['couples']) >= MAX_COUPLES_CARDS) {
                errorResponse(
                    'Maximum ' .
                    MAX_COUPLES_CARDS .
                    ' Photo Gallery cards are allowed.',
                    400
                );
            }

            if (
                $totalCards >=
                MAX_GALLERY_CARDS
            ) {

                errorResponse(
                    'Maximum ' .
                    MAX_GALLERY_CARDS .
                    ' gallery cards are allowed in total.',
                    400
                );
            }


            $name =
                trim(
                    (string) (
                        $data['name']
                        ?? ''
                    )
                );


            $slug =
                trim(
                    (string) (
                        $data['slug']
                        ?? ''
                    )
                );


            $location =
                trim(
                    (string) (
                        $data['location']
                        ?? ''
                    )
                );


            $image =
                trim(
                    (string) (
                        $data['image']
                        ?? ''
                    )
                );


            if ($name === '') {

                errorResponse(
                    'Album name is required.',
                    400
                );
            }


            if ($slug === '') {

                errorResponse(
                    'Album slug is required.',
                    400
                );
            }


            /*
             * Validate slug.
             */
            if (
                !preg_match(
                    '/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                    $slug
                )
            ) {

                errorResponse(
                    'Invalid slug. Use lowercase letters, numbers and hyphens only.',
                    400
                );
            }


            /*
             * Slug must be unique across BOTH sections.
             */
            if (
                slugExists(
                    $gallery,
                    $slug
                )
            ) {

                errorResponse(
                    'An album with this slug already exists.',
                    409
                );
            }


            $order =
                getNextAlbumOrder(
                    $gallery,
                    $section
                );


            $prefix =
                $section === 'recentAlbums'
                    ? 'recent'
                    : 'album';


            $newAlbum = [
                'id' =>
                    $data['id']
                    ??
                    (
                        $prefix .
                        '-' .
                        time() .
                        '-' .
                        random_int(
                            1000,
                            9999
                        )
                    ),

                'slug' =>
                    $slug,

                'name' =>
                    $name,

                'location' =>
                    $location,

                'image' =>
                    $image,

                'order' =>
                    $order,
            ];


            $gallery[$section][] =
                $newAlbum;


            $gallery[$section] =
                sortAlbums(
                    $gallery[$section]
                );


            saveGalleryMetadata(
                $pdo,
                $gallery
            );


            jsonResponse(
                [
                    'success' => true,

                    'message' =>
                        (
                            $section ===
                            'recentAlbums'
                        )
                            ? 'Recent album created successfully.'
                            : 'Photo Gallery album created successfully.',

                    'section' =>
                        $section,

                    'album' =>
                        $newAlbum,

                    'totalCards' =>
                        count(
                            $gallery['couples']
                        ) +
                        count(
                            $gallery['recentAlbums']
                        ),

                    'remainingCards' =>
                        MAX_GALLERY_CARDS -
                        (
                            count(
                                $gallery['couples']
                            ) +
                            count(
                                $gallery['recentAlbums']
                            )
                        ),
                ],
                201
            );

            exit;
        }


        /* =================================================
           CREATE MEDIA - BATCH
        ================================================= */

        if (
            isset($data['items']) &&
            is_array($data['items'])
        ) {

            $items =
                $data['items'];


            if (
                count($items) === 0
            ) {

                errorResponse(
                    'No media items provided.',
                    400
                );
            }


            /*
             * Group items by category.
             */
            $grouped = [];


            foreach (
                $items
                as $item
            ) {

                if (!is_array($item)) {
                    continue;
                }


                $category =
                    trim(
                        (string) (
                            $item['category']
                            ?? ''
                        )
                    );


                $imageUrl =
                    trim(
                        (string) (
                            $item['imageUrl']
                            ??
                            $item['image_url']
                            ??
                            ''
                        )
                    );


                if (
                    $category === '' ||
                    $imageUrl === ''
                ) {
                    continue;
                }


                if (
                    !isset(
                        $grouped[$category]
                    )
                ) {

                    $grouped[$category] =
                        [];
                }


                $grouped[$category][] =
                    $item;
            }


            if (
                empty($grouped)
            ) {

                errorResponse(
                    'No valid media items provided.',
                    400
                );
            }


            /*
             * Validate every category.
             *
             * This is done BEFORE inserting anything.
             */
            foreach (
                $grouped
                as $category =>
                $categoryItems
            ) {

                $currentCount =
                    getPhotoCount(
                        $pdo,
                        $category
                    );


                $requestedCount =
                    count(
                        $categoryItems
                    );


                $remaining =
                    MAX_PHOTOS_PER_CARD -
                    $currentCount;


                if (
                    $requestedCount >
                    $remaining
                ) {

                    errorResponse(
                        "Maximum " .
                        MAX_PHOTOS_PER_CARD .
                        " photos allowed for category '" .
                        $category .
                        "'. " .
                        "Currently " .
                        $currentCount .
                        " photos exist and only " .
                        max(
                            0,
                            $remaining
                        ) .
                        " more can be added.",
                        400
                    );
                }
            }


            /*
             * Insert all media in transaction.
             */
            $pdo->beginTransaction();


            try {

                $insertStmt =
                    $pdo->prepare(
                        '
                        INSERT INTO gallery_media
                        (
                            category,
                            title,
                            image_url,
                            public_id,
                            resource_type,
                            format,
                            width,
                            height,
                            bytes,
                            folder,
                            `order`,
                            is_active
                        )
                        VALUES
                        (
                            :category,
                            :title,
                            :image_url,
                            :public_id,
                            :resource_type,
                            :format,
                            :width,
                            :height,
                            :bytes,
                            :folder,
                            :media_order,
                            :is_active
                        )
                        '
                    );


                $inserted = [];


                /*
                 * Keep track of next order for each category.
                 */
                $nextOrder = [];


                foreach (
                    $grouped
                    as $category =>
                    $categoryItems
                ) {

                    $nextOrder[$category] =
                        getPhotoCount(
                            $pdo,
                            $category
                        );
                }


                foreach (
                    $items
                    as $item
                ) {

                    if (!is_array($item)) {
                        continue;
                    }


                    $category =
                        trim(
                            (string) (
                                $item['category']
                                ?? ''
                            )
                        );


                    $imageUrl =
                        trim(
                            (string) (
                                $item['imageUrl']
                                ??
                                $item['image_url']
                                ??
                                ''
                            )
                        );


                    if (
                        $category === '' ||
                        $imageUrl === ''
                    ) {
                        continue;
                    }


                    $title =
                        trim(
                            (string) (
                                $item['title']
                                ?? ''
                            )
                        );


                    $publicId =
                        trim(
                            (string) (
                                $item['publicId']
                                ??
                                $item['public_id']
                                ??
                                ''
                            )
                        );


                    $resourceType =
                        trim(
                            (string) (
                                $item['resourceType']
                                ??
                                $item['resource_type']
                                ??
                                'image'
                            )
                        );


                    $format =
                        trim(
                            (string) (
                                $item['format']
                                ?? ''
                            )
                        );


                    $width =
                        isset($item['width'])
                            ? (int) $item['width']
                            : null;


                    $height =
                        isset($item['height'])
                            ? (int) $item['height']
                            : null;


                    $bytes =
                        isset($item['bytes'])
                            ? (int) $item['bytes']
                            : null;


                    $folder =
                        trim(
                            (string) (
                                $item['folder']
                                ??
                                'san-photography/gallery'
                            )
                        );


                    /*
                     * New uploads go to the end.
                     */
                    if (
                        isset($item['order'])
                    ) {

                        $mediaOrder =
                            (int) $item['order'];

                    } else {

                        $mediaOrder =
                            $nextOrder[
                                $category
                            ];

                        $nextOrder[
                            $category
                        ]++;
                    }


                    $isActive =
                        isset(
                            $item['isActive']
                        )
                            ? (
                                $item['isActive']
                                    ? 1
                                    : 0
                            )
                            : 1;


                    $insertStmt->execute([
                        ':category' =>
                            $category,

                        ':title' =>
                            $title,

                        ':image_url' =>
                            $imageUrl,

                        ':public_id' =>
                            $publicId,

                        ':resource_type' =>
                            $resourceType,

                        ':format' =>
                            $format,

                        ':width' =>
                            $width,

                        ':height' =>
                            $height,

                        ':bytes' =>
                            $bytes,

                        ':folder' =>
                            $folder,

                        ':media_order' =>
                            $mediaOrder,

                        ':is_active' =>
                            $isActive,
                    ]);


                    $newId =
                        (int) (
                            $pdo->lastInsertId()
                        );


                    $inserted[] = [
                        'id' =>
                            $newId,

                        'category' =>
                            $category,

                        'title' =>
                            $title,

                        'imageUrl' =>
                            $imageUrl,

                        'publicId' =>
                            $publicId,

                        'resourceType' =>
                            $resourceType,

                        'format' =>
                            $format,

                        'width' =>
                            $width,

                        'height' =>
                            $height,

                        'bytes' =>
                            $bytes,

                        'folder' =>
                            $folder,

                        'order' =>
                            $mediaOrder,

                        'isActive' =>
                            (bool) $isActive,
                    ];
                }


                $pdo->commit();


                jsonResponse(
                    [
                        'success' => true,

                        'message' =>
                            count($inserted) .
                            ' photos uploaded successfully.',

                        'items' =>
                            $inserted,
                    ],
                    201
                );

                exit;

            } catch (Throwable $e) {

                if (
                    $pdo->inTransaction()
                ) {
                    $pdo->rollBack();
                }

                throw $e;
            }
        }


        /* =================================================
           CREATE SINGLE MEDIA
        ================================================= */

        $category =
            trim(
                (string) (
                    $data['category']
                    ?? ''
                )
            );


        $imageUrl =
            trim(
                (string) (
                    $data['imageUrl']
                    ??
                    $data['image_url']
                    ??
                    ''
                )
            );


        if (
            $category === '' ||
            $imageUrl === ''
        ) {

            errorResponse(
                'Category and imageUrl are required.',
                400
            );
        }


        $currentCount =
            getPhotoCount(
                $pdo,
                $category
            );


        if (
            $currentCount >=
            MAX_PHOTOS_PER_CARD
        ) {

            errorResponse(
                'Maximum ' .
                MAX_PHOTOS_PER_CARD .
                ' photos reached for this album.',
                400
            );
        }


        $title =
            trim(
                (string) (
                    $data['title']
                    ?? ''
                )
            );


        $publicId =
            trim(
                (string) (
                    $data['publicId']
                    ??
                    $data['public_id']
                    ??
                    ''
                )
            );


        $resourceType =
            trim(
                (string) (
                    $data['resourceType']
                    ??
                    $data['resource_type']
                    ??
                    'image'
                )
            );


        $format =
            trim(
                (string) (
                    $data['format']
                    ?? ''
                )
            );


        $width =
            isset($data['width'])
                ? (int) $data['width']
                : null;


        $height =
            isset($data['height'])
                ? (int) $data['height']
                : null;


        $bytes =
            isset($data['bytes'])
                ? (int) $data['bytes']
                : null;


        $folder =
            trim(
                (string) (
                    $data['folder']
                    ??
                    'san-photography/gallery'
                )
            );


        $order =
            isset($data['order'])
                ? (int) $data['order']
                : $currentCount;


        $isActive =
            isset($data['isActive'])
                ? (
                    $data['isActive']
                        ? 1
                        : 0
                )
                : 1;


        $stmt =
            $pdo->prepare(
                '
                INSERT INTO gallery_media
                (
                    category,
                    title,
                    image_url,
                    public_id,
                    resource_type,
                    format,
                    width,
                    height,
                    bytes,
                    folder,
                    `order`,
                    is_active
                )
                VALUES
                (
                    :category,
                    :title,
                    :image_url,
                    :public_id,
                    :resource_type,
                    :format,
                    :width,
                    :height,
                    :bytes,
                    :folder,
                    :media_order,
                    :is_active
                )
                '
            );


        $stmt->execute([
            ':category' =>
                $category,

            ':title' =>
                $title,

            ':image_url' =>
                $imageUrl,

            ':public_id' =>
                $publicId,

            ':resource_type' =>
                $resourceType,

            ':format' =>
                $format,

            ':width' =>
                $width,

            ':height' =>
                $height,

            ':bytes' =>
                $bytes,

            ':folder' =>
                $folder,

            ':media_order' =>
                $order,

            ':is_active' =>
                $isActive,
        ]);


        $newId =
            (int) (
                $pdo->lastInsertId()
            );


        jsonResponse(
            [
                'success' => true,

                'message' =>
                    'Gallery media created successfully.',

                'item' => [
                    'id' =>
                        $newId,

                    'category' =>
                        $category,

                    'title' =>
                        $title,

                    'imageUrl' =>
                        $imageUrl,

                    'publicId' =>
                        $publicId,

                    'resourceType' =>
                        $resourceType,

                    'format' =>
                        $format,

                    'width' =>
                        $width,

                    'height' =>
                        $height,

                    'bytes' =>
                        $bytes,

                    'folder' =>
                        $folder,

                    'order' =>
                        $order,

                    'isActive' =>
                        (bool) $isActive,
                ],
            ],
            201
        );

        exit;
    }


    /* =====================================================
       PUT
    ===================================================== */

    if ($method === 'PUT') {

        $data =
            getJsonBody();


        if (empty($data)) {

            errorResponse(
                'Invalid JSON payload.',
                400
            );
        }


        $action =
            trim(
                (string) (
                    $data['action']
                    ?? ''
                )
            );


        /* =================================================
           UPDATE ALBUM METADATA
        ================================================= */

        if (
            $action === 'update_album'
        ) {

            $oldSlug =
                trim(
                    (string) (
                        $data['oldSlug']
                        ?? ''
                    )
                );


            $newSlug =
                trim(
                    (string) (
                        $data['slug']
                        ??
                        $data['newSlug']
                        ??
                        $oldSlug
                    )
                );


            $nameProvided =
                array_key_exists(
                    'name',
                    $data
                );


            $locationProvided =
                array_key_exists(
                    'location',
                    $data
                );


            $imageProvided =
                array_key_exists(
                    'image',
                    $data
                );


            if (
                $oldSlug === ''
            ) {

                errorResponse(
                    'oldSlug is required.',
                    400
                );
            }


            if (
                $newSlug === ''
            ) {

                errorResponse(
                    'slug is required.',
                    400
                );
            }


            if (
                !preg_match(
                    '/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                    $newSlug
                )
            ) {

                errorResponse(
                    'Invalid slug. Use lowercase letters, numbers and hyphens only.',
                    400
                );
            }


            $gallery =
                getGalleryMetadata(
                    $pdo
                );


            ensureGalleryArrays(
                $gallery
            );


            /*
             * Find album.
             */
            $foundSection = null;
            $foundIndex = null;


            foreach (
                [
                    'couples',
                    'recentAlbums'
                ]
                as $section
            ) {

                foreach (
                    $gallery[$section]
                    as $index => $album
                ) {

                    if (
                        is_array($album) &&
                        ($album['slug'] ?? '') ===
                        $oldSlug
                    ) {

                        $foundSection =
                            $section;

                        $foundIndex =
                            $index;

                        break 2;
                    }
                }
            }


            if (
                $foundSection === null
            ) {

                errorResponse(
                    'Album not found.',
                    404
                );
            }


            /*
             * Slug collision check.
             */
            if (
                $newSlug !== $oldSlug &&
                slugExists(
                    $gallery,
                    $newSlug,
                    $oldSlug
                )
            ) {

                errorResponse(
                    'The new album slug is already in use.',
                    409
                );
            }


            $oldCategory =
                buildCategory(
                    $foundSection,
                    $oldSlug
                );


            $newCategory =
                buildCategory(
                    $foundSection,
                    $newSlug
                );


            /*
             * If slug changes, move all media.
             */
            if (
                $newSlug !== $oldSlug
            ) {

                /*
                 * Check destination media.
                 */
                $checkStmt =
                    $pdo->prepare(
                        '
                        SELECT COUNT(*)
                        FROM gallery_media
                        WHERE category = :category
                        '
                    );


                $checkStmt->execute([
                    ':category' =>
                        $newCategory,
                ]);


                $existingMedia =
                    (int) (
                        $checkStmt->fetchColumn()
                    );


                if (
                    $existingMedia > 0
                ) {

                    errorResponse(
                        'The new album slug already has media assigned to it.',
                        409
                    );
                }


                $pdo->beginTransaction();


                try {

                    $updateMediaStmt =
                        $pdo->prepare(
                            '
                            UPDATE gallery_media
                            SET category = :new_category
                            WHERE category = :old_category
                            '
                        );


                    $updateMediaStmt->execute([
                        ':new_category' =>
                            $newCategory,

                        ':old_category' =>
                            $oldCategory,
                    ]);


                    $gallery[
                        $foundSection
                    ][$foundIndex]['slug'] =
                        $newSlug;


                    if (
                        $nameProvided
                    ) {

                        $gallery[
                            $foundSection
                        ][$foundIndex]['name'] =
                            trim(
                                (string) (
                                    $data['name']
                                    ?? ''
                                )
                            );
                    }


                    if (
                        $locationProvided
                    ) {

                        $gallery[
                            $foundSection
                        ][$foundIndex]['location'] =
                            trim(
                                (string) (
                                    $data['location']
                                    ?? ''
                                )
                            );
                    }


                    if (
                        $imageProvided
                    ) {

                        $gallery[
                            $foundSection
                        ][$foundIndex]['image'] =
                            trim(
                                (string) (
                                    $data['image']
                                    ?? ''
                                )
                            );
                    }


                    if (
                        array_key_exists(
                            'order',
                            $data
                        )
                    ) {

                        $gallery[
                            $foundSection
                        ][$foundIndex]['order'] =
                            (int) $data['order'];
                    }


                    $gallery[
                        $foundSection
                    ] =
                        sortAlbums(
                            $gallery[
                                $foundSection
                            ]
                        );


                    saveGalleryMetadata(
                        $pdo,
                        $gallery
                    );


                    $pdo->commit();

                } catch (Throwable $e) {

                    if (
                        $pdo->inTransaction()
                    ) {
                        $pdo->rollBack();
                    }

                    throw $e;
                }

            } else {

                /*
                 * Slug unchanged.
                 */
                if (
                    $nameProvided
                ) {

                    $gallery[
                        $foundSection
                    ][$foundIndex]['name'] =
                        trim(
                            (string) (
                                $data['name']
                                ?? ''
                            )
                        );
                }


                if (
                    $locationProvided
                ) {

                    $gallery[
                        $foundSection
                    ][$foundIndex]['location'] =
                        trim(
                            (string) (
                                $data['location']
                                ?? ''
                            )
                        );
                }


                if (
                    $imageProvided
                ) {

                    $gallery[
                        $foundSection
                    ][$foundIndex]['image'] =
                        trim(
                            (string) (
                                $data['image']
                                ?? ''
                            )
                        );
                }


                if (
                    array_key_exists(
                        'order',
                        $data
                    )
                ) {

                    $gallery[
                        $foundSection
                    ][$foundIndex]['order'] =
                        (int) $data['order'];
                }


                $gallery[
                    $foundSection
                ] =
                    sortAlbums(
                        $gallery[
                            $foundSection
                        ]
                    );


                saveGalleryMetadata(
                    $pdo,
                    $gallery
                );
            }


            $updatedAlbum =
                $gallery[
                    $foundSection
                ][
                    array_search(
                        $newSlug,
                        array_column(
                            $gallery[
                                $foundSection
                            ],
                            'slug'
                        ),
                        true
                    )
                ];


            jsonResponse(
                [
                    'success' => true,

                    'message' =>
                        'Album updated successfully.',

                    'section' =>
                        $foundSection,

                    'album' =>
                        $updatedAlbum,

                    'gallery' =>
                        $gallery,
                ],
                200
            );

            exit;
        }


        /* =================================================
           REORDER ALBUMS
        ================================================= */

        if (
            $action === 'reorder_albums'
        ) {

            if (
                !isset($data['items']) ||
                !is_array($data['items'])
            ) {

                errorResponse(
                    'Album items array is required.',
                    400
                );
            }


            $gallery =
                getGalleryMetadata(
                    $pdo
                );


            ensureGalleryArrays(
                $gallery
            );


            /*
             * Supported payload:
             *
             * {
             *   action: "reorder_albums",
             *   section: "couples",
             *   items: [
             *      { slug: "...", order: 0 }
             *   ]
             * }
             *
             * If section omitted, slug is searched
             * in both sections.
             */
            $sectionProvided =
                isset(
                    $data['section']
                );


            $section =
                $sectionProvided
                    ? normalizeSection(
                        $data['section']
                    )
                    : null;


            $orderMap = [];


            foreach (
                $data['items']
                as $item
            ) {

                if (
                    !is_array($item)
                ) {
                    continue;
                }


                if (
                    isset($item['slug']) &&
                    isset($item['order'])
                ) {

                    $orderMap[
                        trim(
                            (string) (
                                $item['slug']
                            )
                        )
                    ] =
                        (int) $item['order'];
                }
            }


            $sectionsToUpdate =
                $section !== null
                    ? [$section]
                    : [
                        'couples',
                        'recentAlbums'
                    ];


            foreach (
                $sectionsToUpdate
                as $currentSection
            ) {

                foreach (
                    $gallery[
                        $currentSection
                    ]
                    as &$album
                ) {

                    if (
                        !is_array($album)
                    ) {
                        continue;
                    }


                    $slug =
                        $album['slug']
                        ?? '';


                    if (
                        isset(
                            $orderMap[$slug]
                        )
                    ) {

                        $album['order'] =
                            $orderMap[$slug];
                    }
                }

                unset($album);


                $gallery[
                    $currentSection
                ] =
                    sortAlbums(
                        $gallery[
                            $currentSection
                        ]
                    );
            }


            saveGalleryMetadata(
                $pdo,
                $gallery
            );


            jsonResponse(
                [
                    'success' => true,

                    'message' =>
                        'Album order saved successfully.',

                    'gallery' =>
                        $gallery,
                ],
                200
            );

            exit;
        }


        /* =================================================
           REORDER MEDIA
        ================================================= */

        if (
            $action === 'reorder'
        ) {

            if (
                !isset($data['items']) ||
                !is_array($data['items'])
            ) {

                errorResponse(
                    'Items array is required.',
                    400
                );
            }


            $stmt =
                $pdo->prepare(
                    '
                    UPDATE gallery_media
                    SET `order` = :media_order
                    WHERE id = :id
                    '
                );


            foreach (
                $data['items']
                as $item
            ) {

                if (
                    !is_array($item) ||
                    !isset($item['id']) ||
                    !isset($item['order'])
                ) {
                    continue;
                }


                $stmt->execute([
                    ':media_order' =>
                        (int) $item['order'],

                    ':id' =>
                        (int) $item['id'],
                ]);
            }


            jsonResponse(
                [
                    'success' => true,

                    'message' =>
                        'Media order saved successfully.',
                ],
                200
            );

            exit;
        }


        /* =================================================
           BATCH UPDATE MEDIA
        ================================================= */

        if (
            $action === 'batch_update'
        ) {

            if (
                !isset($data['items']) ||
                !is_array($data['items'])
            ) {

                errorResponse(
                    'Items array is required.',
                    400
                );
            }


            $stmt =
                $pdo->prepare(
                    '
                    UPDATE gallery_media
                    SET
                        title = :title,
                        `order` = :media_order
                    WHERE id = :id
                    '
                );


            foreach (
                $data['items']
                as $item
            ) {

                if (
                    !is_array($item) ||
                    !isset($item['id'])
                ) {
                    continue;
                }


                $stmt->execute([
                    ':title' =>
                        trim(
                            (string) (
                                $item['title']
                                ?? ''
                            )
                        ),

                    ':media_order' =>
                        (int) (
                            $item['order']
                            ?? 0
                        ),

                    ':id' =>
                        (int) $item['id'],
                ]);
            }


            jsonResponse(
                [
                    'success' => true,

                    'message' =>
                        'Media updated successfully.',
                ],
                200
            );

            exit;
        }


        /* =================================================
           UPDATE SINGLE MEDIA
        ================================================= */

        $id =
            isset($data['id'])
                ? (int) $data['id']
                : 0;


        if (
            $id <= 0
        ) {

            errorResponse(
                'Valid media ID is required.',
                400
            );
        }


        /*
         * Get current media first.
         */
        $currentStmt =
            $pdo->prepare(
                '
                SELECT
                    id,
                    category
                FROM gallery_media
                WHERE id = :id
                LIMIT 1
                '
            );


        $currentStmt->execute([
            ':id' =>
                $id,
        ]);


        $currentMedia =
            $currentStmt->fetch(
                PDO::FETCH_ASSOC
            );


        if (
            !$currentMedia
        ) {

            errorResponse(
                'Media not found.',
                404
            );
        }


        $fields = [];

        $params = [
            ':id' =>
                $id,
        ];


        if (
            array_key_exists(
                'title',
                $data
            )
        ) {

            $fields[] =
                'title = :title';

            $params[':title'] =
                trim(
                    (string) (
                        $data['title']
                        ?? ''
                    )
                );
        }


        if (
            array_key_exists(
                'imageUrl',
                $data
            ) ||
            array_key_exists(
                'image_url',
                $data
            )
        ) {

            $fields[] =
                'image_url = :image_url';

            $params[':image_url'] =
                trim(
                    (string) (
                        $data['imageUrl']
                        ??
                        $data['image_url']
                        ??
                        ''
                    )
                );
        }


        if (
            array_key_exists(
                'publicId',
                $data
            ) ||
            array_key_exists(
                'public_id',
                $data
            )
        ) {

            $fields[] =
                'public_id = :public_id';

            $params[':public_id'] =
                trim(
                    (string) (
                        $data['publicId']
                        ??
                        $data['public_id']
                        ??
                        ''
                    )
                );
        }


        if (
            array_key_exists(
                'resourceType',
                $data
            ) ||
            array_key_exists(
                'resource_type',
                $data
            )
        ) {

            $fields[] =
                'resource_type = :resource_type';

            $params[':resource_type'] =
                trim(
                    (string) (
                        $data['resourceType']
                        ??
                        $data['resource_type']
                        ??
                        'image'
                    )
                );
        }


        if (
            array_key_exists(
                'format',
                $data
            )
        ) {

            $fields[] =
                'format = :format';

            $params[':format'] =
                trim(
                    (string) (
                        $data['format']
                        ?? ''
                    )
                );
        }


        if (
            array_key_exists(
                'category',
                $data
            )
        ) {

            $newCategory =
                trim(
                    (string) (
                        $data['category']
                        ?? ''
                    )
                );


            if (
                $newCategory === ''
            ) {

                errorResponse(
                    'Category cannot be empty.',
                    400
                );
            }


            /*
             * Prevent exceeding 40 if moving media
             * into another album.
             */
            if (
                $newCategory !==
                $currentMedia['category']
            ) {

                $destinationCount =
                    getPhotoCount(
                        $pdo,
                        $newCategory
                    );


                if (
                    $destinationCount >=
                    MAX_PHOTOS_PER_CARD
                ) {

                    errorResponse(
                        'Destination album already has maximum ' .
                        MAX_PHOTOS_PER_CARD .
                        ' photos.',
                        400
                    );
                }
            }


            $fields[] =
                'category = :category';

            $params[':category'] =
                $newCategory;
        }


        if (
            array_key_exists(
                'order',
                $data
            )
        ) {

            $fields[] =
                '`order` = :media_order';

            $params[':media_order'] =
                (int) $data['order'];
        }


        if (
            array_key_exists(
                'isActive',
                $data
            )
        ) {

            $fields[] =
                'is_active = :is_active';

            $params[':is_active'] =
                $data['isActive']
                    ? 1
                    : 0;
        }


        if (
            array_key_exists(
                'width',
                $data
            )
        ) {

            $fields[] =
                'width = :width';

            $params[':width'] =
                (int) $data['width'];
        }


        if (
            array_key_exists(
                'height',
                $data
            )
        ) {

            $fields[] =
                'height = :height';

            $params[':height'] =
                (int) $data['height'];
        }


        if (
            array_key_exists(
                'bytes',
                $data
            )
        ) {

            $fields[] =
                'bytes = :bytes';

            $params[':bytes'] =
                (int) $data['bytes'];
        }


        if (
            array_key_exists(
                'folder',
                $data
            )
        ) {

            $fields[] =
                'folder = :folder';

            $params[':folder'] =
                trim(
                    (string) (
                        $data['folder']
                        ?? ''
                    )
                );
        }


        if (
            empty($fields)
        ) {

            errorResponse(
                'No fields provided for update.',
                400
            );
        }


        $sql =
            '
            UPDATE gallery_media
            SET ' .
            implode(
                ', ',
                $fields
            ) .
            '
            WHERE id = :id
            ';


        $stmt =
            $pdo->prepare(
                $sql
            );


        $stmt->execute(
            $params
        );


        jsonResponse(
            [
                'success' => true,

                'message' =>
                    'Media updated successfully.',
            ],
            200
        );

        exit;
    }


    /* =====================================================
       DELETE
    ===================================================== */

    if ($method === 'DELETE') {


        /* =================================================
           DELETE SINGLE MEDIA
        ================================================= */

        if (
            isset($_GET['id']) &&
            (int) $_GET['id'] > 0
        ) {

            $id =
                (int) $_GET['id'];


            /*
             * Get public_id before deleting.
             *
             * We return it to frontend so frontend can
             * optionally remove the Cloudinary asset.
             */
            $findStmt =
                $pdo->prepare(
                    '
                    SELECT
                        id,
                        public_id AS publicId,
                        resource_type AS resourceType,
                        category
                    FROM gallery_media
                    WHERE id = :id
                    LIMIT 1
                    '
                );


            $findStmt->execute([
                ':id' =>
                    $id,
            ]);


            $media =
                $findStmt->fetch(
                    PDO::FETCH_ASSOC
                );


            if (
                !$media
            ) {

                errorResponse(
                    'Photo not found.',
                    404
                );
            }


            $stmt =
                $pdo->prepare(
                    '
                    DELETE FROM gallery_media
                    WHERE id = :id
                    '
                );


            $stmt->execute([
                ':id' =>
                    $id,
            ]);


            jsonResponse(
                [
                    'success' => true,

                    'message' =>
                        'Photo deleted successfully.',

                    'deleted' => [
                        'id' =>
                            $id,

                        'publicId' =>
                            $media['publicId'],

                        'resourceType' =>
                            $media['resourceType'],

                        'category' =>
                            $media['category'],
                    ],
                ],
                200
            );

            exit;
        }


        /* =================================================
           DELETE ALBUM / CARD
        ================================================= */

        if (
            isset($_GET['slug']) &&
            trim(
                (string) $_GET['slug']
            ) !== ''
        ) {

            $slug =
                trim(
                    (string) $_GET['slug']
                );


            $gallery =
                getGalleryMetadata(
                    $pdo
                );


            ensureGalleryArrays(
                $gallery
            );


            $foundSection =
                null;

            $foundAlbum =
                null;


            foreach (
                [
                    'couples',
                    'recentAlbums'
                ]
                as $section
            ) {

                foreach (
                    $gallery[$section]
                    as $album
                ) {

                    if (
                        is_array($album) &&
                        ($album['slug'] ?? '') ===
                        $slug
                    ) {

                        $foundSection =
                            $section;

                        $foundAlbum =
                            $album;

                        break 2;
                    }
                }
            }


            if (
                $foundSection === null
            ) {

                errorResponse(
                    'Album not found.',
                    404
                );
            }


            $category =
                buildCategory(
                    $foundSection,
                    $slug
                );


            /*
             * Get media public IDs before deletion.
             */
            $mediaStmt =
                $pdo->prepare(
                    '
                    SELECT
                        id,
                        public_id AS publicId,
                        resource_type AS resourceType
                    FROM gallery_media
                    WHERE category = :category
                    '
                );


            $mediaStmt->execute([
                ':category' =>
                    $category,
            ]);


            $deletedMedia =
                $mediaStmt->fetchAll(
                    PDO::FETCH_ASSOC
                );


            $pdo->beginTransaction();


            try {

                /*
                 * Delete all media DB rows.
                 */
                $deleteStmt =
                    $pdo->prepare(
                        '
                        DELETE FROM gallery_media
                        WHERE category = :category
                        '
                    );


                $deleteStmt->execute([
                    ':category' =>
                        $category,
                ]);


                /*
                 * Delete album metadata.
                 */
                $gallery[
                    $foundSection
                ] =
                    array_values(
                        array_filter(
                            $gallery[
                                $foundSection
                            ],
                            function (
                                $album
                            ) use (
                                $slug
                            ) {

                                return !(
                                    is_array($album) &&
                                    ($album['slug'] ?? '') ===
                                    $slug
                                );
                            }
                        )
                    );


                /*
                 * Recalculate order.
                 */
                $gallery[
                    $foundSection
                ] =
                    sortAlbums(
                        $gallery[
                            $foundSection
                        ]
                    );


                saveGalleryMetadata(
                    $pdo,
                    $gallery
                );


                $pdo->commit();


                jsonResponse(
                    [
                        'success' => true,

                        'message' =>
                            (
                                $foundSection ===
                                'recentAlbums'
                            )
                                ? 'Recent album deleted successfully.'
                                : 'Photo Gallery album deleted successfully.',

                        'slug' =>
                            $slug,

                        'section' =>
                            $foundSection,

                        /*
                         * Cloudinary public IDs are returned
                         * for optional frontend cleanup.
                         */
                        'deletedMedia' =>
                            $deletedMedia,
                    ],
                    200
                );

                exit;

            } catch (Throwable $e) {

                if (
                    $pdo->inTransaction()
                ) {
                    $pdo->rollBack();
                }

                throw $e;
            }
        }


        errorResponse(
            'id or slug parameter is required.',
            400
        );
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
     * Never allow PHP warnings/fatal errors to reach
     * frontend as HTML.
     *
     * Frontend always receives JSON.
     */

    http_response_code(500);


    if (
        ob_get_length()
    ) {
        ob_clean();
    }


    header(
        'Content-Type: application/json; charset=utf-8'
    );


    echo json_encode(
        [
            'success' => false,

            'message' =>
                'Gallery request failed.',
        ],
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );


    exit;
}