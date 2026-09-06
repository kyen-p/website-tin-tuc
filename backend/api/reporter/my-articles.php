<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Chỉ Reporter mới được truy cập
requireRole(['reporter']);

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_SESSION['user_id'];

try {
    if ($method === 'GET') {
        // Lấy tất cả bài viết của Reporter hiện tại
        $stmt = $pdo->prepare("
            SELECT
                a.id,
                a.title,
                a.slug,
                a.short_description,
                a.cover_image,
                a.category_id,
                c.name AS category_name,
                a.status,
                a.rejection_reason,
                a.view_count,
                a.published_at,
                a.created_at,
                a.updated_at
            FROM articles a
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.author_id = ?
            ORDER BY a.created_at DESC
        ");

        $stmt->execute([$userId]);
        $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(
            true,
            $articles,
            "Lấy danh sách bài viết thành công"
        );
    }

    if ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $articleId = $input['article_id'] ?? null;
        $action = $input['action'] ?? null;

        if (!$articleId) {
            jsonResponse(false, null, "Thiếu article_id");
        }

        $stmt = $pdo->prepare("SELECT id, status FROM articles WHERE id = ? AND author_id = ?");
        $stmt->execute([$articleId, $userId]);
        $art = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$art) {
            jsonResponse(false, null, "Không tìm thấy bài viết hoặc bạn không có quyền");
        }

        if ($action === 'withdraw') {
            $pdo->prepare("UPDATE articles SET status = 'draft', updated_at = NOW() WHERE id = ?")->execute([$articleId]);
            jsonResponse(true, null, "Đã thu hồi bài viết về bản nháp");
        } else if ($action === 'submit') {
            $pdo->prepare("UPDATE articles SET status = 'pending', updated_at = NOW() WHERE id = ?")->execute([$articleId]);
            jsonResponse(true, null, "Đã gửi bài viết lên Ban Biên tập để thẩm định");
        } else {
            jsonResponse(false, null, "Hành động không hợp lệ");
        }
    }

    if ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        $articleId = $input['article_id'] ?? ($_GET['id'] ?? null);

        if (!$articleId) {
            jsonResponse(false, null, "Thiếu article_id");
        }

        $stmt = $pdo->prepare("SELECT id, status FROM articles WHERE id = ? AND author_id = ?");
        $stmt->execute([$articleId, $userId]);
        $art = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$art) {
            jsonResponse(false, null, "Không tìm thấy bài viết hoặc bạn không có quyền");
        }

        // Xóa liên kết tags trước
        $pdo->prepare("DELETE FROM article_tags WHERE article_id = ?")->execute([$articleId]);
        $pdo->prepare("DELETE FROM comments WHERE article_id = ?")->execute([$articleId]);
        $pdo->prepare("DELETE FROM favorites WHERE article_id = ?")->execute([$articleId]);
        $pdo->prepare("DELETE FROM articles WHERE id = ?")->execute([$articleId]);

        jsonResponse(true, null, "Đã xóa bài viết thành công");
    }

    jsonResponse(false, null, "Phương thức không được hỗ trợ");

} catch (PDOException $e) {
    jsonResponse(false, null, $e->getMessage());
}
