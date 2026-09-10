/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/register.js
 * PHÂN HỆ: Xác thực & Đăng ký Độc giả (Reader Registration Module)
 * MÔ TẢ: Xử lý giao diện và nghiệp vụ đăng ký tài khoản độc giả mới:
 *        1. Quản lý trạng thái form: Ẩn/hiện mật khẩu và xác nhận mật khẩu.
 *        2. Kiểm tra tính hợp lệ dữ liệu nhập (Client-side Validation): Họ tên, username, email, mật khẩu tối thiểu 8 ký tự.
 *        3. Gửi thông tin đăng ký đến API backend/api/auth/register.php.
 *        4. Hiển thị thông báo kết quả (thành công hoặc lỗi chi tiết theo từng ô nhập).
 *        5. Tự động chuyển hướng sang trang đăng nhập (login.html) khi tạo tài khoản thành công.
 * PHẠM VI SỬ DỤNG:
 *   - frontend/public/register.html
 * PHỤ THUỘC:
 *   - frontend/assets/js/common.js (resolveApiUrl, showToast)
 *   - backend/api/auth/register.php
 * ==============================================================================
 */

// ==============================================================================
// KHỐI 1: HÀM HỖ TRỢ ẨN/HIỆN MẬT KHẨU (PASSWORD TOGGLE)
// ==============================================================================
function setupToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.addEventListener("click", () => {
      const isPassword = input.getAttribute("type") === "password";
      input.setAttribute("type", isPassword ? "text" : "password");
      btn.innerHTML = isPassword
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      btn.setAttribute("aria-label", isPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu");
    });
}

// ==============================================================================
// KHỐI 2: KHỞI TẠO BIỂU MẪU & XỬ LÝ SUBMIT ĐĂNG KÝ
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
  setupToggle("togglePasswordBtn", "passwordInput");
  setupToggle("toggleConfirmPasswordBtn", "confirmPasswordInput");

  const registerForm = document.getElementById("registerForm");
  const fullNameInput = document.getElementById("fullNameInput");
  const usernameInput = document.getElementById("usernameInput");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");

  const fullNameField = document.getElementById("fullNameField");
  const usernameField = document.getElementById("usernameField");
  const emailField = document.getElementById("emailField");
  const passwordField = document.getElementById("passwordField");
  const confirmPasswordField = document.getElementById("confirmPasswordField");

  const fullNameError = document.getElementById("fullNameError");
  const usernameError = document.getElementById("usernameError");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const confirmPasswordError = document.getElementById("confirmPasswordError");

  // Xóa lỗi khi gõ phím
  [
    [fullNameInput, fullNameField],
    [usernameInput, usernameField],
    [emailInput, emailField],
    [passwordInput, passwordField],
    [confirmPasswordInput, confirmPasswordField],
  ].forEach(([input, field]) => {
    input?.addEventListener("input", () => field?.classList.remove("has-error"));
  });

  registerForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    [fullNameField, usernameField, emailField, passwordField, confirmPasswordField].forEach((f) =>
      f?.classList.remove("has-error")
    );

    const fullName = fullNameInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    let isValid = true;

    // 1. Họ và tên
    if (!fullName) {
      setError(fullNameField, fullNameError, "Vui lòng nhập họ và tên của bạn.");
      isValid = false;
    } else if (fullName.length < 2) {
      setError(fullNameField, fullNameError, "Họ và tên tối thiểu 2 ký tự.");
      isValid = false;
    }

    // 2. Username (kiểm tra định dạng phía client; trùng username sẽ do backend xác nhận)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!username) {
      setError(usernameField, usernameError, "Vui lòng nhập username.");
      isValid = false;
    } else if (username.length < 3) {
      setError(usernameField, usernameError, "Username phải có ít nhất 3 ký tự.");
      isValid = false;
    } else if (!usernameRegex.test(username)) {
      setError(usernameField, usernameError, "Username chỉ chứa chữ cái, số và dấu gạch dưới.");
      isValid = false;
    }

    // 3. Email (kiểm tra định dạng phía client; trùng email sẽ do backend xác nhận)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError(emailField, emailError, "Vui lòng nhập email.");
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setError(emailField, emailError, "Địa chỉ email không đúng định dạng.");
      isValid = false;
    }

    // 4. Mật khẩu
    if (!password) {
      setError(passwordField, passwordError, "Vui lòng nhập mật khẩu.");
      isValid = false;
    } else if (password.length < 8) {
      setError(passwordField, passwordError, "Mật khẩu tối thiểu 8 ký tự.");
      isValid = false;
    }

    // 5. Xác nhận mật khẩu
    if (!confirmPassword) {
      setError(confirmPasswordField, confirmPasswordError, "Vui lòng nhập lại mật khẩu.");
      isValid = false;
    } else if (password !== confirmPassword) {
      setError(confirmPasswordField, confirmPasswordError, "Mật khẩu xác nhận không khớp.");
      isValid = false;
    }

    if (!isValid) {
      showToast("Vui lòng kiểm tra lại các trường thông tin.", "error");
      return;
    }

    const submitBtn = document.getElementById("registerSubmitBtn");
    if (submitBtn) submitBtn.disabled = true;

    fetch(resolveApiUrl("auth/register.php"), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        username: username,
        email: email,
        password: password,
        full_name: fullName,
      }).toString(),
    })
      .then((res) => res.json())
      .then((result) => {
        if (submitBtn) submitBtn.disabled = false;

        if (!result.success) {
          const msg = result.message || "";
          // Cố gắng gán lỗi đúng ô dựa trên nội dung message trả về từ backend
          if (msg.toLowerCase().includes("tên đăng nhập") || msg.toLowerCase().includes("username")) {
            setError(usernameField, usernameError, msg);
          } else if (msg.toLowerCase().includes("email")) {
            setError(emailField, emailError, msg);
          }
          showToast(msg || "Đăng ký thất bại. Vui lòng thử lại.", "error");
          return;
        }

        showToast("Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...", "success");

        // Chuyển sang login.html để trống form
        setTimeout(() => {
          window.location.href = "login.html";
        }, 900);
      })
      .catch((error) => {
        if (submitBtn) submitBtn.disabled = false;
        console.error("Lỗi khi gọi API đăng ký", error);
        showToast("Không thể kết nối máy chủ. Vui lòng thử lại sau.", "error");
      });
  });
});

// ==============================================================================
// KHỐI 3: HÀM TIỆN ÍCH GÁN TRẠNG THÁI LỖI CHO TRƯỜNG DỮ LIỆU
// ==============================================================================
function setError(fieldElem, errorElem, message) {
  if (fieldElem) fieldElem.classList.add("has-error");
  if (errorElem) errorElem.textContent = message;
}