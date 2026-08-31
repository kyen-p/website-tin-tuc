<?php
require_once '../../config/database.php';
require_once '../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// Specification chính là "id", nhưng trang author.html hiện tại điều hướng bằng
// ?username=... (getAuthorProfileUrl). Để không phá vỡ đường dẫn đang dùng,
// API chấp nhận đồng thời "id" (số) hoặc "username".
$idParam = isset($_GET['id']) ? trim($_GET['id']) : '';
$usernameParam = isset($_GET['username']) ? trim($_GET['username']) : '';

if ($idParam === '' && $usernameParam === '') {
    jsonResponse(false, null, "Thiếu id hoặc username tác giả");
}

try {
    if ($usernameParam !== '') {
        $stmt = $pdo->prepare(
            "SELECT id, username, email, full_name, avatar, bio, role, created_at
             FROM users WHERE username = ? LIMIT 1"
        );
        $stmt->execute([$usernameParam]);
    } else {
        if (!ctype_digit($idParam)) {
            jsonResponse(false, null, "ID tác giả không hợp lệ");
        }
        $stmt = $pdo->prepare(
            "SELECT id, username, email, full_name, avatar, bio, role, created_at
             FROM users WHERE id = ? LIMIT 1"
        );
        $stmt->execute([$idParam]);
    }

    $author = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$author) {
        jsonResponse(false, null, "Không tìm thấy tác giả");
    }

    $author['id'] = (int) $author['id'];

    $stmt = $pdo->prepare(
        "SELECT
            a.id, a.title, a.slug, a.short_description, a.cover_image,
            a.category_id, a.view_count, a.published_at, a.created_at,
            c.name AS category_name, c.slug AS category_slug
         FROM articles a
         LEFT JOIN categories c ON c.id = a.category_id
         WHERE a.author_id = ? AND a.status = 'published'
         ORDER BY a.published_at DESC"
    );
    $stmt->execute([$author['id']]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $articles = array_map(function ($row) {
        return [
            "id" => (int) $row['id'],
            "title" => $row['title'],
            "slug" => $row['slug'],
            "short_description" => $row['short_description'],
            "cover_image" => $row['cover_image'],
            "category_id" => $row['category_id'] !== null ? (int) $row['category_id'] : null,
            "view_count" => (int) $row['view_count'],
            "published_at" => $row['published_at'],
            "created_at" => $row['created_at'],
            "category" => [
                "id" => $row['category_id'] !== null ? (int) $row['category_id'] : null,
                "name" => $row['category_name'],
                "slug" => $row['category_slug'],
            ],
        ];
    }, $rows);

    $author['articles'] = $articles;

    jsonResponse(true, $author);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}
