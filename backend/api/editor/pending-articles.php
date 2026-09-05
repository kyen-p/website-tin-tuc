<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';
require_once '../../helpers/auth.php';

requireRole(['editor']);

$method = $_SERVER['REQUEST_METHOD'];
/* GET - Lấy danh sách bài viết chờ duyệt */
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
        ORDER BY a.created_at DESC
    ";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($articles as &$article) {
            $tagSql = "
                SELECT t.id, t.name, t.slug
                FROM article_tags at
                INNER JOIN tags t ON at.tag_id = t.id
                WHERE at.article_id = ?
                ORDER BY t.name ASC
            ";

            $tagStmt = $pdo->prepare($tagSql);
            $tagStmt->execute([$article['id']]);
            $article['tags'] = $tagStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        unset($article);

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

/* PUT - Duyệt hoặc từ chối bài viết */
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
        /* Kiểm tra bài viết */
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

        /* Duyệt bài */
        if ($action === 'approve') {
            $editorId = $_SESSION['user_id'];

            if (isset($input['is_notable_event'])) {
                $isNotableEvent = $input['is_notable_event'] ? 1 : 0;

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
            } else {
                $updateStmt = $pdo->prepare("
                    UPDATE articles
                    SET status = 'published',
                        approved_by = ?,
                        published_at = NOW(),
                        rejection_reason = NULL,
                        updated_at = NOW()
                    WHERE id = ?
                ");

                $updateStmt->execute([
                    $editorId,
                    $articleId
                ]);
            }

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

        /* Từ chối bài */
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
            "Không thể cập nhật bài viết: " . $e->getMessage()
        );
    }
}

/* Method không được hỗ trợ */
jsonResponse(
    false,
    null,
    "Phương thức HTTP không được hỗ trợ"
);
