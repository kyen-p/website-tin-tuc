<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/helpers/response.php
 * PHÂN HỆ: Trợ giúp Xử lý Phản hồi (Backend Response Helper)
 * MÔ TẢ: Chuẩn hóa định dạng phản hồi JSON trả về cho toàn bộ các yêu cầu API.
 * PHẠM VI SỬ DỤNG:
 *   - [TẬP TIN DÙNG CHUNG CỐT LÕI]
 *   - Được require_once bởi HẦU HẾT các API endpoint trong backend/api/**
 * ==============================================================================
 */

/**
 * [HÀM DÙNG CHUNG TOÀN HỆ THỐNG] jsonResponse
 * - Chức năng: Thiết lập Header JSON, đóng gói dữ liệu phản hồi theo cấu trúc
 *   thống nhất { success, message, data } và kết thúc thực thi kịch bản (exit).
 * - Được gọi bởi: Toàn bộ các API backend khi trả kết quả thành công hoặc báo lỗi về frontend.
 * 
 * @param bool $success Trạng thái kết quả thao tác (true: thành công, false: thất bại)
 * @param mixed $data Dữ liệu kèm theo trả về client (mảng, object, null)
 * @param string $message Thông điệp giải thích kết quả gửi tới người dùng
 * @return void (Hàm xuất chuỗi JSON và dừng chương trình ngay lập tức)
 */
function jsonResponse($success, $data = null, $message = "") {
    // Bước 1: Thiết lập tiêu đề giao thức HTTP Content-Type định dạng dữ liệu JSON
    header('Content-Type: application/json');
    
    // Bước 2: Mã hóa mảng dữ liệu thành chuỗi JSON chuẩn và xuất ra luồng đầu ra
    echo json_encode(["success" => $success, "message" => $message, "data" => $data]);
    
    // Bước 3: Dừng thực thi kịch bản máy chủ PHP ngay lập tức
    exit;
}

/**
 * [HÀM DÙNG CHUNG TOÀN HỆ THỐNG] getPaginationParams
 * - Chức năng: Lấy và chuẩn hóa các tham số phân trang từ $_GET (page, limit, offset).
 * - Kiểm tra tính hợp lệ: page >= 1, limit nằm trong khoảng 1 đến $maxLimit.
 * 
 * @param int $defaultLimit Số bản ghi mặc định trên 1 trang (mặc định 10)
 * @param int $maxLimit Số bản ghi tối đa cho phép trên 1 trang (mặc định 50)
 * @return array [$page, $limit, $offset]
 */
function getPaginationParams($defaultLimit = 10, $maxLimit = 50) {
    // Bước 1: Chuẩn hóa số thứ tự trang hiện tại (tối thiểu là trang 1)
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    
    // Bước 2: Chuẩn hóa số lượng bản ghi hiển thị trên một trang (ràng buộc từ 1 đến giới hạn tối đa)
    $limit = isset($_GET['limit']) ? min($maxLimit, max(1, (int)$_GET['limit'])) : $defaultLimit;
    
    // Bước 3: Tính toán độ lệch bản ghi OFFSET cho câu lệnh truy vấn CSDL
    $offset = ($page - 1) * $limit;
    
    // Bước 4: Trả về bộ ba tham số phân trang [$page, $limit, $offset]
    return [$page, $limit, $offset];
}

/**
 * [HÀM DÙNG CHUNG TOÀN HỆ THỐNG] jsonPaginatedResponse
 * - Chức năng: Đóng gói phản hồi API có cấu trúc phân trang chuẩn mực:
 *   { success, message, data, pagination: { current_page, per_page, total_records, total_pages } }
 * 
 * @param bool $success Trạng thái kết quả thao tác
 * @param mixed $data Danh sách bản ghi thuộc trang hiện tại
 * @param int $totalRecords Tổng số bản ghi thỏa điều kiện lọc trong CSDL
 * @param int $page Trang hiện tại
 * @param int $limit Số bản ghi mỗi trang
 * @param string $message Thông điệp giải thích
 * @return void
 */
function jsonPaginatedResponse($success, $data, $totalRecords, $page, $limit, $message = "") {
    // Bước 1: Thiết lập tiêu đề giao thức HTTP Content-Type định dạng dữ liệu JSON
    header('Content-Type: application/json');
    
    // Bước 2: Tính toán tổng số trang dựa trên tổng số bản ghi và kích thước trang
    $totalPages = $limit > 0 ? (int)ceil($totalRecords / $limit) : 1;
    
    // Bước 3: Đóng gói cấu trúc phản hồi kèm trường pagination chuẩn mực và xuất JSON
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data,
        "pagination" => [
            "current_page" => (int)$page,
            "per_page" => (int)$limit,
            "total_records" => (int)$totalRecords,
            "total_pages" => $totalPages
        ]
    ]);
    
    // Bước 4: Dừng thực thi kịch bản máy chủ PHP ngay lập tức
    exit;
}
