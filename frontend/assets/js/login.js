/**
 * ==============================================================================
 * MẠCH TIN - LOGIN.JS (Xử lý Đăng nhập & Điều hướng 4 Vai trò)
 * ==============================================================================
 */
document.addEventListener("DOMContentLoaded", () => {
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

    // Nếu đã đăng nhập, tự động điều hướng đúng vai trò
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

        // Tìm kiếm trong bảng users
        const users = getTable("users") || [];
        const accountLower = account.toLowerCase();

        const user = users.find(
            (u) =>
                (u.username && u.username.toLowerCase() === accountLower) ||
                (u.email && u.email.toLowerCase() === accountLower)
        );

        // Kiểm tra khớp mật khẩu
        if (!user || user.password !== password) {
            accountField?.classList.add("has-error");
            passwordField?.classList.add("has-error");

            // Xóa dòng thông báo của ô account để không bị hiện chữ "Vui lòng nhập..."
            if (accountError) {
                accountError.textContent = "";
            }

            if (passwordError) {
                passwordError.textContent = "Email/Username hoặc mật khẩu không chính xác.";
            }
            showToast("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.", "error");
            return;
        }

        // Kiểm tra tài khoản bị khóa
        if (user.status === "locked") {
            if (lockedAlert) {
                if (lockedReasonText) {
                    lockedReasonText.textContent = user.lock_reason || "Vi phạm quy chế cộng đồng của tòa soạn.";
                }
                lockedAlert.classList.add("is-show");
            }
            showToast("Tài khoản này đã bị khóa quyền truy cập.", "error");
            return;
        }

        // Đăng nhập thành công
        setCurrentUser(user);
        showToast(`Đăng nhập thành công!`, "success");

        setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get("redirect");

            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                redirectByRole(user.role);
            }
        }, 600);
    });
});

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