<?php
/**
 * CLI script to create the first admin user.
 * Run only from command line: php backend/php/tools/create_admin.php
 */
if (php_sapi_name() !== 'cli') {
    exit('This script can only be run from CLI.');
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/auth.php';

// Prompt for username
$username = trim(readline('Enter admin username: '));
if ($username === '') {
    fwrite(STDERR, "Username cannot be empty.\n");
    exit(1);
}

// Prompt for password (no echo)
if (function_exists('readline_callback_handler_install')) {
    // Windows may not support hidden input; fallback to visible input.
    $password = trim(readline('Enter admin password: '));
    $confirm = trim(readline('Confirm password: '));
} else {
    $password = trim(readline('Enter admin password: '));
    $confirm = trim(readline('Confirm password: '));
}
if ($password === '' || $password !== $confirm) {
    fwrite(STDERR, "Passwords do not match or are empty.\n");
    exit(1);
}

try {
    $pdo = getDbConnection();
    // Check if username already exists
    $stmt = $pdo->prepare('SELECT id FROM admins WHERE username = :username');
    $stmt->execute([':username' => $username]);
    if ($stmt->fetch()) {
        fwrite(STDERR, "An admin with that username already exists.\n");
        exit(1);
    }

    $hash = hashPassword($password);

    $stmt = $pdo->prepare('INSERT INTO admins (username, password) VALUES (:username, :password)');
    $stmt->execute([
        ':username' => $username,
        ':password' => $hash,
    ]);

    echo "Admin created successfully.\n";
} catch (Throwable $e) {
    // Do not expose sensitive details
    fwrite(STDERR, "Error creating admin.\n");
    exit(1);
}
?>
