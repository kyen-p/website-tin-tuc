<?php
/*
==============================================================================
TÊN FILE: backend/api/admin/contact-config.php
PHÂN HỆ: Cấu hình tòa soạn
MÔ TẢ: Quản lý thông tin liên hệ và mạng xã hội Mạch Tin:
       - Xem thông tin liên hệ (công khai cho toàn trang)
       - Cập nhật thông tin tòa soạn và liên kết mạng xã hội (chỉ Admin)
PHẠM VI SỬ DỤNG:
       - Phương thức: GET (công khai), PUT/POST (role = 'admin')
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
       - helpers/auth.php
==============================================================================
*/

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

// 1. Lấy thông tin cấu hình tòa soạn (công khai cho toàn trang)
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM site_settings LIMIT 1");
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($settings && $settings['social_links']) {
        $settings['social_links'] = json_decode($settings['social_links'], true);
    }

    jsonResponse(true, $settings);
}

// 2. Cập nhật thông tin liên hệ & mạng xã hội của tòa soạn (chỉ Admin)
if ($method === 'PUT' || $method === 'POST') {
    requireRole(['admin']);

    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !is_array($input)) {
        $input = $_POST;
    }

    $social_links = json_encode([
        'facebook' => trim($input['facebook'] ?? ''),
        'youtube'  => trim($input['youtube'] ?? ''),
        'tiktok'   => trim($input['tiktok'] ?? ''),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $contactEmail = trim($input['contact_email'] ?? '');
    $contactPhone = trim($input['contact_phone'] ?? '');
    $address      = trim($input['address'] ?? '');
    $shortDesc    = trim($input['short_description'] ?? '');

    if (empty($contactEmail) || empty($contactPhone) || empty($address)) {
        jsonResponse(false, null, "Vui lòng nhập đầy đủ email, số điện thoại hotline và địa chỉ tòa soạn.");
    }

    try {
        $check = $pdo->query("SELECT id FROM site_settings LIMIT 1")->fetch(PDO::FETCH_ASSOC);

        if ($check) {
            $stmt = $pdo->prepare("UPDATE site_settings SET contact_email=?, contact_phone=?, address=?, social_links=?, short_description=? WHERE id=?");
            $stmt->execute([$contactEmail, $contactPhone, $address, $social_links, $shortDesc, $check['id']]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO site_settings (contact_email, contact_phone, address, social_links, short_description) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$contactEmail, $contactPhone, $address, $social_links, $shortDesc]);
        }

        jsonResponse(true, null, "Cập nhật cấu hình tòa soạn thành công");
    } catch (PDOException $e) {
        jsonResponse(false, null, "Lỗi cơ sở dữ liệu khi lưu cấu hình: " . $e->getMessage());
    }
}

