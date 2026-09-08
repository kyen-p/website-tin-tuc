<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/file.php';

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

        $stmt = $pdo->prepare("SELECT id, status, title, content, category_id FROM articles WHERE id = ? AND author_id = ?");
        $stmt->execute([$articleId, $userId]);
        $art = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$art) {
            jsonResponse(false, null, "Không tìm thấy bài viết hoặc bạn không có quyền");
        }

        if ($action === 'withdraw') {
            $pdo->prepare("UPDATE articles SET status = 'draft', updated_at = NOW() WHERE id = ?")->execute([$articleId]);
            jsonResponse(true, null, "Đã thu hồi bài viết về bản nháp");
        } else if ($action === 'submit') {
            if (empty(trim($art['title'] ?? '')) || empty(trim($art['content'] ?? '')) || empty($art['category_id'])) {
                jsonResponse(false, null, "Bài viết chưa đầy đủ tiêu đề, nội dung hoặc chuyên mục để gửi duyệt");
            }
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

        $stmt = $pdo->prepare("SELECT id, status, cover_image, content FROM articles WHERE id = ? AND author_id = ?");
        $stmt->execute([$articleId, $userId]);
        $art = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$art) {
            jsonResponse(false, null, "Không tìm thấy bài viết hoặc bạn không có quyền");
        }

        // Dọn dẹp tệp ảnh vật lý trên đĩa cứng (ảnh bìa + ảnh minh họa trong nội dung)
        if (!empty($art['cover_image'])) {
            deleteUploadedFile($art['cover_image']);
        }

        if (!empty($art['content'])) {
            preg_match_all('/src=["\']([^"\']+)["\']/i', $art['content'], $matches);
            if (!empty($matches[1])) {
                foreach ($matches[1] as $imgSrc) {
                    if (strpos($imgSrc, 'backend/api/upload/') !== false) {
                        $pos = strpos($imgSrc, 'backend/api/upload/');
                        $cleanImgPath = substr($imgSrc, $pos);
                        deleteUploadedFile($cleanImgPath);
                    }
                }
            }
        }

        // Nhờ ON DELETE CASCADE trong database, xóa articles sẽ tự động xóa
        // các liên kết trong article_tags, comments và favorites
        $pdo->prepare("DELETE FROM articles WHERE id = ?")->execute([$articleId]);

        jsonResponse(true, null, "Đã xóa bài viết thành công");
    }

    jsonResponse(false, null, "Phương thức không được hỗ trợ");

} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}
