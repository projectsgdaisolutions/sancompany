<?php
/**
 * Email helper for admin password reset flows.
 * Uses SMTP directly via PHP sockets so there is no Node.js dependency.
 */

function getEnvValue(string $key, $default = null) {
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }

    if (array_key_exists($key, $_ENV) && $_ENV[$key] !== '') {
        return $_ENV[$key];
    }

    if (array_key_exists($key, $_SERVER) && $_SERVER[$key] !== '') {
        return $_SERVER[$key];
    }

    return $default;
}

function readSmtpResponse($socket): array {
    $lines = '';
    $timedOut = false;

    while (true) {
        $line = fgets($socket, 512);
        if ($line === false) {
            $timedOut = true;
            break;
        }

        $lines .= $line;

        if (strlen($line) >= 3 && substr($line, 3, 1) === ' ') {
            break;
        }
    }

    $code = 0;
    if (preg_match('/^(\d{3})/', $lines, $matches)) {
        $code = (int) $matches[1];
    }

    return [
        'code' => $code,
        'text' => trim($lines),
        'timed_out' => $timedOut,
    ];
}

function sendSmtpCommand($socket, string $command): array {
    $result = @fwrite($socket, $command . "\r\n");
    if ($result === false) {
        throw new RuntimeException('SMTP write failed for command: ' . $command);
    }

    $response = readSmtpResponse($socket);

    if ($response['code'] >= 400) {
        throw new RuntimeException('SMTP command failed: ' . $command . ' => ' . $response['text']);
    }

    return $response;
}

function sendPasswordResetEmail(string $toEmail, string $resetUrl): bool {
    $host = getEnvValue('SMTP_HOST');
    $port = (int) (getEnvValue('SMTP_PORT', 587));
    $username = getEnvValue('SMTP_USERNAME');
    $password = getEnvValue('SMTP_PASSWORD');
    $fromEmail = getEnvValue('SMTP_FROM_EMAIL');
    $fromName = getEnvValue('SMTP_FROM_NAME', 'SAN Photography');

    if (!$host || !$username || !$password || !$fromEmail) {
        error_log('SMTP settings incomplete for password reset email.');
        return false;
    }

    $socket = @stream_socket_client('tcp://' . $host . ':' . $port, $errno, $errstr, 30, STREAM_CLIENT_CONNECT);
    if (!$socket) {
        error_log('SMTP connection failed: ' . $errstr . ' (' . $errno . ')');
        return false;
    }

    stream_set_timeout($socket, 30);

    try {
        $greeting = readSmtpResponse($socket);
        if ($greeting['code'] !== 220) {
            throw new RuntimeException('SMTP greeting failed: ' . $greeting['text']);
        }

        $serverResponse = sendSmtpCommand($socket, 'EHLO localhost');
        $startTlsSupported = stripos($serverResponse['text'], 'STARTTLS') !== false;

        if ($port === 587 && !$startTlsSupported) {
            throw new RuntimeException('SMTP server does not advertise STARTTLS on port 587.');
        }

        if ($startTlsSupported && $host !== 'localhost') {
            sendSmtpCommand($socket, 'STARTTLS');
            $tlsEnabled = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            if ($tlsEnabled === false) {
                throw new RuntimeException('SMTP STARTTLS failed.');
            }
            sendSmtpCommand($socket, 'EHLO localhost');
        }

        sendSmtpCommand($socket, 'AUTH LOGIN');
        sendSmtpCommand($socket, base64_encode($username));
        sendSmtpCommand($socket, base64_encode($password));

        $from = '<' . $fromEmail . '>';
        sendSmtpCommand($socket, 'MAIL FROM: ' . $from);
        sendSmtpCommand($socket, 'RCPT TO: <' . $toEmail . '>');
        sendSmtpCommand($socket, 'DATA');

        $encodedFrom = '=?UTF-8?B?' . base64_encode($fromName) . '?=';
        $subject = '=?UTF-8?B?' . base64_encode('SAN Photography Admin Password Reset') . '?=';

        $message = "From: {$encodedFrom} <{$fromEmail}>\r\n";
        $message .= "To: {$toEmail}\r\n";
        $message .= "Subject: {$subject}\r\n";
        $message .= "MIME-Version: 1.0\r\n";
        $message .= "Content-Type: text/html; charset=UTF-8\r\n";
        $message .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $message .= chunk_split(base64_encode(
            '<html><body style="font-family: Arial, sans-serif; line-height:1.6; color:#171717;">' .
            '<p>Hello,</p>' .
            '<p>We received a request to reset your SAN Photography admin password.</p>' .
            '<p><a href="' . htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8') . '">Reset your password</a></p>' .
            '<p>If you did not request this, you can ignore this email.</p>' .
            '<p>This reset link expires in 30 minutes.</p>' .
            '<p>Regards,<br/>SAN Photography</p>' .
            '</body></html>'
        ));
        $message .= "\r\n.";

        $result = @fwrite($socket, $message . "\r\n");
        if ($result === false) {
            throw new RuntimeException('SMTP DATA write failed.');
        }

        $dataResponse = readSmtpResponse($socket);
        if ($dataResponse['code'] >= 400) {
            throw new RuntimeException('SMTP DATA failed: ' . $dataResponse['text']);
        }

        sendSmtpCommand($socket, 'QUIT');
        fclose($socket);
        return true;
    } catch (Throwable $e) {
        error_log('Password reset email send failed: ' . $e->getMessage());
        @fclose($socket);
        return false;
    }
}
