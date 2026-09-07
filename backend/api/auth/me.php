<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';
require_once '../../helpers/auth.php';

if (!isset($_SESSION['user_id'])) {
    jsonResponse(false, null, "Chưa đăng nhập");
}

try {
    $stmt = $pdo->prepare(
        "SELECT id, username, email, full_name, avatar, bio, role, status, created_at
         FROM users WHERE id = ? LIMIT 1"
    );
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Tài khoản đã bị xóa hoặc bị khóa sau khi đăng nhập -> hủy phiên
    if (!$user || $user['status'] === 'locked') {
        $_SESSION = [];
        session_destroy();
        jsonResponse(false, null, "Phiên đăng nhập không hợp lệ");
    }

    jsonResponse(true, $user);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}
