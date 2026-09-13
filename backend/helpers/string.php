<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/helpers/string.php
 * PHÂN HỆ: Trợ giúp Xử lý Chuỗi (Backend String Helper)
 * MÔ TẢ: Cung cấp các tiện ích xử lý chuỗi ký tự, chuyển đổi tiếng Việt có dấu sang slug URL.
 * PHẠM VI SỬ DỤNG:
 *   - [TẬP TIN DÙNG CHUNG CỐT LÕI]
 *   - Được require_once bởi: backend/api/reporter/write-article.php, backend/api/editor/categories-tags.php, backend/api/admin/published-articles.php
 * ==============================================================================
 */

/**
 * [HÀM DÙNG CHUNG TOÀN HỆ THỐNG] createSlug
 * - Chức năng: Chuyển đổi chuỗi tiêu đề tiếng Việt có dấu thành dạng slug URL chuẩn
 *   (chữ thường không dấu, phân tách bằng dấu gạch ngang, loại bỏ ký tự đặc biệt).
 * - Được gọi bởi:
 *   + backend/api/reporter/write-article.php (khi tạo hoặc cập nhật slug bài viết)
 *   + backend/api/editor/categories-tags.php (khi tạo hoặc sửa slug chuyên mục / tag)
 *   + backend/api/admin/published-articles.php (khi admin tạo thẻ tag mới lúc sửa đè bài viết)
 * 
 * @param string $text Chuỗi tiêu đề gốc (tiếng Việt UTF-8)
 * @return string Chuỗi slug thân thiện URL (VD: "kinh-te-viet-nam-2026")
 */
if (!function_exists('createSlug')) {
    function createSlug($text)
    {
        // Bước 1: Loại bỏ khoảng trắng thừa hai đầu và chuyển toàn bộ chuỗi sang chữ thường UTF-8
        $text = trim($text);
        $text = mb_strtolower($text, 'UTF-8');

        // Bước 2: Bảng đối chiếu các ký tự tiếng Việt có dấu
        $vietnamese = [
            'à','á','ạ','ả','ã','â','ầ','ấ','ậ','ẩ','ẫ','ă','ằ','ắ','ặ','ẳ','ẵ',
            'è','é','ẹ','ẻ','ẽ','ê','ề','ế','ệ','ể','ễ',
            'ì','í','ị','ỉ','ĩ',
            'ò','ó','ọ','ỏ','õ','ô','ồ','ố','ộ','ổ','ỗ','ơ','ờ','ớ','ợ','ở','ỡ',
            'ù','ú','ụ','ủ','ũ','ư','ừ','ứ','ự','ử','ữ',
            'ỳ','ý','ỵ','ỷ','ỹ','đ'
        ];

        // Bước 3: Bảng ký tự Latin tương ứng không dấu
        $latin = [
            'a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a',
            'e','e','e','e','e','e','e','e','e','e','e',
            'i','i','i','i','i',
            'o','o','o','o','o','o','o','o','o','o','o','o','o','o','o','o','o',
            'u','u','u','u','u','u','u','u','u','u','u',
            'y','y','y','y','y','d'
        ];

        // Bước 4: Thay thế toàn bộ ký tự có dấu sang ký tự Latin không dấu
        $text = str_replace($vietnamese, $latin, $text);
        
        // Bước 5: Thay thế các ký tự không phải chữ cái và số thành dấu gạch ngang phân cách
        $text = preg_replace('/[^a-z0-9]+/u', '-', $text);
        
        // Bước 6: Cắt bỏ các dấu gạch ngang dư thừa ở đầu và cuối chuỗi slug
        return trim($text, '-');
    }
}

