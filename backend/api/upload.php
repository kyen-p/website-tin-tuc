<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/upload.php
 * PHÂN HỆ: API Xử lý Tải tệp lên Máy chủ (Upload Service)
 * MÔ TẢ: Tiếp nhận tải lên (POST) và xóa bỏ (DELETE) file ảnh vật lý trên máy chủ.
 * PHẠM VI SỬ DỤNG:
 *   - [API DÙNG CHUNG TOÀN HỆ THỐNG]
 *   - Yêu cầu xác thực: Đã đăng nhập (gọi requireLogin())
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php (kết nối DB)
 *   - backend/helpers/response.php (jsonResponse)
 *   - backend/helpers/auth.php (requireLogin)
 *   - backend/helpers/file.php (deleteUploadedFile)
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/profile.js (Tải ảnh đại diện avatar)
 *   - frontend/assets/js/reporter-write-article.js (Tải ảnh bìa bài viết & ảnh nội dung CKEditor 5)
 * ==============================================================================
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/file.php';

// Xác thực bắt buộc: Người dùng phải đăng nhập trước khi thực hiện thao tác tệp
requireLogin();

$method = $_SERVER['REQUEST_METHOD'];

// ==============================================================================
// KHỐI 1: XỬ LÝ YÊU CẦU XÓA FILE ẢNH VẬT LÝ (METHOD: DELETE)
// - Nhận đường dẫn ảnh tương đối từ body JSON hoặc query param
// - Gọi hàm an toàn deleteUploadedFile() từ backend/helpers/file.php
// ==============================================================================
if ($method === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = $input['url'] ?? $_GET['url'] ?? '';

    if (empty($url)) {
        jsonResponse(false, null, "Thiếu thông tin đường dẫn ảnh cần xóa");
    }

    $deleted = deleteUploadedFile($url);
    if ($deleted) {
        jsonResponse(true, null, "Đã xóa vĩnh viễn file ảnh khỏi máy chủ");
    } else {
        // Trả về true kể cả khi file không tồn tại để tránh chặn luồng frontend
        jsonResponse(true, null, "File không tồn tại hoặc đã được xóa trước đó");
    }
}

// ==============================================================================
// KHỐI 2: KIỂM TRA PHƯƠNG THỨC GỬI DỮ LIỆU TẢI LÊN
// - Chỉ chấp nhận phương thức POST đối với tác vụ upload ảnh
// ==============================================================================
if ($method !== 'POST') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// ==============================================================================
// KHỐI 3: KIỂM TRA TỆP GỬI LÊN VÀ MÃ LỖI UPLOAD CỦA PHP
// ==============================================================================
if (!isset($_FILES['image'])) {
    jsonResponse(false, null, "Vui lòng chọn ảnh");
}

$file = $_FILES['image'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE) {
        jsonResponse(false, null, "Ảnh không được vượt quá 5MB");
    }
    jsonResponse(false, null, "Upload ảnh thất bại");
}

// ==============================================================================
// KHỐI 4: KIỂM TRA VÀ PHÂN LOẠI ẢNH (AVATAR HOẶC ARTICLE)
// ==============================================================================
$type = isset($_POST['type']) ? trim($_POST['type']) : '';

if (!in_array($type, ['avatar', 'article'], true)) {
    jsonResponse(false, null, "Loại ảnh không hợp lệ");
}

// ==============================================================================
// KHỐI 5: KIỂM TRA DUNG LƯỢNG (GIỚI HẠN TỐI ĐA 5MB)
// ==============================================================================
$maxFileSize = 5 * 1024 * 1024;

if ($file['size'] > $maxFileSize) {
    jsonResponse(false, null, "Ảnh không được vượt quá 5MB");
}

// ==============================================================================
// KHỐI 6: KIỂM TRA MIME TYPE THỰC VÀ TÍNH HỢP LỆ CỦA TỆP HÌNH ẢNH
// - Dùng getimagesize() để xác thực file là ảnh thật, chống mã độc giả mạo đuôi file
// - Chỉ chấp nhận JPG, JPEG, PNG, WEBP
// ==============================================================================
$imageInfo = getimagesize($file['tmp_name']);

if ($imageInfo === false) {
    jsonResponse(false, null, "File được chọn không phải là ảnh");
}

$allowedMimeTypes = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp'
];

$mimeType = $imageInfo['mime'];

if (!isset($allowedMimeTypes[$mimeType])) {
    jsonResponse(
        false,
        null,
        "Chỉ hỗ trợ ảnh JPG, JPEG, PNG và WEBP"
    );
}

$extension = $allowedMimeTypes[$mimeType];

// ==============================================================================
// KHỐI 7: ĐIỀU HƯỚNG THƯ MỤC LƯU TRỮ VÀ TẠO TÊN TỆP ĐỘC BẢN
// - Ảnh avatar: lưu vào backend/api/upload/avatars/
// - Ảnh bài viết: lưu vào backend/api/upload/articles/
// - Đặt tên file theo mẫu: {type}_{uniqid}_{timestamp}.{extension}
// ==============================================================================
if ($type === 'avatar') {
    $uploadDir = __DIR__ . '/upload/avatars/';
    $dbPathPrefix = 'backend/api/upload/avatars/';
} else {
    $uploadDir = __DIR__ . '/upload/articles/';
    $dbPathPrefix = 'backend/api/upload/articles/';
}

// Tự động khởi tạo thư mục lưu trữ nếu chưa tồn tại
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$fileName = $type . '_' . uniqid() . '_' . time() . '.' . $extension;
$targetPath = $uploadDir . $fileName;

// ==============================================================================
// KHỐI 8: DI CHUYỂN FILE TỪ THƯ MỤC TẠM VÀ PHẢN HỒI KẾT QUẢ CHO CLIENT
// ==============================================================================
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    jsonResponse(false, null, "Không thể lưu ảnh vào máy chủ");
}

// Đường dẫn tương đối chuẩn để lưu vào cơ sở dữ liệu và hiển thị trên giao diện
$imageUrl = $dbPathPrefix . $fileName;

jsonResponse(
    true,
    [
        "url" => $imageUrl
    ],
    "Upload ảnh thành công"
);

