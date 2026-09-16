<?php
/*
==============================================================================
TÊN FILE: backend/helpers/response.php
PHÂN HỆ: Trợ giúp Xử lý Phản hồi API (Response Helper)
MÔ TẢ: Định dạng dữ liệu trả về theo chuẩn JSON cho toàn bộ API hệ thống:
       - jsonResponse: Trả về kết quả thao tác đơn lẻ hoặc danh sách ngắn.
       - getPaginationParams: Đọc và tính toán tham số phân trang từ URL (page, limit, offset).
       - jsonPaginatedResponse: Trả về danh sách có kèm thông tin phân trang (tổng số trang, tổng số dòng).
PHẠM VI SỬ DỤNG:
       - Dùng chung cho tất cả các endpoint API trong backend/api/**
==============================================================================
*/

/**
 * Trả về phản hồi JSON chuẩn và kết thúc xử lý
 * @param bool $success Trạng thái (true: thành công, false: thất bại)
 * @param mixed $data Dữ liệu kèm theo (object, array, null)
 * @param string $message Thông báo phản hồi cho người dùng
 * @param int $statusCode Mã HTTP status code (200, 400, 401, 403, 500...)
 */
function jsonResponse($success, $data = null, $message = "", $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    
    echo json_encode([
        "success" => $success, 
        "message" => $message, 
        "data" => $data
    ], JSON_UNESCAPED_UNICODE);
    
    exit;
}

/**
 * Lấy và tính toán các tham số phân trang từ query string ($_GET)
 * @param int $defaultLimit Số phần tử mặc định trên mỗi trang (mặc định 10)
 * @param int $maxLimit Số phần tử tối đa cho phép trên mỗi trang (mặc định 50)
 * @return array Mảng gồm [$page, $limit, $offset] để đưa trực tiếp vào SQL LIMIT/OFFSET
 */
function getPaginationParams($defaultLimit = 10, $maxLimit = 50) {
    // Lấy số trang hiện tại, tối thiểu là 1
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    
    // Giới hạn số lượng bản ghi hiển thị trên 1 trang để tránh tải quá tải CSDL
    $limit = isset($_GET['limit']) ? min($maxLimit, max(1, (int)$_GET['limit'])) : $defaultLimit;
    
    // Tính khoảng cách offset để truy vấn CSDL
    $offset = ($page - 1) * $limit;
    
    return [$page, $limit, $offset];
}

/**
 * Trả về phản hồi JSON kèm dữ liệu phân trang chuẩn
 * @param bool $success Trạng thái kết quả
 * @param mixed $data Danh sách dữ liệu của trang hiện tại
 * @param int $totalRecords Tổng số bản ghi trong CSDL thỏa mãn điều kiện
 * @param int $page Trang hiện tại
 * @param int $limit Số bản ghi trên 1 trang
 * @param string $message Thông báo
 */
function jsonPaginatedResponse($success, $data, $totalRecords, $page, $limit, $message = "") {
    header('Content-Type: application/json; charset=utf-8');
    
    // Tính tổng số trang (làm tròn lên)
    $totalPages = $limit > 0 ? (int)ceil($totalRecords / $limit) : 1;
    
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
    ], JSON_UNESCAPED_UNICODE);
    
    exit;
}
