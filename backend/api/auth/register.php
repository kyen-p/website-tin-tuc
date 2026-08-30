<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? (string) $_POST['password'] : '';
$fullName = isset($_POST['full_name']) ? trim($_POST['full_name']) : '';

// 1. Kiểm tra các trường bắt buộc
if ($username === '' || $email === '' || $password === '' || $fullName === '') {
    jsonResponse(false, null, "Vui lòng nhập đầy đủ username, email, password và họ tên");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(false, null, "Địa chỉ email không hợp lệ");
}

if (strlen($password) < 8) {
    jsonResponse(false, null, "Mật khẩu phải có ít nhất 8 ký tự");
}

try {
    // 2. Kiểm tra username / email đã tồn tại chưa
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        jsonResponse(false, null, "Tên đăng nhập này đã có người sử dụng");
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(false, null, "Email này đã được đăng ký tài khoản");
    }

    // 3. Hash mật khẩu và insert user mới
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        "INSERT INTO users (username, email, password, full_name, role, status, comment_locked, created_at)
         VALUES (?, ?, ?, ?, 'user', 'active', 0, NOW())"
    );
    $stmt->execute([$username, $email, $hashedPassword, $fullName]);

    jsonResponse(true, null, "Đăng ký tài khoản thành công");
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}
