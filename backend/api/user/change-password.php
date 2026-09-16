<?php
/*
==============================================================================
TÊN FILE: backend/api/user/change-password.php
PHÂN HỆ: Quản lý mật khẩu người dùng
MÔ TẢ: Xử lý đổi mật khẩu cho tài khoản đang đăng nhập
PHẠM VI SỬ DỤNG:
       - Phương thức: PUT
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
       - helpers/auth.php
==============================================================================
*/

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Yêu cầu đăng nhập trước khi đổi mật khẩu
requireLogin();

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// Kiểm tra phương thức request
if ($method !== 'PUT') {
    jsonResponse(false, null, "Phương thức không hợp lệ");
}

// Tiếp nhận và kiểm tra mật khẩu
try {
    $input = json_decode(file_get_contents("php://input"), true);

    $oldPassword = $input['old_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';

    if ($oldPassword === '' || $newPassword === '') {
        jsonResponse(false, null, "Vui lòng nhập đầy đủ mật khẩu");
    }

    // Xác thực mật khẩu cũ và lưu mật khẩu mới
    $stmt = $pdo->prepare(
        "SELECT password 
         FROM users 
         WHERE id = ?"
    );
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        jsonResponse(false, null, "Không tìm thấy tài khoản");
    }

    // Xác thực mật khẩu cũ
    if (!password_verify($oldPassword, $user['password'])) {
        jsonResponse(false, null, "Mật khẩu cũ không đúng");
    }

    // Mã hóa mật khẩu mới
    $newPasswordHash = password_hash(
        $newPassword,
        PASSWORD_DEFAULT
    );

    // Cập nhật vào cơ sở dữ liệu
    $stmt = $pdo->prepare(
        "UPDATE users
         SET password = ?
         WHERE id = ?"
    );
    $stmt->execute([
        $newPasswordHash,
        $userId
    ]);

    jsonResponse(
        true,
        null,
        "Đổi mật khẩu thành công"
    );

} catch (PDOException $e) {
    jsonResponse(
        false,
        null,
        "Lỗi hệ thống, vui lòng thử lại sau"
    );
}

