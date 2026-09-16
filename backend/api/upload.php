<?php
/*
==============================================================================
TÊN FILE: backend/api/upload.php
PHÂN HỆ: Xử lý tệp tin tải lên
MÔ TẢ: Tiếp nhận tải lên (POST) và xóa bỏ (DELETE) file ảnh vật lý trên máy chủ
PHẠM VI SỬ DỤNG:
       - Phương thức: POST, DELETE
PHỤ THUỘC:
       - config/database.php
       - helpers/response.php
       - helpers/auth.php
       - helpers/file.php
==============================================================================
*/

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/file.php';

// Yêu cầu đăng nhập trước khi thao tác upload
requireLogin();

$method = $_SERVER['REQUEST_METHOD'];

// Xóa file ảnh vật lý trên máy chủ
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
        jsonResponse(true, null, "File không tồn tại hoặc đã được xóa trước đó");
    }
}

// Chỉ chấp nhận POST cho tác vụ tải ảnh
if ($method !== 'POST') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// Kiểm tra tệp gửi lên
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

// Phân loại mục đích ảnh (avatar hoặc article)
$type = isset($_POST['type']) ? trim($_POST['type']) : '';

if (!in_array($type, ['avatar', 'article'], true)) {
    jsonResponse(false, null, "Loại ảnh không hợp lệ");
}

// Giới hạn dung lượng tối đa 5MB
$maxFileSize = 5 * 1024 * 1024;

if ($file['size'] > $maxFileSize) {
    jsonResponse(false, null, "Ảnh không được vượt quá 5MB");
}

// Xác thực MIME type thực tế của file ảnh
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

// Xác định thư mục lưu trữ theo loại ảnh
if ($type === 'avatar') {
    $uploadDir = __DIR__ . '/upload/avatars/';
    $dbPathPrefix = 'backend/api/upload/avatars/';
} else {
    $uploadDir = __DIR__ . '/upload/articles/';
    $dbPathPrefix = 'backend/api/upload/articles/';
}

// Tạo thư mục nếu chưa có
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$fileName = $type . '_' . uniqid() . '_' . time() . '.' . $extension;
$targetPath = $uploadDir . $fileName;

// Di chuyển file từ thư mục tạm sang thư mục đích
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    jsonResponse(false, null, "Không thể lưu ảnh vào máy chủ");
}

$imageUrl = $dbPathPrefix . $fileName;

jsonResponse(
    true,
    [
        "url" => $imageUrl
    ],
    "Upload ảnh thành công"
);


