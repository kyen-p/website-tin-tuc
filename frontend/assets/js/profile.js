/**
 * ==============================================================================
 * MẠCH TIN - PROFILE.JS (Quản lý Thông tin tài khoản - Single Card Layout)
 * ==============================================================================
 */

function initProfilePage() {
  // 1. Kiểm tra đăng nhập (Bảo vệ tuyến đường)
  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  if (!currentUser) {
    if (typeof showToast === "function") {
      showToast("Vui lòng đăng nhập để xem thông tin tài khoản", "warning");
    }
    setTimeout(() => {
      window.location.href = "../public/login.html?redirect=" + encodeURIComponent(window.location.href);
    }, 400);
    return;
  }

  // 2. Khởi tạo Header và Footer chung
  if (typeof initPublicHeader === "function") initPublicHeader("profile");
  if (typeof initPublicFooter === "function") initPublicFooter();

  // 3. Lấy dữ liệu người dùng mới nhất từ Database
  const users = typeof getTable === "function" ? getTable("users") : [];
  const latestUser = users.find((u) => u.id === currentUser.id) || currentUser;

  // DOM Elements
  const userRoleBadge = document.getElementById("userRoleBadge");
  const profileForm = document.getElementById("profileForm");
  const avatarContainer = document.getElementById("avatarPreviewContainer");
  const avatarFileInput = document.getElementById("avatarFileInput");
  const btnRemoveAvatar = document.getElementById("btnRemoveAvatar");

  const fullNameInput = document.getElementById("fullNameInput");
  const usernameInput = document.getElementById("usernameInput");
  const emailInput = document.getElementById("emailInput");
  const roleDisplayInput = document.getElementById("roleDisplayInput");
  const createdAtDisplayInput = document.getElementById("createdAtDisplayInput");
  const bioInput = document.getElementById("bioInput");
  const btnResetForm = document.getElementById("btnResetForm");
  const btnViewPublicProfile = document.getElementById("btnViewPublicProfile");

  // Biến lưu trạng thái avatar hiện tại đang chỉnh sửa
  let currentAvatarValue = latestUser.avatar || null;

  // Map tên vai trò hiển thị tiếng Việt
  const roleMap = {
    admin: "Quản trị viên",
    editor: "Biên tập viên",
    reporter: "Phóng viên",
    user: "Độc giả",
  };

  /**
   * Cập nhật hiển thị hộp Avatar (ảnh hoặc chữ cái đầu)
   */
  function renderAvatarBox(avatarUrl, nameText) {
    if (!avatarContainer) return;
    const resolvedUrl = typeof resolveAssetPath === "function" ? resolveAssetPath(avatarUrl) : avatarUrl;
    const initials = typeof getInitials === "function" ? getInitials(nameText) : "U";

    if (resolvedUrl) {
      avatarContainer.style.backgroundColor = "transparent";
      avatarContainer.innerHTML = `
        <img src="${resolvedUrl}" alt="${escapeHtml(nameText || '')}" style="width: 100%; height: 100%; object-fit: cover;" onerror="const p=this.parentElement; this.remove(); if(p){ p.style.backgroundColor='var(--brass)'; p.innerHTML='<span style=\\'user-select: none;\\'>${initials}</span>'; }">
      `;
      if (btnRemoveAvatar) {
        btnRemoveAvatar.style.display = "inline-flex";
      }
    } else {
      avatarContainer.style.backgroundColor = "var(--brass)";
      avatarContainer.innerHTML = `<span style="user-select: none;">${initials}</span>`;
      if (btnRemoveAvatar) {
        btnRemoveAvatar.style.display = "none"; // Ẩn nút xóa khi đang là avatar mặc định
      }
    }
  }

  // 4. Điền dữ liệu người dùng vào Form
  function populateUserData(user) {
    currentAvatarValue = user.avatar || null;

    if (userRoleBadge) {
      userRoleBadge.textContent = roleMap[user.role] || "Độc giả";
      userRoleBadge.className = `user-role-badge user-role-badge--${user.role || 'user'}`;
    }

    renderAvatarBox(currentAvatarValue, user.full_name || user.username);

    if (fullNameInput) fullNameInput.value = user.full_name || "";
    if (usernameInput) usernameInput.value = user.username || "";
    if (emailInput) emailInput.value = user.email || "";
    if (roleDisplayInput) roleDisplayInput.value = roleMap[user.role] || "Độc giả";
    if (createdAtDisplayInput) {
      createdAtDisplayInput.value = typeof formatDate === "function" 
        ? formatDate(user.created_at || "2026-08-01 08:00:00") 
        : user.created_at || "01/08/2026";
    }
    if (bioInput) bioInput.value = user.bio || "";
    if (btnViewPublicProfile) {
      btnViewPublicProfile.href = `../public/author.html?id=${user.id}`;
    }
  }

  populateUserData(latestUser);

  // 5. Lắng nghe thay đổi Họ tên để cập nhật Avatar chữ cái theo thời gian thực (nếu không có ảnh)
  if (fullNameInput) {
    fullNameInput.addEventListener("input", (e) => {
      if (!currentAvatarValue) {
        renderAvatarBox(null, e.target.value.trim());
      }
    });
  }

  // 6. Xử lý Tải ảnh đại diện lên từ máy tính
  if (avatarFileInput) {
    avatarFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate loại file ảnh
      if (!file.type.startsWith("image/")) {
        if (typeof showToast === "function") showToast("Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WebP)", "error");
        avatarFileInput.value = "";
        return;
      }

      // Validate dung lượng ảnh (tối đa 2MB)
      if (file.size > 2 * 1024 * 1024) {
        if (typeof showToast === "function") showToast("Kích thước ảnh không được vượt quá 2MB", "error");
        avatarFileInput.value = "";
        return;
      }

      // Đọc file thành DataURL base64
      const reader = new FileReader();
      reader.onload = (event) => {
        currentAvatarValue = event.target.result;
        renderAvatarBox(currentAvatarValue, fullNameInput ? fullNameInput.value : "");
        if (typeof showToast === "function") showToast("Đã tải ảnh lên thành công! Hãy bấm 'Lưu cập nhật' để lưu lại.", "info");
      };
      reader.readAsDataURL(file);
    });
  }

  // 7. Xử lý Xóa ảnh đại diện về mặc định (chữ cái đầu)
  if (btnRemoveAvatar) {
    btnRemoveAvatar.addEventListener("click", () => {
      currentAvatarValue = null;
      if (avatarFileInput) avatarFileInput.value = "";
      renderAvatarBox(null, fullNameInput ? fullNameInput.value : "");
      if (typeof showToast === "function") showToast("Xóa ảnh đại diện thành công! Hãy bấm 'Lưu cập nhật' để lưu lại.", "info");
    });
  }

  // 8. Xử lý nút Hủy thay đổi (Reset form về giá trị ban đầu)
  if (btnResetForm) {
    btnResetForm.addEventListener("click", (e) => {
      e.preventDefault();
      populateUserData(latestUser);
      if (avatarFileInput) avatarFileInput.value = "";
      if (typeof showToast === "function") showToast("Đã khôi phục thông tin ban đầu", "info");
    });
  }

  // 9. Xử lý Submit cập nhật thông tin
  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const newFullName = (fullNameInput ? fullNameInput.value : "").trim();
      const newUsername = (usernameInput ? usernameInput.value : "").trim().toLowerCase();
      const newEmail = (emailInput ? emailInput.value : "").trim().toLowerCase();
      const newBio = (bioInput ? bioInput.value : "").trim();

      // Validate dữ liệu
      if (!newFullName) {
        if (typeof showToast === "function") showToast("Họ và tên không được để trống", "error");
        return;
      }

      if (!newUsername) {
        if (typeof showToast === "function") showToast("Tên đăng nhập không được để trống", "error");
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(newUsername)) {
        if (typeof showToast === "function") {
          showToast("Tên đăng nhập phải từ 3-30 ký tự (chỉ gồm chữ cái, chữ số và dấu gạch dưới)", "error");
        }
        return;
      }

      if (!newEmail) {
        if (typeof showToast === "function") showToast("Email không được để trống", "error");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        if (typeof showToast === "function") showToast("Địa chỉ email không hợp lệ", "error");
        return;
      }

      // Kiểm tra trùng username hoặc email với các tài khoản khác
      const currentUsersList = typeof getTable === "function" ? getTable("users") : [];
      
      const usernameExists = currentUsersList.some(
        (u) => u.id !== latestUser.id && (u.username || "").toLowerCase() === newUsername
      );
      if (usernameExists) {
        if (typeof showToast === "function") showToast("Tên đăng nhập này đã có người sử dụng", "error");
        return;
      }

      const emailExists = currentUsersList.some(
        (u) => u.id !== latestUser.id && (u.email || "").toLowerCase() === newEmail
      );
      if (emailExists) {
        if (typeof showToast === "function") showToast("Địa chỉ email này đã được đăng ký", "error");
        return;
      }

      // Cập nhật thông tin vào Database
      const updatedUser = {
        ...latestUser,
        full_name: newFullName,
        username: newUsername,
        email: newEmail,
        bio: newBio,
        avatar: currentAvatarValue,
        updated_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      };

      if (typeof updateRecord === "function") {
        updateRecord("users", latestUser.id, updatedUser);
      }

      // Cập nhật Session hiện tại
      if (typeof setCurrentUser === "function") {
        setCurrentUser(updatedUser);
      }

      // Cập nhật lại UI Form và Header
      populateUserData(updatedUser);

      if (typeof initPublicHeader === "function") {
        initPublicHeader("profile");
      }

      if (typeof showToast === "function") {
        showToast("Cập nhật thông tin tài khoản thành công!", "success");
      }
    });
  }
}

// Khởi chạy khi trang đã tải xong
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProfilePage);
} else {
  initProfilePage();
}
