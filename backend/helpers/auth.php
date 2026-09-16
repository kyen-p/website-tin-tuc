<?php
/*
==============================================================================
TÊN FILE: backend/helpers/auth.php
PHÂN HỆ: Trợ giúp Xác thực & Phân quyền (Auth Helper)
MÔ TẢ: Quản lý phiên làm việc PHP Session và kiểm tra quyền hạn người dùng:
       - Khởi động Session nếu chưa có.
       - Kiểm tra trạng thái đã đăng nhập (requireLogin).
       - Kiểm tra vai trò người dùng được phép truy cập (requireRole: admin, editor, reporter, user).
PHẠM VI SỬ DỤNG:
       - Dùng chung cho các API cần xác thực danh tính và phân quyền.
PHỤ THUỘC:
       - backend/helpers/response.php (gọi jsonResponse khi từ chối truy cập)
==============================================================================
*/

// Khởi tạo phiên làm việc PHP Session
session_start();

/**
 * Kiểm tra xem người dùng đã đăng nhập chưa
 * Nếu chưa đăng nhập ($_SESSION['user_id'] không tồn tại), ngắt và trả về lỗi 401 JSON
 */
function requireLogin() {
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(false, null, "Bạn cần đăng nhập để thực hiện chức năng này", 401);
    }
}

/**
 * Kiểm tra quyền truy cập theo vai trò (Role-based Access Control)
 * @param array $roles Mảng các vai trò được phép (ví dụ: ['admin'], ['editor', 'admin'])
 */
function requireRole($roles) {
    // Trước tiên yêu cầu người dùng phải đăng nhập
    requireLogin();
    
    // Đối chiếu vai trò hiện tại trong Session với danh sách vai trò hợp lệ
    if (!in_array($_SESSION['role'], $roles)) {
        jsonResponse(false, null, "Bạn không có quyền truy cập chức năng này", 403);
    }
}
