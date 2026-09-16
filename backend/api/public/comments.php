<?php
/*
==============================================================================
TÊN FILE: backend/api/public/comments.php
PHÂN HỆ: Bình luận công khai
MÔ TẢ: Lấy danh sách bình luận của bài viết sắp xếp theo thời gian mới nhất
PHẠM VI SỬ DỤNG:
       - Phương thức: GET
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
==============================================================================
*/

require_once '../../config/database.php';
require_once '../../helpers/response.php';

// Kiểm tra phương thức request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// Tiếp nhận ID bài viết
$articleId = isset($_GET['article_id']) ? (int)$_GET['article_id'] : 0;
if ($articleId <= 0) {
    jsonResponse(false, null, "Thiếu hoặc sai mã bài viết (article_id)");
}

// Lấy danh sách bình luận kèm người gửi
try {
    $stmt = $pdo->prepare("
        SELECT c.id, c.article_id, c.user_id, c.content, c.created_at,
               u.full_name, u.username, u.avatar, u.role
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.article_id = ?
        ORDER BY c.created_at DESC
    ");
    $stmt->execute([$articleId]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(true, $comments);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}

