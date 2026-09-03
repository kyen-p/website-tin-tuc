<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';
require_once '../../helpers/auth.php';

requireRole(['admin']);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT a.*, u.full_name AS author_name, u.username AS author_username,
            approver.full_name AS approver_name, approver.username AS approver_username,
            c.name AS category_name, c.slug AS category_slug
        FROM articles a
        JOIN users u ON a.author_id = u.id
        LEFT JOIN users approver ON a.approved_by = approver.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status IN ('published', 'hidden')
        ORDER BY a.published_at DESC");
    $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(true, $articles);
}

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;
    if (!$id) jsonResponse(false, null, "Thiếu id bài viết");

    // Trường hợp 1: chỉ đổi trạng thái (Ẩn/Hiện)
    if (isset($input['toggle_status']) && $input['toggle_status'] === true) {
        $stmt = $pdo->prepare("SELECT status FROM articles WHERE id = ?");
        $stmt->execute([$id]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        $newStatus = $current['status'] === 'hidden' ? 'published' : 'hidden';

        $stmt = $pdo->prepare("UPDATE articles SET status = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$newStatus, $id]);
        jsonResponse(true, ['status' => $newStatus], "Cập nhật trạng thái thành công");
    }

    // Trường hợp 2: sửa đè toàn bộ nội dung
    $stmt = $pdo->prepare(
        "UPDATE articles SET title=?, category_id=?, status=?, is_notable_event=?, short_description=?, content=?, updated_at=NOW()
         WHERE id=?"
    );
    $stmt->execute([
        $input['title'], $input['category_id'], $input['status'],
        $input['is_notable_event'] ? 1 : 0, $input['short_description'], $input['content'], $id
    ]);
    jsonResponse(true, null, "Cập nhật bài viết thành công");
}

if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;
    if (!$id) jsonResponse(false, null, "Thiếu id bài viết");

    // Nhờ đã khai báo ON DELETE CASCADE trong database, xóa articles sẽ tự xóa luôn
    // comments, article_tags, favorites liên quan — không cần code PHP dọn từng bảng
    $stmt = $pdo->prepare("DELETE FROM articles WHERE id = ?");
    $stmt->execute([$id]);
    jsonResponse(true, null, "Đã xóa vĩnh viễn bài viết");
}