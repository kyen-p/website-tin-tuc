<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/file.php';

// Yêu cầu người dùng phải đăng nhập
requireLogin();

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {

    // =========================================================
    // GET: Lấy thông tin cá nhân của người dùng đang đăng nhập
    // =========================================================
    if ($method === 'GET') {

        $stmt = $pdo->prepare("
            SELECT
                id,
                username,
                email,
                full_name,
                avatar,
                bio,
                role,
                status,
                created_at
            FROM users
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            jsonResponse(false, null, "Không tìm thấy người dùng");
        }

        jsonResponse(
            true,
            $user,
            "Lấy thông tin cá nhân thành công"
        );
    }


    // =========================================================
    // PUT: Cập nhật thông tin cá nhân
    // Chỉ cho phép sửa: full_name, bio, avatar
    // =========================================================
    if ($method === 'PUT') {

        // Đọc dữ liệu JSON từ frontend
        $input = json_decode(
            file_get_contents('php://input'),
            true
        );

        if (!is_array($input)) {
            jsonResponse(false, null, "Dữ liệu gửi lên không hợp lệ");
        }

        // Lấy dữ liệu
        $fullName = isset($input['full_name'])
            ? trim($input['full_name'])
            : '';

        $username = isset($input['username'])
            ? trim($input['username'])
            : '';

        $email = isset($input['email'])
            ? trim($input['email'])
            : '';

        $bio = isset($input['bio'])
            ? trim($input['bio'])
            : '';

        $avatar = isset($input['avatar'])
            ? trim($input['avatar'])
            : '';

        // Kiểm tra họ tên
        if ($fullName === '') {
            jsonResponse(false, null, "Họ và tên không được để trống");
        }

        // Kiểm tra tên đăng nhập
        if ($username === '') {
            jsonResponse(false, null, "Tên đăng nhập không được để trống");
        }

        if (!preg_match('/^[a-zA-Z0-9_]{3,30}$/', $username)) {
            jsonResponse(false, null, "Tên đăng nhập từ 3 - 30 ký tự, không chứa dấu cách hoặc ký tự đặc biệt");
        }

        // Kiểm tra email
        if ($email === '') {
            jsonResponse(false, null, "Email không được để trống");
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(false, null, "Định dạng email không hợp lệ");
        }

        // Kiểm tra trùng lặp username
        $stmtCheckUser = $pdo->prepare("SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1");
        $stmtCheckUser->execute([$username, $userId]);
        if ($stmtCheckUser->fetch()) {
            jsonResponse(false, null, "Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác!");
        }

        // Kiểm tra trùng lặp email
        $stmtCheckEmail = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1");
        $stmtCheckEmail->execute([$email, $userId]);
        if ($stmtCheckEmail->fetch()) {
            jsonResponse(false, null, "Email này đã được sử dụng bởi một tài khoản khác!");
        }

        // Nếu người dùng đổi ảnh đại diện mới HOẶC xóa ảnh đại diện -> Xóa ảnh đại diện cũ khỏi máy chủ
        $stmtOld = $pdo->prepare("SELECT avatar FROM users WHERE id = ?");
        $stmtOld->execute([$userId]);
        $currentAvatar = $stmtOld->fetchColumn();

        if ($currentAvatar && $currentAvatar !== $avatar) {
            deleteUploadedFile($currentAvatar);
        }

        // Cập nhật đúng user đang đăng nhập
        $stmt = $pdo->prepare("
            UPDATE users
            SET
                username = ?,
                email = ?,
                full_name = ?,
                bio = ?,
                avatar = ?
            WHERE id = ?
        ");

        $stmt->execute([
            $username,
            $email,
            $fullName,
            $bio,
            $avatar,
            $userId
        ]);

        // Lấy lại thông tin mới nhất
        $stmt = $pdo->prepare("
            SELECT
                id,
                username,
                email,
                full_name,
                avatar,
                bio,
                role,
                status,
                created_at
            FROM users
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Cập nhật lại session
        if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
            $_SESSION['user']['username'] = $user['username'];
            $_SESSION['user']['email'] = $user['email'];
            $_SESSION['user']['full_name'] = $user['full_name'];
            $_SESSION['user']['avatar'] = $user['avatar'];
            $_SESSION['user']['bio'] = $user['bio'];
        }

        jsonResponse(
            true,
            $user,
            "Cập nhật thông tin cá nhân thành công"
        );
    }


    // =========================================================
    // Các phương thức khác
    // =========================================================
    jsonResponse(false, null, "Phương thức không được hỗ trợ");

} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống: " . $e->getMessage());
}
