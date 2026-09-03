<?php

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/auth.php';


// Bắt buộc đăng nhập
requireLogin();

$userId = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];


try {


    // =========================================================
    // POST: Thêm bình luận
    // Input:
    // article_id
    // content
    // =========================================================
    if ($method === 'POST') {


        $input = json_decode(
            file_get_contents('php://input'),
            true
        );


        if (!is_array($input)) {

            jsonResponse(
                false,
                null,
                "Dữ liệu gửi lên không hợp lệ"
            );

        }


        $articleId = $input['article_id'] ?? null;
        $content = trim($input['content'] ?? '');



        if (!$articleId || $content === '') {

            jsonResponse(
                false,
                null,
                "Vui lòng nhập đầy đủ thông tin"
            );

        }



        // Kiểm tra bài viết tồn tại
        $stmt = $pdo->prepare("
            SELECT id
            FROM articles
            WHERE id = ?
            LIMIT 1
        ");


        $stmt->execute([$articleId]);


        if (!$stmt->fetch()) {

            jsonResponse(
                false,
                null,
                "Không tìm thấy bài viết"
            );

        }



        // Thêm bình luận
        $stmt = $pdo->prepare("
            INSERT INTO comments
            (
                article_id,
                user_id,
                content
            )
            VALUES (?, ?, ?)
        ");


        $stmt->execute([
            $articleId,
            $userId,
            $content
        ]);



        jsonResponse(
            true,
            null,
            "Bình luận thành công"
        );

    }




    // =========================================================
    // DELETE: Xóa bình luận của chính mình
    // Input:
    // comment_id
    // =========================================================
    if ($method === 'DELETE') {


        $input = json_decode(
            file_get_contents('php://input'),
            true
        );


        if (!is_array($input)) {

            jsonResponse(
                false,
                null,
                "Dữ liệu gửi lên không hợp lệ"
            );

        }



        $commentId = $input['comment_id'] ?? null;



        if (!$commentId) {

            jsonResponse(
                false,
                null,
                "Thiếu comment_id"
            );

        }



        // Kiểm tra comment thuộc user đang đăng nhập
        $stmt = $pdo->prepare("
            SELECT user_id
            FROM comments
            WHERE id = ?
            LIMIT 1
        ");


        $stmt->execute([$commentId]);


        $comment = $stmt->fetch(PDO::FETCH_ASSOC);



        if (!$comment) {

            jsonResponse(
                false,
                null,
                "Không tìm thấy bình luận"
            );

        }



        // Chỉ được xóa comment của chính mình
        if ($comment['user_id'] != $userId) {

            jsonResponse(
                false,
                null,
                "Bạn không có quyền xóa bình luận này"
            );

        }



        // Xóa bình luận
        $stmt = $pdo->prepare("
            DELETE FROM comments
            WHERE id = ?
        ");


        $stmt->execute([$commentId]);



        jsonResponse(
            true,
            null,
            "Xóa bình luận thành công"
        );

    }




    // Method không hỗ trợ

    jsonResponse(
        false,
        null,
        "Phương thức không được hỗ trợ"
    );



} catch (PDOException $e) {


    jsonResponse(
        false,
        null,
        "Lỗi hệ thống, vui lòng thử lại sau"
    );

}

?>