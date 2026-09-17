<?php
/**
 * Migration Script: Migrate Contact Data into MySQL
 * Initializes defaults when needed and updates website_content.contact and contact_info
 */
require_once __DIR__ . '/../config/database.php';
$pdo = getDbConnection();

// Check if website_content.contact already has data
$stmt = $pdo->query('SELECT contact FROM website_content WHERE id = 1 LIMIT 1');
$row = $stmt->fetch(PDO::FETCH_ASSOC);

$defaultContact = [
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

if (empty($row['contact'])) {
    $json = json_encode($defaultContact, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $update = $pdo->prepare('UPDATE website_content SET contact = :contact WHERE id = 1');
    $update->execute([':contact' => $json]);
    echo "Initialized website_content.contact with default SAN contact data.\n";
} else {
    echo "website_content.contact already has data. Preserving existing data.\n";
}

// Sync contact_info
$checkInfo = $pdo->query('SELECT id FROM contact_info LIMIT 1');
if (!$checkInfo->fetch()) {
    $stmt = $pdo->prepare(
        'INSERT INTO contact_info
         (phone, email, whatsapp, address, google_maps_url, working_hours)
         VALUES (:phone, :email, :whatsapp, :address, :google_maps_url, :working_hours)'
    );
    $stmt->execute([
        ':phone' => $defaultContact['phone'],
        ':email' => $defaultContact['email'],
        ':whatsapp' => $defaultContact['whatsapp'],
        ':address' => $defaultContact['address'],
        ':google_maps_url' => $defaultContact['googleMapsUrl'],
        ':working_hours' => $defaultContact['workingHours'],
    ]);
    echo "Populated contact_info row.\n";
} else {
    echo "contact_info row already exists.\n";
}

$stmt = $pdo->query('SELECT id, LENGTH(contact) as len FROM website_content WHERE id = 1');
print_r($stmt->fetch(PDO::FETCH_ASSOC));
