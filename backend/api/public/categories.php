<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/public/categories.php
 * PHÂN HỆ: API Chuyên mục Công khai (Public Categories Service)
 * MÔ TẢ: Lấy danh sách tất cả chuyên mục tin tức hoặc lấy thông tin chi tiết của một
 *        chuyên mục theo slug.
 * PHẠM VI SỬ DỤNG:
 *   - [API CÔNG KHAI]
 *   - Phương thức: GET
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/common.js (Hàm renderHeader hiển thị thanh điều hướng Menu)
 *   - frontend/assets/js/home.js (Hiển thị các khối tin theo danh mục trên trang chủ)
 *   - frontend/assets/js/category.js (Lấy tên và mô tả chuyên mục đang duyệt)
 * THAM SỐ TRUY VẤN (QUERY PARAMS):
 *   - slug: (string, tùy chọn) Lọc theo slug của chuyên mục cụ thể
 * TRẢ VỀ (JSON):
 *   - { success: true, data: [ { id, name, slug, description, created_at } ] }
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
// KHỐI 2: TIẾP NHẬN THAM SỐ SLUG (NẾU CÓ)
// ==============================================================================
$slug = isset($_GET['slug']) ? trim($_GET['slug']) : '';

// ==============================================================================
// KHỐI 3: TRUY VẤN DỮ LIỆU CHUYÊN MỤC TỪ DATABASE
// ==============================================================================
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

    // ==============================================================================
    // KHỐI 4: PHẢN HỒI KẾT QUẢ CHO CLIENT
    // ==============================================================================
    jsonResponse(true, $categories);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}

