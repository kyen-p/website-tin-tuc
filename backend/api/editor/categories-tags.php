<?php
/*
==============================================================================
TÊN FILE: backend/api/editor/categories-tags.php
PHÂN HỆ: Quản lý chuyên mục và thẻ tag
MÔ TẢ: Cung cấp đầy đủ các thao tác quản lý danh mục và thẻ phân loại bài viết:
       - Lấy danh sách chuyên mục hoặc thẻ tag kèm số lượng bài viết liên kết
       - Thêm mới chuyên mục hoặc thẻ tag (tự động tạo slug)
       - Chỉnh sửa tên, slug, mô tả; hỗ trợ gộp thẻ tag trùng lặp
       - Xóa chuyên mục (nếu chưa có bài viết) hoặc xóa thẻ tag
PHẠM VI SỬ DỤNG:
       - Phân quyền: role = 'editor'
       - Phương thức: GET, POST, PUT, DELETE
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

// Chỉ Biên tập viên (editor) mới được quản lý chuyên mục và tag
requireRole(['editor']);

$method = $_SERVER['REQUEST_METHOD'];
$type = $_GET['type'] ?? 'categories';

if ($type !== 'categories' && $type !== 'tags') {
    jsonResponse(false, null, "type phải là categories hoặc tags");
}

// 1. Lấy danh sách chuyên mục hoặc thẻ tag
if ($method === 'GET') {
    try {
        if ($type === 'categories') {
            $sql = "
                SELECT c.id, c.name, c.slug, c.description, c.created_at,
                       COUNT(a.id) AS article_count
                FROM categories c
                LEFT JOIN articles a ON c.id = a.category_id
                GROUP BY c.id, c.name, c.slug, c.description, c.created_at
                ORDER BY c.name ASC
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($categories as &$category) {
                $category['article_count'] = (int)$category['article_count'];
            }
            unset($category);

            jsonResponse(true, $categories, "Lấy danh sách chuyên mục thành công");
        }

        if ($type === 'tags') {
            $sql = "
                SELECT t.id, t.name, t.slug, t.created_at,
                       COUNT(at.article_id) AS article_count
                FROM tags t
                LEFT JOIN article_tags at ON t.id = at.tag_id
                GROUP BY t.id, t.name, t.slug, t.created_at
                ORDER BY t.name ASC
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute();
            $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($tags as &$tag) {
                $tag['article_count'] = (int)$tag['article_count'];
            }
            unset($tag);

            jsonResponse(true, $tags, "Lấy danh sách tag thành công");
        }
    } catch (PDOException $e) {
        jsonResponse(false, null, "Không thể lấy dữ liệu: " . $e->getMessage());
    }
}

// 2. Thêm mới chuyên mục hoặc thẻ tag
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        jsonResponse(false, null, "Dữ liệu gửi lên không hợp lệ");
    }

    $name = trim($input['name'] ?? '');
    $slug = trim($input['slug'] ?? '');
    $description = trim($input['description'] ?? '');

    if ($name === '') {
        jsonResponse(false, null, "Tên không được để trống");
    }

    $slug = $slug === '' ? createSlug($name) : createSlug($slug);

    if ($slug === '') {
        jsonResponse(false, null, "Không thể tạo slug hợp lệ");
    }

    try {
        if ($type === 'categories') {
            $checkName = $pdo->prepare("
                SELECT id FROM categories WHERE name = ? LIMIT 1
            ");
            $checkName->execute([$name]);

            if ($checkName->fetch()) {
                jsonResponse(false, null, "Chuyên mục đã tồn tại");
            }

            $checkSlug = $pdo->prepare("
                SELECT id FROM categories WHERE slug = ? LIMIT 1
            ");
            $checkSlug->execute([$slug]);

            if ($checkSlug->fetch()) {
                jsonResponse(false, null, "Slug chuyên mục đã tồn tại");
            }

            $stmt = $pdo->prepare("
                INSERT INTO categories (name, slug, description, created_at)
                VALUES (?, ?, ?, NOW())
            ");

            $stmt->execute([
                $name,
                $slug,
                $description !== '' ? $description : null
            ]);

            $newId = $pdo->lastInsertId();

            $resultStmt = $pdo->prepare("
                SELECT id, name, slug, description, created_at
                FROM categories WHERE id = ?
            ");
            $resultStmt->execute([$newId]);
            $result = $resultStmt->fetch(PDO::FETCH_ASSOC);

            jsonResponse(true, $result, "Thêm chuyên mục thành công");
        }

        if ($type === 'tags') {
            $checkName = $pdo->prepare("
                SELECT id FROM tags WHERE name = ? LIMIT 1
            ");
            $checkName->execute([$name]);

            if ($checkName->fetch()) {
                jsonResponse(false, null, "Tag đã tồn tại");
            }

            $checkSlug = $pdo->prepare("
                SELECT id FROM tags WHERE slug = ? LIMIT 1
            ");
            $checkSlug->execute([$slug]);

            if ($checkSlug->fetch()) {
                jsonResponse(false, null, "Slug tag đã tồn tại");
            }

            $stmt = $pdo->prepare("
                INSERT INTO tags (name, slug, created_at)
                VALUES (?, ?, NOW())
            ");

            $stmt->execute([$name, $slug]);
            $newId = $pdo->lastInsertId();

            $resultStmt = $pdo->prepare("
                SELECT id, name, slug, created_at
                FROM tags WHERE id = ?
            ");
            $resultStmt->execute([$newId]);
            $result = $resultStmt->fetch(PDO::FETCH_ASSOC);

            jsonResponse(true, $result, "Thêm tag thành công");
        }
    } catch (PDOException $e) {
        jsonResponse(false, null, "Không thể thêm dữ liệu: " . $e->getMessage());
    }
}

// 3. Cập nhật thông tin chuyên mục hoặc thẻ tag (hỗ trợ gộp thẻ tag trùng lặp)
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!is_array($input)) {
        jsonResponse(false, null, "Dữ liệu gửi lên không hợp lệ");
    }

    $id = $input['id'] ?? null;

    if (!$id) {
        jsonResponse(false, null, "Thiếu id");
    }

    $name = trim($input['name'] ?? '');
    $slug = trim($input['slug'] ?? '');
    $description = trim($input['description'] ?? '');

    if ($name === '') {
        jsonResponse(false, null, "Tên không được để trống");
    }

    $slug = $slug === '' ? createSlug($name) : createSlug($slug);

    if ($slug === '') {
        jsonResponse(false, null, "Không thể tạo slug hợp lệ");
    }

    try {
        if ($type === 'categories') {
            $check = $pdo->prepare("
                SELECT id FROM categories WHERE id = ?
            ");
            $check->execute([$id]);

            if (!$check->fetch()) {
                jsonResponse(false, null, "Không tìm thấy chuyên mục");
            }

            $checkName = $pdo->prepare("
                SELECT id FROM categories
                WHERE name = ? AND id <> ? LIMIT 1
            ");
            $checkName->execute([$name, $id]);

            if ($checkName->fetch()) {
                jsonResponse(false, null, "Tên chuyên mục đã tồn tại");
            }

            $checkSlug = $pdo->prepare("
                SELECT id FROM categories
                WHERE slug = ? AND id <> ? LIMIT 1
            ");
            $checkSlug->execute([$slug, $id]);

            if ($checkSlug->fetch()) {
                jsonResponse(false, null, "Slug chuyên mục đã tồn tại");
            }

            $stmt = $pdo->prepare("
                UPDATE categories
                SET name = ?, slug = ?, description = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $name,
                $slug,
                $description !== '' ? $description : null,
                $id
            ]);

            $resultStmt = $pdo->prepare("
                SELECT id, name, slug, description, created_at
                FROM categories WHERE id = ?
            ");
            $resultStmt->execute([$id]);
            $result = $resultStmt->fetch(PDO::FETCH_ASSOC);

            jsonResponse(true, $result, "Cập nhật chuyên mục thành công");
        }

        if ($type === 'tags') {
            $check = $pdo->prepare("
                SELECT id, name FROM tags WHERE id = ?
            ");
            $check->execute([$id]);
            $currentTag = $check->fetch(PDO::FETCH_ASSOC);

            if (!$currentTag) {
                jsonResponse(false, null, "Không tìm thấy tag");
            }

            // Kiểm tra xem tên tag mới (hoặc slug mới) đã trùng với một tag khác có sẵn chưa
            $checkTarget = $pdo->prepare("
                SELECT id, name, slug FROM tags
                WHERE (name = ? OR slug = ?) AND id <> ?
                LIMIT 1
            ");
            $checkTarget->execute([$name, $slug, $id]);
            $targetTag = $checkTarget->fetch(PDO::FETCH_ASSOC);

            // =========================================================================
            // TRƯỜNG HỢP 3.1: TÊN / SLUG ĐÃ TỒN TẠI -> THỰC HIỆN GỘP THẺ TAG THÔNG MINH
            // =========================================================================
            if ($targetTag) {
                $targetId = (int)$targetTag['id'];
                $targetName = $targetTag['name'];

                $pdo->beginTransaction();
                try {
                    // 1. Chuyển toàn bộ liên kết bài viết từ tag hiện tại ($id) sang tag đích ($targetId)
                    // Dùng INSERT IGNORE để nếu bài viết đã có sẵn cả 2 tag thì không bị lỗi trùng lặp khóa chính
                    $stmtMove = $pdo->prepare("
                        INSERT IGNORE INTO article_tags (article_id, tag_id)
                        SELECT article_id, ?
                        FROM article_tags
                        WHERE tag_id = ?
                    ");
                    $stmtMove->execute([$targetId, $id]);

                    // 2. Xóa các bản ghi liên kết cũ của tag nguồn
                    $stmtClean = $pdo->prepare("DELETE FROM article_tags WHERE tag_id = ?");
                    $stmtClean->execute([$id]);

                    // 3. Xóa tag nguồn khỏi bảng tags
                    $stmtDelete = $pdo->prepare("DELETE FROM tags WHERE id = ?");
                    $stmtDelete->execute([$id]);

                    $pdo->commit();

                    jsonResponse(true, [
                        'merged' => true,
                        'source_id' => $id,
                        'target_id' => $targetId,
                        'target_name' => $targetName
                    ], "Đã gộp thẻ tag thành công vào thẻ '#{$targetName}'!");
                } catch (Exception $e) {
                    $pdo->rollBack();
                    jsonResponse(false, null, "Không thể gộp thẻ tag: " . $e->getMessage());
                }
            }

            // =========================================================================
            // TRƯỜNG HỢP 3.2: TÊN TAG MỚI HOÀN TOÀN -> CẬP NHẬT TÊN VÀ SLUG BÌNH THƯỜNG
            // =========================================================================
            $stmt = $pdo->prepare("
                UPDATE tags
                SET name = ?, slug = ?
                WHERE id = ?
            ");

            $stmt->execute([$name, $slug, $id]);

            $resultStmt = $pdo->prepare("
                SELECT id, name, slug, created_at
                FROM tags WHERE id = ?
            ");
            $resultStmt->execute([$id]);
            $result = $resultStmt->fetch(PDO::FETCH_ASSOC);

            jsonResponse(true, $result, "Cập nhật tag thành công");
        }
    } catch (PDOException $e) {
        jsonResponse(false, null, "Không thể cập nhật dữ liệu: " . $e->getMessage());
    }
}

// 4. Xóa chuyên mục hoặc thẻ tag
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        $input = json_decode(file_get_contents('php://input'), true);

        if (is_array($input)) {
            $id = $input['id'] ?? null;
        }
    }

    if (!$id) {
        jsonResponse(false, null, "Thiếu id cần xóa");
    }

    try {
        if ($type === 'categories') {
            $check = $pdo->prepare("
                SELECT id FROM categories WHERE id = ?
            ");
            $check->execute([$id]);

            if (!$check->fetch()) {
                jsonResponse(false, null, "Không tìm thấy chuyên mục");
            }

            $articleCheck = $pdo->prepare("
                SELECT COUNT(*) AS total
                FROM articles WHERE category_id = ?
            ");
            $articleCheck->execute([$id]);
            $articleCount = (int)$articleCheck->fetchColumn();

            if ($articleCount > 0) {
                jsonResponse(
                    false,
                    null,
                    "Không thể xóa chuyên mục vì đang có "
                    . $articleCount . " bài viết sử dụng"
                );
            }

            $stmt = $pdo->prepare("
                DELETE FROM categories WHERE id = ?
            ");
            $stmt->execute([$id]);

            jsonResponse(true, null, "Xóa chuyên mục thành công");
        }

        if ($type === 'tags') {
            $check = $pdo->prepare("
                SELECT id FROM tags WHERE id = ?
            ");
            $check->execute([$id]);

            if (!$check->fetch()) {
                jsonResponse(false, null, "Không tìm thấy tag");
            }

            $linkStmt = $pdo->prepare("
                DELETE FROM article_tags WHERE tag_id = ?
            ");
            $linkStmt->execute([$id]);

            $stmt = $pdo->prepare("
                DELETE FROM tags WHERE id = ?
            ");
            $stmt->execute([$id]);

            jsonResponse(true, null, "Xóa tag thành công");
        }
    } catch (PDOException $e) {
        jsonResponse(false, null, "Không thể xóa dữ liệu: " . $e->getMessage());
    }
}

// Phản hồi khi client gọi sai phương thức HTTP
jsonResponse(false, null, "Phương thức HTTP không được hỗ trợ");



