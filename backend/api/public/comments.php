<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

$articleId = isset($_GET['article_id']) ? (int)$_GET['article_id'] : 0;
if ($articleId <= 0) {
    jsonResponse(false, null, "Thiếu hoặc sai mã bài viết (article_id)");
}

try {
    $stmt = $pdo->prepare("
        SELECT c.id, c.article_id, c.user_id, c.content, c.is_deleted, c.created_at,
               u.full_name, u.username, u.avatar, u.role
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.article_id = ? AND c.is_deleted = 0
        ORDER BY c.created_at DESC
    ");
    $stmt->execute([$articleId]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(true, $comments);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống: " . $e->getMessage());
}
