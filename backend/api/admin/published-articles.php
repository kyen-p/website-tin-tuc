<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/admin/published-articles.php
 * PHÂN HỆ: API Quản lý Bài viết Toàn hệ thống (Global Articles Service)
 * MÔ TẢ: Cung cấp quyền giám sát tối cao đối với các bài viết đã qua kiểm duyệt:
 *        - GET: Lấy danh sách bài viết đã xuất bản hoặc bị ẩn (status: published, hidden).
 *        - PUT: Bật/tắt trạng thái hiển thị (toggle Ẩn/Hiện) hoặc chỉnh sửa nội dung bài viết.
 *        - DELETE: Xóa vĩnh viễn bài viết khỏi hệ thống (đồng thời quét dọn ảnh bìa và các ảnh
 *          minh họa upload cục bộ trong bài; CSDL tự động cascade các comment, tag, favorite).
 * PHẠM VI SỬ DỤNG:
 *   - [KHU VỰC QUẢN TRỊ TỐI CAO - ADMIN]
 *   - Phân quyền: role = 'admin'
 *   - Phương thức: GET, PUT, DELETE
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 *   - backend/helpers/auth.php (requireRole)
 *   - backend/helpers/file.php (deleteUploadedFile)
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/admin-articles.js (Bảng quản lý tin bài hệ thống)
 * TRẢ VỀ (JSON):
 *   - Theo từng nghiệp vụ tương ứng
 * ==============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/file.php';
require_once __DIR__ . '/../../helpers/string.php';

// Kiểm tra quyền hạn: Chỉ Quản trị viên (admin) mới được truy cập
requireRole(['admin']);

$method = $_SERVER['REQUEST_METHOD'];

// ==============================================================================
// NGHIỆP VỤ 1: GET - TRUY VẤN DANH SÁCH BÀI VIẾT ĐÃ XUẤT BẢN / ĐANG BỊ ẨN
// ==============================================================================
if ($method === 'GET') {
    $isPaginated = isset($_GET['page']);
    $statusFilter = isset($_GET['status']) ? trim($_GET['status']) : 'all';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : 0;

    $whereClauses = ["a.status IN ('published', 'hidden')"];
    $params = [];

    if ($statusFilter === 'published') {
        $whereClauses[] = "a.status = 'published'";
    } elseif ($statusFilter === 'hidden') {
        $whereClauses[] = "a.status = 'hidden'";
    }

    if ($categoryId > 0) {
        $whereClauses[] = "a.category_id = ?";
        $params[] = $categoryId;
    }

    if ($search !== '') {
        $whereClauses[] = "(a.title LIKE ? OR a.short_description LIKE ? OR u.full_name LIKE ? OR u.username LIKE ?)";
        $like = '%' . $search . '%';
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    $whereSql = " WHERE " . implode(" AND ", $whereClauses);

    if ($isPaginated) {
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM articles a 
                                    JOIN users u ON a.author_id = u.id" . $whereSql);
        $countStmt->execute($params);
        $totalRecords = (int)$countStmt->fetchColumn();

        list($page, $limit, $offset) = getPaginationParams(10, 50);

        $sql = "SELECT a.*, u.full_name AS author_name, u.username AS author_username,
                    approver.full_name AS approver_name, approver.username AS approver_username,
                    c.name AS category_name, c.slug AS category_slug
                FROM articles a
                JOIN users u ON a.author_id = u.id
                LEFT JOIN users approver ON a.approved_by = approver.id
                LEFT JOIN categories c ON a.category_id = c.id
                " . $whereSql . "
                ORDER BY a.published_at DESC
                LIMIT " . (int)$limit . " OFFSET " . (int)$offset;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Nạp đầy đủ danh sách Thẻ Tag (tags) cho từng bài viết
        if (!empty($articles)) {
            $tagStmt = $pdo->prepare("
                SELECT t.id, t.name, t.slug 
                FROM article_tags at 
                INNER JOIN tags t ON at.tag_id = t.id 
                WHERE at.article_id = ?
            ");
            foreach ($articles as &$art) {
                $tagStmt->execute([$art['id']]);
                $art['tags'] = $tagStmt->fetchAll(PDO::FETCH_ASSOC);
            }
            unset($art);
        }

        jsonPaginatedResponse(true, $articles, $totalRecords, $page, $limit);
    } else {
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

        // Nạp đầy đủ danh sách Thẻ Tag (tags) cho từng bài viết để Admin xem chi tiết & sửa đè
        $tagStmt = $pdo->prepare("
            SELECT t.id, t.name, t.slug 
            FROM article_tags at 
            INNER JOIN tags t ON at.tag_id = t.id 
            WHERE at.article_id = ?
        ");

        foreach ($articles as &$art) {
            $tagStmt->execute([$art['id']]);
            $art['tags'] = $tagStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        unset($art);

        jsonResponse(true, $articles);
    }
}

// ==============================================================================
// NGHIỆP VỤ 2: PUT - CHỈNH SỬA NỘI DUNG HOẶC BẬT/TẮT ẨN HIỆN BÀI VIẾT
// ==============================================================================
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;
    if (!$id) jsonResponse(false, null, "Thiếu id bài viết");

    // Nhánh 2.1: Chuyển đổi trạng thái Ẩn / Hiện (toggle_status)
    if (isset($input['toggle_status']) && $input['toggle_status'] === true) {
        $stmt = $pdo->prepare("SELECT status FROM articles WHERE id = ?");
        $stmt->execute([$id]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        $newStatus = $current['status'] === 'hidden' ? 'published' : 'hidden';

        $stmt = $pdo->prepare("UPDATE articles SET status = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$newStatus, $id]);
        jsonResponse(true, ['status' => $newStatus], "Cập nhật trạng thái thành công");
    }

    // Nhánh 2.2: Cập nhật toàn bộ thông tin chi tiết bài viết (Bao gồm Thẻ Tag)
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            "UPDATE articles SET title=?, category_id=?, status=?, is_notable_event=?, short_description=?, content=?, updated_at=NOW()
             WHERE id=?"
        );
        $stmt->execute([
            $input['title'],
            $input['category_id'],
            $input['status'],
            !empty($input['is_notable_event']) ? 1 : 0,
            $input['short_description'] ?? '',
            $input['content'] ?? '',
            $id
        ]);

        // Đồng bộ danh sách Thẻ Tag nếu có trong payload
        if (isset($input['tags']) && is_array($input['tags'])) {
            // Xóa liên kết tags cũ của bài viết
            $delTagsStmt = $pdo->prepare("DELETE FROM article_tags WHERE article_id = ?");
            $delTagsStmt->execute([$id]);

            $uniqueTagNames = array_unique(array_map('trim', $input['tags']));
            foreach ($uniqueTagNames as $tagName) {
                if ($tagName === '') continue;

                // Kiểm tra tag đã tồn tại trong từ điển hệ thống chưa
                $stmtTag = $pdo->prepare("SELECT id FROM tags WHERE LOWER(name) = LOWER(?) LIMIT 1");
                $stmtTag->execute([$tagName]);
                $existingTag = $stmtTag->fetch(PDO::FETCH_ASSOC);

                if ($existingTag) {
                    $tagId = (int)$existingTag['id'];
                } else {
                    $tagSlug = createSlug($tagName);
                    $insertTag = $pdo->prepare("INSERT INTO tags (name, slug, created_at) VALUES (?, ?, NOW())");
                    $insertTag->execute([$tagName, $tagSlug]);
                    $tagId = (int)$pdo->lastInsertId();
                }

                $insertArticleTag = $pdo->prepare("INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)");
                $insertArticleTag->execute([$id, $tagId]);
            }
        }

        $pdo->commit();
        jsonResponse(true, null, "Cập nhật bài viết và thẻ tag thành công");
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonResponse(false, null, "Lỗi cập nhật bài viết: " . $e->getMessage());
    }
}

// ==============================================================================
// NGHIỆP VỤ 3: DELETE - XÓA VĨNH VIỄN BÀI VIẾT & DỌN DẸP TỆP TIN VẬT LÝ LIÊN QUAN
// ==============================================================================
if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = $input['id'] ?? null;
    if (!$id) jsonResponse(false, null, "Thiếu id bài viết");

    // Lấy thông tin bài viết để xóa các file ảnh vật lý liên quan (ảnh bìa + ảnh minh họa trong bài)
    $stmtFind = $pdo->prepare("SELECT cover_image, content FROM articles WHERE id = ?");
    $stmtFind->execute([$id]);
    $article = $stmtFind->fetch(PDO::FETCH_ASSOC);

    if ($article) {
        // 1. Xóa ảnh bìa (cover_image)
        if (!empty($article['cover_image'])) {
            deleteUploadedFile($article['cover_image']);
        }

        // 2. Quét và xóa các ảnh minh họa chèn trong nội dung bài viết
        if (!empty($article['content'])) {
            preg_match_all('/src=["\']([^"\']+)["\']/i', $article['content'], $matches);
            if (!empty($matches[1])) {
                foreach ($matches[1] as $imgSrc) {
                    // Nếu là ảnh upload cục bộ của hệ thống
                    if (strpos($imgSrc, 'backend/api/upload/') !== false) {
                        // Chuẩn hóa lấy đúng đường dẫn bắt đầu từ backend/api/upload/...
                        $pos = strpos($imgSrc, 'backend/api/upload/');
                        $cleanImgPath = substr($imgSrc, $pos);
                        deleteUploadedFile($cleanImgPath);
                    }
                }
            }
        }
    }

    // Nhờ đã khai báo ON DELETE CASCADE trong database, xóa articles sẽ tự xóa luôn
    // comments, article_tags, favorites liên quan - không cần code PHP dọn từng bảng
    $stmt = $pdo->prepare("DELETE FROM articles WHERE id = ?");
    $stmt->execute([$id]);
    jsonResponse(true, null, "Đã xóa vĩnh viễn bài viết và các tệp ảnh liên quan");
}
