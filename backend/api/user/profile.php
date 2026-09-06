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

        $bio = isset($input['bio'])
            ? trim($input['bio'])
            : '';

        $avatar = isset($input['avatar'])
            ? trim($input['avatar'])
            : '';

        // Kiểm tra họ tên
        if ($fullName === '') {
            jsonResponse(false, null, "Họ tên không được để trống");
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
                full_name = ?,
                bio = ?,
                avatar = ?
            WHERE id = ?
        ");

        $stmt->execute([
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
