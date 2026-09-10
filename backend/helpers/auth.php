<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/helpers/auth.php
 * PHÂN HỆ: Trợ giúp Xác thực & Phân quyền (Backend Auth Helper)
 * MÔ TẢ: Khởi tạo PHP Session và cung cấp các hàm kiểm tra đăng nhập, phân quyền vai trò.
 * PHẠM VI SỬ DỤNG:
 *   - [TẬP TIN DÙNG CHUNG CỐT LÕI]
 *   - Phụ thuộc: backend/helpers/response.php (gọi jsonResponse khi từ chối truy cập)
 *   - Được require_once bởi: Tất cả các API yêu cầu đăng nhập thuộc
 *     backend/api/{user, reporter, editor, admin}/** và backend/api/upload.php
 * ==============================================================================
 */

session_start();

/**
 * [HÀM DÙNG CHUNG] requireLogin
 * - Chức năng: Kiểm tra người dùng hiện tại đã đăng nhập vào hệ thống hay chưa thông qua PHP Session.
 * - Hành vi: Nếu chưa đăng nhập ($_SESSION['user_id'] chưa tồn tại), trả về lỗi 
 *   JSON { success: false, message: "Bạn cần đăng nhập" } và dừng thực thi ngay.
 * - Được gọi bởi: requireRole(), backend/api/user/**, backend/api/upload.php.
 * 
 * @return void
 */
function requireLogin() {
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(false, null, "Bạn cần đăng nhập");
    }
}

/**
 * [HÀM DÙNG CHUNG] requireRole
 * - Chức năng: Kiểm tra quyền truy cập dựa trên danh sách các vai trò (roles) được phép.
 * - Các vai trò trong hệ thống: 'admin', 'editor', 'reporter', 'reader' (user).
 * - Hành vi: Tự động gọi requireLogin() trước, sau đó nếu vai trò hiện tại không nằm trong
 *   mảng $roles thì trả về lỗi { success: false, message: "Không có quyền truy cập" } và dừng thực thi.
 * - Được gọi bởi: 
 *   + backend/api/admin/** (cho phép ['admin'])
 *   + backend/api/editor/** (cho phép ['editor', 'admin'])
 *   + backend/api/reporter/** (cho phép ['reporter', 'admin'])
 * 
 * @param array $roles Mảng danh sách các chuỗi vai trò được cấp quyền
 * @return void
 */
function requireRole($roles) {
    requireLogin();
    if (!in_array($_SESSION['role'], $roles)) {
        jsonResponse(false, null, "Không có quyền truy cập");
    }
}
