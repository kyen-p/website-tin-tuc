/**
 * ==============================================================================
 * MẠCH TIN - CHANGE-PASSWORD.JS (Xử lý Đổi mật khẩu)
 * ==============================================================================
 */

function initChangePasswordPage() {
  // 1. Kiểm tra đăng nhập (Bảo vệ tuyến đường)
  const currentUser =
    typeof getCurrentUser === "function" ? getCurrentUser() : null;
  if (!currentUser) {
    if (typeof showToast === "function") {
      showToast("Vui lòng đăng nhập để đổi mật khẩu", "warning");
    }
    setTimeout(() => {
      window.location.href =
        "../public/login.html?redirect=" +
        encodeURIComponent(window.location.href);
    }, 400);
    return;
  }

  // 2. Khởi tạo Header và Footer chung
  if (typeof initPublicHeader === "function")
    initPublicHeader("change-password");
  if (typeof initPublicFooter === "function") initPublicFooter();

  // DOM Elements
  const changePasswordForm = document.getElementById("changePasswordForm");
  const currentPasswordInput = document.getElementById("currentPasswordInput");
  const newPasswordInput = document.getElementById("newPasswordInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");
  const btnResetPasswordForm = document.getElementById("btnResetPasswordForm");
  const toggleButtons = document.querySelectorAll(".btn-toggle-password");

  // Icon SVG Mắt mở & Mắt đóng
  const eyeOpenSvg = `
    <svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;
  const eyeCloseSvg = `
    <svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  `;

  // 3. Xử lý Toggle Ẩn/Hiện mật khẩu
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        btn.innerHTML = eyeCloseSvg;
      } else {
        input.type = "password";
        btn.innerHTML = eyeOpenSvg;
      }
    });
  });

  // 4. Xử lý Reset form
  if (btnResetPasswordForm) {
    btnResetPasswordForm.addEventListener("click", () => {
      if (changePasswordForm) changePasswordForm.reset();
      // Reset type về password
      [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(
        (inp) => {
          if (inp) inp.type = "password";
        },
      );
      toggleButtons.forEach((btn) => {
        btn.innerHTML = eyeOpenSvg;
      });
    });
  }

  // 5. Xử lý Submit Đổi mật khẩu
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const currentPassVal = currentPasswordInput
        ? currentPasswordInput.value.trim()
        : "";
      const newPassVal = newPasswordInput ? newPasswordInput.value.trim() : "";
      const confirmPassVal = confirmPasswordInput
        ? confirmPasswordInput.value.trim()
        : "";

      // Kiểm tra rỗng
      if (!currentPassVal || !newPassVal || !confirmPassVal) {
        if (typeof showToast === "function") {
          showToast("Vui lòng điền đầy đủ tất cả các trường mật khẩu", "error");
        }
        return;
      }

      // Lấy danh sách users từ Storage hoặc mock-data
      const users = typeof getTable === "function" ? getTable("users") : [];
      const userIndex = users.findIndex((u) => u.id === currentUser.id);
      const userRecord = userIndex !== -1 ? users[userIndex] : currentUser;

      // Kiểm tra mật khẩu hiện tại
      const storedPassword =
        userRecord.password ||
        (typeof MOCK_USERS !== "undefined" &&
          MOCK_USERS.find((u) => u.id === currentUser.id)?.password) ||
        "password123";
      if (currentPassVal !== storedPassword) {
        if (typeof showToast === "function") {
          showToast("Mật khẩu hiện tại không chính xác", "error");
        }
        if (currentPasswordInput) {
          currentPasswordInput.focus();
          currentPasswordInput.select();
        }
        return;
      }

      // Kiểm tra điều kiện duy nhất: tối thiểu 8 ký tự
      if (newPassVal.length < 8) {
        if (typeof showToast === "function") {
          showToast("Mật khẩu mới phải có tối thiểu 8 ký tự", "error");
        }
        if (newPasswordInput) newPasswordInput.focus();
        return;
      }

      // Kiểm tra mật khẩu mới không trùng mật khẩu cũ
      if (newPassVal === currentPassVal) {
        if (typeof showToast === "function") {
          showToast(
            "Mật khẩu mới không được trùng với mật khẩu hiện tại",
            "warning",
          );
        }
        if (newPasswordInput) newPasswordInput.focus();
        return;
      }

      // Kiểm tra xác nhận mật khẩu mới
      if (newPassVal !== confirmPassVal) {
        if (typeof showToast === "function") {
          showToast("Xác nhận mật khẩu mới không khớp", "error");
        }
        if (confirmPasswordInput) confirmPasswordInput.focus();
        return;
      }

      // Tiến hành lưu mật khẩu mới
      if (userIndex !== -1) {
        users[userIndex].password = newPassVal;
        users[userIndex].updated_at = new Date().toISOString();
        if (typeof saveTable === "function") {
          saveTable("users", users);
        }
      }

      // Cập nhật phiên đăng nhập hiện tại
      const sessionUser =
        typeof getCurrentUser === "function" ? getCurrentUser() : currentUser;
      if (sessionUser) {
        sessionUser.password = newPassVal;
        localStorage.setItem(
          "mach_tin_current_user",
          JSON.stringify(sessionUser),
        );
      }

      // Xử lý sau khi đổi thành công: Cách 1 (Giữ phiên)
      changePasswordForm.reset();
      [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(
        (inp) => {
          if (inp) inp.type = "password";
        },
      );
      toggleButtons.forEach((btn) => {
        btn.innerHTML = eyeOpenSvg;
      });

      if (typeof showToast === "function") {
        showToast("Đổi mật khẩu thành công!", "success");
      }
    });
  }
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", initChangePasswordPage);
