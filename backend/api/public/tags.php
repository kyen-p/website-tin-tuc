<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

$isFeatured = isset($_GET['featured']) && ($_GET['featured'] == '1' || $_GET['featured'] === 'true');

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

    jsonResponse(true, $tags);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}
