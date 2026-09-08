<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

requireLogin();

$userId = $_SESSION['user_id'];

$method = $_SERVER['REQUEST_METHOD'];


if ($method !== 'PUT') {
    jsonResponse(false, null, "Phương thức không hợp lệ");
}


try {

    // Lấy dữ liệu PUT
    $input = json_decode(file_get_contents("php://input"), true);


    $oldPassword = $input['old_password'] ?? '';
    $newPassword = $input['new_password'] ?? '';


    // Kiểm tra rỗng
    if ($oldPassword === '' || $newPassword === '') {
        jsonResponse(false, null, "Vui lòng nhập đầy đủ mật khẩu");
    }


    // Lấy mật khẩu hiện tại
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


    // Kiểm tra mật khẩu cũ
    if (!password_verify($oldPassword, $user['password'])) {

        jsonResponse(false, null, "Mật khẩu cũ không đúng");

    }


    // Mã hóa mật khẩu mới
    $newPasswordHash = password_hash(
        $newPassword,
        PASSWORD_DEFAULT
    );


    // Cập nhật mật khẩu
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

?>