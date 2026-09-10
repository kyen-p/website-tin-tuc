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
    header('Content-Type: application/json');
    echo json_encode(["success" => $success, "message" => $message, "data" => $data]);
    exit;
}
