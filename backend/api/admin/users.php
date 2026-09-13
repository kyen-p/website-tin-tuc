<?php
/**
 * ==============================================================================
 * TÊN FILE: backend/api/admin/users.php
 * PHÂN HỆ: API Quản trị Tài khoản Người dùng (User Administration Service)
 * MÔ TẢ: Cung cấp các công cụ quản lý thành viên cho Quản trị viên (Admin):
 *        - GET: Lấy danh sách toàn bộ tài khoản người dùng trong hệ thống kèm trạng thái khóa.
 *        - PUT: Phân quyền vai trò người dùng (user, reporter, editor) hoặc Khóa/Mở khóa tài khoản kèm lý do.
 *        - Cơ chế bảo vệ: Nghiêm cấm tự khóa tài khoản của chính mình hoặc can thiệp tài khoản Admin.
 * PHẠM VI SỬ DỤNG:
 *   - [KHU VỰC QUẢN TRỊ TỐI CAO - ADMIN]
 *   - Phân quyền: role = 'admin'
 *   - Phương thức: GET, PUT
 * PHỤ THUỘC (HELPERS):
 *   - backend/config/database.php ($pdo)
 *   - backend/helpers/response.php (jsonResponse)
 *   - backend/helpers/auth.php (requireRole, $_SESSION['user_id'])
 * ĐƯỢC GỌI BỞI (FRONTEND):
 *   - frontend/assets/js/admin-users.js (Bảng quản lý tài khoản thành viên)
 * TRẢ VỀ (JSON):
 *   - GET: Danh sách người dùng
 *   - PUT: Kết quả cập nhật vai trò hoặc trạng thái khóa
 * ==============================================================================
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// Kiểm tra quyền hạn Quản trị viên cho toàn bộ tệp API
requireRole(['admin']);

$method = $_SERVER['REQUEST_METHOD'];

// ==============================================================================
// NGHIỆP VỤ 1: GET - LẤY DANH SÁCH TOÀN BỘ NGƯỜI DÙNG TRONG HỆ THỐNG
// ==============================================================================
if ($method === 'GET') {
    $isPaginated = isset($_GET['page']);
    $role = isset($_GET['role']) ? trim($_GET['role']) : '';
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    $whereClauses = [];
    $params = [];

    if ($role !== '' && $role !== 'all') {
        $whereClauses[] = "role = ?";
        $params[] = $role;
    }

    if ($status === 'active') {
        $whereClauses[] = "status = 'active'";
    } elseif ($status === 'locked') {
        $whereClauses[] = "status = 'locked'";
    }

    if ($search !== '') {
        $whereClauses[] = "(full_name LIKE ? OR username LIKE ? OR email LIKE ? OR bio LIKE ?)";
        $like = '%' . $search . '%';
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    $whereSql = !empty($whereClauses) ? " WHERE " . implode(" AND ", $whereClauses) : "";

    $totalRecords = 0;
    $page = 1;
    $limit = 10;
    if ($isPaginated) {
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM users" . $whereSql);
        $countStmt->execute($params);
        $totalRecords = (int)$countStmt->fetchColumn();

        list($page, $limit, $offset) = getPaginationParams(10, 50);
    }

    $sql = "SELECT id, username, email, full_name, avatar, bio, role, status, lock_reason, locked_at, created_at 
            FROM users" . $whereSql . " 
            ORDER BY created_at DESC";

    if ($isPaginated) {
        $sql .= " LIMIT " . (int)$limit . " OFFSET " . (int)$offset;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($isPaginated) {
        jsonPaginatedResponse(true, $users, $totalRecords, $page, $limit);
    } else {
        jsonResponse(true, $users);
    }
}

// ==============================================================================
// NGHIỆP VỤ 2: PUT - PHÂN VAI TRÒ HOẶC KHÓA/MỞ KHÓA TÀI KHOẢN
// ==============================================================================
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = isset($input['user_id']) ? (int)$input['user_id'] : 0;
    $currentAdminId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;

    if ($userId <= 0) {
        jsonResponse(false, null, "ID người dùng không hợp lệ");
    }

    // Kiểm tra thông tin tài khoản đích
    $stmtFind = $pdo->prepare("SELECT id, role, status FROM users WHERE id = ?");
    $stmtFind->execute([$userId]);
    $targetUser = $stmtFind->fetch(PDO::FETCH_ASSOC);

    if (!$targetUser) {
        jsonResponse(false, null, "Không tìm thấy người dùng");
    }

    // Không cho phép thao tác trên tài khoản của chính mình
    if ($userId === $currentAdminId) {
        jsonResponse(false, null, "Không thể tự thao tác trên tài khoản của chính bạn");
    }

    // Không cho phép sửa tài khoản Admin khác qua giao diện này
    if ($targetUser['role'] === 'admin') {
        jsonResponse(false, null, "Tài khoản Quản trị viên được bảo vệ cố định, không thể can thiệp qua giao diện");
    }

    // Cập nhật vai trò (chỉ cho phép luân chuyển giữa user, reporter, editor)
    if (isset($input['role'])) {
        $allowedRoles = ['user', 'reporter', 'editor'];
        if (!in_array($input['role'], $allowedRoles, true)) {
            jsonResponse(false, null, "Vai trò mới không hợp lệ hoặc không có quyền cấp quyền này");
        }
        $stmt = $pdo->prepare("UPDATE users SET role = ? WHERE id = ?");
        $stmt->execute([$input['role'], $userId]);
    }

    // Cập nhật trạng thái khóa hoặc mở khóa tài khoản
    if (isset($input['status'])) {
        if ($input['status'] === 'locked') {
            $stmt = $pdo->prepare("UPDATE users SET status='locked', lock_reason=?, locked_at=NOW() WHERE id=?");
            $stmt->execute([$input['lock_reason'] ?? 'Vi phạm điều khoản cộng đồng', $userId]);
        } else {
            $stmt = $pdo->prepare("UPDATE users SET status='active', lock_reason=NULL, locked_at=NULL WHERE id=?");
            $stmt->execute([$userId]);
        }
    }

    jsonResponse(true, null, "Cập nhật thành công");
}
