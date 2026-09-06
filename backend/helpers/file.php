<?php

/**
 * Helper xử lý tập tin (upload / xóa file vật lý)
 * Áp dụng Slide 68 (unlink) và Slide 69 (kiểm tra thư mục / file_exists)
 */

function deleteUploadedFile($relativePath)
{
    if (empty($relativePath) || !is_string($relativePath)) {
        return false;
    }

    // Chuẩn hóa đường dẫn, bỏ dấu / ở đầu nếu có
    $cleanPath = ltrim(trim($relativePath), '/');

    // Chỉ cho phép xóa các file nằm trong thư mục upload an toàn của hệ thống
    // Ngăn chặn tấn công Path Traversal (vd: ../../config/database.php)
    if (!str_starts_with($cleanPath, 'backend/api/upload/')) {
        return false;
    }

    // Xác định đường dẫn tuyệt đối đến thư mục gốc của dự án
    // File này nằm ở backend/helpers/ => __DIR__ là backend/helpers
    $projectRoot = dirname(__DIR__, 2); // Ra khỏi helpers, ra khỏi backend
    $absolutePath = $projectRoot . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $cleanPath);

    // Kiểm tra file có thực sự tồn tại trên đĩa cứng hay không
    if (file_exists($absolutePath) && is_file($absolutePath)) {
        return @unlink($absolutePath);
    }

    return false;
}
