<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/admin/comments.php
 * PHÂN HỆ: API Quản trị Bình luận Toàn trang (Global Comments Service)
 * MÔ TẢ: Cung cấp các thao tác kiểm duyệt bình luận cấp cao cho Quản trị viên:
 *        - GET: Lấy danh sách toàn bộ bình luận của độc giả trên tất cả bài viết kèm thông tin người đăng,
 *               tiêu đề và slug bài viết (hỗ trợ Admin điều hướng cuộn lướt chính xác tới vị trí bình luận và chớp sáng viền).
 *        - DELETE: Xóa vĩnh viễn bình luận vi phạm chính sách nội dung khỏi cơ sở dữ liệu.
 * PHẠM VI SỬ DỤNG:
 *   - [KHU VỰC QUẢN TRỊ TỐI CAO - ADMIN]
 *   - Phân quyền: role = 'admin'
 *   - Phương thức: GET, DELETE
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 *   - backend/helpers/auth.php (requireRole)
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/admin-comments.js (Bảng quản trị bình luận)
 * TRẢ VỀ (JSON):
 *   - GET: Danh sách bình luận
 *   - DELETE: Thông báo kết quả xóa
 * ==============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Kiểm tra quyền hạn Quản trị viên cho toàn bộ tệp API
requireRole(['admin']);

$method = $_SERVER['REQUEST_METHOD'];

// ==============================================================================
// NGHIỆP VỤ 1: GET - LẤY TOÀN BỘ BÌNH LUẬN TRONG HỆ THỐNG KÈM BÀI VIẾT & TÁC GIẢ (HỖ TRỢ PHÂN TRANG)
// ==============================================================================
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

// ==============================================================================
// NGHIỆP VỤ 2: DELETE - XÓA BÌNH LUẬN VI PHẠM
// ==============================================================================
if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['comment_id'])) {
        jsonResponse(false, null, "Thiếu ID bình luận");
    }
    $stmt = $pdo->prepare("DELETE FROM comments WHERE id = ?");
    $stmt->execute([(int)$input['comment_id']]);
    jsonResponse(true, null, "Đã xóa vĩnh viễn bình luận thành công");
}
