<?php
/*
==============================================================================
TÊN FILE: backend/api/admin/dashboard.php
PHÂN HỆ: Bảng điều khiển quản trị viên
MÔ TẢ: Cung cấp các chỉ số KPI, xu hướng 7 ngày, thị phần chuyên mục và hiệu suất phóng viên
PHẠM VI SỬ DỤNG:
       - Phân quyền: role = 'admin'
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

// Chỉ Quản trị viên (admin) mới được truy cập
requireRole(['admin']);

// Kiểm tra phương thức request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

try {
    // 1. Thống kê tài khoản người dùng theo vai trò
    $userStatsStmt = $pdo->query("
        SELECT 
            COUNT(*) AS total_users,
            SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admin_count,
            SUM(CASE WHEN role = 'editor' THEN 1 ELSE 0 END) AS editor_count,
            SUM(CASE WHEN role = 'reporter' THEN 1 ELSE 0 END) AS reporter_count,
            SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) AS reader_count
        FROM users
    ");
    $userStats = $userStatsStmt->fetch(PDO::FETCH_ASSOC);

    // 2. Thống kê bài viết và lưu lượng lượt xem
    $articleStatsStmt = $pdo->query("
        SELECT 
            COUNT(*) AS total_articles,
            SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_count,
            SUM(CASE WHEN status = 'hidden' THEN 1 ELSE 0 END) AS hidden_count,
            COALESCE(SUM(view_count), 0) AS total_views
        FROM articles
    ");
    $articleStats = $articleStatsStmt->fetch(PDO::FETCH_ASSOC);

    // 3. Thống kê tổng số bình luận toàn hệ thống
    $commentCountStmt = $pdo->query("SELECT COUNT(*) AS total_comments FROM comments");
    $totalComments = (int)$commentCountStmt->fetchColumn();

    $publishedCount = (int)$articleStats['published_count'];
    $hiddenCount = (int)$articleStats['hidden_count'];
    $totalViews = (int)$articleStats['total_views'];
    $avgViews = $publishedCount > 0 ? (int)round($totalViews / $publishedCount) : 0;

    $kpi = [
        'totalUsers' => (int)$userStats['total_users'],
        'adminCount' => (int)$userStats['admin_count'],
        'editorCount' => (int)$userStats['editor_count'],
        'reporterCount' => (int)$userStats['reporter_count'],
        'readerCount' => (int)$userStats['reader_count'],
        'totalViews' => $totalViews,
        'avgViewsPerArticle' => $avgViews,
        'publishedCount' => $publishedCount,
        'hiddenCount' => $hiddenCount,
        'totalPublishedAndHidden' => $publishedCount + $hiddenCount,
        'totalArticles' => (int)$articleStats['total_articles'],
        'totalComments' => $totalComments,
        'activeCommentsCount' => $totalComments
    ];

    // Thống kê xu hướng bài viết và lượt xem trong 7 ngày gần nhất
    $maxDateStmt = $pdo->query("SELECT MAX(published_at) FROM articles WHERE status = 'published'");
    $maxPublished = $maxDateStmt->fetchColumn();
    $baseDate = $maxPublished ? new DateTime($maxPublished) : new DateTime();

    $daysMap = [];
    for ($i = 6; $i >= 0; $i--) {
        $d = clone $baseDate;
        $d->modify("-{$i} days");
        $dateKey = $d->format('Y-m-d');
        $dayLabel = $d->format('j/n');
        $daysMap[$dateKey] = [
            'label' => $dayLabel,
            'articleCount' => 0,
            'viewCount' => 0
        ];
    }

    $minDateBound = (clone $baseDate)->modify('-6 days')->format('Y-m-d 00:00:00');
    $maxDateBound = $baseDate->format('Y-m-d 23:59:59');

    $trendStmt = $pdo->prepare("
        SELECT DATE(published_at) AS pub_date,
               COUNT(*) AS article_count,
               COALESCE(SUM(view_count), 0) AS view_count
        FROM articles
        WHERE status = 'published'
          AND published_at >= ?
          AND published_at <= ?
        GROUP BY DATE(published_at)
    ");
    $trendStmt->execute([$minDateBound, $maxDateBound]);
    while ($row = $trendStmt->fetch(PDO::FETCH_ASSOC)) {
        $pDate = $row['pub_date'];
        if (isset($daysMap[$pDate])) {
            $daysMap[$pDate]['articleCount'] = (int)$row['article_count'];
            $daysMap[$pDate]['viewCount'] = (int)$row['view_count'];
        }
    }

    $trend = [
        'labels' => array_column($daysMap, 'label'),
        'articleCounts' => array_column($daysMap, 'articleCount'),
        'viewCounts' => array_column($daysMap, 'viewCount')
    ];

    // Thống kê số bài theo chuyên mục
    $catStmt = $pdo->query("
        SELECT c.id, c.name,
               COUNT(CASE WHEN a.status = 'published' THEN a.id END) AS count
        FROM categories c
        LEFT JOIN articles a ON c.id = a.category_id
        GROUP BY c.id, c.name
        ORDER BY count DESC, c.name ASC
    ");
    $catRows = $catStmt->fetchAll(PDO::FETCH_ASSOC);

    $categoryShare = [
        'labels' => array_column($catRows, 'name'),
        'counts' => array_map('intval', array_column($catRows, 'count'))
    ];

    // Top 5 bài viết nhiều lượt xem nhất
    $topArticlesStmt = $pdo->query("
        SELECT a.id, a.title, a.slug, a.short_description, a.cover_image, a.view_count, a.published_at,
               c.id AS category_id, c.name AS category_name,
               u.id AS author_id, u.full_name AS author_name, u.username AS author_username
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN users u ON a.author_id = u.id
        WHERE a.status = 'published'
        ORDER BY a.view_count DESC, a.published_at DESC
        LIMIT 5
    ");
    $topArticles = $topArticlesStmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($topArticles as &$art) {
        $art['id'] = (int)$art['id'];
        $art['view_count'] = (int)$art['view_count'];
        $art['category_id'] = $art['category_id'] !== null ? (int)$art['category_id'] : null;
        $art['author_id'] = $art['author_id'] !== null ? (int)$art['author_id'] : null;
    }
    unset($art);

    // Thống kê năng suất và lượt xem theo phóng viên
    $repStmt = $pdo->query("
        SELECT u.id, u.full_name AS name, u.username,
               COUNT(CASE WHEN a.status = 'published' THEN a.id END) AS publishedCount,
               COUNT(CASE WHEN a.status = 'pending' THEN a.id END) AS pendingCount,
               COALESCE(SUM(CASE WHEN a.status = 'published' THEN a.view_count ELSE 0 END), 0) AS totalViews
        FROM users u
        LEFT JOIN articles a ON u.id = a.author_id
        WHERE u.role = 'reporter'
        GROUP BY u.id, u.full_name, u.username
        ORDER BY publishedCount DESC, totalViews DESC
    ");
    $reporterStats = $repStmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($reporterStats as &$rep) {
        $rep['id'] = (int)$rep['id'];
        $rep['publishedCount'] = (int)$rep['publishedCount'];
        $rep['pendingCount'] = (int)$rep['pendingCount'];
        $rep['totalViews'] = (int)$rep['totalViews'];
        if (empty($rep['name'])) {
            $rep['name'] = $rep['username'];
        }
    }
    unset($rep);

    jsonResponse(true, [
        'kpi' => $kpi,
        'trend' => $trend,
        'category_share' => $categoryShare,
        'top_articles' => $topArticles,
        'reporter_stats' => $reporterStats
    ], "Lấy số liệu thống kê Dashboard Quản trị viên thành công");

} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống: " . $e->getMessage());
}

