<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/editor/dashboard.php
 * PHÂN HỆ: API Bảng điều khiển Biên tập viên (Editor Dashboard Service)
 * MÔ TẢ: Cung cấp các số liệu phân tích tổng quan cho ban biên tập:
 *        - Thống kê bài viết xuất bản và tổng lượt xem theo từng chuyên mục.
 *        - Báo cáo hiệu suất công việc của đội ngũ phóng viên (số bài xuất bản, đang chờ duyệt, lượt xem).
 *        - Top 10 Thẻ Tag được gắn nhiều nhất trong các bài viết đã xuất bản.
 * PHẠM VI SỬ DỤNG:
 *   - [KHU VỰC TÒA SOẠN - BAN BIÊN TẬP]
 *   - Phân quyền: role = 'editor'
 *   - Phương thức: GET
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 *   - backend/helpers/auth.php (requireRole)
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/editor-dashboard.js (Giao diện bảng điều khiển biên tập viên)
 * TRẢ VỀ (JSON):
 *   - { success: true, data: { category_stats: [...], reporter_stats: [...], top_tags: [...] } }
 * ==============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Kiểm tra quyền hạn: Chỉ Biên tập viên (editor) mới được truy cập
requireRole(['editor']);

// ==============================================================================
// KHỐI 1: KIỂM TRA PHƯƠNG THỨC HTTP
// ==============================================================================
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

try {
    // ==============================================================================
    // KHỐI 2: THỐNG KÊ SỐ LƯỢNG BÀI XUẤT BẢN & LƯỢT XEM THEO CHUYÊN MỤC
    // ==============================================================================
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

    // ==============================================================================
    // KHỐI 3: THỐNG KÊ NĂNG SUẤT & HIỆU QUẢ CÔNG TÁC CỦA ĐỘI NGŨ PHÓNG VIÊN
    // ==============================================================================
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

    // ==============================================================================
    // KHỐI 4: TOP 10 THẺ TAG ĐƯỢC GẮN NHIỀU NHẤT TRÊN CÁC BÀI VIẾT ĐÃ XUẤT BẢN
    // ==============================================================================
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

    // ==============================================================================
    // KHỐI 5: PHẢN HỒI KẾT QUẢ CHO CLIENT
    // ==============================================================================
    jsonResponse(true, [
        'category_stats' => $catStats,
        'reporter_stats' => $reporterStats,
        'top_tags' => $topTagsStats
    ], "Lấy số liệu thống kê Dashboard Biên tập viên thành công");

} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống: " . $e->getMessage());
}

