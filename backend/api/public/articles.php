<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/public/articles.php
 * PHÂN HỆ: API Bài viết Công khai (Public Articles Service)
 * MÔ TẢ: Lấy danh sách bài viết đã xuất bản (status = 'published') phục vụ trang chủ,
 *        chuyên mục, tìm kiếm từ khóa, bài viết theo tag và top bài đọc nhiều nhất tuần.
 * PHẠM VI SỬ DỤNG:
 *   - [API CÔNG KHAI]
 *   - Phương thức: GET
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/home.js (Tải tin tiêu điểm, tin mới nhất, tin theo danh mục, top tuần)
 *   - frontend/assets/js/category.js (Lọc bài viết theo danh mục slug)
 *   - frontend/assets/js/search.js (Tìm kiếm bài viết theo từ khóa và theo tag)
 * THAM SỐ TRUY VẤN (QUERY PARAMS):
 *   - category: (string) Slug của chuyên mục cần lọc
 *   - tag: (string) Slug của tag bài viết cần lọc
 *   - search: (string) Từ khóa tìm kiếm trong tiêu đề, mô tả ngắn hoặc nội dung
 *   - top_weekly: (bool/1) Lấy 5 bài viết được xem nhiều nhất trong 7 ngày gần đây
 * TRẢ VỀ (JSON):
 *   - { success: true, data: [ { id, title, slug, short_description, cover_image, ... tags: [...] } ] }
 * ==============================================================================
 */

require_once '../../config/database.php';
require_once '../../helpers/response.php';

// ==============================================================================
// KHỐI 1: KIỂM TRA PHƯƠNG THỨC HTTP
// ==============================================================================
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// ==============================================================================
// KHỐI 2: TIẾP NHẬN BỘ LỌC TÌM KIẾM
// ==============================================================================
$categorySlug = isset($_GET['category']) ? trim($_GET['category']) : '';
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$tagSlug = isset($_GET['tag']) ? trim($_GET['tag']) : '';
$topWeekly = isset($_GET['top_weekly']) && ($_GET['top_weekly'] == '1' || $_GET['top_weekly'] === 'true');

// ==============================================================================
// KHỐI 3: XÂY DỰNG TRUY VẤN SQL ĐỘNG THEO TIÊU CHÍ LỌC
// ==============================================================================
try {
    $sql = "SELECT
                a.id, a.title, a.slug, a.short_description, a.cover_image,
                a.author_id, a.category_id, a.is_notable_event, a.status,
                a.view_count, a.published_at, a.created_at, a.updated_at,
                c.name AS category_name, c.slug AS category_slug,
                u.username AS author_username, u.full_name AS author_full_name, u.avatar AS author_avatar
            FROM articles a
            LEFT JOIN categories c ON c.id = a.category_id
            LEFT JOIN users u ON u.id = a.author_id
            WHERE a.status = 'published'";

    $params = [];

    // Bộ lọc: Top 5 bài viết đọc nhiều nhất trong vòng 7 ngày gần nhất
    if ($topWeekly) {
        $sql .= " AND a.published_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $sql .= " ORDER BY a.view_count DESC, a.published_at DESC LIMIT 5";
    } else {
        // Bộ lọc theo chuyên mục
        if ($categorySlug !== '') {
            $sql .= " AND c.slug = ?";
            $params[] = $categorySlug;
        }

        // Bộ lọc theo thẻ tag
        if ($tagSlug !== '') {
            $sql .= " AND a.id IN (
                SELECT at.article_id FROM article_tags at 
                JOIN tags t ON at.tag_id = t.id 
                WHERE t.slug = ?
            )";
            $params[] = $tagSlug;
        }

        // Bộ lọc tìm kiếm toàn văn
        if ($search !== '') {
            $sql .= " AND (a.title LIKE ? OR a.short_description LIKE ? OR a.content LIKE ?)";
            $likeTerm = '%' . $search . '%';
            $params[] = $likeTerm;
            $params[] = $likeTerm;
            $params[] = $likeTerm;
        }

        $sql .= " ORDER BY a.published_at DESC";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ==============================================================================
    // KHỐI 4: KẾT NỐI DANH SÁCH THẺ TAG CHO TỪNG BÀI VIẾT
    // ==============================================================================
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

    // ==============================================================================
    // KHỐI 5: ĐÓNG GÓI CẤU TRÚC PHẢN HỒI VÀ TRẢ DỮ LIỆU
    // ==============================================================================
    $articles = array_map(function($row) use ($tagsByArticle) {
        $mapped = mapArticleRow($row);
        $mapped['tags'] = $tagsByArticle[$row['id']] ?? [];
        return $mapped;
    }, $rows);

    jsonResponse(true, $articles);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}

/**
 * [HÀM NỘI BỘ] mapArticleRow
 * - Chức năng: Định hình cấu trúc dữ liệu của 1 bài viết chuẩn hóa (ép kiểu số, đóng gói lồng đối tượng category, author).
 * - Phạm vi: Sử dụng nội bộ trong file backend/api/public/articles.php.
 * 
 * @param array $row Dữ liệu bản ghi thô từ MySQL
 * @return array Mảng dữ liệu đã chuẩn hóa
 */
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

