<?php
/*
==============================================================================
TÊN FILE: backend/config/database.php
PHÂN HỆ: Cấu hình kết nối Cơ sở dữ liệu (Database Config)
MÔ TẢ: Khởi tạo kết nối CSDL MySQL thông qua thư viện PDO:
       - Cấu hình múi giờ hệ thống (Asia/Ho_Chi_Minh).
       - Kết nối CSDL với bảng mã utf8mb4 (hỗ trợ lưu trữ tiếng Việt có dấu).
       - Bật chế độ bắt lỗi ngoại lệ (ERRMODE_EXCEPTION).
       - Đồng bộ múi giờ phiên làm việc MySQL sang GMT+7.
PHẠM VI SỬ DỤNG:
       - Được include trong tất cả các file API backend.
       - Cung cấp biến kết nối dùng chung: $pdo.
==============================================================================
*/

// Thiết lập múi giờ Việt Nam (GMT+7)
date_default_timezone_set('Asia/Ho_Chi_Minh');

// Thông số kết nối CSDL MySQL
$host = "localhost";
$dbname = "machtin_db";
$username = "root";
$password = "";

try {
    // Khởi tạo kết nối PDO với charset utf8mb4
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    
    // Thiết lập chế độ thông báo lỗi qua ngoại lệ (Exception)
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Đồng bộ múi giờ với MySQL để đảm bảo hàm NOW() khớp với giờ Việt Nam
    $pdo->exec("SET time_zone = '+07:00'");
} catch (PDOException $e) {
    // Trả về thông báo lỗi JSON nếu không thể kết nối CSDL
    die(json_encode([
        "success" => false, 
        "message" => "Không thể kết nối cơ sở dữ liệu: " . $e->getMessage()
    ]));
}
