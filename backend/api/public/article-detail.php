<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// Specification chính là "id", nhưng frontend hiện tại điều hướng chi tiết bài viết
// bằng slug (getArticleDetailUrl -> article-detail.html?slug=...). Để không phá vỡ
// đường dẫn đang dùng, API chấp nhận đồng thời "id" (số) hoặc "slug".
$idParam = isset($_GET['id']) ? trim($_GET['id']) : '';
$slugParam = isset($_GET['slug']) ? trim($_GET['slug']) : '';

if ($idParam === '' && $slugParam === '') {
    jsonResponse(false, null, "Thiếu id hoặc slug bài viết");
}

try {
    if ($slugParam !== '') {
        $stmt = $pdo->prepare("SELECT id, author_id FROM articles WHERE slug = ? AND status = 'published' LIMIT 1");
        $stmt->execute([$slugParam]);
    } else {
        if (!ctype_digit($idParam)) {
            jsonResponse(false, null, "ID bài viết không hợp lệ");
        }
        $stmt = $pdo->prepare("SELECT id, author_id FROM articles WHERE id = ? AND status = 'published' LIMIT 1");
        $stmt->execute([$idParam]);
    }

    $found = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$found) {
        jsonResponse(false, null, "Không tìm thấy bài viết");
    }

    $articleId = (int) $found['id'];
    $authorId = $found['author_id'] !== null ? (int) $found['author_id'] : null;

    // Khởi tạo phiên làm việc (Session) để theo dõi các bài viết đã đọc
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!isset($_SESSION['viewed_articles']) || !is_array($_SESSION['viewed_articles'])) {
        $_SESSION['viewed_articles'] = [];
    }

    // Kiểm tra nếu người đang xem là chính tác giả bài viết (chống tác giả tự tăng view bài mình)
    $isAuthor = isset($_SESSION['user_id']) && $authorId !== null && ((int) $_SESSION['user_id'] === $authorId);

    // Chỉ tăng lượt xem vào CSDL nếu người đọc chưa từng xem bài này trong phiên làm việc hiện tại
    // Chống spam khi F5 / reload lại trang cho cả khách (guest) và thành viên (user)
    if (!in_array($articleId, $_SESSION['viewed_articles'], true)) {
        if (!$isAuthor) {
            $updateStmt = $pdo->prepare("UPDATE articles SET view_count = view_count + 1 WHERE id = ?");
            $updateStmt->execute([$articleId]);
        }
        $_SESSION['viewed_articles'][] = $articleId;
    }

    $stmt = $pdo->prepare(
        "SELECT
            a.id, a.title, a.slug, a.short_description, a.content, a.cover_image,
            a.author_id, a.category_id, a.is_notable_event, a.status,
            a.view_count, a.published_at, a.created_at, a.updated_at,
            c.name AS category_name, c.slug AS category_slug,
            u.id AS author_uid, u.username AS author_username, u.full_name AS author_full_name,
            u.avatar AS author_avatar, u.bio AS author_bio, u.role AS author_role
         FROM articles a
         LEFT JOIN categories c ON c.id = a.category_id
         LEFT JOIN users u ON u.id = a.author_id
         WHERE a.id = ?
         LIMIT 1"
    );
    $stmt->execute([$articleId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $article = [
        "id" => (int) $row['id'],
        "title" => $row['title'],
        "slug" => $row['slug'],
        "short_description" => $row['short_description'],
        "content" => $row['content'],
        "cover_image" => $row['cover_image'],
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
            "id" => $row['author_uid'] !== null ? (int) $row['author_uid'] : null,
            "username" => $row['author_username'],
            "full_name" => $row['author_full_name'],
            "avatar" => $row['author_avatar'],
            "bio" => $row['author_bio'],
            "role" => $row['author_role'],
        ],
    ];

    $tagStmt = $pdo->prepare("
        SELECT t.id, t.name, t.slug 
        FROM article_tags at 
        JOIN tags t ON at.tag_id = t.id 
        WHERE at.article_id = ?
        ORDER BY t.name ASC
    ");
    $tagStmt->execute([$articleId]);
    $article['tags'] = $tagStmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(true, $article);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}
