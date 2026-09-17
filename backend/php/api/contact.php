<?php
/**
 * SAN Photography - Contact API
 *
 * GET /api/contact.php
 * PUT /api/contact.php
 *
 * Storage:
 *   website_content.contact
 *   contact_info (synchronized)
 */

ob_start();

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../config/database.php';

handleCors();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/* =========================================================
   DEFAULT CONTACT
========================================================= */

function getDefaultContact(): array
{
    return [
        'heroEyebrow' => "Let's create something timeless",
        'heroHeading' => 'Your story',
        'heroItalicHeading' => 'deserves to be felt.',
        'heroDescription' => "Tell us about your wedding, pre-wedding session, celebration or creative project. We'd love to hear what you're planning.",
        'heroButtonText' => 'Start a Conversation',
        'heroButtonHref' => '#contact-form',

        'introEyebrow' => 'Get In Touch',
        'introHeadingLine1' => "Let's talk",
        'introHeadingLine2' => 'about',
        'introHeadingItalic' => 'your story.',
        'introSubheading' => 'Every beautiful photograph begins with a simple conversation.',
        'introDescription' => "Whether you're planning a wedding, pre-wedding shoot, maternity session, birthday celebration or family portrait, we'd love to know what you're imagining.",
        'introEmailLabel' => 'Email',
        'introCallLabel' => 'Call',
        'introWhatsAppLabel' => 'WhatsApp',

        'formEyebrow' => 'Enquiry',
        'formHeadingNormal' => 'Tell us about',
        'formHeadingItalic' => 'your plans.',
        'formNameLabel' => 'Name *',
        'formNamePlaceholder' => 'Your name',
        'formEmailLabel' => 'Email *',
        'formEmailPlaceholder' => 'you@example.com',
        'formPhoneLabel' => 'Phone',
        'formPhonePlaceholder' => '+91',
        'formServiceLabel' => 'Service *',
        'formServicePlaceholder' => 'Select service',
        'formServiceOptions' => [
            'Wedding & Cinematography',
            'Pre-Wedding',
            'Engagement',
            'Other',
        ],
        'formOtherServiceLabel' => 'Please specify *',
        'formOtherServicePlaceholder' => 'Type your service here',
        'formStartDateLabel' => 'Start Date',
        'formEndDateLabel' => 'End Date',
        'formLocationLabel' => 'Location',
        'formLocationPlaceholder' => 'City / Venue',
        'formMessageLabel' => 'Tell us about it',
        'formMessagePlaceholder' => 'Tell us about your wedding, vision, location...',
        'formButtonText' => 'Send Enquiry',

        'studioEyebrow' => 'Studio',
        'studioHeadingNormal' => 'Find us',
        'studioHeadingItalic' => 'here.',
        'studioDescription' => 'SAN Photography is available for weddings, pre-weddings, maternity, birthdays, kids, family portraits and special celebrations.',
        'studioName' => 'SAN Photography',
        'address' => 'Nagpur, Maharashtra, India',
        'phone' => '9359338557',
        'email' => 'sancompany0@gmail.com',
        'whatsapp' => '9359338557',
        'instagramLabel' => '@ni3cinema',
        'instagramUrl' => 'https://instagram.com/ni3cinema',
        'youtubeLabel' => 'NI3 Cinema',
        'youtubeUrl' => 'https://youtube.com',
        'workingHours' => '',
        'googleMapsUrl' => '',

        'ctaEyebrow' => 'SAN Photography',
        'ctaHeadingNormal' => 'Your next chapter',
        'ctaHeadingItalic' => 'starts here.',
        'ctaButtonText' => 'Begin Your Enquiry',
        'ctaButtonHref' => '#contact-form',
    ];
}

/* =========================================================
   HELPERS
========================================================= */

function decodeContactJson(?string $json): array
{
    if ($json === null || trim($json) === '') {
        return [];
    }

    $decoded = json_decode($json, true);

    return is_array($decoded) ? $decoded : [];
}

function getContactContent(PDO $pdo): array
{
    $stmt = $pdo->query(
        'SELECT contact
         FROM website_content
         WHERE id = 1
         LIMIT 1'
    );

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || empty($row['contact'])) {
        return [];
    }

    return decodeContactJson($row['contact'] ?? null);
}

function syncContactInfoTable(PDO $pdo, array $contact): void
{
    try {
        $phone = $contact['phone'] ?? '';
        $email = $contact['email'] ?? '';
        $whatsapp = $contact['whatsapp'] ?? '';
        $address = $contact['address'] ?? '';
        $googleMapsUrl = $contact['googleMapsUrl'] ?? '';
        $workingHours = $contact['workingHours'] ?? '';

        $check = $pdo->query('SELECT id FROM contact_info ORDER BY id ASC LIMIT 1');
        $row = $check->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            $stmt = $pdo->prepare(
                'UPDATE contact_info
                 SET phone = :phone,
                     email = :email,
                     whatsapp = :whatsapp,
                     address = :address,
                     google_maps_url = :google_maps_url,
                     working_hours = :working_hours
                 WHERE id = :id'
            );
            $stmt->execute([
                ':phone' => $phone,
                ':email' => $email,
                ':whatsapp' => $whatsapp,
                ':address' => $address,
                ':google_maps_url' => $googleMapsUrl,
                ':working_hours' => $workingHours,
                ':id' => $row['id'],
            ]);
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO contact_info
                 (phone, email, whatsapp, address, google_maps_url, working_hours)
                 VALUES (:phone, :email, :whatsapp, :address, :google_maps_url, :working_hours)'
            );
            $stmt->execute([
                ':phone' => $phone,
                ':email' => $email,
                ':whatsapp' => $whatsapp,
                ':address' => $address,
                ':google_maps_url' => $googleMapsUrl,
                ':working_hours' => $workingHours,
            ]);
        }
    } catch (Throwable $e) {
        // Log or silently ignore secondary table sync errors to ensure primary save never fails
        error_log('Failed to sync contact_info table: ' . $e->getMessage());
    }
}

function saveContactContent(PDO $pdo, array $contact): void
{
    $json = json_encode(
        $contact,
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
             SET contact = :contact
             WHERE id = 1'
        );

        $stmt->execute([
            ':contact' => $json,
        ]);
    } else {
        $stmt = $pdo->prepare(
            'INSERT INTO website_content
                (id, contact)
             VALUES
                (1, :contact)'
        );

        $stmt->execute([
            ':contact' => $json,
        ]);
    }

    syncContactInfoTable($pdo, $contact);
}

/* =========================================================
   GET
========================================================= */

function handleGet(PDO $pdo): void
{
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');

    $contact = getContactContent($pdo);

    if (empty($contact)) {
        // Initial fallback to standard defaults if empty in database
        $contact = getDefaultContact();
    }

    jsonResponse([
        'success' => true,
        'contact' => $contact,
        'data' => $contact,
        'content' => [
            'contact' => $contact,
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
     * { "content": { "contact": {...} } }
     * or:
     * { "contact": {...} }
     * or:
     * { "data": {...} }
     * or direct Contact object.
     */
    if (
        isset($payload['content']) &&
        is_array($payload['content']) &&
        isset($payload['content']['contact']) &&
        is_array($payload['content']['contact'])
    ) {
        $contact = $payload['content']['contact'];
    } elseif (
        isset($payload['contact']) &&
        is_array($payload['contact'])
    ) {
        $contact = $payload['contact'];
    } elseif (
        isset($payload['data']) &&
        is_array($payload['data'])
    ) {
        $contact = $payload['data'];
    } else {
        $contact = $payload;
    }

    if (!is_array($contact)) {
        errorResponse(
            'Invalid Contact data.',
            400
        );
    }

    try {
        $pdo->beginTransaction();

        saveContactContent(
            $pdo,
            $contact
        );

        /*
         * Read the value back from MySQL before responding.
         * Guarantees response represents persisted data.
         */
        $savedContact = getContactContent($pdo);

        $pdo->commit();

        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');

        jsonResponse([
            'success' => true,
            'message' => 'Contact content saved successfully.',
            'contact' => $savedContact,
            'data' => $savedContact,
            'content' => [
                'contact' => $savedContact,
            ],
        ]);

        exit;

    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        errorResponse(
            'Contact save failed: ' . $e->getMessage(),
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
        'Contact API error: ' . $e->getMessage(),
        500
    );
}
