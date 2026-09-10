<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/auth/register.php
 * PHÂN HỆ: API Đăng ký Tài khoản (Auth Service)
 * MÔ TẢ: Tiếp nhận yêu cầu đăng ký tài khoản mới cho độc giả (role mặc định: user).
 * PHẠM VI SỬ DỤNG:
 *   - [API CÔNG KHAI - AUTH]
 *   - Phương thức: POST
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/register.js (Hàm xử lý gửi form đăng ký độc giả)
 * ĐẦU VÀO (POST):
 *   - username: Tên tài khoản viết liền không dấu
 *   - email: Địa chỉ email hợp lệ
 *   - password: Mật khẩu (tối thiểu 8 ký tự)
 *   - full_name: Họ và tên đầy đủ của người dùng
 * TRẢ VỀ (JSON):
 *   - Thành công: { success: true, message: "Đăng ký tài khoản thành công", data: null }
 *   - Thất bại: { success: false, message: "...", data: null }
 * ==============================================================================
 */

require_once '../../config/database.php';
require_once '../../helpers/response.php';

// ==============================================================================
// KHỐI 1: KIỂM TRA PHƯƠNG THỨC HTTP
// ==============================================================================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// ==============================================================================
// KHỐI 2: TIẾP NHẬN & KIỂM TRA DỮ LIỆU ĐẦU VÀO
// ==============================================================================
$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? (string) $_POST['password'] : '';
$fullName = isset($_POST['full_name']) ? trim($_POST['full_name']) : '';

// Kiểm tra các trường bắt buộc không được để trống
if ($username === '' || $email === '' || $password === '' || $fullName === '') {
    jsonResponse(false, null, "Vui lòng nhập đầy đủ username, email, password và họ tên");
}

// Kiểm tra định dạng email hợp lệ
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(false, null, "Địa chỉ email không hợp lệ");
}

// Kiểm tra độ dài mật khẩu an toàn
if (strlen($password) < 8) {
    jsonResponse(false, null, "Mật khẩu phải có ít nhất 8 ký tự");
}

// ==============================================================================
// KHỐI 3: KIỂM TRA TRÙNG LẶP & KHỞI TẠO TÀI KHOẢN MỚI
// ==============================================================================
try {
    // Kiểm tra username đã tồn tại trong hệ thống chưa
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        jsonResponse(false, null, "Tên đăng nhập này đã có người sử dụng");
    }

    // Kiểm tra email đã được đăng ký trước đó chưa
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(false, null, "Email này đã được đăng ký tài khoản");
    }

    // Mã hóa mật khẩu bằng thuật toán BCRYPT mặc định an toàn của PHP
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Lưu người dùng mới vào database với vai trò mặc định là 'user' và trạng thái 'active'
    $stmt = $pdo->prepare(
        "INSERT INTO users (username, email, password, full_name, role, status, created_at)
         VALUES (?, ?, ?, ?, 'user', 'active', NOW())"
    );
    $stmt->execute([$username, $email, $hashedPassword, $fullName]);

    // ==============================================================================
    // KHỐI 4: PHẢN HỒI KẾT QUẢ CHO CLIENT
    // ==============================================================================
    jsonResponse(true, null, "Đăng ký tài khoản thành công");
} catch (PDOException $e) {
    jsonResponse(false, null, "Lỗi hệ thống, vui lòng thử lại sau");
}

