<?php
require_once __DIR__ . '/lib.php';

$uid = $_GET['uid'] ?? '';
if (!$uid) { http_response_code(400); echo json_encode(['error' => 'Missing uid']); exit; }

sb_request('GET', '/portfolios?user_id=eq.' . urlencode($uid) . '&limit=1');