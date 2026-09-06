<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';
require_once __DIR__ . '/../helpers/file.php';

requireLogin();

$method = $_SERVER['REQUEST_METHOD'];

// Xử lý XÓA ảnh (DELETE)
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

// Chỉ chấp nhận POST nếu không phải DELETE
if ($method !== 'POST') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// Kiểm tra có gửi file hay không
if (!isset($_FILES['image'])) {
    jsonResponse(false, null, "Vui lòng chọn ảnh");
}

$file = $_FILES['image'];

// Kiểm tra lỗi upload
if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(false, null, "Upload ảnh thất bại");
}

// Lấy loại ảnh
$type = isset($_POST['type']) ? trim($_POST['type']) : '';

// Chỉ chấp nhận avatar hoặc article
if (!in_array($type, ['avatar', 'article'], true)) {
    jsonResponse(false, null, "Loại ảnh không hợp lệ");
}

// Kiểm tra dung lượng tối đa 5MB
$maxFileSize = 5 * 1024 * 1024;

if ($file['size'] > $maxFileSize) {
    jsonResponse(false, null, "Ảnh không được vượt quá 5MB");
}

// Kiểm tra file có phải ảnh thật không
$imageInfo = getimagesize($file['tmp_name']);

if ($imageInfo === false) {
    jsonResponse(false, null, "File được chọn không phải là ảnh");
}

// Chỉ chấp nhận các định dạng ảnh hợp lệ
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

// Lấy extension từ MIME type thật
$extension = $allowedMimeTypes[$mimeType];

// Chọn thư mục lưu ảnh (theo cấu trúc backend/api/upload/articles/ và backend/api/upload/avatars/)
if ($type === 'avatar') {
    $uploadDir = __DIR__ . '/upload/avatars/';
    $dbPathPrefix = 'backend/api/upload/avatars/';
} else {
    $uploadDir = __DIR__ . '/upload/articles/';
    $dbPathPrefix = 'backend/api/upload/articles/';
}

// Tự động tạo thư mục nếu chưa tồn tại (Slide 69)
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Tạo tên file riêng biệt không trùng lặp
$fileName = $type . '_' . uniqid() . '_' . time() . '.' . $extension;

// Đường dẫn vật lý của file đích
$targetPath = $uploadDir . $fileName;

// Di chuyển file từ thư mục tạm sang thư mục đích (Slide 74)
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    jsonResponse(false, null, "Không thể lưu ảnh vào máy chủ");
}

// Đường dẫn ảnh chuẩn lưu trong database và trả về frontend
$imageUrl = $dbPathPrefix . $fileName;

// Trả kết quả JSON
jsonResponse(
    true,
    [
        "url" => $imageUrl
    ],
    "Upload ảnh thành công"
);
