<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/admin/contact-config.php
 * PHÂN HỆ: API Cấu hình Thông tin Tòa soạn & Liên hệ (Site Settings Service)
 * MÔ TẢ: Quản lý thông tin liên hệ và liên kết mạng xã hội của Tòa soạn Báo Mạch Tin:
 *        - GET: Đọc cấu hình liên hệ (email, hotline, địa chỉ, mô tả, link MXH) - Public cho toàn trang (Footer, Trang liên hệ).
 *        - PUT: Cập nhật thông tin tòa soạn và các kênh mạng xã hội - Chỉ Quản trị viên (Admin).
 * PHẠM VI SỬ DỤNG:
 *   - [CÔNG KHAI & KHU VỰC QUẢN TRỊ ADMIN]
 *   - Phân quyền: GET (Công khai), PUT (role = 'admin')
 *   - Phương thức: GET, PUT
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 *   - backend/helpers/auth.php (requireRole)
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/layout.js (Render footer thông tin liên hệ toàn trang)
 *   - frontend/assets/js/admin-contact.js (Giao diện cài đặt thông tin tòa soạn)
 * TRẢ VỀ (JSON):
 *   - GET: { contact_email, contact_phone, address, short_description, social_links: {...} }
 *   - PUT: Thông báo cập nhật thành công
 * ==============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

// ==============================================================================
// NGHIỆP VỤ 1: GET - ĐỌC THÔNG TIN CẤU HÌNH TÒA SOẠN (CÔNG KHAI)
// ==============================================================================
if ($method === 'GET') {
    // Ai cũng xem được, không cần đăng nhập
    $stmt = $pdo->query("SELECT * FROM site_settings LIMIT 1");
    $settings = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($settings && $settings['social_links']) {
        $settings['social_links'] = json_decode($settings['social_links'], true);
    }

    jsonResponse(true, $settings);
}

// ==============================================================================
// NGHIỆP VỤ 2: PUT - CẬP NHẬT THÔNG TIN LIÊN HỆ & MẠNG XÃ HỘI (CHỈ ADMIN)
// ==============================================================================
if ($method === 'PUT') {
    requireRole(['admin']);

    $input = json_decode(file_get_contents('php://input'), true);

    $social_links = json_encode([
        'facebook' => $input['facebook'] ?? '',
        'youtube'  => $input['youtube'] ?? '',
        'tiktok'   => $input['tiktok'] ?? '',
    ]);

    $contactEmail = $input['contact_email'] ?? null;
    $contactPhone = $input['contact_phone'] ?? null;
    $address      = $input['address'] ?? null;
    $shortDesc    = $input['short_description'] ?? null;

    $check = $pdo->query("SELECT id FROM site_settings LIMIT 1")->fetch();

    if ($check) {
        $stmt = $pdo->prepare("UPDATE site_settings SET contact_email=?, contact_phone=?, address=?, social_links=?, short_description=? WHERE id=?");
        $stmt->execute([$contactEmail, $contactPhone, $address, $social_links, $shortDesc, $check['id']]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO site_settings (contact_email, contact_phone, address, social_links, short_description) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$contactEmail, $contactPhone, $address, $social_links, $shortDesc]);
    }

    jsonResponse(true, null, "Cập nhật thành công");
}
