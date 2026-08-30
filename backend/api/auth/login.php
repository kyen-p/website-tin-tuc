<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';
require_once '../../helpers/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// Giao diện hiện tại cho phép nhập Email hoặc Username vào cùng 1 ô (accountInput).
// Frontend gửi giá trị đó lên dưới field "email" theo đúng specification (email, password),
// backend sẽ tự nhận diện đây là email hay username khi truy vấn.
$account = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? (string) $_POST['password'] : '';

if ($account === '' || $password === '') {
    jsonResponse(false, null, "Vui lòng nhập đầy đủ email/username và mật khẩu");
}

try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1");
    $stmt->execute([$account, $account]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {
        jsonResponse(false, null, "Email/Username hoặc mật khẩu không chính xác");
    }

    if ($user['status'] === 'locked') {
        jsonResponse(false, [
            "lock_reason" => $user['lock_reason'],
        ], "Tài khoản này đã bị khóa quyền truy cập");
    }

    // Tạo phiên đăng nhập
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
