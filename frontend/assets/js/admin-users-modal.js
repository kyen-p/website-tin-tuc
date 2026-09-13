/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/admin-users-modal.js
 * PHÂN HỆ: Quản lý Modal & Thao tác Người dùng Quản trị viên (Admin Users Modal Module)
 * MÔ TẢ: Xử lý giao diện và nghiệp vụ của các hộp thoại modal phục vụ quản trị người dùng:
 *        1. Cung cấp danh sách preset lý do khóa tài khoản vi phạm.
 *        2. Render HTML các modal: Đổi vai trò phân quyền (Change Role Modal), Xác nhận thao tác (User Action Modal),
 *           Xem chi tiết lý do khóa tài khoản (View Lock Reason Modal).
 *        3. Thực hiện gọi API PUT admin/users.php để lưu thay đổi vai trò hoặc cập nhật trạng thái khóa/mở khóa tài khoản.
 *        4. Xuất khẩu các hàm ra window (window.AdminUsersModals) để admin-users.js sử dụng chung.
 * PHẠM VI SỬ DỤNG:
 *   - frontend/admin/users.html
 * PHỤ THUỘC:
 *   - frontend/assets/js/common.js (resolveApiUrl, showToast, escapeHtml, renderUserAvatar, formatDateTime)
 *   - backend/api/admin/users.php
 * ==============================================================================
 */

(function () {
  "use strict";

  // ==============================================================================
  // KHỐI 1: DANH SÁCH LÝ DO MẪU & HELPER ĐỊNH DẠNG VAI TRÒ, AVATAR
  // ==============================================================================
  const ACCOUNT_LOCK_PRESETS = [
    "Vi phạm quy chế sử dụng và điều khoản tòa soạn",
    "Tài khoản có hoạt động bất thường hoặc nghi ngờ bị xâm phạm",
    "Liên tục đăng tải nội dung vi phạm pháp luật / thuần phong mỹ tục",
    "Spam hệ thống hoặc tạo tài khoản giả mạo quấy rối",
    "Khác (Tự nhập lý do bên dưới)"
  ];

  function getRoleBadgeHtml(role) {
    switch (role) {
      case "admin":
        return `<span class="admin-badge" style="background:#EDE9FE; color:#5B21B6; border:1px solid #DDD6FE; font-weight:600; padding:3px 9px; border-radius:4px; font-size:12px;">Quản trị viên</span>`;
      case "editor":
        return `<span class="admin-badge" style="background:#E0F2FE; color:#0369A1; border:1px solid #BAE6FD; font-weight:600; padding:3px 9px; border-radius:4px; font-size:12px;">Biên tập viên</span>`;
      case "reporter":
        return `<span class="admin-badge" style="background:#ECFDF5; color:#047857; border:1px solid #A7F3D0; font-weight:600; padding:3px 9px; border-radius:4px; font-size:12px;">Phóng viên</span>`;
      default:
        return `<span class="admin-badge" style="background:#F3F4F6; color:#374151; border:1px solid #E5E7EB; font-weight:600; padding:3px 9px; border-radius:4px; font-size:12px;">Độc giả</span>`;
    }
  }

  function getRoleName(role) {
    switch (role) {
      case "admin": return "Quản trị viên";
      case "editor": return "Biên tập viên";
      case "reporter": return "Phóng viên";
      default: return "Độc giả";
    }
  }

  function getUserAvatarHtml(user, size = 36) {
    if (typeof renderUserAvatar === "function") {
      let sizeClass = "avatar-badge--sm";
      if (size <= 28) sizeClass = "avatar-badge--xs";
      else if (size <= 40) sizeClass = "avatar-badge--md";
      else if (size <= 60) sizeClass = "avatar-badge--lg";
      else sizeClass = "avatar-badge--xl";
      return renderUserAvatar(user, `avatar-badge ${sizeClass}`);
    }
    const initials = (user && (user.full_name || user.username) || "U").substring(0, 2).toUpperCase();
    return `<div class="avatar-badge avatar-badge--md">${initials}</div>`;
  }

  // ==============================================================================
  // KHỐI 2: RENDER CẤU TRÚC HTML CÁC MODAL HỘP THOẠI QUẢN TRỊ
  // ==============================================================================
  function renderModalsHtml() {
    return `
      <!-- 1. MODAL PHÂN QUYỀN VAI TRÒ -->
      <div id="changeRoleModal" class="admin-modal-overlay" style="display:none;">
        <div class="admin-modal" style="max-width: 480px; width: 100%;">
          <div class="admin-modal__header">
            <div class="admin-modal__title">Phân quyền vai trò người dùng</div>
            <button type="button" class="admin-btn-close-modal" onclick="window.closeModal('changeRoleModal')" style="background:none; border:none; font-size:22px; color:var(--muted); cursor:pointer; line-height:1;">&times;</button>
          </div>
          <form id="changeRoleForm" onsubmit="window.handleSubmitChangeRole(event)">
            <input type="hidden" id="change-role-user-id">
            <div class="admin-modal__body" style="padding: 20px;">
              <div id="changeRoleUserInfo" style="background: #FAF8F4; border: 1px solid var(--line-soft); border-radius: 6px; padding: 12px 14px; margin-bottom: 16px;">
              </div>

              <div>
                <label class="admin-form-label" style="font-weight: 600; font-size: 13px; margin-bottom: 6px; display: block;">Vai trò phân quyền mới <span style="color: var(--crimson);">*</span></label>
                <select id="change-role-select" class="admin-form-select" required style="font-size: 13.5px; height: 38px;">
                  <option value="user">Độc giả (User)</option>
                  <option value="reporter">Phóng viên (Reporter)</option>
                  <option value="editor">Biên tập viên (Editor)</option>
                </select>
                <p style="font-size: 12px; color: var(--muted); margin: 6px 0 0 0; line-height: 1.4;">
                  Hệ thống hỗ trợ luân chuyển giữa 3 vai trò: Độc giả, Phóng viên và Biên tập viên. Vai trò Quản trị viên được bảo vệ cố định.
                </p>
              </div>
            </div>
            <div class="admin-modal__footer" style="padding: 12px 20px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--line-soft);">
              <button type="button" class="admin-btn admin-btn--default" onclick="window.closeModal('changeRoleModal')">Hủy bỏ</button>
              <button type="submit" class="admin-btn admin-btn--primary">Lưu thay đổi</button>
            </div>
          </form>
        </div>
      </div>

      <!-- 2. MODAL XÁC NHẬN CHUNG (KHÓA / MỞ KHÓA / PHÂN QUYỀN) -->
      <div id="userActionModal" class="admin-modal-overlay" style="display:none;">
        <div class="admin-modal" style="max-width: 460px; width: 100%;">
          <div class="admin-modal__header">
            <div class="admin-modal__title" id="userActionModalTitle">Xác nhận thao tác</div>
            <button type="button" class="admin-btn-close-modal" onclick="window.closeModal('userActionModal')" style="background:none; border:none; font-size:22px; color:var(--muted); cursor:pointer; line-height:1;">&times;</button>
          </div>
          <div class="admin-modal__body" id="userActionModalBody" style="padding: 18px 20px;">
          </div>
          <div class="admin-modal__footer" style="padding: 12px 20px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--line-soft);">
            <button type="button" class="admin-btn admin-btn--default" onclick="window.closeModal('userActionModal')">Hủy bỏ</button>
            <button type="button" class="admin-btn" id="btnConfirmUserAction">Xác nhận</button>
          </div>
        </div>
      </div>

      <!-- 3. MODAL XEM CHI TIẾT LÝ DO KHÓA -->
      <div id="viewLockReasonModal" class="admin-modal-overlay" style="display:none;">
        <div class="admin-modal" style="max-width: 480px; width: 100%;">
          <div class="admin-modal__header">
            <div class="admin-modal__title" id="viewLockReasonTitle">Chi tiết lý do khóa</div>
            <button type="button" class="admin-btn-close-modal" onclick="window.closeModal('viewLockReasonModal')" style="background:none; border:none; font-size:22px; color:var(--muted); cursor:pointer; line-height:1;">&times;</button>
          </div>
          <div class="admin-modal__body" id="viewLockReasonBody" style="padding: 18px 20px;">
          </div>
          <div class="admin-modal__footer" id="viewLockReasonFooter" style="padding: 12px 20px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--line-soft);">
            <button type="button" class="admin-btn admin-btn--default" onclick="window.closeModal('viewLockReasonModal')">Đóng</button>
          </div>
        </div>
      </div>
    `;
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
  }

  function openConfirmActionModal(config) {
    const modal = document.getElementById("userActionModal");
    const titleEl = document.getElementById("userActionModalTitle");
    const bodyEl = document.getElementById("userActionModalBody");
    const confirmBtn = document.getElementById("btnConfirmUserAction");

    if (!modal || !titleEl || !bodyEl || !confirmBtn) return;

    titleEl.textContent = config.title || "Xác nhận";
    bodyEl.innerHTML = config.bodyHtml || "";
    confirmBtn.textContent = config.confirmText || "Xác nhận";
    confirmBtn.className = "admin-btn " + (config.confirmBtnClass || "admin-btn--primary");

    confirmBtn.onclick = function () {
      if (typeof config.onConfirm === "function") {
        config.onConfirm();
      }
    };

    modal.style.display = "flex";
  }

  // ==============================================================================
  // KHỐI 3: XỬ LÝ NGHIỆP VỤ MỞ MODAL & GỬI YÊU CẦU PHÂN QUYỀN VAI TRÒ (API PUT)
  // ==============================================================================
  function handleOpenChangeRole(userId) {
    if (typeof window.closeAllUserActionMenus === "function") window.closeAllUserActionMenus();
    const users = window.AdminUsers ? window.AdminUsers.getAllUsers() : [];
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    if (currentUser && String(currentUser.id) === String(user.id)) {
      showToast("Không thể thực hiện thao tác trên tài khoản của chính bạn!", "warning");
      return;
    }

    if (user.role === "admin") {
      showToast("Tài khoản Quản trị viên được bảo vệ cố định, không thể thay đổi vai trò!", "warning");
      return;
    }

    document.getElementById("change-role-user-id").value = user.id;
    document.getElementById("change-role-select").value = user.role || "user";

    const infoContainer = document.getElementById("changeRoleUserInfo");
    if (infoContainer) {
      const avatarHtml = getUserAvatarHtml(user, 42);

      infoContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          ${avatarHtml}
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 14px; color: var(--ink);">${escapeHtml(user.full_name || user.username)}</div>
            <div style="font-size: 12px; color: var(--muted); font-family: var(--f-mono); margin-top: 2px;">
              @${escapeHtml(user.username || "")} • ${escapeHtml(user.email || "")}
            </div>
            <div style="margin-top: 6px; display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 12px; color: var(--muted);">Vai trò hiện tại:</span>
              ${getRoleBadgeHtml(user.role)}
            </div>
          </div>
        </div>
      `;
    }

    const modal = document.getElementById("changeRoleModal");
    if (modal) modal.style.display = "flex";
  }

  function handleSubmitChangeRole(e) {
    e.preventDefault();
    const users = window.AdminUsers ? window.AdminUsers.getAllUsers() : [];
    const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    const userId = Number(document.getElementById("change-role-user-id").value);
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (currentUser && String(currentUser.id) === String(user.id)) {
      showToast("Không thể thực hiện thao tác trên tài khoản của chính bạn!", "warning");
      return;
    }

    if (user.role === "admin") {
      showToast("Tài khoản Quản trị viên được bảo vệ cố định, không thể thay đổi vai trò!", "warning");
      return;
    }

    const newRole = document.getElementById("change-role-select").value;
    const allowedRoles = ["user", "reporter", "editor"];
    if (!allowedRoles.includes(newRole)) {
      showToast("Vai trò được chọn không hợp lệ!", "error");
      return;
    }

    const oldRole = user.role || "user";

    if (oldRole === newRole) {
      closeModal("changeRoleModal");
      showToast("Vai trò của người dùng không có thay đổi.", "info");
      return;
    }

    closeModal("changeRoleModal");

    openConfirmActionModal({
      title: "Xác nhận phân quyền vai trò",
      bodyHtml: `
        <p style="font-size: 13.5px; line-height: 1.5; color: var(--ink); margin-bottom: 12px;">
          Bạn có chắc chắn muốn thay đổi phân quyền cho tài khoản <strong>${escapeHtml(user.full_name || user.username)}</strong>?
        </p>
        <div style="background: #FAF8F4; border: 1px solid var(--line-soft); border-radius: 6px; padding: 12px 14px; margin-bottom: 12px; font-size: 13px;">
          <div style="margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
            <span style="color: var(--muted);">Vai trò hiện tại:</span>
            <span>${getRoleBadgeHtml(oldRole)}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px dashed var(--line-soft); padding-top: 6px;">
            <span style="font-weight: 600; color: var(--ink);">Vai trò mới:</span>
            <span>${getRoleBadgeHtml(newRole)}</span>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--muted); margin: 0; line-height: 1.4;">
          Hệ thống sẽ cập nhật quyền truy cập và gửi thông báo thay đổi vai trò đến tài khoản này.
        </p>
      `,
      confirmText: "Xác nhận đổi vai trò",
      confirmBtnClass: "admin-btn--primary",
      onConfirm: async function () {
        try {
          const res = await fetch(resolveApiUrl("admin/users.php"), {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id, role: newRole }),
          });
          const result = await res.json();
          if (result && result.success) {
            closeModal("userActionModal");
            if (window.AdminUsers && typeof window.AdminUsers.reloadAndRender === "function") {
              await window.AdminUsers.reloadAndRender();
            }
            showToast(`Đã phân quyền tài khoản '${user.full_name}' thành '${getRoleName(newRole)}' thành công!`, "success");
          } else {
            showToast((result && result.message) || "Không thể đổi vai trò!", "error");
          }
        } catch (e) {
          console.error("Lỗi đổi vai trò:", e);
          showToast("Lỗi kết nối khi cập nhật vai trò!", "error");
        }
      }
    });
  }

  // ==============================================================================
  // KHỐI 4: XỬ LÝ NGHIỆP VỤ KHÓA / MỞ KHÓA TÀI KHOẢN & XEM LÝ DO KHÓA
  // ==============================================================================
  function handleToggleLockUser(userId, shouldLock) {
    if (typeof window.closeAllUserActionMenus === "function") window.closeAllUserActionMenus();
    const users = window.AdminUsers ? window.AdminUsers.getAllUsers() : [];
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    if (currentUser && String(currentUser.id) === String(user.id)) {
      showToast("Không thể thực hiện thao tác trên tài khoản của chính bạn!", "warning");
      return;
    }

    if (user.role === "admin") {
      showToast("Tài khoản Quản trị viên được bảo vệ cố định, không thể khóa!", "warning");
      return;
    }

    if (shouldLock) {
      openConfirmActionModal({
        title: "Xác nhận khóa tài khoản người dùng",
        bodyHtml: `
          <p style="font-size: 13.5px; line-height: 1.5; color: var(--ink); margin-bottom: 12px;">
            Bạn có chắc chắn muốn khóa tài khoản của <strong>${escapeHtml(user.full_name)}</strong> (@${escapeHtml(user.username)}) không?
          </p>
          <div style="margin-bottom: 12px;">
            <label style="font-size: 12.5px; font-weight: 600; color: var(--ink); display: block; margin-bottom: 4px;">Chọn lý do mẫu có sẵn:</label>
            <select id="modal-account-lock-preset" class="admin-form-select" style="width: 100%; font-size: 12.5px; margin-bottom: 8px;">
              ${ACCOUNT_LOCK_PRESETS.map((p, idx) => `<option value="${escapeHtml(p)}" ${idx === 0 ? 'selected' : ''}>${escapeHtml(p)}</option>`).join("")}
            </select>

            <label style="font-size: 12px; font-weight: 600; color: var(--muted); display: block; margin-bottom: 4px;">Nội dung lý do áp dụng (có thể chỉnh sửa trực tiếp):</label>
            <textarea id="modal-lock-reason" class="admin-form-textarea" rows="2" style="width: 100%; font-size: 13px;" placeholder="Nhập hoặc chỉnh sửa lý do vi phạm...">${escapeHtml(ACCOUNT_LOCK_PRESETS[0])}</textarea>
          </div>
          <p style="font-size: 12px; color: var(--crimson); margin: 0; line-height: 1.4;">
            Khi bị khóa, người dùng sẽ không thể đăng nhập hoặc thao tác bất kỳ tính năng nào trên hệ thống.
          </p>
        `,
        confirmText: "Khóa tài khoản",
        confirmBtnClass: "admin-btn--danger",
        onConfirm: async function () {
          const reason = document.getElementById("modal-lock-reason") ? document.getElementById("modal-lock-reason").value.trim() : "";
          try {
            const res = await fetch(resolveApiUrl("admin/users.php"), {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: user.id,
                status: "locked",
                lock_reason: reason || ACCOUNT_LOCK_PRESETS[0],
              }),
            });
            const result = await res.json();
            if (result && result.success) {
              closeModal("userActionModal");
              if (window.AdminUsers && typeof window.AdminUsers.reloadAndRender === "function") {
                await window.AdminUsers.reloadAndRender();
              }
              showToast(`Đã khóa tài khoản '${user.full_name}' thành công.`, "warning");
            } else {
              showToast((result && result.message) || "Không thể khóa tài khoản!", "error");
            }
          } catch (e) {
            console.error("Lỗi khóa tài khoản:", e);
            showToast("Lỗi kết nối khi khóa tài khoản!", "error");
          }
        }
      });

      setTimeout(() => {
        const presetSelect = document.getElementById("modal-account-lock-preset");
        const reasonInput = document.getElementById("modal-lock-reason");
        if (presetSelect && reasonInput) {
          presetSelect.addEventListener("change", function () {
            if (this.value.startsWith("Khác")) {
              reasonInput.value = "";
              reasonInput.focus();
            } else {
              reasonInput.value = this.value;
            }
          });
        }
      }, 50);
    } else {
      openConfirmActionModal({
        title: "Xác nhận mở khóa tài khoản",
        bodyHtml: `
          <p style="font-size: 13.5px; line-height: 1.5; color: var(--ink); margin: 0;">
            Bạn có chắc chắn muốn mở khóa đăng nhập trở lại cho tài khoản <strong>${escapeHtml(user.full_name)}</strong> (@${escapeHtml(user.username)})?
          </p>
        `,
        confirmText: "Mở khóa tài khoản",
        confirmBtnClass: "admin-btn--primary",
        onConfirm: function () {
          fetch(resolveApiUrl('admin/users.php'), {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, status: 'active' })
          })
            .then(res => res.json())
            .then(async result => {
              if (result && result.success) {
                closeModal("userActionModal");
                if (window.AdminUsers && typeof window.AdminUsers.reloadAndRender === "function") {
                  await window.AdminUsers.reloadAndRender();
                }
                showToast(`Đã mở khóa tài khoản '${user.full_name}' thành công.`, "success");
              } else {
                showToast((result && result.message) || "Không thể mở khóa tài khoản!", "error");
              }
            });
        }
      });
    }
  }

  function handleViewLockReason(userId) {
    if (typeof window.closeAllUserActionMenus === "function") window.closeAllUserActionMenus();
    const users = window.AdminUsers ? window.AdminUsers.getAllUsers() : [];
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const titleEl = document.getElementById("viewLockReasonTitle");
    const bodyEl = document.getElementById("viewLockReasonBody");
    const footerEl = document.getElementById("viewLockReasonFooter");
    const modal = document.getElementById("viewLockReasonModal");
    if (!modal || !titleEl || !bodyEl || !footerEl) return;

    titleEl.innerHTML = `<span style="color: #DC2626; display: inline-flex; align-items: center; gap: 6px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Chi tiết lý do khóa tài khoản</span>`;

    const reasonText = user.lock_reason || "Vi phạm quy chế hệ thống hoặc có hoạt động bất thường";
    const lockTime = typeof formatDateTime === "function" ? formatDateTime(user.locked_at || user.updated_at) : (user.locked_at || user.updated_at);
    const avatarHtml = getUserAvatarHtml(user, 44);

    bodyEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; background: #FAF8F4; border: 1px solid var(--line-soft); border-radius: 8px; padding: 12px 14px; margin-bottom: 16px;">
        ${avatarHtml}
        <div style="min-width: 0; flex: 1;">
          <div style="font-weight: 600; font-size: 14.5px; color: var(--ink);">${escapeHtml(user.full_name || user.username)}</div>
          <div style="font-size: 12px; color: var(--muted); font-family: var(--f-mono); margin-top: 2px;">
            @${escapeHtml(user.username || "user")} • ${escapeHtml(user.email || "")}
          </div>
          <div style="margin-top: 5px;">
            ${getRoleBadgeHtml(user.role)}
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 12px;">
          <div style="font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; margin-bottom: 4px;">Hình thức áp dụng</div>
          <div style="font-size: 12.5px; font-weight: 600; color: #DC2626;">
            Khóa truy cập toàn hệ thống
          </div>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 12px;">
          <div style="font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; margin-bottom: 4px;">Thời gian xử lý</div>
          <div style="font-size: 12.5px; font-weight: 500; color: var(--ink);">
            ${lockTime}
          </div>
        </div>
      </div>

      <div style="background: #FFF5F5; border: 1px solid #FED7D7; border-radius: 6px; padding: 14px;">
        <div style="font-size: 12px; font-weight: 700; color: #C53030; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          Lý do ghi nhận vi phạm
        </div>
        <p style="font-size: 13.5px; line-height: 1.55; color: #1F2937; margin: 0; word-break: break-word; font-weight: 500;">
          ${escapeHtml(reasonText)}
        </p>
      </div>
    `;

    footerEl.innerHTML = `
      <button type="button" class="admin-btn admin-btn--default" onclick="window.closeModal('viewLockReasonModal')">Đóng</button>
      <button type="button" class="admin-btn admin-btn--primary" onclick="window.closeModal('viewLockReasonModal'); window.handleToggleLockUser(${user.id}, false)">
        Mở khóa tài khoản ngay
      </button>
    `;

    modal.style.display = "flex";
  }

  // ==============================================================================
  // KHỐI 5: LẮNG NGHE SỰ KIỆN TOÀN CỤC & XUẤT BẢN CÁC HÀM RA WINDOW
  // ==============================================================================
  // Bước 1: Gắn trình lắng nghe sự kiện phím Escape và nhấp chuột bên ngoài vùng Overlay để đóng hộp thoại Modal
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModal("changeRoleModal");
      closeModal("userActionModal");
      closeModal("viewLockReasonModal");
    }
  });

  document.addEventListener("click", function (e) {
    if (e.target && e.target.classList && e.target.classList.contains("admin-modal-overlay")) {
      e.target.style.display = "none";
    }
  });

  // Bước 2: Đăng ký các hàm nghiệp vụ hộp thoại vào đối tượng toàn cục window để gọi từ các module khác
  window.closeModal = closeModal;
  window.handleOpenChangeRole = handleOpenChangeRole;
  window.handleSubmitChangeRole = handleSubmitChangeRole;
  window.handleToggleLockUser = handleToggleLockUser;
  window.handleViewLockReason = handleViewLockReason;
  window.openConfirmActionModal = openConfirmActionModal;
  window.AdminUsersModals = {
    renderModalsHtml,
    getRoleBadgeHtml,
    getRoleName
  };
})();
