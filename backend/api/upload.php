<?php

require_once '../config/database.php';
require_once '../helpers/response.php';
require_once '../helpers/auth.php';

// Yêu cầu người dùng phải đăng nhập
requireLogin();

// Chỉ cho phép phương thức POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// Kiểm tra có gửi file ảnh lên hay không
if (!isset($_FILES['image'])) {
    jsonResponse(false, null, "Vui lòng chọn ảnh");
}

$file = $_FILES['image'];

// Kiểm tra lỗi trong quá trình upload
if ($file['error'] !== UPLOAD_ERR_OK) {
    jsonResponse(false, null, "Upload ảnh thất bại");
}

// Lấy loại ảnh: avatar hoặc article
$type = isset($_POST['type']) ? trim($_POST['type']) : '';

// Chỉ chấp nhận 2 loại ảnh
if (!in_array($type, ['avatar', 'article'])) {
    jsonResponse(false, null, "Loại ảnh không hợp lệ");
}

// Kiểm tra file có phải là ảnh thật hay không
$imageInfo = getimagesize($file['tmp_name']);

if ($imageInfo === false) {
    jsonResponse(false, null, "File được chọn không phải là ảnh");
}

// Chỉ chấp nhận các định dạng ảnh được phép
$allowedMimeTypes = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
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

// Lấy phần mở rộng dựa trên MIME thật của ảnh
$extension = $allowedMimeTypes[$mimeType];

// Giới hạn dung lượng ảnh tối đa 5MB
$maxFileSize = 5 * 1024 * 1024;

if ($file['size'] > $maxFileSize) {
    jsonResponse(false, null, "Ảnh không được vượt quá 5MB");
}

// Chọn thư mục lưu ảnh
if ($type === 'avatar') {
    $uploadDir = __DIR__ . '/../uploads/avatars/';
    $urlPath = '../backend/uploads/avatars/';
} else {
    $uploadDir = __DIR__ . '/../uploads/articles/';
    $urlPath = '../backend/uploads/articles/';
}

// Kiểm tra thư mục lưu ảnh có tồn tại không
if (!is_dir($uploadDir)) {
    jsonResponse(false, null, "Thư mục lưu ảnh không tồn tại");
}

// Kiểm tra thư mục có quyền ghi hay không
if (!is_writable($uploadDir)) {
    jsonResponse(false, null, "Thư mục lưu ảnh không có quyền ghi");
}

// Tạo tên file riêng để tránh trùng tên
$fileName = $type . '_' . uniqid() . '_' . time() . '.' . $extension;

// Đường dẫn thật trên server
$targetPath = $uploadDir . $fileName;

// Di chuyển file từ thư mục tạm của PHP vào thư mục uploads
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    jsonResponse(false, null, "Không thể lưu ảnh");
}

// URL/đường dẫn ảnh trả về cho frontend
$imageUrl = $urlPath . $fileName;

// Trả kết quả thành công
jsonResponse(
    true,
    [
        "url" => $imageUrl
    ],
    "Upload ảnh thành công"
);