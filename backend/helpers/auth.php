<?php
session_start();
function requireLogin() {
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(false, null, "Bạn cần đăng nhập");
    }
}
function requireRole($roles) {
    requireLogin();
    if (!in_array($_SESSION['role'], $roles)) {
        jsonResponse(false, null, "Không có quyền truy cập");
    }
}