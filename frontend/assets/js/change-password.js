/**
 * ==============================================================================
 * MẠCH TIN - CHANGE-PASSWORD.JS
 * Kết nối PHP API: backend/api/user/change-password.php
 * ==============================================================================
 */

const CHANGE_PASSWORD_API = "../../backend/api/user/change-password.php";

function initChangePasswordPage() {
  // DOM Elements
  const changePasswordForm = document.getElementById("changePasswordForm");
  const currentPasswordInput = document.getElementById("currentPasswordInput");
  const newPasswordInput = document.getElementById("newPasswordInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");
  const btnResetPasswordForm = document.getElementById("btnResetPasswordForm");
  const toggleButtons = document.querySelectorAll(".btn-toggle-password");

  // Icon mắt mở
  const eyeOpenSvg = `
    <svg
      class="eye-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;

  // Icon mắt đóng
  const eyeCloseSvg = `
    <svg
      class="eye-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  `;

  // Toggle ẩn / hiện mật khẩu
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

  // Reset form
  function resetPasswordForm() {
    if (changePasswordForm) {
      changePasswordForm.reset();
    }

    [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(
      (input) => {
        if (input) {
          input.type = "password";
        }
      },
    );

    toggleButtons.forEach((btn) => {
      btn.innerHTML = eyeOpenSvg;
    });
  }

  if (btnResetPasswordForm) {
    btnResetPasswordForm.addEventListener("click", () => {
      resetPasswordForm();
    });
  }

  // Submit đổi mật khẩu
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const oldPassword = currentPasswordInput
        ? currentPasswordInput.value.trim()
        : "";

      const newPassword = newPasswordInput ? newPasswordInput.value.trim() : "";

      const confirmPassword = confirmPasswordInput
        ? confirmPasswordInput.value.trim()
        : "";

      // Kiểm tra rỗng
      if (!oldPassword || !newPassword || !confirmPassword) {
        if (typeof showToast === "function") {
          showToast("Vui lòng điền đầy đủ tất cả các trường mật khẩu", "error");
        }
        return;
      }

      // Tối thiểu 8 ký tự
      if (newPassword.length < 8) {
        if (typeof showToast === "function") {
          showToast("Mật khẩu mới phải có tối thiểu 8 ký tự", "error");
        }

        if (newPasswordInput) {
          newPasswordInput.focus();
        }

        return;
      }

      // Mật khẩu mới không trùng mật khẩu cũ
      if (newPassword === oldPassword) {
        if (typeof showToast === "function") {
          showToast(
            "Mật khẩu mới không được trùng với mật khẩu hiện tại",
            "warning",
          );
        }

        if (newPasswordInput) {
          newPasswordInput.focus();
        }

        return;
      }

      // Xác nhận mật khẩu
      if (newPassword !== confirmPassword) {
        if (typeof showToast === "function") {
          showToast("Xác nhận mật khẩu mới không khớp", "error");
        }

        if (confirmPasswordInput) {
          confirmPasswordInput.focus();
        }

        return;
      }

      try {
        const response = await fetch(CHANGE_PASSWORD_API, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          if (typeof showToast === "function") {
            showToast(result.message || "Đổi mật khẩu thất bại", "error");
          }
          return;
        }

        resetPasswordForm();

        if (typeof showToast === "function") {
          showToast(result.message || "Đổi mật khẩu thành công!", "success");
        }
      } catch (error) {
        console.error("Lỗi đổi mật khẩu:", error);

        if (typeof showToast === "function") {
          showToast(
            "Không thể kết nối đến máy chủ. Vui lòng thử lại.",
            "error",
          );
        }
      }
    });
  }
}

// Khởi chạy
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChangePasswordPage);
} else {
  initChangePasswordPage();
}
