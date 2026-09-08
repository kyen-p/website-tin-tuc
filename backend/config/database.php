<?php
// Thiết lập múi giờ mặc định cho toàn bộ ứng dụng PHP theo chuẩn Việt Nam (GMT+7)
date_default_timezone_set('Asia/Ho_Chi_Minh');

$host = "localhost";
$dbname = "machtin_db";
$username = "root";
$password = "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Đồng bộ múi giờ phiên làm việc của MySQL với giờ Việt Nam
    $pdo->exec("SET time_zone = '+07:00'");
} catch (PDOException $e) {
    die(json_encode(["success" => false, "message" => "Kết nối thất bại: " . $e->getMessage()]));
}