<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/public/comments.php
 * PHÂN HỆ: API Bình luận Công khai (Public Comments Service)
 * MÔ TẢ: Lấy danh sách tất cả bình luận của một bài viết cụ thể, sắp xếp từ mới đến cũ.
 * PHẠM VI SỬ DỤNG:
 *   - [API CÔNG KHAI]
 *   - Phương thức: GET
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/article-detail.js (Hàm loadComments hiển thị danh sách bình luận)
 * THAM SỐ TRUY VẤN (QUERY PARAMS):
 *   - article_id: (int, bắt buộc) ID của bài viết cần lấy bình luận
 * TRẢ VỀ (JSON):
 *   - { success: true, data: [ { id, article_id, user_id, content, created_at, full_name, username, avatar, role } ] }
 * ==============================================================================
 */

require_once '../../config/database.php';
require_once '../../helpers/response.php';

// ==============================================================================
// KHỐI 1: KIỂM TRA PHƯƠNG THỨC HTTP
// ==============================================================================
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// ==============================================================================
// KHỐI 2: TIẾP NHẬN & KIỂM TRA MÃ BÀI VIẾT (ARTICLE_ID)
// ==============================================================================
$articleId = isset($_GET['article_id']) ? (int)$_GET['article_id'] : 0;
if ($articleId <= 0) {
    jsonResponse(false, null, "Thiếu hoặc sai mã bài viết (article_id)");
}

// ==============================================================================
// KHỐI 3: TRUY VẤN DANH SÁCH BÌNH LUẬN KÈM THÔNG TIN NGƯỜI BÌNH LUẬN
// ==============================================================================
try {
    $stmt = $pdo->prepare("
        SELECT c.id, c.article_id, c.user_id, c.content, c.created_at,
               u.full_name, u.username, u.avatar, u.role
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.article_id = ?
        ORDER BY c.created_at DESC
    ");
    $stmt->execute([$articleId]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ==============================================================================
    // KHỐI 4: PHẢN HỒI KẾT QUẢ CHO CLIENT
    // ==============================================================================
    jsonResponse(true, $comments);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}

