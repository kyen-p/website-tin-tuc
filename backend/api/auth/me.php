<?php
/*
==============================================================================
TÊN FILE: backend/api/auth/me.php
PHÂN HỆ: Xác thực & Đăng nhập
MÔ TẢ: Lấy thông tin tài khoản đang đăng nhập từ phiên làm việc (Session)
PHẠM VI SỬ DỤNG:
       - Phương thức: GET
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
       - helpers/auth.php
==============================================================================
*/

require_once '../../config/database.php';
require_once '../../helpers/response.php';
require_once '../../helpers/auth.php';

// Kiểm tra trạng thái đăng nhập trong Session
if (!isset($_SESSION['user_id'])) {
    jsonResponse(false, null, "Chưa đăng nhập");
}

// Truy vấn thông tin người dùng từ CSDL
try {
    $stmt = $pdo->prepare(
        "SELECT id, username, email, full_name, avatar, bio, role, status, created_at
         FROM users WHERE id = ? LIMIT 1"
    );
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Nếu tài khoản không tồn tại hoặc đã bị khóa thì hủy phiên
    if (!$user || $user['status'] === 'locked') {
        $_SESSION = [];
        session_destroy();
        jsonResponse(false, null, "Phiên đăng nhập không hợp lệ");
    }

    jsonResponse(true, $user);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}

