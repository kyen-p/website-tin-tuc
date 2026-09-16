<?php
/*
==============================================================================
TÊN FILE: backend/helpers/string.php
PHÂN HỆ: Trợ giúp Xử lý Chuỗi (String Helper)
MÔ TẢ: Cung cấp tiện ích xử lý chuỗi và tạo slug URL:
       - createSlug: Chuyển tiêu đề tiếng Việt có dấu thành chuỗi slug không dấu,
         thay khoảng trắng bằng dấu gạch nối (-), loại bỏ ký tự đặc biệt.
PHẠM VI SỬ DỤNG:
       - Dùng khi tạo hoặc cập nhật bài viết, chuyên mục, thẻ tag để tối ưu đường dẫn URL (SEO).
==============================================================================
*/

/**
 * Chuyển đổi văn bản tiếng Việt có dấu thành Slug thân thiện với URL (VD: "Tin tức thể thao 2026" -> "tin-tuc-the-thao-2026")
 * @param string $text Chuỗi văn bản tiếng Việt
 * @return string Chuỗi slug chuẩn
 */
if (!function_exists('createSlug')) {
    function createSlug($text)
    {
        // Chuyển toàn bộ chuỗi sang chữ thường UTF-8 và bỏ khoảng trắng 2 đầu
        $text = trim($text);
        $text = mb_strtolower($text, 'UTF-8');

        // Bảng ký tự tiếng Việt có dấu
        $vietnamese = [
            'à','á','ạ','ả','ã','â','ầ','ấ','ậ','ẩ','ẫ','ă','ằ','ắ','ặ','ẳ','ẵ',
            'è','é','ẹ','ẻ','ẽ','ê','ề','ế','ệ','ể','ễ',
            'ì','í','ị','ỉ','ĩ',
            'ò','ó','ọ','ỏ','õ','ô','ồ','ố','ộ','ổ','ỗ','ơ','ờ','ớ','ợ','ở','ỡ',
            'ù','ú','ụ','ủ','ũ','ư','ừ','ứ','ự','ử','ữ',
            'ỳ','ý','ỵ','ỷ','ỹ','đ'
        ];

        // Bảng ký tự Latin tương ứng không dấu
        $latin = [
            'a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a',
            'e','e','e','e','e','e','e','e','e','e','e',
            'i','i','i','i','i',
            'o','o','o','o','o','o','o','o','o','o','o','o','o','o','o','o','o',
            'u','u','u','u','u','u','u','u','u','u','u',
            'y','y','y','y','y','d'
        ];

        // Thay thế ký tự có dấu thành không dấu
        $text = str_replace($vietnamese, $latin, $text);
        
        // Thay các ký tự không phải chữ cái và số bằng dấu gạch ngang (-)
        $text = preg_replace('/[^a-z0-9]+/u', '-', $text);
        
        // Cắt bỏ các dấu gạch ngang dư thừa ở hai đầu chuỗi
        return trim($text, '-');
    }
}

