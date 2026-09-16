<?php
/*
==============================================================================
TÊN FILE: backend/api/user/my-comments.php
PHÂN HỆ: Quản lý bình luận cá nhân
MÔ TẢ: Cung cấp các thao tác quản lý bình luận cho thành viên đã đăng nhập:
       - Lấy danh sách lịch sử bình luận của chính mình
       - Đăng bình luận mới cho bài viết (kiểm tra tài khoản không bị khóa)
       - Chỉnh sửa nội dung bình luận của chính mình
       - Xóa bình luận của chính mình
PHẠM VI SỬ DỤNG:
       - Phân quyền: Thành viên đã đăng nhập
       - Phương thức: GET, POST, PUT, DELETE
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
       - helpers/auth.php
==============================================================================
*/

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Bắt buộc đăng nhập trước khi thực hiện bất kỳ thao tác bình luận nào
requireLogin();

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    // 1. Lấy danh sách bình luận của người dùng đang đăng nhập
    if ($method === 'GET') {
        $stmt = $pdo->prepare("
            SELECT c.id, c.article_id, c.content, c.created_at,
                   a.title AS article_title, a.slug AS article_slug, a.cover_image AS article_cover_image
            FROM comments c
            LEFT JOIN articles a ON c.article_id = a.id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        ");
        $stmt->execute([$userId]);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(true, $comments, "Lấy danh sách bình luận thành công");
    }

    // 2. Đăng bình luận mới cho bài viết
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

        // Kiểm tra trạng thái hoạt động của tài khoản (tài khoản bị khóa không được bình luận)
        $stmt = $pdo->prepare("SELECT status, lock_reason FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $userRow = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($userRow && $userRow['status'] === 'locked') {
            jsonResponse(false, null, "Tài khoản của bạn đã bị khóa: " . ($userRow['lock_reason'] ?: "Vi phạm tiêu chuẩn cộng đồng"));
        }

        // Kiểm tra bài viết mục tiêu có tồn tại và đã xuất bản không
        $stmt = $pdo->prepare("SELECT id FROM articles WHERE id = ? AND status = 'published' LIMIT 1");
        $stmt->execute([$articleId]);

        if (!$stmt->fetch()) {
            jsonResponse(false, null, "Không tìm thấy bài viết");
        }

        // Thêm bình luận mới vào cơ sở dữ liệu
        $stmt = $pdo->prepare("
            INSERT INTO comments (article_id, user_id, content, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$articleId, $userId, $content]);
        $newCommentId = $pdo->lastInsertId();

        // Lấy lại đầy đủ bản ghi vừa tạo kèm thông tin người gửi để phản hồi ngay cho giao diện
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

    // 3. Chỉnh sửa nội dung bình luận của chính mình
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

        // Kiểm tra quyền sở hữu bình luận
        $stmt = $pdo->prepare("SELECT id, user_id FROM comments WHERE id = ? LIMIT 1");
        $stmt->execute([$commentId]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$comment) {
            jsonResponse(false, null, "Không tìm thấy bình luận");
        }

        if ($comment['user_id'] != $userId) {
            jsonResponse(false, null, "Bạn không có quyền chỉnh sửa bình luận này");
        }

        // Cập nhật nội dung bình luận
        $stmt = $pdo->prepare("UPDATE comments SET content = ? WHERE id = ?");
        $stmt->execute([$content, $commentId]);

        jsonResponse(true, null, "Chỉnh sửa bình luận thành công");
    }

    // 4. Xóa bình luận của chính mình
    if ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input)) {
            jsonResponse(false, null, "Dữ liệu gửi lên không hợp lệ");
        }

        $commentId = $input['comment_id'] ?? null;

        if (!$commentId) {
            jsonResponse(false, null, "Thiếu comment_id");
        }

        // Kiểm tra quyền sở hữu bình luận trước khi xóa
        $stmt = $pdo->prepare("SELECT user_id FROM comments WHERE id = ? LIMIT 1");
        $stmt->execute([$commentId]);
        $comment = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$comment) {
            jsonResponse(false, null, "Không tìm thấy bình luận");
        }

        if ($comment['user_id'] != $userId) {
            jsonResponse(false, null, "Bạn không có quyền xóa bình luận này");
        }

        // Xóa vĩnh viễn bình luận khỏi CSDL
        $stmt = $pdo->prepare("DELETE FROM comments WHERE id = ? AND user_id = ?");
        $stmt->execute([$commentId, $userId]);

        jsonResponse(true, null, "Xóa bình luận thành công");
    }

    // Phản hồi khi client gọi sai phương thức HTTP
    jsonResponse(false, null, "Phương thức không được hỗ trợ");

} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống: " . $e->getMessage());
}


