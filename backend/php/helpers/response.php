<?php
/**
 * Response Helper Functions
 * backend/php/helpers/response.php
 */

ini_set('display_errors', '0');
ini_set('log_errors', '1');

/**
 * Send a generic JSON response
 *
 * @param mixed $data
 * @param int $statusCode
 * @return void
 */
function jsonResponse($data, int $statusCode = 200) {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($statusCode);
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

/**
 * Send a success JSON response
 *
 * @param string $message
 * @param array $extraData
 * @param int $statusCode
 * @return void
 */
function successResponse(string $message = 'Success', array $extraData = [], int $statusCode = 200) {
    $payload = array_merge([
        'success' => true,
        'message' => $message,
    ], $extraData);

    jsonResponse($payload, $statusCode);
}

/**
 * Send an error JSON response
 *
 * @param string $message
 * @param int $statusCode
 * @param array $extraData
 * @return void
 */
function errorResponse(string $message = 'An error occurred', int $statusCode = 500, array $extraData = []) {
    $payload = array_merge([
        'success' => false,
        'message' => $message,
    ], $extraData);

    jsonResponse($payload, $statusCode);
}
