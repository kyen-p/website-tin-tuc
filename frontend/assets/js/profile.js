/**
 * ==============================================================================
 * MẠCH TIN - PROFILE.JS
 *
 * API:
 * GET / PUT  : ../../backend/api/user/profile.php
 * POST upload: ../../backend/api/upload.php
 * ==============================================================================
 */

const PROFILE_API = "../../backend/api/user/profile.php";

const UPLOAD_API = "../../backend/api/upload.php";

let originalUserData = null;
let currentAvatarValue = null;

async function initProfilePage() {
  // DOM Elements
  const userRoleBadge = document.getElementById("userRoleBadge");

  const profileForm = document.getElementById("profileForm");

  const avatarContainer = document.getElementById("avatarPreviewContainer");

  const avatarFileInput = document.getElementById("avatarFileInput");

  const btnRemoveAvatar = document.getElementById("btnRemoveAvatar");

  const fullNameInput = document.getElementById("fullNameInput");

  const usernameInput = document.getElementById("usernameInput");

  const emailInput = document.getElementById("emailInput");

  const bioInput = document.getElementById("bioInput");

  const btnResetForm = document.getElementById("btnResetForm");

  const btnViewPublicProfile = document.getElementById("btnViewPublicProfile");

  // Map vai trò
  const roleMap = {
    admin: "Quản trị viên",
    editor: "Biên tập viên",
    reporter: "Phóng viên",
    user: "Độc giả",
  };

  /**
   * Hiển thị avatar
   */
  function renderAvatarBox(avatarUrl, nameText) {
    if (!avatarContainer) return;

    const initials =
      typeof getInitials === "function" ? getInitials(nameText || "") : "U";

    const safeName =
      typeof escapeHtml === "function"
        ? escapeHtml(nameText || "")
        : nameText || "";

    if (avatarUrl) {
      const resolvedUrl =
        typeof resolveAssetPath === "function"
          ? resolveAssetPath(avatarUrl)
          : avatarUrl;

      avatarContainer.style.backgroundColor = "transparent";

      avatarContainer.innerHTML = `
        <img
          src="${resolvedUrl}"
          alt="${safeName}"
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
          "
          onerror="
            const p = this.parentElement;
            this.remove();

            if (p) {
              p.style.backgroundColor = 'var(--brass)';
              p.innerHTML =
                '<span style=&quot;user-select:none;&quot;>${initials}</span>';
            }
          "
        >
      `;

      if (btnRemoveAvatar) {
        btnRemoveAvatar.style.display = "inline-flex";
      }
    } else {
      avatarContainer.style.backgroundColor = "var(--brass)";

      avatarContainer.innerHTML = `
        <span style="user-select: none;">
          ${initials}
        </span>
      `;

      if (btnRemoveAvatar) {
        btnRemoveAvatar.style.display = "none";
      }
    }
  }

  /**
   * Điền dữ liệu API vào form
   */
  function populateUserData(user) {
    if (!user) return;

    currentAvatarValue = user.avatar || null;

    if (userRoleBadge) {
      userRoleBadge.textContent = roleMap[user.role] || "Độc giả";

      userRoleBadge.className = `user-role-badge user-role-badge--${user.role || "user"}`;
    }

    renderAvatarBox(currentAvatarValue, user.full_name || user.username);

    if (fullNameInput) {
      fullNameInput.value = user.full_name || "";
    }

    if (usernameInput) {
      usernameInput.value = user.username || "";
    }

    if (emailInput) {
      emailInput.value = user.email || "";
    }

    if (bioInput) {
      bioInput.value = user.bio || "";
    }

    if (btnViewPublicProfile) {
      btnViewPublicProfile.href =
        typeof getAuthorProfileUrl === "function"
          ? getAuthorProfileUrl(user, "../public/")
          : `../public/author.html?username=${encodeURIComponent(
              user.username || user.id,
            )}`;
    }
  }

  /**
   * GET: Lấy thông tin profile
   */
  async function loadProfile() {
    try {
      const response = await fetch(PROFILE_API, {
        method: "GET",
        credentials: "include",
      });

      const result = await response.json();

      if (!result.success) {
        if (typeof showToast === "function") {
          showToast(
            result.message || "Không thể tải thông tin tài khoản",
            "error",
          );
        }

        return;
      }

      originalUserData = result.data;

      populateUserData(originalUserData);
    } catch (error) {
      console.error("Lỗi tải profile:", error);

      if (typeof showToast === "function") {
        showToast("Không thể kết nối đến máy chủ", "error");
      }
    }
  }

  /**
   * Upload avatar
   */
  async function uploadAvatar(file) {
    const formData = new FormData();

    formData.append("image", file);
    formData.append("type", "avatar");

    const response = await fetch(UPLOAD_API, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Upload ảnh thất bại");
    }

    return result.data.url;
  }

  /**
   * Chọn ảnh avatar
   */
  if (avatarFileInput) {
    avatarFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];

      if (!file) return;

      // Kiểm tra loại ảnh
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        if (typeof showToast === "function") {
          showToast("Chỉ hỗ trợ ảnh JPG, JPEG, PNG và WEBP", "error");
        }

        avatarFileInput.value = "";
        return;
      }

      // Theo backend: tối đa 5MB
      if (file.size > 5 * 1024 * 1024) {
        if (typeof showToast === "function") {
          showToast("Ảnh không được vượt quá 5MB", "error");
        }

        avatarFileInput.value = "";
        return;
      }

      try {
        if (typeof showToast === "function") {
          showToast("Đang tải ảnh lên...", "info");
        }

        const imageUrl = await uploadAvatar(file);

        currentAvatarValue = imageUrl;

        renderAvatarBox(
          currentAvatarValue,
          fullNameInput ? fullNameInput.value.trim() : "",
        );

        if (typeof showToast === "function") {
          showToast(
            "Upload ảnh thành công! Hãy bấm 'Lưu cập nhật' để hoàn tất.",
            "success",
          );
        }
      } catch (error) {
        console.error("Lỗi upload avatar:", error);

        if (typeof showToast === "function") {
          showToast(error.message || "Upload ảnh thất bại", "error");
        }

        avatarFileInput.value = "";
      }
    });
  }

  /**
   * Cập nhật avatar chữ cái khi thay đổi họ tên
   */
  if (fullNameInput) {
    fullNameInput.addEventListener("input", (e) => {
      if (!currentAvatarValue) {
        renderAvatarBox(null, e.target.value.trim());
      }
    });
  }

  /**
   * Xóa avatar
   */
  if (btnRemoveAvatar) {
    btnRemoveAvatar.addEventListener("click", () => {
      currentAvatarValue = null;

      if (avatarFileInput) {
        avatarFileInput.value = "";
      }

      renderAvatarBox(null, fullNameInput ? fullNameInput.value.trim() : "");

      if (typeof showToast === "function") {
        showToast(
          "Đã xóa ảnh đại diện. Hãy bấm 'Lưu cập nhật' để lưu thay đổi.",
          "info",
        );
      }
    });
  }

  /**
   * Khôi phục dữ liệu ban đầu
   */
  if (btnResetForm) {
    btnResetForm.addEventListener("click", (e) => {
      e.preventDefault();

      if (originalUserData) {
        populateUserData(originalUserData);
      }

      if (avatarFileInput) {
        avatarFileInput.value = "";
      }

      if (typeof showToast === "function") {
        showToast("Đã khôi phục thông tin ban đầu", "info");
      }
    });
  }

  /**
   * PUT: Cập nhật profile
   *
   * Theo PHP chỉ gửi:
   * full_name
   * bio
   * avatar
   */
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fullName = fullNameInput ? fullNameInput.value.trim() : "";
      const username = usernameInput ? usernameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const bio = bioInput ? bioInput.value.trim() : "";

      if (!fullName) {
        if (typeof showToast === "function") {
          showToast("Họ và tên không được để trống", "error");
        }
        return;
      }

      if (!username) {
        if (typeof showToast === "function") {
          showToast("Tên đăng nhập không được để trống", "error");
        }
        return;
      }

      if (!email) {
        if (typeof showToast === "function") {
          showToast("Email không được để trống", "error");
        }
        return;
      }

      try {
        const response = await fetch(PROFILE_API, {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            email: email,
            full_name: fullName,
            bio: bio,
            avatar: currentAvatarValue || "",
          }),
        });

        const result = await response.json();

        if (!result.success) {
          if (typeof showToast === "function") {
            showToast(result.message || "Cập nhật thất bại", "error");
          }
          return;
        }

        originalUserData = result.data;
        populateUserData(result.data);

        // Cập nhật bộ nhớ phiên làm việc cho header và các hàm liên quan
        if (typeof setCurrentUser === "function") {
          setCurrentUser(result.data);
        }

        if (typeof initPublicHeader === "function") {
          await initPublicHeader("profile");
        }

        if (typeof showToast === "function") {
          showToast(
            result.message || "Cập nhật thông tin tài khoản thành công!",
            "success",
          );
        }
      } catch (error) {
        console.error("Lỗi cập nhật profile:", error);

        if (typeof showToast === "function") {
          showToast("Không thể kết nối đến máy chủ", "error");
        }
      }
    });
  }

  // Khởi tạo Header / Footer
  if (typeof initPublicHeader === "function") {
    await initPublicHeader("profile");
  }

  if (typeof initPublicFooter === "function") {
    await initPublicFooter();
  }

  // Lấy dữ liệu thật từ PHP
  await loadProfile();
}

// Khởi chạy
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProfilePage);
} else {
  initProfilePage();
}
