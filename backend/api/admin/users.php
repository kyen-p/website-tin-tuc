<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';
require_once '../../helpers/auth.php';

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
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        jsonResponse(true, null, "Đã xóa tài khoản");
    }

    if ($input['status'] === 'locked') {
        $stmt = $pdo->prepare("UPDATE users SET status='locked', lock_reason=?, locked_at=NOW() WHERE id=?");
        $stmt->execute([$input['lock_reason'], $userId]);
    } else {
        $stmt = $pdo->prepare("UPDATE users SET status='active', lock_reason=NULL, locked_at=NULL WHERE id=?");
        $stmt->execute([$userId]);
    }

    jsonResponse(true, null, "Cập nhật thành công");
}