<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Bắt buộc đăng nhập
requireLogin();

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    // =========================================================
    // GET: Lấy danh sách bình luận của user đang đăng nhập
    // =========================================================
    if ($method === 'GET') {
        $stmt = $pdo->prepare("
            SELECT c.id, c.article_id, c.content, c.is_deleted, c.created_at,
                   a.title AS article_title, a.slug AS article_slug, a.cover_image AS article_cover_image
            FROM comments c
            LEFT JOIN articles a ON c.article_id = a.id
            WHERE c.user_id = ? AND c.is_deleted = 0
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$userId]);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(true, $comments, "Lấy danh sách bình luận thành công");
    }

    // =========================================================
    // POST: Thêm bình luận
    // =========================================================
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input)) {
            jsonResponse(false, null, "Dữ liệu gửi lên không hợp lệ");
        }

        $articleId = $input['article_id'] ?? null;
        $content = trim($input['content'] ?? '');

        if (!$articleId || $content === '') {
            jsonResponse(false, null, "Vui lòng nhập đầy đủ thông tin");
        }

        // Kiểm tra quyền bình luận của user
        $stmt = $pdo->prepare("SELECT is_comment_locked, comment_lock_reason FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $userRow = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($userRow && !empty($userRow['is_comment_locked'])) {
            jsonResponse(false, null, "Tài khoản của bạn đã bị khóa tính năng bình luận: " . ($userRow['comment_lock_reason'] ?: "Vi phạm tiêu chuẩn cộng đồng"));
        }

        // Kiểm tra bài viết tồn tại và đã xuất bản
        $stmt = $pdo->prepare("SELECT id FROM articles WHERE id = ? AND status = 'published' LIMIT 1");
        $stmt->execute([$articleId]);

        if (!$stmt->fetch()) {
            jsonResponse(false, null, "Không tìm thấy bài viết");
        }

        // Thêm bình luận vào MySQL
        $stmt = $pdo->prepare("
            INSERT INTO comments (article_id, user_id, content, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$articleId, $userId, $content]);
        $newCommentId = $pdo->lastInsertId();

        // Lấy thông tin bình luận vừa tạo kèm user
        $fetchStmt = $pdo->prepare("
            SELECT c.id, c.article_id, c.user_id, c.content, c.created_at,
                   u.full_name, u.username, u.avatar, u.role
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        ");
        $fetchStmt->execute([$newCommentId]);
        $newComment = $fetchStmt->fetch(PDO::FETCH_ASSOC);

        jsonResponse(true, $newComment, "Bình luận thành công");
    }

    // =========================================================
    // PUT: Chỉnh sửa nội dung bình luận của chính mình
    // =========================================================
    if ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input)) {
            jsonResponse(false, null, "Dữ liệu gửi lên không hợp lệ");
        }

        $commentId = $input['comment_id'] ?? null;
        $content = trim($input['content'] ?? '');

        if (!$commentId || $content === '') {
            jsonResponse(false, null, "Vui lòng nhập đầy đủ thông tin");
        }

        $stmt = $pdo->prepare("SELECT id, user_id FROM comments WHERE id = ? LIMIT 1");
        $stmt->execute([$commentId]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$comment) {
            jsonResponse(false, null, "Không tìm thấy bình luận");
        }

        if ($comment['user_id'] != $userId) {
            jsonResponse(false, null, "Bạn không có quyền chỉnh sửa bình luận này");
        }

        $stmt = $pdo->prepare("UPDATE comments SET content = ? WHERE id = ?");
        $stmt->execute([$content, $commentId]);

        jsonResponse(true, null, "Chỉnh sửa bình luận thành công");
    }

    // =========================================================
    // DELETE: Xóa bình luận của chính mình
    // =========================================================
    if ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input)) {
            jsonResponse(false, null, "Dữ liệu gửi lên không hợp lệ");
        }

        $commentId = $input['comment_id'] ?? null;

        if (!$commentId) {
            jsonResponse(false, null, "Thiếu comment_id");
        }

        // Kiểm tra comment thuộc user đang đăng nhập
        $stmt = $pdo->prepare("SELECT user_id FROM comments WHERE id = ? LIMIT 1");
        $stmt->execute([$commentId]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$comment) {
            jsonResponse(false, null, "Không tìm thấy bình luận");
        }

        if ($comment['user_id'] != $userId) {
            jsonResponse(false, null, "Bạn không có quyền xóa bình luận này");
        }

        // Xóa bình luận
        $stmt = $pdo->prepare("DELETE FROM comments WHERE id = ?");
        $stmt->execute([$commentId]);

        jsonResponse(true, null, "Xóa bình luận thành công");
    }

    jsonResponse(false, null, "Phương thức không được hỗ trợ");

} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống: " . $e->getMessage());
}
