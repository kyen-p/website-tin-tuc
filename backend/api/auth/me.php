<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/auth/me.php
 * PHÂN HỆ: API Xác thực & Người dùng Hiện tại (Auth Service)
 * MÔ TẢ: Lấy thông tin chi tiết của tài khoản đang đăng nhập từ Session và Database.
 * PHẠM VI SỬ DỤNG:
 *   - [API DÙNG CHUNG TOÀN HỆ THỐNG]
 *   - Phương thức: GET
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 *   - backend/helpers/auth.php (session_start)
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/common.js (Hàm getCurrentUser, checkAuth dùng chung)
 *   - frontend/assets/js/admin-layout.js (Lấy thông tin hiển thị Topbar và phân quyền Sidebar)
 *   - frontend/assets/js/profile.js (Tải thông tin cá nhân trang tài khoản)
 * TRẢ VỀ (JSON):
 *   - Thành công: { success: true, data: { id, username, email, full_name, avatar, bio, role, status, created_at } }
 *   - Chưa đăng nhập: { success: false, data: null, message: "Chưa đăng nhập" }
 * ==============================================================================
 */

require_once '../../config/database.php';
require_once '../../helpers/response.php';
require_once '../../helpers/auth.php';

// ==============================================================================
// KHỐI 1: KIỂM TRA PHIÊN LÀM VIỆC (SESSION)
// ==============================================================================
if (!isset($_SESSION['user_id'])) {
    jsonResponse(false, null, "Chưa đăng nhập");
}

// ==============================================================================
// KHỐI 2: TRUY VẤN CƠ SỞ DỮ LIỆU & KIỂM TRA TRẠNG THÁI TÀI KHOẢN
// ==============================================================================
try {
    $stmt = $pdo->prepare(
        "SELECT id, username, email, full_name, avatar, bio, role, status, created_at
         FROM users WHERE id = ? LIMIT 1"
    );
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Tài khoản đã bị xóa khỏi DB hoặc bị quản trị viên khóa sau khi đăng nhập -> hủy phiên ngay
    if (!$user || $user['status'] === 'locked') {
        $_SESSION = [];
        session_destroy();
        jsonResponse(false, null, "Phiên đăng nhập không hợp lệ");
    }

    // ==============================================================================
    // KHỐI 3: PHẢN HỒI THÔNG TIN NGƯỜI DÙNG HIỆN TẠI
    // ==============================================================================
    jsonResponse(true, $user);
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}

