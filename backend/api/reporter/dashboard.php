<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/reporter/dashboard.php
 * PHÂN HỆ: API Bảng điều khiển Phóng viên (Reporter Dashboard Service)
 * MÔ TẢ: Cung cấp số liệu thống kê hoạt động báo chí của riêng phóng viên:
 *        - Thống kê số lượng bài theo trạng thái (đã xuất bản, chờ duyệt, nháp, từ chối).
 *        - Tổng lượt xem tích lũy và tổng số lượt độc giả yêu thích các bài viết của phóng viên.
 *        - Danh sách bài viết gần đây kèm số bình luận & lượt yêu thích.
 *        - Top 5 bài viết có lượt xem cao nhất của phóng viên.
 * PHẠM VI SỬ DỤNG:
 *   - [KHU VỰC TÒA SOẠN - PHÓNG VIÊN]
 *   - Phân quyền: role = 'reporter'
 *   - Phương thức: GET
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 *   - backend/helpers/auth.php (requireRole, $_SESSION['user_id'])
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/reporter-dashboard.js (Hiển thị trang dashboard của phóng viên)
 * TRẢ VỀ (JSON):
 *   - { success: true, data: { stats: {...}, articles: [...], top_articles: [...] } }
 * ==============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Kiểm tra quyền hạn: Chỉ phóng viên (reporter) mới được truy cập
requireRole(['reporter']);

// ==============================================================================
// KHỐI 1: KIỂM TRA PHƯƠNG THỨC HTTP
// ==============================================================================
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

$userId = (int)$_SESSION['user_id'];

try {
    // ==============================================================================
    // KHỐI 2: THỐNG KÊ SỐ LIỆU BÀI VIẾT, LƯỢT XEM VÀ LƯỢT LƯU YÊU THÍCH
    // ==============================================================================
    $statsStmt = $pdo->prepare("
        SELECT
            COUNT(*) AS total_articles,
            SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_count,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
            SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_count,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
            COALESCE(SUM(view_count), 0) AS total_views,
            (SELECT COUNT(*) 
             FROM favorites fav 
             JOIN articles art ON fav.article_id = art.id 
             WHERE art.author_id = ? AND art.status = 'published') AS total_favorites
        FROM articles
        WHERE author_id = ?
    ");
    $statsStmt->execute([$userId, $userId]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    // ==============================================================================
    // KHỐI 3: TRUY VẤN DANH SÁCH BÀI VIẾT GẦN ĐÂY CỦA TÁC GIẢ KÈM SỐ BÌNH LUẬN & YÊU THÍCH
    // ==============================================================================
    $articlesStmt = $pdo->prepare("
        SELECT
            a.id, a.title, a.slug, a.cover_image, a.category_id, a.status,
            a.view_count, a.published_at, a.created_at, a.updated_at, a.rejection_reason,
            c.name AS category_name,
            (SELECT COUNT(*) FROM comments cm WHERE cm.article_id = a.id) AS comment_count,
            (SELECT COUNT(*) FROM favorites fav WHERE fav.article_id = a.id) AS favorite_count
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.author_id = ?
        ORDER BY a.created_at DESC
    ");
    $articlesStmt->execute([$userId]);
    $articles = $articlesStmt->fetchAll(PDO::FETCH_ASSOC);

    // ==============================================================================
    // KHỐI 4: TRUY VẤN TOP 5 BÀI VIẾT CÓ LƯỢT ĐỌC CAO NHẤT CỦA PHÓNG VIÊN
    // ==============================================================================
    $topArticlesStmt = $pdo->prepare("
        SELECT id, title, slug, view_count, published_at
        FROM articles
        WHERE author_id = ? AND status = 'published'
        ORDER BY view_count DESC
        LIMIT 5
    ");
    $topArticlesStmt->execute([$userId]);
    $topArticles = $topArticlesStmt->fetchAll(PDO::FETCH_ASSOC);

    // ==============================================================================
    // KHỐI 5: PHẢN HỒI KẾT QUẢ CHO CLIENT
    // ==============================================================================
    jsonResponse(true, [
        'stats' => [
            'total_articles' => (int)($stats['total_articles'] ?? 0),
            'published_count' => (int)($stats['published_count'] ?? 0),
            'pending_count' => (int)($stats['pending_count'] ?? 0),
            'draft_count' => (int)($stats['draft_count'] ?? 0),
            'rejected_count' => (int)($stats['rejected_count'] ?? 0),
            'total_views' => (int)($stats['total_views'] ?? 0),
            'total_favorites' => (int)($stats['total_favorites'] ?? 0),
        ],
        'articles' => $articles,
        'top_articles' => $topArticles
    ], "Lấy dữ liệu bảng điều khiển phóng viên thành công");

} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống: " . $e->getMessage());
}

