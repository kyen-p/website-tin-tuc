<?php
/*
==============================================================================
TÊN FILE: backend/api/auth/logout.php
PHÂN HỆ: Xác thực & Đăng nhập
MÔ TẢ: Xử lý đăng xuất, hủy phiên làm việc (Session) và xóa cookie
PHẠM VI SỬ DỤNG:
       - Phương thức: POST
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
       - helpers/auth.php
==============================================================================
*/

require_once '../../config/database.php';
require_once '../../helpers/response.php';
require_once '../../helpers/auth.php';

// Chỉ chấp nhận phương thức POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// Xóa dữ liệu Session và hủy cookie phiên trên trình duyệt
$_SESSION = [];

if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

session_destroy();

jsonResponse(true, null, "Đăng xuất thành công");

