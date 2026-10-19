<?php
require_once __DIR__ . '/lib.php';
sb_request('GET', '/portfolios?select=id,full_name,email,template,created_at&order=created_at.desc');