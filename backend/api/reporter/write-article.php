<?php
/*
==============================================================================
TÊN FILE: backend/api/reporter/write-article.php
PHÂN HỆ: Soạn thảo bài viết của phóng viên
MÔ TẢ: Tiếp nhận dữ liệu viết bài, tạo mới hoặc cập nhật bài viết cho phóng viên:
       - Lấy dữ liệu chi tiết bài viết (kèm tags, chuyên mục) để nạp vào form sửa
       - Lưu bài viết ở trạng thái bản nháp (draft) hoặc gửi duyệt (pending)
       - Tự động sinh slug duy nhất (URL thân thiện) và đồng bộ thẻ tag
PHẠM VI SỬ DỤNG:
       - Phân quyền: role = 'reporter'
       - Phương thức: GET, POST, PUT
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
       - helpers/auth.php
       - helpers/string.php
==============================================================================
*/

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/string.php';

// Chỉ phóng viên (reporter) mới được tạo/sửa bài viết
requireRole(['reporter']);

$method = $_SERVER['REQUEST_METHOD'];
$authorId = (int) $_SESSION['user_id'];

// 1. Lấy thông tin bài viết để nạp vào form chỉnh sửa
if ($method === 'GET') {
    $articleId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($articleId <= 0) {
        jsonResponse(false, null, "Thiếu id bài viết");
    }

    try {
        $stmt = $pdo->prepare("
            SELECT a.*, c.name AS category_name
            FROM articles a
            LEFT JOIN categories c ON a.category_id = c.id
            WHERE a.id = ? AND a.author_id = ?
            LIMIT 1
        ");
        $stmt->execute([$articleId, $authorId]);
        $article = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$article) {
            jsonResponse(false, null, "Không tìm thấy bài viết hoặc bạn không có quyền");
        }

        // Lấy danh sách thẻ (tags) đính kèm bài viết
        $tagStmt = $pdo->prepare("
            SELECT t.id, t.name, t.slug
            FROM article_tags at
            JOIN tags t ON at.tag_id = t.id
            WHERE at.article_id = ?
        ");
        $tagStmt->execute([$articleId]);
        $article['tags'] = $tagStmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(true, $article);
    } catch (PDOException $e) {
        jsonResponse(false, null, "Lỗi hệ thống: " . $e->getMessage());
    }
}

// 2. Lưu bản nháp hoặc gửi thẩm định (tạo mới hoặc chỉnh sửa bài viết)
if ($method !== 'POST' && $method !== 'PUT') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    jsonResponse(false, null, "Dữ liệu gửi lên không hợp lệ");
}

$targetId = isset($input['id']) && (int)$input['id'] > 0 ? (int)$input['id'] : 0;
$title = isset($input['title']) ? trim($input['title']) : '';
$shortDescription = isset($input['short_description']) ? trim($input['short_description']) : '';
$content = isset($input['content']) ? trim($input['content']) : '';
$rawCoverImage = isset($input['cover_image']) ? trim($input['cover_image']) : '';
$categoryId = isset($input['category_id']) ? (int) $input['category_id'] : 0;
$status = isset($input['status']) ? trim($input['status']) : 'draft';
$tags = isset($input['tags']) && is_array($input['tags']) ? $input['tags'] : [];

/**
 * Hàm hỗ trợ: Chuẩn hóa đường dẫn tương đối của ảnh bìa
 *
 * @param string|null $cover Đường dẫn thô từ client
 * @return string|null Đường dẫn chuẩn hóa hoặc null
 */
function sanitizeCoverImagePath($cover)
{
    if (empty($cover) || !is_string($cover)) {
        return null;
    }
    $trimmed = trim($cover);
    if ($trimmed === '' || strpos($trimmed, 'placeholder') !== false) {
        return null;
    }
    $pos = strpos($trimmed, 'backend/api/upload/');
    if ($pos !== false) {
        return substr($trimmed, $pos);
    }
    $cleaned = preg_replace('#^(\.\./)+#', '', $trimmed);
    $cleaned = ltrim($cleaned, '/');
    return $cleaned !== '' ? $cleaned : null;
}

$coverImage = sanitizeCoverImagePath($rawCoverImage);

// Kiểm tra trạng thái cho phép của phóng viên
$allowedStatuses = ['draft', 'pending'];
if (!in_array($status, $allowedStatuses, true)) {
    jsonResponse(false, null, "Trạng thái bài viết không hợp lệ");
}

// Kiểm tra tính toàn vẹn theo từng trạng thái
if ($status === 'draft') {
    if ($title === '') {
        jsonResponse(false, null, "Tiêu đề không được để trống khi lưu bản nháp");
    }
}

if ($status === 'pending') {
    if ($title === '') {
        jsonResponse(false, null, "Tiêu đề không được để trống");
    }
    if ($shortDescription === '') {
        jsonResponse(false, null, "Mô tả ngắn không được để trống khi gửi duyệt");
    }
    if ($content === '') {
        jsonResponse(false, null, "Nội dung bài viết không được để trống khi gửi duyệt");
    }
    if ($categoryId <= 0) {
        jsonResponse(false, null, "Vui lòng chọn chuyên mục trước khi gửi duyệt");
    }
    if (empty($coverImage)) {
        jsonResponse(false, null, "Bài viết gửi duyệt bắt buộc phải có ảnh bìa đại diện");
    }
}

try {
    // Kiểm tra chuyên mục có tồn tại không
    if ($categoryId > 0) {
        $stmt = $pdo->prepare("SELECT id FROM categories WHERE id = ? LIMIT 1");
        $stmt->execute([$categoryId]);
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            jsonResponse(false, null, "Chuyên mục không tồn tại");
        }
    }

    $pdo->beginTransaction();

    if ($targetId > 0) {
        // Cập nhật bài viết có sẵn của tác giả
        $checkStmt = $pdo->prepare("SELECT id, slug, status FROM articles WHERE id = ? AND author_id = ?");
        $checkStmt->execute([$targetId, $authorId]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$existing) {
            $pdo->rollBack();
            jsonResponse(false, null, "Không tìm thấy bài viết để cập nhật");
        }

        $slug = $existing['slug'];

        $stmt = $pdo->prepare("
            UPDATE articles SET
                title = ?,
                short_description = ?,
                content = ?,
                cover_image = ?,
                category_id = ?,
                status = ?,
                updated_at = NOW()
            WHERE id = ? AND author_id = ?
        ");
        $stmt->execute([
            $title,
            $shortDescription !== '' ? $shortDescription : null,
            $content !== '' ? $content : null,
            $coverImage !== '' ? $coverImage : null,
            $categoryId > 0 ? $categoryId : null,
            $status,
            $targetId,
            $authorId
        ]);

        $articleId = $targetId;

        // Xóa tags cũ để đồng bộ lại
        $pdo->prepare("DELETE FROM article_tags WHERE article_id = ?")->execute([$articleId]);
    } else {
        // Tạo mới bài viết: sinh slug duy nhất tránh trùng lặp
        $baseSlug = createSlug($title);
        if ($baseSlug === '') {
            $baseSlug = 'bai-viet';
        }
        $slug = $baseSlug;
        $counter = 1;
        while (true) {
            $stmt = $pdo->prepare("SELECT id FROM articles WHERE slug = ? LIMIT 1");
            $stmt->execute([$slug]);
            if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
                break;
            }
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        $stmt = $pdo->prepare("
            INSERT INTO articles (
                title, slug, short_description, content, cover_image,
                author_id, category_id, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $title,
            $slug,
            $shortDescription !== '' ? $shortDescription : null,
            $content !== '' ? $content : null,
            $coverImage !== '' ? $coverImage : null,
            $authorId,
            $categoryId > 0 ? $categoryId : null,
            $status
        ]);
        $articleId = (int)$pdo->lastInsertId();
    }

    // Xử lý và đồng bộ danh sách Tags
    $uniqueTagNames = array_unique(array_map('trim', $tags));
    foreach ($uniqueTagNames as $tagName) {
        if ($tagName === '') continue;

        $stmt = $pdo->prepare("SELECT id FROM tags WHERE LOWER(name) = LOWER(?) LIMIT 1");
        $stmt->execute([$tagName]);
        $existingTag = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existingTag) {
            $tagId = (int)$existingTag['id'];
        } else {
            $tagSlug = createSlug($tagName);
            $insertTag = $pdo->prepare("INSERT INTO tags (name, slug, created_at) VALUES (?, ?, NOW())");
            $insertTag->execute([$tagName, $tagSlug]);
            $tagId = (int)$pdo->lastInsertId();
        }

        $stmt = $pdo->prepare("INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)");
        $stmt->execute([$articleId, $tagId]);
    }

    $pdo->commit();

    jsonResponse(
        true,
        [
            "id" => $articleId,
            "title" => $title,
            "slug" => $slug,
            "status" => $status
        ],
        $status === 'draft'
            ? "Lưu bản nháp thành công"
            : "Gửi bài viết chờ duyệt thành công"
    );

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    jsonResponse(false, null, "Lỗi hệ thống: " . $e->getMessage());
}

