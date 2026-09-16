<?php
/*
==============================================================================
TÊN FILE: backend/api/editor/pending-articles.php
PHÂN HỆ: Duyệt bài viết
MÔ TẢ: Xử lý quy trình kiểm duyệt bài viết cho Ban biên tập:
       - Lấy danh sách bài viết đang chờ duyệt (status = 'pending')
       - Phê duyệt xuất bản bài viết (status = 'published', lưu người duyệt, thời gian)
       - Từ chối bài viết kèm lý do phản hồi cho phóng viên (status = 'rejected')
PHẠM VI SỬ DỤNG:
       - Phân quyền: role = 'editor'
       - Phương thức: GET, PUT
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
       - helpers/auth.php
==============================================================================
*/

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Chỉ Biên tập viên (editor) mới được thẩm định bài viết
requireRole(['editor']);

$method = $_SERVER['REQUEST_METHOD'];

// 1. Lấy danh sách bài viết chờ duyệt kèm thông tin tác giả và chuyên mục
if ($method === 'GET') {
    $sql = "
        SELECT
            a.id, a.title, a.slug, a.short_description, a.content,
            a.cover_image, a.author_id, a.approved_by, a.category_id,
            a.is_notable_event, a.status, a.rejection_reason,
            a.view_count, a.published_at, a.created_at, a.updated_at,
            u.username AS author_username,
            u.full_name AS author_name,
            u.avatar AS author_avatar,
            u.bio AS author_bio,
            c.name AS category_name,
            c.slug AS category_slug,
            c.description AS category_description
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.status = 'pending'
        ORDER BY COALESCE(a.updated_at, a.created_at) DESC
    ";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Nạp danh sách thẻ (tags) đính kèm cho từng bài viết
        if (!empty($articles)) {
            $tagSql = "
                SELECT t.id, t.name, t.slug
                FROM article_tags at
                INNER JOIN tags t ON at.tag_id = t.id
                WHERE at.article_id = ?
                ORDER BY t.name ASC
            ";
            $tagStmt = $pdo->prepare($tagSql);

            foreach ($articles as &$article) {
                $tagStmt->execute([$article['id']]);
                $article['tags'] = $tagStmt->fetchAll(PDO::FETCH_ASSOC);
            }
            unset($article);
        }

        jsonResponse(
            true,
            $articles,
            "Lấy danh sách bài viết chờ duyệt thành công"
        );
    } catch (PDOException $e) {
        jsonResponse(
            false,
            null,
            "Không thể lấy danh sách bài viết: " . $e->getMessage()
        );
    }
}

// 2. Phê duyệt xuất bản hoặc từ chối bài viết
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        jsonResponse(false, null, "Dữ liệu gửi lên không hợp lệ");
    }

    $articleId = $input['article_id'] ?? null;
    $action = $input['action'] ?? null;
    $rejectionReason = trim($input['rejection_reason'] ?? '');

    if (!$articleId) {
        jsonResponse(false, null, "Thiếu article_id");
    }

    if ($action !== 'approve' && $action !== 'reject') {
        jsonResponse(false, null, "action phải là approve hoặc reject");
    }

    try {
        // Kiểm tra tính hợp lệ và trạng thái bài viết
        $checkStmt = $pdo->prepare("
            SELECT id, title, status
            FROM articles
            WHERE id = ?
        ");
        $checkStmt->execute([$articleId]);
        $article = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$article) {
            jsonResponse(false, null, "Không tìm thấy bài viết");
        }

        if ($article['status'] !== 'pending') {
            jsonResponse(
                false,
                null,
                "Bài viết này không còn ở trạng thái chờ duyệt"
            );
        }

        // Nhánh 2.1: Phê duyệt và công bố bài viết lên trang chủ
        if ($action === 'approve') {
            $editorId = $_SESSION['user_id'];
            $isNotableEvent = !empty($input['is_notable_event']) ? 1 : 0;

            $updateStmt = $pdo->prepare("
                UPDATE articles
                SET status = 'published',
                    approved_by = ?,
                    published_at = NOW(),
                    is_notable_event = ?,
                    rejection_reason = NULL,
                    updated_at = NOW()
                WHERE id = ?
            ");

            $updateStmt->execute([
                $editorId,
                $isNotableEvent,
                $articleId
            ]);

            $resultStmt = $pdo->prepare("
                SELECT id, title, status, approved_by, published_at,
                       is_notable_event, rejection_reason, updated_at
                FROM articles
                WHERE id = ?
            ");

            $resultStmt->execute([$articleId]);
            $result = $resultStmt->fetch(PDO::FETCH_ASSOC);

            jsonResponse(
                true,
                $result,
                "Đã duyệt và xuất bản bài viết thành công"
            );
        }

        // Nhánh 2.2: Từ chối bài viết kèm lý do phản hồi cho phóng viên
        if ($action === 'reject') {
            if ($rejectionReason === '') {
                jsonResponse(
                    false,
                    null,
                    "Vui lòng nhập lý do từ chối bài viết"
                );
            }

            $updateStmt = $pdo->prepare("
                UPDATE articles
                SET status = 'rejected',
                    rejection_reason = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");

            $updateStmt->execute([
                $rejectionReason,
                $articleId
            ]);

            $resultStmt = $pdo->prepare("
                SELECT id, title, status, rejection_reason, updated_at
                FROM articles
                WHERE id = ?
            ");

            $resultStmt->execute([$articleId]);
            $result = $resultStmt->fetch(PDO::FETCH_ASSOC);

            jsonResponse(
                true,
                $result,
                "Đã từ chối bài viết"
            );
        }
    } catch (PDOException $e) {
        jsonResponse(
            false,
            null,
            "Lỗi hệ thống, vui lòng thử lại sau"
        );
    }
}

// Phản hồi khi client gọi sai phương thức HTTP
jsonResponse(
    false,
    null,
    "Phương thức HTTP không được hỗ trợ"
);

