<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

requireLogin();

// Chỉ cho phép POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

// Chỉ chấp nhận các định dạng ảnh
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

// Chọn thư mục lưu ảnh
if ($type === 'avatar') {
    $uploadDir = __DIR__ . '/../uploads/avatars/';
} else {
    $uploadDir = __DIR__ . '/../uploads/articles/';
}

// Kiểm tra thư mục tồn tại
if (!is_dir($uploadDir)) {
    jsonResponse(false, null, "Thư mục lưu ảnh không tồn tại");
}

// Kiểm tra quyền ghi
if (!is_writable($uploadDir)) {
    jsonResponse(false, null, "Thư mục lưu ảnh không có quyền ghi");
}

// Tạo tên file riêng
$fileName = $type . '_' . uniqid() . '_' . time() . '.' . $extension;

// Đường dẫn vật lý của file
$targetPath = $uploadDir . $fileName;

// Lưu ảnh
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    jsonResponse(false, null, "Không thể lưu ảnh");
}

// Đường dẫn ảnh lưu trong database
if ($type === 'avatar') {
    $imageUrl = 'backend/uploads/avatars/' . $fileName;
} else {
    $imageUrl = 'backend/uploads/articles/' . $fileName;
}

// Trả kết quả
jsonResponse(
    true,
    [
        "url" => $imageUrl
    ],
    "Upload ảnh thành công"
);