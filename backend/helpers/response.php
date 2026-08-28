<?php
function jsonResponse($success, $data = null, $message = "") {
    header('Content-Type: application/json');
    echo json_encode(["success" => $success, "message" => $message, "data" => $data]);
    exit;
}