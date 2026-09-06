<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';
require_once '../../helpers/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Ai cũng xem được, không cần đăng nhập
    $stmt = $pdo->query("SELECT * FROM site_settings LIMIT 1");
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($settings && $settings['social_links']) {
        $settings['social_links'] = json_decode($settings['social_links'], true);
    }

    jsonResponse(true, $settings);
}

if ($method === 'PUT') {
    requireRole(['admin']);

    $input = json_decode(file_get_contents('php://input'), true);

    $social_links = json_encode([
        'facebook' => $input['facebook'] ?? '',
        'youtube'  => $input['youtube'] ?? '',
        'tiktok'   => $input['tiktok'] ?? '',
    ]);

    $check = $pdo->query("SELECT id FROM site_settings LIMIT 1")->fetch();

    if ($check) {
        $stmt = $pdo->prepare("UPDATE site_settings SET contact_email=?, contact_phone=?, address=?, social_links=?, short_description=? WHERE id=?");
        $stmt->execute([$input['contact_email'], $input['contact_phone'], $input['address'], $social_links, $input['short_description'], $check['id']]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO site_settings (contact_email, contact_phone, address, social_links, short_description) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$input['contact_email'], $input['contact_phone'], $input['address'], $social_links, $input['short_description']]);
    }

    jsonResponse(true, null, "Cập nhật thành công");
}