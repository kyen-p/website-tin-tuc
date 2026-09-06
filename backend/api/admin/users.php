<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';
require_once '../../helpers/auth.php';
require_once '../../helpers/file.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireRole(['admin']);
    $stmt = $pdo->query("SELECT id, username, email, full_name, avatar, bio, role, status, lock_reason, locked_at, comment_locked, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(true, $users);
}

if ($method === 'PUT') {
    requireRole(['admin']);
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'];

    if (!empty($input['delete'])) {
        // Xóa tài khoản (dùng cho handleDeleteUser)
        // Lấy ảnh đại diện để xóa file vật lý trên máy chủ
        $stmtFind = $pdo->prepare("SELECT avatar FROM users WHERE id = ?");
        $stmtFind->execute([$userId]);
        $userObj = $stmtFind->fetch(PDO::FETCH_ASSOC);
        if ($userObj && !empty($userObj['avatar'])) {
            deleteUploadedFile($userObj['avatar']);
        }

        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        jsonResponse(true, null, "Đã xóa tài khoản");
    }

    if (isset($input['role'])) {
        $allowedRoles = ['user', 'reporter', 'editor', 'admin'];
        if (in_array($input['role'], $allowedRoles, true)) {
            $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
            $stmt->execute([$input['role'], $userId]);
        }
    }

    if (isset($input['comment_locked'])) {
        $stmt = $pdo->prepare("UPDATE users SET comment_locked = ? WHERE id = ?");
        $stmt->execute([(int)$input['comment_locked'], $userId]);
    }

    if (isset($input['status'])) {
        if ($input['status'] === 'locked') {
            $stmt = $pdo->prepare("UPDATE users SET status='locked', lock_reason=?, locked_at=NOW() WHERE id=?");
            $stmt->execute([$input['lock_reason'] ?? 'Vi phạm điều khoản cộng đồng', $userId]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET status='active', lock_reason=NULL, locked_at=NULL WHERE id=?");
            $stmt->execute([$userId]);
        }
    }

    jsonResponse(true, null, "Cập nhật thành công");
}