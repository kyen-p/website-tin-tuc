<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

$categorySlug = isset($_GET['category']) ? trim($_GET['category']) : '';
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

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

    if ($categorySlug !== '') {
        $sql .= " AND c.slug = ?";
        $params[] = $categorySlug;
    }

    if ($search !== '') {
        $sql .= " AND (a.title LIKE ? OR a.short_description LIKE ? OR a.content LIKE ?)";
        $likeTerm = '%' . $search . '%';
        $params[] = $likeTerm;
        $params[] = $likeTerm;
        $params[] = $likeTerm;
    }

    $sql .= " ORDER BY a.published_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $articles = array_map('mapArticleRow', $rows);

    jsonResponse(true, $articles);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}

function mapArticleRow($row)
{
    return [
        "id" => (int) $row['id'],
        "title" => $row['title'],
        "slug" => $row['slug'],
        "short_description" => $row['short_description'],
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
            "id" => $row['author_id'] !== null ? (int) $row['author_id'] : null,
            "username" => $row['author_username'],
            "full_name" => $row['author_full_name'],
            "avatar" => $row['author_avatar'],
        ],
    ];
}
