<?php
/*
==============================================================================
TÊN FILE: backend/helpers/file.php
PHÂN HỆ: Trợ giúp Xử lý Tệp tin (File Helper)
MÔ TẢ: Cung cấp hàm xóa tệp tin vật lý an toàn trên máy chủ:
       - Kiểm tra đường dẫn hợp lệ.
       - Chống tấn công duyệt thư mục (Path Traversal Prevention): chỉ cho phép xóa trong thư mục upload.
       - Kiểm tra file tồn tại trước khi dùng unlink() để dọn dẹp ảnh cũ.
PHẠM VI SỬ DỤNG:
       - Dùng khi người dùng đổi avatar, gỡ ảnh bìa bài viết hoặc xóa tài khoản.
==============================================================================
*/

/**
 * Xóa an toàn một tệp tin đã upload trên máy chủ
 * @param string $relativePath Đường dẫn tương đối của file (ví dụ: /backend/api/upload/avatars/abc.jpg)
 * @return bool True nếu xóa thành công hoặc file không tồn tại, False nếu đường dẫn bất hợp pháp
 */
function deleteUploadedFile($relativePath)
{
    if (empty($relativePath) || !is_string($relativePath)) {
        return false;
    }

    $cleanPath = trim($relativePath);
    $pos = strpos($cleanPath, 'backend/api/upload/');
    if ($pos !== false) {
        $cleanPath = substr($cleanPath, $pos);
    } else {
        $cleanPath = ltrim($cleanPath, '/');
    }

    // Bảo mật: Chỉ cho phép thao tác với file nằm trong thư mục upload
    // Tránh việc kẻ xấu truyền đường dẫn '../../config/database.php' để xóa file hệ thống
    if (strpos($cleanPath, 'backend/api/upload/') !== 0) {
        return false;
    }

    // Xác định đường dẫn tuyệt đối đến file trên ổ đĩa máy chủ
    $projectRoot = dirname(__DIR__, 2);
    $absolutePath = $projectRoot . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $cleanPath);

    // Kiểm tra file có thực sự tồn tại trước khi xóa
    if (file_exists($absolutePath) && is_file($absolutePath)) {
        return @unlink($absolutePath);
    }

    return false;
}

