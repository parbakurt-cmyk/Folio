<?php
require_once __DIR__ . '/lib.php';

$in   = input();
$uid  = $in['uid'] ?? '';
$data = $in['data'] ?? [];
$tpl  = (int) ($in['tpl'] ?? 1);

if (!$uid) { http_response_code(400); echo json_encode(['error' => 'Missing uid']); exit; }

$row = [
    'user_id'    => $uid,
    'full_name'  => $data['name']     ?? '',
    'email'      => $data['email']    ?? '',
    'phone'      => $data['phone']    ?? '',
    'address'    => $data['address']  ?? '',
    'about'      => $data['about']    ?? '',
    'education'  => $data['edu']      ?? '',
    'skills'     => $data['skills']   ?? '',
    'projects'   => $data['proj']     ?? '',
    'experience' => $data['exp']      ?? '',
    'links'      => $data['links']    ?? '',
    'photo'      => $data['pic']      ?? '',
    'template'   => $tpl,
    'updated_at' => gmdate('Y-m-d\TH:i:s\Z'),
];

sb_request('POST', '/portfolios?on_conflict=user_id', $row, [
    'Prefer: resolution=merge-duplicates,return=representation',
]);