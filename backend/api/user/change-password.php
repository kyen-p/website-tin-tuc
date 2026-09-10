<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/user/change-password.php
 * PHÂN HỆ: API Đổi Mật Khẩu (User Security Service)
 * MÔ TẢ: Xử lý đổi mật khẩu cho tài khoản đang đăng nhập (kiểm tra mật khẩu cũ, mã hóa mật khẩu mới).
 * PHẠM VI SỬ DỤNG:
 *   - [API THÀNH VIÊN ĐĂNG NHẬP]
 *   - Phương thức: PUT
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 *   - backend/helpers/auth.php (requireLogin, $_SESSION['user_id'])
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/profile.js (Form đổi mật khẩu trong trang cá nhân)
 * ĐẦU VÀO (PUT JSON):
 *   - old_password: Mật khẩu hiện tại
 *   - new_password: Mật khẩu mới muốn đặt
 * TRẢ VỀ (JSON):
 *   - { success: true, message: "Đổi mật khẩu thành công", data: null }
 * ==============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Yêu cầu đăng nhập trước khi đổi mật khẩu
requireLogin();

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

// ==============================================================================
// KHỐI 1: KIỂM TRA PHƯƠNG THỨC HTTP
// ==============================================================================
if ($method !== 'PUT') {
    jsonResponse(false, null, "Phương thức không hợp lệ");
}

// ==============================================================================
// KHỐI 2: TIẾP NHẬN & KIỂM TRA MẬT KHẨU CŨ - MỚI
// ==============================================================================
try {
    $input = json_decode(file_get_contents("php://input"), true);

    $oldPassword = $input['old_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';

    // Kiểm tra không được để trống
    if ($oldPassword === '' || $newPassword === '') {
        jsonResponse(false, null, "Vui lòng nhập đầy đủ mật khẩu");
    }

    // ==============================================================================
    // KHỐI 3: XÁC THỰC MẬT KHẨU HIỆN TẠI VÀ CẬP NHẬT MẬT KHẨU MỚI
    // ==============================================================================
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

    // Xác thực mật khẩu cũ bằng password_verify
    if (!password_verify($oldPassword, $user['password'])) {
        jsonResponse(false, null, "Mật khẩu cũ không đúng");
    }

    // Mã hóa mật khẩu mới bằng thuật toán bcrypt mặc định
    $newPasswordHash = password_hash(
        $newPassword,
        PASSWORD_DEFAULT
    );

    // Cập nhật mật khẩu mới vào cơ sở dữ liệu
    $stmt = $pdo->prepare(
        "UPDATE users
         SET password = ?
         WHERE id = ?"
    );
    $stmt->execute([
        $newPasswordHash,
        $userId
    ]);

    // ==============================================================================
    // KHỐI 4: PHẢN HỒI KẾT QUẢ CHO CLIENT
    // ==============================================================================
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
