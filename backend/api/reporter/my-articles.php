<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/reporter/my-articles.php
 * PHÂN HỆ: API Quản lý Bài viết Phóng viên (Reporter Articles Service)
 * MÔ TẢ: Cung cấp các thao tác quản lý bài viết của phóng viên:
 *        - GET: Lấy danh sách toàn bộ bài viết do phóng viên sáng tác (mọi trạng thái).
 *        - PUT: Thu hồi bài viết về bản nháp (action='withdraw') hoặc gửi duyệt (action='submit').
 *        - DELETE: Xóa bài viết thuộc quyền sở hữu (chỉ cho phép xóa bản nháp hoặc bị từ chối;
 *          tự động xóa tệp ảnh bìa và ảnh nội dung đính kèm).
 * PHẠM VI SỬ DỤNG:
 *   - [KHU VỰC TÒA SOẠN - PHÓNG VIÊN]
 *   - Phân quyền: role = 'reporter'
 *   - Phương thức: GET, PUT, DELETE
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 *   - backend/helpers/auth.php (requireRole, $_SESSION['user_id'])
 *   - backend/helpers/file.php (deleteUploadedFile)
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/reporter-articles.js (Hiển thị và xử lý bảng bài viết phóng viên)
 * TRẢ VỀ (JSON):
 *   - Theo từng nghiệp vụ tương ứng
 * ==============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';
require_once __DIR__ . '/../../helpers/file.php';

// Chỉ phóng viên (reporter) mới được truy cập
requireRole(['reporter']);

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_SESSION['user_id'];

try {
    // ==============================================================================
    // NGHIỆP VỤ 1: GET - LẤY TOÀN BỘ BÀI VIẾT CỦA PHÓNG VIÊN ĐANG ĐĂNG NHẬP
    // ==============================================================================
    if ($method === 'GET') {
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
    }

    // ==============================================================================
    // NGHIỆP VỤ 2: PUT - THU HỒI BÀI VIẾT HOẶC GỬI DUYỆT LÊN BAN BIÊN TẬP
    // ==============================================================================
    if ($method === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        $articleId = $input['article_id'] ?? null;
        $action = $input['action'] ?? null;

        if (!$articleId) {
            jsonResponse(false, null, "Thiếu article_id");
        }

        $stmt = $pdo->prepare("SELECT id, status, title, content, category_id FROM articles WHERE id = ? AND author_id = ?");
        $stmt->execute([$articleId, $userId]);
        $art = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$art) {
            jsonResponse(false, null, "Không tìm thấy bài viết hoặc bạn không có quyền");
        }

        if ($action === 'withdraw') {
            $pdo->prepare("UPDATE articles SET status = 'draft', updated_at = NOW() WHERE id = ?")->execute([$articleId]);
            jsonResponse(true, null, "Đã thu hồi bài viết về bản nháp");
        } else if ($action === 'submit') {
            if (empty(trim($art['title'] ?? '')) || empty(trim($art['content'] ?? '')) || empty($art['category_id'])) {
                jsonResponse(false, null, "Bài viết chưa đầy đủ tiêu đề, nội dung hoặc chuyên mục để gửi duyệt");
            }
            $pdo->prepare("UPDATE articles SET status = 'pending', updated_at = NOW() WHERE id = ?")->execute([$articleId]);
            jsonResponse(true, null, "Đã gửi bài viết lên Ban Biên tập để thẩm định");
        } else {
            jsonResponse(false, null, "Hành động không hợp lệ");
        }
    }

    // ==============================================================================
    // NGHIỆP VỤ 3: DELETE - XÓA BÀI VIẾT VÀ DỌN DẸP TỆP TIN ĐÍNH KÈM
    // ==============================================================================
    if ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);
        $articleId = $input['article_id'] ?? ($_GET['id'] ?? null);

        if (!$articleId) {
            jsonResponse(false, null, "Thiếu article_id");
        }

        $stmt = $pdo->prepare("SELECT id, status, cover_image, content FROM articles WHERE id = ? AND author_id = ?");
        $stmt->execute([$articleId, $userId]);
        $art = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$art) {
            jsonResponse(false, null, "Không tìm thấy bài viết hoặc bạn không có quyền");
        }

        // Chặn nghiệp vụ: Phóng viên không được xóa bài đã xuất bản hoặc đang chờ biên tập viên duyệt
        if ($art['status'] === 'published') {
            jsonResponse(false, null, "Không thể xóa bài viết đã được xuất bản");
        }
        if ($art['status'] === 'pending') {
            jsonResponse(false, null, "Bài viết đang trong hàng đợi duyệt. Vui lòng thu hồi về Bản nháp trước khi xóa.");
        }

        // Dọn dẹp tệp ảnh vật lý trên đĩa cứng (ảnh bìa + ảnh minh họa trong nội dung)
        if (!empty($art['cover_image'])) {
            deleteUploadedFile($art['cover_image']);
        }

        if (!empty($art['content'])) {
            preg_match_all('/src=["\']([^"\']+)["\']/i', $art['content'], $matches);
            if (!empty($matches[1])) {
                foreach ($matches[1] as $imgSrc) {
                    if (strpos($imgSrc, 'backend/api/upload/') !== false) {
                        $pos = strpos($imgSrc, 'backend/api/upload/');
                        $cleanImgPath = substr($imgSrc, $pos);
                        deleteUploadedFile($cleanImgPath);
                    }
                }
            }
        }

        // Nhờ ON DELETE CASCADE trong database, xóa articles sẽ tự động xóa
        // các liên kết trong article_tags, comments và favorites
        $pdo->prepare("DELETE FROM articles WHERE id = ?")->execute([$articleId]);

        jsonResponse(true, null, "Đã xóa bài viết thành công");
    }

    // Phản hồi khi client gọi sai phương thức HTTP
    jsonResponse(false, null, "Phương thức không được hỗ trợ");

} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}

