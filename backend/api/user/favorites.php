<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/user/favorites.php
 * PHÂN HỆ: API Bài viết Yêu thích (User Favorites Service)
 * MÔ TẢ: Quản lý danh sách bài viết yêu thích / lưu đọc sau của người dùng:
 *        - GET: Lấy danh sách bài viết đã lưu yêu thích.
 *        - POST: Thêm một bài viết vào danh sách yêu thích.
 *        - DELETE: Bỏ lưu bài viết khỏi danh sách yêu thích.
 * PHẠM VI SỬ DỤNG:
 *   - [API THÀNH VIÊN ĐĂNG NHẬP]
 *   - Phương thức: GET, POST, DELETE
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 *   - backend/helpers/auth.php (requireLogin, $_SESSION['user_id'])
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/article-detail.js (Nút Lưu bài viết / Bỏ lưu)
 *   - frontend/assets/js/profile.js (Tab danh sách bài viết đã lưu)
 * TRẢ VỀ (JSON):
 *   - Theo từng nghiệp vụ CRUD tương ứng
 * ==============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Bắt buộc đăng nhập trước khi thao tác danh sách yêu thích
requireLogin();

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    // ==============================================================================
    // NGHIỆP VỤ 1: GET - LẤY DANH SÁCH BÀI VIẾT ĐÃ YÊU THÍCH
    // ==============================================================================
    if ($method === 'GET') {
        $stmt = $pdo->prepare("
            SELECT
                articles.id,
                articles.id AS article_id,
                articles.title,
                articles.slug,
                articles.short_description,
                articles.cover_image,
                favorites.created_at
            FROM favorites
            INNER JOIN articles
                ON favorites.article_id = articles.id
            WHERE favorites.user_id = ? AND articles.status = 'published'
            ORDER BY favorites.created_at DESC
        ");

        $stmt->execute([$userId]);
        $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(
            true,
            $favorites,
            "Lấy danh sách yêu thích thành công"
        );
    }

    // ==============================================================================
    // NGHIỆP VỤ 2: POST - THÊM BÀI VIẾT VÀO DANH SÁCH YÊU THÍCH
    // ==============================================================================
    if ($method === 'POST') {
        $input = json_decode(
            file_get_contents('php://input'),
            true
        );

        if (!is_array($input)) {
            jsonResponse(
                false,
                null,
                "Dữ liệu gửi lên không hợp lệ"
            );
        }

        $articleId = $input['article_id'] ?? null;

        if (!$articleId) {
            jsonResponse(
                false,
                null,
                "Thiếu article_id"
            );
        }

        // Kiểm tra bài viết tồn tại và đã xuất bản
        $stmt = $pdo->prepare("
            SELECT id
            FROM articles
            WHERE id = ? AND status = 'published'
            LIMIT 1
        ");
        $stmt->execute([$articleId]);

        if (!$stmt->fetch()) {
            jsonResponse(
                false,
                null,
                "Không tìm thấy bài viết"
            );
        }

        // Kiểm tra bài viết đã có trong danh sách yêu thích của người dùng chưa
        $stmt = $pdo->prepare("
            SELECT *
            FROM favorites
            WHERE user_id = ?
            AND article_id = ?
            LIMIT 1
        ");
        $stmt->execute([
            $userId,
            $articleId
        ]);

        if ($stmt->fetch()) {
            jsonResponse(
                false,
                null,
                "Bài viết đã có trong danh sách yêu thích"
            );
        }

        // Thêm bản ghi yêu thích mới
        $stmt = $pdo->prepare("
            INSERT INTO favorites
            (
                user_id,
                article_id
            )
            VALUES (?, ?)
        ");
        $stmt->execute([
            $userId,
            $articleId
        ]);

        jsonResponse(
            true,
            null,
            "Thêm yêu thích thành công"
        );
    }

    // ==============================================================================
    // NGHIỆP VỤ 3: DELETE - BỎ LƯU BÀI VIẾT KHỎI DANH SÁCH YÊU THÍCH
    // ==============================================================================
    if ($method === 'DELETE') {
        $input = json_decode(
            file_get_contents('php://input'),
            true
        );

        if (!is_array($input)) {
            jsonResponse(
                false,
                null,
                "Dữ liệu gửi lên không hợp lệ"
            );
        }

        $articleId = $input['article_id'] ?? null;

        if (!$articleId) {
            jsonResponse(
                false,
                null,
                "Thiếu article_id"
            );
        }

        $stmt = $pdo->prepare("
            DELETE FROM favorites
            WHERE user_id = ?
            AND article_id = ?
        ");
        $stmt->execute([
            $userId,
            $articleId
        ]);

        jsonResponse(
            true,
            null,
            "Xóa yêu thích thành công"
        );
    }

    // Phản hồi khi client gọi sai phương thức HTTP
    jsonResponse(
        false,
        null,
        "Phương thức không được hỗ trợ"
    );

} catch (PDOException $e) {
    jsonResponse(
        false,
        null,
        "Lỗi hệ thống, vui lòng thử lại sau"
    );
}
