<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';

try {
    if ($slug !== '') {
        $stmt = $pdo->prepare("SELECT id, name, slug, description, created_at FROM categories WHERE slug = ?");
        $stmt->execute([$slug]);
    } else {
        $stmt = $pdo->prepare("SELECT id, name, slug, description, created_at FROM categories ORDER BY name ASC");
        $stmt->execute();
    }

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $categories = array_map(function ($row) {
        return [
            "id" => (int) $row['id'],
            "name" => $row['name'],
            "slug" => $row['slug'],
            "description" => $row['description'],
            "created_at" => $row['created_at'],
        ];
    }, $rows);

    jsonResponse(true, $categories);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}
