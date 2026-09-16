<?php
/*
==============================================================================
TÊN FILE: backend/api/auth/register.php
PHÂN HỆ: Đăng ký tài khoản
MÔ TẢ: Tiếp nhận yêu cầu đăng ký tài khoản mới cho độc giả
PHẠM VI SỬ DỤNG:
       - Phương thức: POST
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
==============================================================================
*/

require_once '../../config/database.php';
require_once '../../helpers/response.php';

// Kiểm tra phương thức HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// Tiếp nhận dữ liệu đăng ký
$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? (string) $_POST['password'] : '';
$fullName = isset($_POST['full_name']) ? trim($_POST['full_name']) : '';

// Kiểm tra các trường bắt buộc
if ($username === '' || $email === '' || $password === '' || $fullName === '') {
    jsonResponse(false, null, "Vui lòng nhập đầy đủ username, email, password và họ tên");
}

// Kiểm tra định dạng email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(false, null, "Địa chỉ email không hợp lệ");
}

// Mật khẩu tối thiểu 8 ký tự
if (strlen($password) < 8) {
    jsonResponse(false, null, "Mật khẩu phải có ít nhất 8 ký tự");
}

// Kiểm tra trùng lặp và tạo tài khoản
try {
    // Kiểm tra username đã tồn tại chưa
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        jsonResponse(false, null, "Tên đăng nhập này đã có người sử dụng");
    }

    // Kiểm tra email đã đăng ký chưa
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(false, null, "Email này đã được đăng ký tài khoản");
    }

    // Băm mật khẩu an toàn
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Thêm bản ghi mới (mặc định vai trò là 'user')
    $stmt = $pdo->prepare(
        "INSERT INTO users (username, email, password, full_name, role, status, created_at)
         VALUES (?, ?, ?, ?, 'user', 'active', NOW())"
    );
    $stmt->execute([$username, $email, $hashedPassword, $fullName]);

    jsonResponse(true, null, "Đăng ký tài khoản thành công");
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}

