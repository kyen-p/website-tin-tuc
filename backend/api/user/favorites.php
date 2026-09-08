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
    // GET: Lấy danh sách bài viết yêu thích của user
    // =========================================================
    if ($method === 'GET') {


        $stmt = $pdo->prepare("
            SELECT
                articles.id,
                articles.title,
                articles.slug,
                articles.short_description,
                articles.cover_image,
                favorites.created_at
            FROM favorites
            INNER JOIN articles
                ON favorites.article_id = articles.id
            WHERE favorites.user_id = ? AND articles.status = 'published'
            ORDER BY favorites.created_at DESC
        ");


        $stmt->execute([$userId]);

        $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);


        jsonResponse(
            true,
            $favorites,
            "Lấy danh sách yêu thích thành công"
        );

    }



    // =========================================================
    // POST: Thêm bài viết vào danh sách yêu thích
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


        if (!$articleId) {

            jsonResponse(
                false,
                null,
                "Thiếu article_id"
            );

        }



        // Kiểm tra bài viết tồn tại và đã xuất bản
        $stmt = $pdo->prepare("
            SELECT id
            FROM articles
            WHERE id = ? AND status = 'published'
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



        // Kiểm tra đã yêu thích chưa
        $stmt = $pdo->prepare("
            SELECT *
            FROM favorites
            WHERE user_id = ?
            AND article_id = ?
            LIMIT 1
        ");


        $stmt->execute([
            $userId,
            $articleId
        ]);



        if ($stmt->fetch()) {

            jsonResponse(
                false,
                null,
                "Bài viết đã có trong danh sách yêu thích"
            );

        }



        // Thêm yêu thích
        $stmt = $pdo->prepare("
            INSERT INTO favorites
            (
                user_id,
                article_id
            )
            VALUES (?, ?)
        ");


        $stmt->execute([
            $userId,
            $articleId
        ]);



        jsonResponse(
            true,
            null,
            "Thêm yêu thích thành công"
        );

    }




    // =========================================================
    // DELETE: Xóa bài viết khỏi danh sách yêu thích
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



        $articleId = $input['article_id'] ?? null;


        if (!$articleId) {

            jsonResponse(
                false,
                null,
                "Thiếu article_id"
            );

        }



        $stmt = $pdo->prepare("
            DELETE FROM favorites
            WHERE user_id = ?
            AND article_id = ?
        ");



        $stmt->execute([
            $userId,
            $articleId
        ]);



        jsonResponse(
            true,
            null,
            "Xóa yêu thích thành công"
        );

    }



    // =========================================================
    // Method khác
    // =========================================================

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