<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/config/database.php
 * PHÂN HỆ: Cấu hình Hệ thống (Backend Core Config)
 * MÔ TẢ: Khởi tạo kết nối cơ sở dữ liệu MySQL thông qua PDO và cấu hình múi giờ.
 * PHẠM VI SỬ DỤNG:
 *   - [TẬP TIN DÙNG CHUNG CỐT LÕI]
 *   - Được require_once bởi TOÀN BỘ các API endpoint trong backend/api/**
 *   - Cung cấp biến kết nối toàn cục: $pdo
 * ==============================================================================
 */

// ==============================================================================
// KHỐI 1: CẤU HÌNH MÚI GIỜ HỆ THỐNG
// - Đồng bộ múi giờ ứng dụng PHP sang giờ Việt Nam (GMT+7)
// ==============================================================================
date_default_timezone_set('Asia/Ho_Chi_Minh');

// ==============================================================================
// KHỐI 2: THÔNG SỐ VÀ KHỞI TẠO KẾT NỐI PDO MYSQL
// - Khởi tạo đối tượng $pdo với mã hóa utf8mb4 hỗ trợ tiếng Việt đầy đủ
// - Thiết lập chế độ báo lỗi ngoại lệ (ERRMODE_EXCEPTION)
// - Đồng bộ múi giờ phiên làm việc MySQL sang +07:00
// ==============================================================================
$host = "localhost";
$dbname = "machtin_db";
$username = "root";
$password = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("SET time_zone = '+07:00'");
} catch (PDOException $e) {
    die(json_encode(["success" => false, "message" => "Kết nối thất bại: " . $e->getMessage()]));
}
