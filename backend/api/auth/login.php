<?php
/*
==============================================================================
TÊN FILE: backend/api/auth/login.php
PHÂN HỆ: Xác thực & Đăng nhập
MÔ TẢ: Xử lý đăng nhập tài khoản bằng Email hoặc Username và mật khẩu
PHẠM VI SỬ DỤNG:
       - Phương thức: POST
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
       - helpers/auth.php
==============================================================================
*/

require_once '../../config/database.php';
require_once '../../helpers/response.php';
require_once '../../helpers/auth.php';

// Kiểm tra phương thức request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// Tiếp nhận và kiểm tra dữ liệu đầu vào (hỗ trợ cả Email hoặc Username)
$account = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? (string) $_POST['password'] : '';

if ($account === '' || $password === '') {
    jsonResponse(false, null, "Vui lòng nhập đầy đủ email/username và mật khẩu");
}

// Truy vấn tài khoản và kiểm tra mật khẩu
try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1");
    $stmt->execute([$account, $account]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {
        jsonResponse(false, null, "Email/Username hoặc mật khẩu không chính xác");
    }

    // Kiểm tra nếu tài khoản đang bị khóa
    if ($user['status'] === 'locked') {
        jsonResponse(false, [
            "lock_reason" => $user['lock_reason'],
        ], "Tài khoản này đã bị khóa quyền truy cập");
    }

    // Lưu phiên làm việc vào Session (tạo mới session id để chống tấn công fixation)
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];

    jsonResponse(true, [
        "id" => $user['id'],
        "username" => $user['username'],
        "role" => $user['role'],
    ], "Đăng nhập thành công");
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}

