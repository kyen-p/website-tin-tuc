<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Chỉ Reporter mới được truy cập
requireRole(['reporter']);

// Chỉ cho phép phương thức GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// Lấy ID của Reporter đang đăng nhập
$userId = $_SESSION['user_id'];

try {

    // Lấy tất cả bài viết của Reporter hiện tại
    $stmt = $pdo->prepare("
        SELECT
            a.id,
            a.title,
            a.slug,
            a.short_description,
            a.cover_image,
            a.category_id,
            c.name AS category_name,
            a.status,
            a.rejection_reason,
            a.view_count,
            a.published_at,
            a.created_at,
            a.updated_at
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.author_id = ?
        ORDER BY a.created_at DESC
    ");

    $stmt->execute([$userId]);

    $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse(
        true,
        $articles,
        "Lấy danh sách bài viết thành công"
    );

} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}