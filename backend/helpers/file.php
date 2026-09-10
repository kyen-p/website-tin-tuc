<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/helpers/file.php
 * PHÂN HỆ: Trợ giúp Xử lý Tệp tin (Backend File Helper)
 * MÔ TẢ: Cung cấp các hàm xử lý tệp tin vật lý trên máy chủ (xóa tệp upload an toàn).
 * PHẠM VI SỬ DỤNG:
 *   - [TẬP TIN DÙNG CHUNG CỐT LÕI]
 *   - Được require_once bởi: backend/api/upload.php, backend/api/user/profile.php,
 *     backend/api/admin/users.php, backend/api/reporter/write-article.php
 * ==============================================================================
 */

/**
 * [HÀM DÙNG CHUNG TOÀN HỆ THỐNG] deleteUploadedFile
 * - Chức năng: Xóa file ảnh vật lý khỏi thư mục lưu trữ trên máy chủ khi người dùng đổi avatar,
 *   gỡ ảnh bìa, hoặc xóa tài khoản / bài viết.
 * - Cơ chế bảo mật:
 *   + Chuẩn hóa đường dẫn tương đối.
 *   + Chống tấn công duyệt thư mục (Path Traversal Prevention): Chỉ cho phép xóa các file
 *     nằm bên trong thư mục 'backend/api/upload/'. Ngăn chặn xóa nhầm các file mã nguồn hệ thống.
 *   + Kiểm tra sự tồn tại vật lý bằng file_exists() và is_file() trước khi gọi unlink().
 * - Được gọi bởi:
 *   + backend/api/upload.php (khi gọi API DELETE xóa ảnh nháp)
 *   + backend/api/user/profile.php (khi cập nhật avatar mới, dọn dẹp avatar cũ)
 *   + backend/api/admin/users.php (khi xóa vĩnh viễn tài khoản người dùng)
 *   + backend/api/reporter/write-article.php (khi thay thế ảnh bìa bài viết)
 * 
 * @param string $relativePath Đường dẫn tương đối của file cần xóa
 * @return bool True nếu xóa thành công, False nếu đường dẫn không hợp lệ hoặc file không tồn tại
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

    // Chỉ cho phép xóa các file nằm trong thư mục upload an toàn của hệ thống
    // Ngăn chặn tấn công Path Traversal (vd: ../../config/database.php)
    if (strpos($cleanPath, 'backend/api/upload/') !== 0) {
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

