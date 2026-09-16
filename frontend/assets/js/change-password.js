/*
==============================================================================
TÊN FILE: frontend/assets/js/change-password.js
PHÂN HỆ: Đổi mật khẩu tài khoản
MÔ TẢ: Quản lý quy trình đổi mật khẩu của tài khoản hiện tại:
       - Kiểm tra hợp lệ mật khẩu mới (tối thiểu 8 ký tự, không trùng mật khẩu cũ, khớp xác nhận)
       - Ẩn/hiện mật khẩu bằng icon mắt
       - Gửi yêu cầu cập nhật mật khẩu qua API backend/api/user/change-password.php
       - Hiển thị thông báo và đặt lại form khi thành công
PHẠM VI SỬ DỤNG:
       - frontend/user/change-password.html
PHỤ THUỘC:
       - frontend/assets/js/common.js
       - backend/api/user/change-password.php
==============================================================================
*/

const CHANGE_PASSWORD_API = "../../backend/api/user/change-password.php";

// 1. Khởi tạo khung trang và đăng ký các phần tử giao diện
async function initChangePasswordPage() {
  if (typeof initPublicHeader === "function") {
    await initPublicHeader("change-password");
  }
  if (typeof initPublicFooter === "function") {
    await initPublicFooter();
  } 
  // Truy xuất các phần tử giao diện DOM (Document Object Model) của biểu mẫu đổi mật khẩu
  const changePasswordForm = document.getElementById("changePasswordForm");
  const currentPasswordInput = document.getElementById("currentPasswordInput");
  const newPasswordInput = document.getElementById("newPasswordInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");
  const btnResetPasswordForm = document.getElementById("btnResetPasswordForm");
  const toggleButtons = document.querySelectorAll(".btn-toggle-password");

  // 2. Tùy chọn ẩn / hiện mật khẩu và đặt lại biểu mẫu
  // Biểu tượng SVG mắt mở (trạng thái hiển thị mật khẩu)
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

  // Biểu tượng SVG mắt đóng (trạng thái ẩn bảo mật mật khẩu)
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

  // Gắn trình lắng nghe sự kiện Event Listener cho các nút chuyển đổi ẩn / hiện mật khẩu
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

  // Hàm làm mới toàn bộ biểu mẫu (Reset Form) về trạng thái trống ban đầu
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

  // 3. Kiểm tra tính hợp lệ và gửi yêu cầu đổi mật khẩu qua API
  // Xử lý sự kiện gửi form (Form Submit Event Handler)
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

      // Kiểm tra rỗng: Đảm bảo không bỏ trống trường nào
      if (!oldPassword || !newPassword || !confirmPassword) {
        if (typeof showToast === "function") {
          showToast("Vui lòng điền đầy đủ tất cả các trường mật khẩu", "error");
        }
        return;
      }

      // Kiểm tra độ dài an toàn: Tối thiểu 8 ký tự
      if (newPassword.length < 8) {
        if (typeof showToast === "function") {
          showToast("Mật khẩu mới phải có tối thiểu 8 ký tự", "error");
        }

        if (newPasswordInput) {
          newPasswordInput.focus();
        }

        return;
      }

      // Kiểm tra logic bảo mật: Mật khẩu mới không được trùng mật khẩu hiện tại
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

      // Kiểm tra tính nhất quán: Mật khẩu xác nhận phải trùng khớp 100% với mật khẩu mới
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
        // Gửi yêu cầu HTTP PUT tới API backend để cập nhật mật khẩu mới
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

        // Làm mới biểu mẫu và hiển thị thông báo thành công dạng Toast
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

// Khởi chạy module khi cây cấu trúc tài liệu DOM đã sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChangePasswordPage);
} else {
  initChangePasswordPage();
}
