<?php
/*
==============================================================================
TÊN FILE: backend/api/editor/dashboard.php
PHÂN HỆ: Bảng điều khiển biên tập viên
MÔ TẢ: Phân tích và thống kê bài viết theo chuyên mục, hiệu suất phóng viên và tag
PHẠM VI SỬ DỤNG:
       - Phân quyền: role = 'editor'
       - Phương thức: GET
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
       - helpers/auth.php
==============================================================================
*/

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Chỉ Biên tập viên (editor) mới được truy cập
requireRole(['editor']);

// Kiểm tra phương thức request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

try {
    // Thống kê bài viết xuất bản và lượt xem theo từng chuyên mục
    $catStmt = $pdo->query("
        SELECT c.id, c.name, c.slug,
               COUNT(CASE WHEN a.status = 'published' THEN a.id END) AS articleCount,
               COALESCE(SUM(CASE WHEN a.status = 'published' THEN a.view_count ELSE 0 END), 0) AS totalViews
        FROM categories c
        LEFT JOIN articles a ON c.id = a.category_id
        GROUP BY c.id, c.name, c.slug
        ORDER BY articleCount DESC, c.name ASC
    ");
    $catStats = $catStmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($catStats as &$cat) {
        $cat['articleCount'] = (int)$cat['articleCount'];
        $cat['totalViews'] = (int)$cat['totalViews'];
    }
    unset($cat);

    // Thống kê bài viết và hiệu suất của phóng viên
    $repStmt = $pdo->query("
        SELECT u.id, u.full_name AS name, u.username, u.email,
               COUNT(CASE WHEN a.status = 'published' THEN a.id END) AS publishedCount,
               COUNT(CASE WHEN a.status = 'pending' THEN a.id END) AS pendingCount,
               COALESCE(SUM(CASE WHEN a.status = 'published' THEN a.view_count ELSE 0 END), 0) AS totalViews
        FROM users u
        LEFT JOIN articles a ON u.id = a.author_id
        WHERE u.role = 'reporter'
        GROUP BY u.id, u.full_name, u.username, u.email
        ORDER BY publishedCount DESC, totalViews DESC
    ");
    $reporterStats = $repStmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($reporterStats as &$rep) {
        $rep['publishedCount'] = (int)$rep['publishedCount'];
        $rep['pendingCount'] = (int)$rep['pendingCount'];
        $rep['totalViews'] = (int)$rep['totalViews'];
    }
    unset($rep);

    // Top 10 thẻ tag được gắn nhiều nhất
    $tagStmt = $pdo->query("
        SELECT t.id, t.name, t.slug,
               COUNT(at.article_id) AS count
        FROM tags t
        INNER JOIN article_tags at ON t.id = at.tag_id
        INNER JOIN articles a ON at.article_id = a.id AND a.status = 'published'
        GROUP BY t.id, t.name, t.slug
        ORDER BY count DESC
        LIMIT 10
    ");
    $topTagsStats = $tagStmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($topTagsStats as &$tag) {
        $tag['count'] = (int)$tag['count'];
    }
    unset($tag);

    jsonResponse(true, [
        'category_stats' => $catStats,
        'reporter_stats' => $reporterStats,
        'top_tags' => $topTagsStats
    ], "Lấy số liệu thống kê Dashboard Biên tập viên thành công");

} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống: " . $e->getMessage());
}


