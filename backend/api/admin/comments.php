<?php
/*
==============================================================================
TÊN FILE: backend/api/admin/comments.php
PHÂN HỆ: Quản trị bình luận
MÔ TẢ: Quản lý và kiểm duyệt bình luận toàn hệ thống:
       - Lấy danh sách bình luận của độc giả kèm thông tin bài viết và người đăng
       - Hỗ trợ phân trang danh sách bình luận
       - Xóa bình luận vi phạm chính sách nội dung
PHẠM VI SỬ DỤNG:
       - Phân quyền: role = 'admin'
       - Phương thức: GET, DELETE
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

$method = $_SERVER['REQUEST_METHOD'];

// 1. Lấy danh sách bình luận toàn hệ thống (hỗ trợ phân trang)
if ($method === 'GET') {
    $isPaginated = isset($_GET['page']) || isset($_GET['limit']);

    $baseSql = "SELECT c.*, u.full_name, u.username, u.avatar, a.title AS article_title, a.slug AS article_slug 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                JOIN articles a ON c.article_id = a.id 
                ORDER BY c.created_at DESC";

    if ($isPaginated) {
        list($page, $limit, $offset) = getPaginationParams(10, 50);

        $countStmt = $pdo->query("SELECT COUNT(*) FROM comments");
        $totalRecords = (int)$countStmt->fetchColumn();

        $stmt = $pdo->prepare($baseSql . " LIMIT ? OFFSET ?");
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonPaginatedResponse(true, $comments, $totalRecords, $page, $limit);
    } else {
        $stmt = $pdo->query($baseSql);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse(true, $comments);
    }
}

// 2. Xóa bình luận vi phạm khỏi cơ sở dữ liệu
if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['comment_id'])) {
        jsonResponse(false, null, "Thiếu ID bình luận");
    }
    $stmt = $pdo->prepare("DELETE FROM comments WHERE id = ?");
    $stmt->execute([(int)$input['comment_id']]);
    jsonResponse(true, null, "Đã xóa vĩnh viễn bình luận thành công");
}

