<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';
require_once '../../helpers/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireRole(['admin']);
    $stmt = $pdo->query("SELECT c.*, u.full_name, u.username, u.avatar, a.title AS article_title, a.slug AS article_slug 
        FROM comments c 
        JOIN users u ON c.user_id = u.id 
        JOIN articles a ON c.article_id = a.id 
        ORDER BY c.created_at DESC");
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(true, $comments);
}

if ($method === 'DELETE') {
    requireRole(['admin']);
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['comment_id'])) {
        jsonResponse(false, null, "Thiếu ID bình luận");
    }
    $stmt = $pdo->prepare("DELETE FROM comments WHERE id = ?");
    $stmt->execute([(int)$input['comment_id']]);
    jsonResponse(true, null, "Đã xóa vĩnh viễn bình luận thành công");
}