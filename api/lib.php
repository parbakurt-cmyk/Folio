<?php
header('Content-Type: application/json');

function sb_request($method, $path, $body = null, $extraHeaders = []) {
    $url = getenv('SUPABASE_URL') . '/rest/v1' . $path;
    $key = getenv('SUPABASE_ANON_KEY');

    $headers = array_merge([
        'apikey: ' . $key,
        'Authorization: Bearer ' . $key,
        'Content-Type: application/json',
    ], $extraHeaders);

    $ctx = stream_context_create(['http' => [
        'method'        => $method,
        'header'        => implode("\r\n", $headers),
        'content'       => $body ? json_encode($body) : null,
        'ignore_errors' => true,
    ]]);

    $response = file_get_contents($url, false, $ctx);
    http_response_code($http_response_header
        ? (int) explode(' ', $http_response_header[0])[1]
        : 500);
    echo $response ?: json_encode(['error' => 'no response']);
}

function input() {
    $raw = json_decode(file_get_contents('php://input'), true);
    if (!is_array($raw)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON body']);
        exit;
    }
    return $raw;
}