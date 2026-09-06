<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';

// =========================================================
// KIỂM TRA QUYỀN TRUY CẬP
// =========================================================

// Chỉ Reporter mới được tạo bài viết
requireRole(['reporter']);

// Chỉ cho phép phương thức POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, null, "Phương thức không được hỗ trợ");
}

// =========================================================
// ĐỌC DỮ LIỆU TỪ FRONTEND
// =========================================================

// Frontend gửi dữ liệu JSON
$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    jsonResponse(false, null, "Dữ liệu gửi lên không hợp lệ");
}

// =========================================================
// LẤY DỮ LIỆU
// =========================================================

$title = isset($input['title'])
    ? trim($input['title'])
    : '';

$shortDescription = isset($input['short_description'])
    ? trim($input['short_description'])
    : '';

$content = isset($input['content'])
    ? trim($input['content'])
    : '';

$coverImage = isset($input['cover_image'])
    ? trim($input['cover_image'])
    : '';

$categoryId = isset($input['category_id'])
    ? (int) $input['category_id']
    : 0;

$status = isset($input['status'])
    ? trim($input['status'])
    : 'draft';

$tags = isset($input['tags']) && is_array($input['tags'])
    ? $input['tags']
    : [];

// ID của Reporter đang đăng nhập
$authorId = (int) $_SESSION['user_id'];


// =========================================================
// KIỂM TRA STATUS
// =========================================================

$allowedStatuses = ['draft', 'pending'];

if (!in_array($status, $allowedStatuses, true)) {
    jsonResponse(false, null, "Trạng thái bài viết không hợp lệ");
}


// =========================================================
// KIỂM TRA DỮ LIỆU THEO TỪNG TRẠNG THÁI
// =========================================================

// ---------------------------------------------------------
// LƯU NHÁP
// ---------------------------------------------------------
// Draft có thể chưa hoàn chỉnh.
// Chỉ yêu cầu tiêu đề để xác định bài viết.

if ($status === 'draft') {

    if ($title === '') {
        jsonResponse(false, null, "Tiêu đề không được để trống khi lưu bản nháp");
    }
}


// ---------------------------------------------------------
// GỬI CHỜ DUYỆT
// ---------------------------------------------------------
// Pending phải có đầy đủ thông tin cần thiết.

if ($status === 'pending') {

    if ($title === '') {
        jsonResponse(false, null, "Tiêu đề không được để trống");
    }

    if ($shortDescription === '') {
        jsonResponse(false, null, "Mô tả ngắn không được để trống khi gửi duyệt");
    }

    if ($content === '') {
        jsonResponse(false, null, "Nội dung bài viết không được để trống khi gửi duyệt");
    }

    if ($categoryId <= 0) {
        jsonResponse(false, null, "Vui lòng chọn chuyên mục trước khi gửi duyệt");
    }
}


// =========================================================
// HÀM TẠO SLUG
// =========================================================

function createSlug($text)
{
    $text = trim($text);

    // Chuyển về chữ thường
    $text = mb_strtolower($text, 'UTF-8');

    // Chuyển đ thành d
    $text = str_replace('đ', 'd', $text);

    // Chuyển tiếng Việt có dấu thành không dấu
    $text = preg_replace(
        [
            '/[áàảãạăắằẳẵặâấầẩẫậ]/u',
            '/[éèẻẽẹêếềểễệ]/u',
            '/[íìỉĩị]/u',
            '/[óòỏõọôốồổỗộơớờởỡợ]/u',
            '/[úùủũụưứừửữự]/u',
            '/[ýỳỷỹỵ]/u'
        ],
        [
            'a',
            'e',
            'i',
            'o',
            'u',
            'y'
        ],
        $text
    );

    // Các ký tự không phải chữ hoặc số thành dấu -
    $text = preg_replace('/[^a-z0-9]+/u', '-', $text);

    // Xóa dấu - ở đầu và cuối
    $text = trim($text, '-');

    return $text;
}


// =========================================================
// LƯU BÀI VIẾT
// =========================================================

try {

    // =====================================================
    // KIỂM TRA CATEGORY
    // =====================================================
    // Chỉ kiểm tra nếu Reporter đã chọn category.
    // Draft có thể chưa chọn category.

    if ($categoryId > 0) {

        $stmt = $pdo->prepare("
            SELECT id
            FROM categories
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([$categoryId]);

        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            jsonResponse(false, null, "Chuyên mục không tồn tại");
        }
    }


    // =====================================================
    // TẠO SLUG KHÔNG TRÙNG
    // =====================================================

    $baseSlug = createSlug($title);

    if ($baseSlug === '') {
        jsonResponse(false, null, "Không thể tạo slug từ tiêu đề");
    }

    $slug = $baseSlug;
    $counter = 1;

    while (true) {

        $stmt = $pdo->prepare("
            SELECT id
            FROM articles
            WHERE slug = ?
            LIMIT 1
        ");

        $stmt->execute([$slug]);

        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            break;
        }

        $slug = $baseSlug . '-' . $counter;
        $counter++;
    }


    // =====================================================
    // BẮT ĐẦU TRANSACTION
    // =====================================================

    $pdo->beginTransaction();


    // =====================================================
    // THÊM BÀI VIẾT
    // =====================================================

    $stmt = $pdo->prepare("
        INSERT INTO articles (
            title,
            slug,
            short_description,
            content,
            cover_image,
            author_id,
            category_id,
            status,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $stmt->execute([
        $title,
        $slug,

        // Draft có thể để trống
        $shortDescription !== ''
            ? $shortDescription
            : null,

        // Draft có thể để trống
        $content !== ''
            ? $content
            : null,

        // Ảnh bìa có thể để trống
        $coverImage !== ''
            ? $coverImage
            : null,

        $authorId,

        // Nếu chưa chọn category thì lưu NULL
        $categoryId > 0
            ? $categoryId
            : null,

        $status
    ]);

    // Lấy ID bài viết vừa tạo
    $articleId = (int) $pdo->lastInsertId();


    // =====================================================
    // XỬ LÝ TAGS
    // =====================================================

    // Loại bỏ tag trùng nhau
    $uniqueTags = array_unique($tags);

    foreach ($uniqueTags as $tagId) {

        $tagId = (int) $tagId;

        // Bỏ qua giá trị không hợp lệ
        if ($tagId <= 0) {
            continue;
        }

        // Kiểm tra tag có tồn tại
        $stmt = $pdo->prepare("
            SELECT id
            FROM tags
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->execute([$tagId]);

        // Nếu tag không tồn tại thì báo lỗi
        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {

            $pdo->rollBack();

            jsonResponse(
                false,
                null,
                "Tag có ID " . $tagId . " không tồn tại"
            );
        }

        // Gắn tag vào bài viết
        $stmt = $pdo->prepare("
            INSERT INTO article_tags (
                article_id,
                tag_id
            )
            VALUES (?, ?)
        ");

        $stmt->execute([
            $articleId,
            $tagId
        ]);
    }


    // =====================================================
    // HOÀN TẤT TRANSACTION
    // =====================================================

    $pdo->commit();


    // =====================================================
    // TRẢ KẾT QUẢ
    // =====================================================

    jsonResponse(
        true,
        [
            "id" => $articleId,
            "title" => $title,
            "slug" => $slug,
            "status" => $status
        ],
        $status === 'draft'
            ? "Lưu bản nháp thành công"
            : "Gửi bài viết chờ duyệt thành công"
    );

} catch (PDOException $e) {

    // Nếu lỗi khi đang transaction thì hoàn tác
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse(
        false,
        null,
        "Lỗi hệ thống, vui lòng thử lại sau"
    );
}