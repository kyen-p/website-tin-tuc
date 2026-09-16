<?php
/*
==============================================================================
TÊN FILE: backend/api/public/categories.php
PHÂN HỆ: Chuyên mục công khai
MÔ TẢ: Lấy danh sách chuyên mục tin tức hoặc thông tin chi tiết một chuyên mục
PHẠM VI SỬ DỤNG:
       - Phương thức: GET
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
==============================================================================
*/

require_once '../../config/database.php';
require_once '../../helpers/response.php';

// Kiểm tra phương thức request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// Tiếp nhận tham số slug (nếu có)
$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';

// Truy vấn danh sách chuyên mục
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

