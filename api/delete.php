<?php
require_once __DIR__ . '/lib.php';

$in  = input();
$uid = $in['uid'] ?? '';
if (!$uid) { http_response_code(400); echo json_encode(['error' => 'Missing uid']); exit; }

sb_request('DELETE', '/portfolios?user_id=eq.' . urlencode($uid));