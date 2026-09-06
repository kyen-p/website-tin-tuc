<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

requireRole(['reporter']);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

$userId = (int)$_SESSION['user_id'];

try {
    // 1. Thống kê bài viết theo trạng thái
    $statsStmt = $pdo->prepare("
        SELECT
            COUNT(*) AS total_articles,
            SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_count,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
            SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_count,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count,
            COALESCE(SUM(view_count), 0) AS total_views
        FROM articles
        WHERE author_id = ?
    ");
    $statsStmt->execute([$userId]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    // 2. Danh sách bài viết gần đây của tác giả kèm số bình luận
    $articlesStmt = $pdo->prepare("
        SELECT
            a.id, a.title, a.slug, a.cover_image, a.category_id, a.status,
            a.view_count, a.published_at, a.created_at, a.updated_at, a.rejection_reason,
            c.name AS category_name,
            COUNT(cm.id) AS comment_count
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN comments cm ON cm.article_id = a.id AND cm.is_deleted = 0
        WHERE a.author_id = ?
        GROUP BY a.id, a.title, a.slug, a.cover_image, a.category_id, a.status,
                 a.view_count, a.published_at, a.created_at, a.updated_at, a.rejection_reason,
                 c.name
        ORDER BY a.created_at DESC
    ");
    $articlesStmt->execute([$userId]);
    $articles = $articlesStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Top bài viết xem nhiều nhất
    $topArticlesStmt = $pdo->prepare("
        SELECT id, title, slug, view_count, published_at
        FROM articles
        WHERE author_id = ? AND status = 'published'
        ORDER BY view_count DESC
        LIMIT 5
    ");
    $topArticlesStmt->execute([$userId]);
    $topArticles = $topArticlesStmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(true, [
        'stats' => [
            'total_articles' => (int)($stats['total_articles'] ?? 0),
            'published_count' => (int)($stats['published_count'] ?? 0),
            'pending_count' => (int)($stats['pending_count'] ?? 0),
            'draft_count' => (int)($stats['draft_count'] ?? 0),
            'rejected_count' => (int)($stats['rejected_count'] ?? 0),
            'total_views' => (int)($stats['total_views'] ?? 0),
        ],
        'articles' => $articles,
        'top_articles' => $topArticles
    ], "Lấy dữ liệu bảng điều khiển phóng viên thành công");

} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống: " . $e->getMessage());
}
