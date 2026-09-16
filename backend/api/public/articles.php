<?php
/*
==============================================================================
TÊN FILE: backend/api/public/articles.php
PHÂN HỆ: Bài viết công khai
MÔ TẢ: Lấy danh sách bài viết đã xuất bản cho trang chủ, chuyên mục, tìm kiếm,
       lọc theo thẻ tag và top bài đọc nhiều nhất tuần
PHẠM VI SỬ DỤNG:
       - Phương thức: GET
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
==============================================================================
*/

require_once '../../config/database.php';
require_once '../../helpers/response.php';

// Kiểm tra phương thức request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// Tiếp nhận tham số tìm kiếm, lọc và phân trang
$categorySlug = isset($_GET['category']) ? trim($_GET['category']) : '';
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$tagSlug = isset($_GET['tag']) ? trim($_GET['tag']) : '';
$topWeekly = isset($_GET['top_weekly']) && ($_GET['top_weekly'] == '1' || $_GET['top_weekly'] === 'true');
$isPaginated = isset($_GET['page']);

// Xây dựng câu truy vấn SQL động
try {
    $whereSql = " WHERE a.status = 'published'";
    $params = [];

    // Lọc 5 bài đọc nhiều nhất trong 7 ngày qua
    if ($topWeekly) {
        $whereSql .= " AND a.published_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $orderBy = " ORDER BY a.view_count DESC, a.published_at DESC LIMIT 5";
    } else {
        // Lọc theo chuyên mục
        if ($categorySlug !== '') {
            $whereSql .= " AND c.slug = ?";
            $params[] = $categorySlug;
        }

        // Lọc theo thẻ tag
        if ($tagSlug !== '') {
            $whereSql .= " AND a.id IN (
                SELECT at.article_id FROM article_tags at 
                JOIN tags t ON at.tag_id = t.id 
                WHERE t.slug = ?
            )";
            $params[] = $tagSlug;
        }

        // Tìm kiếm theo từ khóa
        if ($search !== '') {
            $whereSql .= " AND (a.title LIKE ? OR a.short_description LIKE ? OR a.content LIKE ?)";
            $likeTerm = '%' . $search . '%';
            $params[] = $likeTerm;
            $params[] = $likeTerm;
            $params[] = $likeTerm;
        }

        $orderBy = " ORDER BY a.published_at DESC";
    }

    // Xử lý tính toán phân trang nếu có
    $totalRecords = 0;
    $page = 1;
    $limit = 9;
    if ($isPaginated && !$topWeekly) {
        $countSql = "SELECT COUNT(DISTINCT a.id) FROM articles a
                     LEFT JOIN categories c ON c.id = a.category_id" . $whereSql;
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($params);
        $totalRecords = (int)$countStmt->fetchColumn();

        list($page, $limit, $offset) = getPaginationParams(9, 50);
        $orderBy .= " LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
    }

    $sql = "SELECT
                a.id, a.title, a.slug, a.short_description, a.cover_image,
                a.author_id, a.category_id, a.is_notable_event, a.status,
                a.view_count, a.published_at, a.created_at, a.updated_at,
                c.name AS category_name, c.slug AS category_slug,
                u.username AS author_username, u.full_name AS author_full_name, u.avatar AS author_avatar
            FROM articles a
            LEFT JOIN categories c ON c.id = a.category_id
            LEFT JOIN users u ON u.id = a.author_id"
            . $whereSql
            . $orderBy;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Lấy danh sách thẻ tag cho các bài viết tìm được
    $articleIds = array_column($rows, 'id');
    $tagsByArticle = [];
    if (!empty($articleIds)) {
        $inPlaceholders = implode(',', array_fill(0, count($articleIds), '?'));
        $tagStmt = $pdo->prepare("
            SELECT at.article_id, t.id, t.name, t.slug 
            FROM article_tags at 
            JOIN tags t ON at.tag_id = t.id 
            WHERE at.article_id IN ($inPlaceholders)
        ");
        $tagStmt->execute($articleIds);
        while ($t = $tagStmt->fetch(PDO::FETCH_ASSOC)) {
            $tagsByArticle[$t['article_id']][] = [
                'id' => (int)$t['id'],
                'name' => $t['name'],
                'slug' => $t['slug']
            ];
        }
    }

    // Gắn tag vào từng bài viết và trả kết quả
    $articles = array_map(function($row) use ($tagsByArticle) {
        $mapped = mapArticleRow($row);
        $mapped['tags'] = $tagsByArticle[$row['id']] ?? [];
        return $mapped;
    }, $rows);

    if ($isPaginated && !$topWeekly) {
        jsonPaginatedResponse(true, $articles, $totalRecords, $page, $limit);
    } else {
        jsonResponse(true, $articles);
    }
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}

// Chuẩn hóa dữ liệu một bản ghi bài viết từ CSDL
function mapArticleRow($row)
{
    return [
        "id" => (int) $row['id'],
        "title" => $row['title'],
        "slug" => $row['slug'],
        "short_description" => $row['short_description'],
        "cover_image" => (!empty($row['cover_image']) && strpos($row['cover_image'], 'placeholder') === false) ? $row['cover_image'] : null,
        "author_id" => $row['author_id'] !== null ? (int) $row['author_id'] : null,
        "category_id" => $row['category_id'] !== null ? (int) $row['category_id'] : null,
        "is_notable_event" => (bool) $row['is_notable_event'],
        "status" => $row['status'],
        "view_count" => (int) $row['view_count'],
        "published_at" => $row['published_at'],
        "created_at" => $row['created_at'],
        "updated_at" => $row['updated_at'],
        "category" => [
            "id" => $row['category_id'] !== null ? (int) $row['category_id'] : null,
            "name" => $row['category_name'],
            "slug" => $row['category_slug'],
        ],
        "author" => [
            "id" => $row['author_id'] !== null ? (int) $row['author_id'] : null,
            "username" => $row['author_username'],
            "full_name" => $row['author_full_name'],
            "avatar" => $row['author_avatar'],
        ],
    ];
}

