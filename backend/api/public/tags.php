<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/public/tags.php
 * PHÂN HỆ: API Thẻ Tag Công khai (Public Tags Service)
 * MÔ TẢ: Lấy danh sách các thẻ tag bài viết, kèm số lượng bài viết tương ứng đã gắn tag.
 *        Hỗ trợ lấy top 15 tag nổi bật (featured).
 * PHẠM VI SỬ DỤNG:
 *   - [API CÔNG KHAI]
 *   - Phương thức: GET
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/home.js (Hiển thị mây thẻ tag / chủ đề thịnh hành trên trang chủ)
 *   - frontend/assets/js/search.js (Hiển thị gợi ý các tag phổ biến khi tìm kiếm)
 * THAM SỐ TRUY VẤN (QUERY PARAMS):
 *   - featured: (bool/1) Lấy top 15 tag có nhiều bài viết nhất
 * TRẢ VỀ (JSON):
 *   - { success: true, data: [ { id, name, slug, created_at, article_count } ] }
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
// KHỐI 2: TIẾP NHẬN BỘ LỌC NỔI BẬT
// ==============================================================================
$isFeatured = isset($_GET['featured']) && ($_GET['featured'] == '1' || $_GET['featured'] === 'true');

// ==============================================================================
// KHỐI 3: TRUY VẤN TÍNH TOÁN SỐ BÀI VIẾT THEO TỪNG THẺ TAG
// ==============================================================================
try {
    $sql = "
        SELECT t.id, t.name, t.slug, t.created_at,
               COUNT(at.article_id) AS article_count
        FROM tags t
        LEFT JOIN article_tags at ON t.id = at.tag_id
        GROUP BY t.id, t.name, t.slug, t.created_at
        ORDER BY article_count DESC, t.name ASC
    ";

    if ($isFeatured) {
        $sql .= " LIMIT 15";
    }

    $stmt = $pdo->query($sql);
    $tags = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($tags as &$tag) {
        $tag['article_count'] = (int)$tag['article_count'];
    }
    unset($tag);

    // ==============================================================================
    // KHỐI 4: PHẢN HỒI KẾT QUẢ CHO CLIENT
    // ==============================================================================
    jsonResponse(true, $tags);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}

