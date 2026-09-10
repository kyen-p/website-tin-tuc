/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/login.js
 * PHÂN HỆ: Xác thực & Điều hướng (Authentication & Role-based Redirection)
 * MÔ TẢ: Xử lý tương tác form đăng nhập tài khoản vào hệ thống Tòa soạn Báo Mạch Tin:
 *        1. Quản lý trạng thái form: Ẩn/hiện mật khẩu, kiểm tra hợp lệ dữ liệu nhập (Validation).
 *        2. Xử lý gửi biểu mẫu qua API backend/api/auth/login.php.
 *        3. Hiển thị cảnh báo tài khoản bị khóa (kèm lý do do Quản trị viên chỉ định).
 *        4. Điều hướng sau đăng nhập dựa theo vai trò (Role):
 *           - admin -> ../admin/dashboard.html
 *           - editor -> ../editor/dashboard.html
 *           - reporter -> ../reporter/dashboard.html
 *           - user / độc giả -> index.html (hoặc URL redirect được chỉ định)
 * PHẠM VI SỬ DỤNG:
 *   - frontend/public/login.html
 * PHỤ THUỘC:
 *   - frontend/assets/js/common.js (resolveApiUrl, getCurrentUser, showToast)
 *   - backend/api/auth/login.php
 * ==============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==============================================================================
    // KHỐI 1: KHỞI TẠO BIẾN GIAO DIỆN & BẮT SỰ KIỆN ẨN/HIỆN MẬT KHẨU
    // ==============================================================================
    const loginForm = document.getElementById("loginForm");
    const accountInput = document.getElementById("accountInput");
    const passwordInput = document.getElementById("passwordInput");
    const togglePasswordBtn = document.getElementById("togglePasswordBtn");
    const accountField = document.getElementById("accountField");
    const passwordField = document.getElementById("passwordField");
    const accountError = document.getElementById("accountError");
    const passwordError = document.getElementById("passwordError");
    const lockedAlert = document.getElementById("lockedAlert");
    const lockedReasonText = document.getElementById("lockedReasonText");

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener("click", () => {
            const isPassword = passwordInput.getAttribute("type") === "password";
            passwordInput.setAttribute("type", isPassword ? "text" : "password");
            togglePasswordBtn.innerHTML = isPassword
                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            togglePasswordBtn.setAttribute("aria-label", isPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu");
        });
    }

    // ==============================================================================
    // KHỐI 2: TỰ ĐỘNG CHUYỂN HƯỚNG NẾU ĐÃ ĐĂNG NHẬP SẴN
    // ==============================================================================
    const currentUser = getCurrentUser();
    if (currentUser) {
        redirectByRole(currentUser.role);
        return;
    }

    // Xóa cảnh báo lỗi khi người dùng gõ
    accountInput?.addEventListener("input", () => {
        accountField?.classList.remove("has-error");
        lockedAlert?.classList.remove("is-show");
    });
    passwordInput?.addEventListener("input", () => {
        passwordField?.classList.remove("has-error");
        lockedAlert?.classList.remove("is-show");
    });

    // ==============================================================================
    // KHỐI 3: XỬ LÝ SUBMIT FORM ĐĂNG NHẬP & GỌI API BACKEND
    // ==============================================================================
    loginForm?.addEventListener("submit", (e) => {
        e.preventDefault();

        accountField?.classList.remove("has-error");
        passwordField?.classList.remove("has-error");
        lockedAlert?.classList.remove("is-show");

        const account = accountInput.value.trim();
        const password = passwordInput.value;

        let hasError = false;

        if (!account) {
            accountField?.classList.add("has-error");
            if (accountError) accountError.textContent = "Vui lòng nhập Email hoặc Username.";
            hasError = true;
        }

        if (!password) {
            passwordField?.classList.add("has-error");
            if (passwordError) passwordError.textContent = "Vui lòng nhập mật khẩu.";
            hasError = true;
        }

        if (hasError) return;

        const submitBtn = document.getElementById("loginSubmitBtn");
        if (submitBtn) submitBtn.disabled = true;

        // Gọi API backend đăng nhập. "account" có thể là email hoặc username,
        // được gửi lên dưới field "email" đúng specification - backend tự nhận diện.
        fetch(resolveApiUrl("auth/login.php"), {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ email: account, password: password }).toString(),
        })
            .then((res) => res.json())
            .then((result) => {
                if (submitBtn) submitBtn.disabled = false;

                if (!result.success) {
                    // Tài khoản bị khóa
                    if (result.data && result.data.lock_reason !== undefined) {
                        if (lockedAlert) {
                            if (lockedReasonText) {
                                lockedReasonText.textContent = result.data.lock_reason || "Vi phạm quy chế cộng đồng của tòa soạn.";
                            }
                            lockedAlert.classList.add("is-show");
                        }
                        showToast("Tài khoản này đã bị khóa quyền truy cập.", "error");
                        return;
                    }

                    // Sai tài khoản/mật khẩu hoặc lỗi khác
                    accountField?.classList.add("has-error");
                    passwordField?.classList.add("has-error");
                    if (accountError) accountError.textContent = "";
                    if (passwordError) passwordError.textContent = result.message || "Email/Username hoặc mật khẩu không chính xác.";
                    showToast(result.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.", "error");
                    return;
                }

                // Đăng nhập thành công
                showToast("Đăng nhập thành công!", "success");

                setTimeout(() => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectUrl = urlParams.get("redirect");

                    if (redirectUrl) {
                        window.location.href = redirectUrl;
                    } else {
                        redirectByRole(result.data.role);
                    }
                }, 600);
            })
            .catch((error) => {
                if (submitBtn) submitBtn.disabled = false;
                console.error("Lỗi khi gọi API đăng nhập", error);
                showToast("Không thể kết nối máy chủ. Vui lòng thử lại sau.", "error");
            });
    });
});

// ==============================================================================
// KHỐI 4: HÀM ĐIỀU HƯỚNG THEO VAI TRÒ (REDIRECT BY ROLE)
// ==============================================================================
function redirectByRole(role) {
    if (role === "admin") {
        window.location.href = "../admin/dashboard.html";
    } else if (role === "editor") {
        window.location.href = "../editor/dashboard.html";
    } else if (role === "reporter") {
        window.location.href = "../reporter/dashboard.html";
    } else {
        window.location.href = "index.html";
    }
}