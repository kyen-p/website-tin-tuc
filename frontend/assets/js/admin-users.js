/**
 * ==============================================================================
 * ADMIN USERS MANAGEMENT - QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN
 * Mạch Tin - Báo Điện Tử
 * 
 * Tính năng & Nghiệp vụ cốt lõi:
 * 1. Phân loại vai trò: Độc giả (user), Phóng viên (reporter), Biên tập viên (editor), Quản trị viên (admin)
 * 2. Cấu trúc Tabs: Tất cả tài khoản | Đội ngũ tòa soạn | Độc giả | Tài khoản bị khóa / Hạn chế
 * 3. Bộ lọc vai trò, trạng thái và tìm kiếm thời gian thực theo tên, username, email
 * 4. Thêm mới tài khoản nhân viên / độc giả với form chuẩn xác
 * 5. Phân quyền / Đổi vai trò linh hoạt kèm thông báo tự động
 * 6. Khóa / Mở khóa tài khoản (khóa đăng nhập) & Khóa / Mở khóa quyền bình luận độc lập
 * 7. Xem chi tiết hồ sơ & đóng góp (bài viết, bình luận, tương tác)
 * 8. Xóa tài khoản với modal xác nhận an toàn
 * ==============================================================================
 */

(function () {
  "use strict";

  let allUsers = [];
  let allArticles = [];
  let allComments = [];
  let allCategories = [];

  // Bộ lọc hiện tại
  let currentTab = "all"; // 'all' | 'staff' | 'reader' | 'locked'
  let roleFilter = "all"; // 'all' | 'admin' | 'editor' | 'reporter' | 'user'
  let statusFilter = "all"; // 'all' | 'active' | 'locked'
  let searchQuery = "";

  // Sắp xếp
  let sortField = "created_at"; // 'created_at' | 'full_name' | 'role'
  let sortOrder = "desc"; // 'desc' | 'asc'

  // Biến lưu trạng thái modal
  let selectedUserId = null;

  document.addEventListener("DOMContentLoaded", () => {
    initUsersPage();
  });

  async function initUsersPage() {
    await loadData();
    renderPageStructure();
    bindEvents();
    renderTableRows();
  }

  async function loadData() {
    const res = await fetch('/website-tin-tuc/backend/api/admin/users.php');
    const result = await res.json();
    allUsers = result.data || [];
    // allArticles, allComments, allCategories: tạm giữ getTable() cho tới khi Cặp 1/2/3 nối xong API tương ứng của họ
    allArticles = getTable("articles") || [];
    allComments = getTable("comments") || [];
    allCategories = getTable("categories") || [];
  }

  /**
   * Tính toán số lượng theo từng nhóm tab
   */
  function calculateCounts() {
    const total = allUsers.length;
    const staff = allUsers.filter(u => u.role === "admin" || u.role === "editor" || u.role === "reporter").length;
    const readers = allUsers.filter(u => u.role === "user" || u.role === "reader" || !u.role).length;
    const locked = allUsers.filter(u => u.status === "locked" || u.status === "inactive").length;

    return { total, staff, readers, locked };
  }

  /**
   * Render khung cấu trúc trang quản lý người dùng
   */
  function renderPageStructure() {
    const container = document.getElementById("workspace-content");
    if (!container) return;

    const counts = calculateCounts();

    container.innerHTML = `
      <!-- 1. TABS ĐIỀU HƯỚNG NHÓM TÀI KHOẢN -->
      <div class="admin-tabs-nav">
        <button type="button" class="admin-tab-btn ${currentTab === 'all' ? 'is-active' : ''}" data-tab="all" onclick="window.switchUserTab('all')">
          Tất cả tài khoản <span class="tab-badge">${counts.total}</span>
        </button>
        <button type="button" class="admin-tab-btn ${currentTab === 'staff' ? 'is-active' : ''}" data-tab="staff" onclick="window.switchUserTab('staff')">
          Đội ngũ tòa soạn <span class="tab-badge" style="background:#E0F2FE; color:#0369A1;">${counts.staff}</span>
        </button>
        <button type="button" class="admin-tab-btn ${currentTab === 'reader' ? 'is-active' : ''}" data-tab="reader" onclick="window.switchUserTab('reader')">
          Độc giả <span class="tab-badge" style="background:#F3F4F6; color:#374151;">${counts.readers}</span>
        </button>
        <button type="button" class="admin-tab-btn ${currentTab === 'locked' ? 'is-active' : ''}" data-tab="locked" onclick="window.switchUserTab('locked')">
          Tài khoản bị khóa <span class="tab-badge" style="background:#FEE2E2; color:#DC2626;">${counts.locked}</span>
        </button>
      </div>

      <!-- 2. THẺ BẢNG QUẢN TRỊ DỮ LIỆU -->
      <div class="admin-card">
        <div class="admin-card__header">
          <div class="admin-card__title-group">
            <h2 class="admin-card__title" id="user-tab-title-display">${getTabTitle(currentTab)}</h2>
            <span class="admin-card__count-badge" id="users-count-badge">0 người dùng</span>
          </div>

          <div class="admin-card__toolbar" style="flex-wrap: wrap; gap: 10px;">
            <!-- Lọc vai trò -->
            <select id="user-role-select" class="admin-form-select" style="max-width: 150px; font-size: 12.5px; height: 36px;" onchange="window.setUserRoleFilter(this.value)">
              <option value="all" ${roleFilter === 'all' ? 'selected' : ''}>Tất cả vai trò</option>
              <option value="admin" ${roleFilter === 'admin' ? 'selected' : ''}>Quản trị viên</option>
              <option value="editor" ${roleFilter === 'editor' ? 'selected' : ''}>Biên tập viên</option>
              <option value="reporter" ${roleFilter === 'reporter' ? 'selected' : ''}>Phóng viên</option>
              <option value="user" ${roleFilter === 'user' ? 'selected' : ''}>Độc giả</option>
            </select>

            <!-- Lọc trạng thái -->
            <select id="user-status-select" class="admin-form-select" style="max-width: 160px; font-size: 12.5px; height: 36px;" onchange="window.setUserStatusFilter(this.value)">
              <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
              <option value="active" ${statusFilter === 'active' ? 'selected' : ''}>Đang hoạt động</option>
              <option value="locked" ${statusFilter === 'locked' ? 'selected' : ''}>Bị khóa tài khoản</option>
            </select>

            <!-- Ô tìm kiếm -->
            <div class="admin-search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                id="search-users-input" 
                class="admin-search-input" 
                placeholder="Tìm theo tên, @username, email..."
                value="${escapeHtml(searchQuery)}"
              >
            </div>
          </div>
        </div>

        <!-- BẢNG DANH SÁCH -->
        <div class="admin-table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="min-width: 250px;">Người dùng</th>
                <th style="min-width: 140px; text-align: center;">Vai trò</th>
                <th style="min-width: 160px;">Đóng góp / Hoạt động</th>
                <th style="min-width: 150px; text-align: center;">Trạng thái</th>
                <th class="is-sortable admin-col-date ${sortField === 'created_at' ? 'is-sorted' : ''}" onclick="window.handleSortTable('created_at')" style="text-align: center; white-space: nowrap; width: 140px;">
                  <div class="admin-th-content" style="justify-content: center;">
                    <span>Ngày tham gia</span>
                    <span class="admin-sort-icon">${getSortIcon('created_at')}</span>
                  </div>
                </th>
                <th style="text-align: center; width: 80px;">Thao tác</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              <!-- Sẽ được nạp động bằng renderTableRows -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- CÁC MODAL HỘP THOẠI (PHÂN QUYỀN VAI TRÒ, XÁC NHẬN) -->
      <!-- ==================================================================== -->

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
              <!-- Thông tin người dùng (chỉ xem) -->
              <div id="changeRoleUserInfo" style="background: #FAF8F4; border: 1px solid var(--line-soft); border-radius: 6px; padding: 12px 14px; margin-bottom: 16px;">
                <!-- Nạp động qua JS -->
              </div>

              <div>
                <label class="admin-form-label" style="font-weight: 600; font-size: 13px; margin-bottom: 6px; display: block;">Vai trò phân quyền mới <span style="color: var(--crimson);">*</span></label>
                <select id="change-role-select" class="admin-form-select" required style="font-size: 13.5px; height: 38px;">
                  <option value="user">Độc giả (User)</option>
                  <option value="reporter">Phóng viên (Reporter)</option>
                  <option value="editor">Biên tập viên (Editor)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
                <p style="font-size: 12px; color: var(--muted); margin: 6px 0 0 0; line-height: 1.4;">
                  Hệ thống sẽ tự động cập nhật phạm vi quyền hạn tương ứng và gửi thông báo đến tài khoản này.
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

      <!-- 2. MODAL XÁC NHẬN CHUNG (KHÓA/MỞ KHÓA/XÓA) -->
      <div id="userActionModal" class="admin-modal-overlay" style="display:none;">
        <div class="admin-modal" style="max-width: 460px; width: 100%;">
          <div class="admin-modal__header">
            <div class="admin-modal__title" id="userActionModalTitle">Xác nhận thao tác</div>
            <button type="button" class="admin-btn-close-modal" onclick="window.closeModal('userActionModal')" style="background:none; border:none; font-size:22px; color:var(--muted); cursor:pointer; line-height:1;">&times;</button>
          </div>
          <div class="admin-modal__body" id="userActionModalBody" style="padding: 18px 20px;">
            <!-- Nội dung xác nhận -->
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
            <!-- Nội dung lý do nạp động qua JS -->
          </div>
          <div class="admin-modal__footer" id="viewLockReasonFooter" style="padding: 12px 20px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--line-soft);">
            <button type="button" class="admin-btn admin-btn--default" onclick="window.closeModal('viewLockReasonModal')">Đóng</button>
          </div>
        </div>
      </div>
    `;
  }

  function getTabTitle(tab) {
    switch (tab) {
      case "staff": return "Đội ngũ tòa soạn (Admin, Biên tập, Phóng viên)";
      case "reader": return "Danh sách tài khoản độc giả";
      case "locked": return "Danh sách tài khoản bị khóa";
      default: return "Tất cả tài khoản hệ thống";
    }
  }

  function getSortIcon(field) {
    if (sortField !== field) return "▲▼";
    return sortOrder === "asc" ? "▲" : "▼";
  }

  /**
   * Render các hàng dữ liệu của Bảng
   */
  function renderTableRows() {
    const tbody = document.getElementById("users-table-body");
    const countBadge = document.getElementById("users-count-badge");
    if (!tbody) return;

    loadData();

    const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    let filtered = [...allUsers];

    // Lọc theo Tab
    if (currentTab === "staff") {
      filtered = filtered.filter(u => u.role === "admin" || u.role === "editor" || u.role === "reporter");
    } else if (currentTab === "reader") {
      filtered = filtered.filter(u => u.role === "user" || u.role === "reader" || !u.role);
    } else if (currentTab === "locked") {
      filtered = filtered.filter(u => u.status === "locked" || u.status === "inactive");
    }

    // Lọc theo Role Dropdown
    if (roleFilter !== "all") {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Lọc theo Status Dropdown
    if (statusFilter === "active") {
      filtered = filtered.filter(u => u.status !== "locked" && u.status !== "inactive");
    } else if (statusFilter === "locked") {
      filtered = filtered.filter(u => u.status === "locked" || u.status === "inactive");
    }

    // Lọc theo Tìm kiếm
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.bio && u.bio.toLowerCase().includes(q))
      );
    }

    // Sắp xếp
    filtered.sort((a, b) => {
      if (sortField === "created_at") {
        const timeA = new Date(String(a.created_at || "").replace(" ", "T")).getTime() || 0;
        const timeB = new Date(String(b.created_at || "").replace(" ", "T")).getTime() || 0;
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      } else if (sortField === "full_name") {
        const nameA = (a.full_name || "").toLowerCase();
        const nameB = (b.full_name || "").toLowerCase();
        return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      return 0;
    });

    // Cập nhật số đếm
    if (countBadge) {
      countBadge.textContent = `${filtered.length} người dùng`;
    }

    // Trạng thái trống
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="admin-empty-state" style="padding: 48px 16px;">
              <div class="admin-empty-state__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <p class="admin-empty-state__text">Không tìm thấy người dùng nào phù hợp với điều kiện lọc.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(user => {
      const isSelf = currentUser && String(currentUser.id) === String(user.id);
      const isLocked = user.status === "locked";
      const isCommentLocked = user.comment_locked === true || user.is_comment_locked === true;

      // Tính toán đóng góp (đếm tổng số bài đã xuất bản)
      let contributionHtml = "";
      if (user.role === "reporter") {
        const myPublishedArticlesCount = allArticles.filter(
          a => String(a.author_id) === String(user.id) && a.status === "published"
        ).length;

        contributionHtml = `
          <div style="font-size: 12.5px; color: var(--ink);">
            <strong>${myPublishedArticlesCount}</strong> bài đã đăng
          </div>
        `;
      } else if (user.role === "editor") {
        // Đếm tất cả các bài viết đã duyệt xuất bản bởi BTV này
        const approvedCount = allArticles.filter(a => {
          if (a.status !== "published") return false;
          return String(a.approved_by) === String(user.id) || String(a.editor_id) === String(user.id);
        }).length;

        contributionHtml = `
          <div style="font-size: 12.5px; color: var(--ink);">
            <strong>${approvedCount}</strong> bài đã duyệt
          </div>
        `;
      } else if (user.role === "admin") {
        contributionHtml = `
          <div style="font-size: 12px; color: var(--muted); font-style: italic;">
            Quản lý hệ thống
          </div>
        `;
      } else {
        const commentsCount = allComments.filter(c => String(c.user_id) === String(user.id) && !c.is_deleted).length;
        contributionHtml = `
          <div style="font-size: 12.5px; color: var(--ink);">
            <strong>${commentsCount}</strong> bình luận
          </div>
        `;
      }

      // Huy hiệu vai trò
      const roleBadge = getRoleBadgeHtml(user.role);

      // Huy hiệu trạng thái tài khoản
      let statusHtml = "";
      if (isLocked) {
        statusHtml = `<span class="admin-status-badge admin-status-badge--rejected" title="${escapeHtml(user.lock_reason || 'Đã bị khóa tài khoản')}">Đã khóa tài khoản</span>`;
      } else {
        statusHtml = `<span class="admin-status-badge admin-status-badge--published">Đang hoạt động</span>`;
      }

      // Avatar
      const avatarHtml = getUserAvatarHtml(user, 38, 14);

      return `
        <tr id="user-row-${user.id}">
          <!-- CỘT 1: THÔNG TIN NGƯỜI DÙNG -->
          <td>
            <div style="display: flex; align-items: center; gap: 12px;">
              ${avatarHtml}
              <div style="min-width: 0;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-weight: 600; font-size: 14px; color: var(--ink);">${escapeHtml(user.full_name || user.username)}</span>
                  ${isSelf ? `<span style="font-size: 10px; font-weight: 700; background: #E0F2FE; color: #0284C7; padding: 1px 5px; border-radius: 3px;">BẠN</span>` : ""}
                </div>
                <div style="font-size: 12px; color: var(--muted); font-family: var(--f-mono); margin-top: 2px;">
                  @${escapeHtml(user.username || "user")} • ${escapeHtml(user.email || "")}
                </div>
              </div>
            </div>
          </td>

          <!-- CỘT 2: VAI TRÒ -->
          <td style="text-align: center;">
            ${roleBadge}
          </td>

          <!-- CỘT 3: ĐÓNG GÓP / HOẠT ĐỘNG -->
          <td>
            ${contributionHtml}
          </td>

          <!-- CỘT 4: TRẠNG THÁI -->
          <td style="text-align: center;">
            ${statusHtml}
          </td>

          <!-- CỘT 5: NGÀY THAM GIA (CHUẨN 08:00 01/08/2026) -->
          <td style="text-align: center;">
            ${formatDateTime(user.created_at)}
          </td>

          <!-- CỘT 6: THAO TÁC 3 CHẤM -->
          <td style="text-align: center; position: relative;">
            ${isSelf ? `
              <span style="color: var(--muted); font-size: 13px; font-weight: 500;" title="Không thể thao tác trên tài khoản của chính bạn">—</span>
            ` : `
              <div class="admin-action-dropdown-wrapper" style="position: relative; display: inline-block;">
                <button 
                  type="button" 
                  class="admin-btn-more-actions" 
                  onclick="window.toggleUserActionDropdown(event, ${user.id})"
                  title="Tùy chọn thao tác"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="2"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                    <circle cx="12" cy="19" r="2"></circle>
                  </svg>
                </button>

                <div id="user-action-menu-${user.id}" class="admin-action-dropdown-menu" style="display: none; right: 0; min-width: 205px;">
                  <!-- Xem lý do nếu bị khóa -->
                  ${isLocked ? `
                    <button type="button" class="admin-dropdown-item" onclick="window.handleViewLockReason(${user.id}, 'account')" style="background: #FEF2F2;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                      <span style="color:#DC2626; font-weight: 600;">Xem lý do khóa tài khoản</span>
                    </button>
                    <div class="admin-dropdown-divider" style="height:1px; background:var(--line-soft); margin:4px 0;"></div>
                  ` : ""}

                  <!-- Phân quyền vai trò -->
                  <button type="button" class="admin-dropdown-item" onclick="window.handleOpenChangeRole(${user.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <span>Phân quyền vai trò</span>
                  </button>

                  <div class="admin-dropdown-divider" style="height:1px; background:var(--line-soft); margin:4px 0;"></div>

                  <!-- Khóa / Mở khóa tài khoản -->
                  ${isLocked ? `
                    <button type="button" class="admin-dropdown-item" onclick="window.handleToggleLockUser(${user.id}, false)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                      <span style="color:#2E7D32;">Mở khóa tài khoản</span>
                    </button>
                  ` : `
                    <button type="button" class="admin-dropdown-item" onclick="window.handleToggleLockUser(${user.id}, true)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C62828" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      <span style="color:#C62828;">Khóa tài khoản</span>
                    </button>
                  `}

                  <!-- Xóa tài khoản -->
                  <div class="admin-dropdown-divider" style="height:1px; background:var(--line-soft); margin:4px 0;"></div>
                  <button type="button" class="admin-dropdown-item admin-dropdown-item--danger" onclick="window.handleDeleteUser(${user.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span>Xóa tài khoản</span>
                  </button>
                </div>
              </div>
            `}
          </td>
        </tr>
      `;
    }).join("");
  }

  /**
   * Helper sinh HTML avatar người dùng với chuẩn resolve đường dẫn và fallback chữ cái
   */
  function getUserAvatarHtml(user, size = 38, fontSize = 14) {
    if (!user) return `<div style="width: ${size}px; height: ${size}px; border-radius: 50%; background: #FAF8F4; border: 1px solid var(--line); color: var(--brass-dark); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: ${fontSize}px; font-family: var(--f-display);">U</div>`;
    const initials = (user.full_name || user.username || "U").charAt(0).toUpperCase();
    const rawAvatar = user.avatar || "";
    const resolvedAvatar = rawAvatar && typeof resolveAssetPath === "function" ? resolveAssetPath(rawAvatar) : rawAvatar;

    if (resolvedAvatar) {
      return `
        <div style="width: ${size}px; height: ${size}px; border-radius: 50%; overflow: hidden; border: 1px solid var(--line); background: #FAF8F4; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          <img src="${resolvedAvatar}" alt="${escapeHtml(user.full_name || user.username)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.remove(); this.parentElement.innerHTML='<span style=\\'font-weight: 700; font-size: ${fontSize}px; color: var(--brass-dark); font-family: var(--f-display);\\'>${initials}</span>';">
        </div>
      `;
    }
    return `<div style="width: ${size}px; height: ${size}px; border-radius: 50%; background: #FAF8F4; border: 1px solid var(--line); color: var(--brass-dark); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: ${fontSize}px; font-family: var(--f-display); flex-shrink: 0;">${initials}</div>`;
  }

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

  /**
   * Đăng ký các sự kiện và hàm xử lý
   */
  function bindEvents() {
    window.switchUserTab = function (tab) {
      currentTab = tab;
      loadData();
      renderPageStructure();
      renderTableRows();
    };

    window.setUserRoleFilter = function (val) {
      roleFilter = val;
      renderTableRows();
    };

    window.setUserStatusFilter = function (val) {
      statusFilter = val;
      renderTableRows();
    };

    window.handleSortTable = function (field) {
      if (sortField === field) {
        sortOrder = sortOrder === "asc" ? "desc" : "asc";
      } else {
        sortField = field;
        sortOrder = "desc";
      }
      renderPageStructure();
      renderTableRows();
    };

    // Tìm kiếm
    const searchInput = document.getElementById("search-users-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim();
        renderTableRows();
      });
    }

    // Đóng dropdown khi click ra ngoài
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".admin-action-dropdown-wrapper") && !e.target.closest(".admin-action-dropdown-menu")) {
        closeAllActionMenus();
      }
    });

    window.addEventListener("scroll", closeAllActionMenus, true);
    window.addEventListener("resize", closeAllActionMenus);

    window.toggleUserActionDropdown = function (event, userId) {
      event.stopPropagation();
      const btn = event.currentTarget || (event.target && event.target.closest("button"));
      const targetMenu = document.getElementById(`user-action-menu-${userId}`);
      if (!targetMenu || !btn) return;

      const isVisible = targetMenu.style.display === "flex";
      closeAllActionMenus();

      if (!isVisible) {
        targetMenu.style.display = "flex";
        targetMenu.style.flexDirection = "column";
        targetMenu.style.position = "fixed";
        targetMenu.style.zIndex = "99999";

        const rect = btn.getBoundingClientRect();
        const menuHeight = targetMenu.offsetHeight || 220;
        const spaceBelow = window.innerHeight - rect.bottom;

        targetMenu.style.right = Math.max(8, window.innerWidth - rect.right) + "px";
        targetMenu.style.left = "auto";

        // Nếu phía dưới không đủ chỗ (hoặc ở dòng cuối bảng), tự động trồi lên trên nút bấm
        if (spaceBelow < menuHeight && rect.top > menuHeight) {
          targetMenu.style.top = "auto";
          targetMenu.style.bottom = (window.innerHeight - rect.top + 4) + "px";
        } else {
          targetMenu.style.bottom = "auto";
          targetMenu.style.top = (rect.bottom + 4) + "px";
        }
      }
    };

    function closeAllActionMenus() {
      document.querySelectorAll(".admin-action-dropdown-menu").forEach(menu => {
        menu.style.display = "none";
      });
    }

    window.closeModal = function (modalId) {
      const modal = document.getElementById(modalId);
      if (modal) modal.style.display = "none";
    };

    // Đóng modal khi bấm phím ESC hoặc bấm ra ngoài nền tối
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        window.closeModal("changeRoleModal");
        window.closeModal("userActionModal");
        window.closeModal("viewLockReasonModal");
      }
    });

    document.addEventListener("click", function (e) {
      if (e.target && e.target.classList && e.target.classList.contains("admin-modal-overlay")) {
        e.target.style.display = "none";
      }
    });

    // =========================================================================
    // 1. PHÂN QUYỀN VAI TRÒ
    // =========================================================================
    window.handleOpenChangeRole = function (userId) {
      closeAllActionMenus();
      loadData();
      const user = allUsers.find(u => u.id === userId);
      if (!user) return;

      const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
      if (currentUser && String(currentUser.id) === String(user.id)) {
        showToast("Không thể thực hiện thao tác trên tài khoản của chính bạn!", "warning");
        return;
      }

      document.getElementById("change-role-user-id").value = user.id;
      document.getElementById("change-role-select").value = user.role || "user";

      const infoContainer = document.getElementById("changeRoleUserInfo");
      if (infoContainer) {
        const avatarHtml = getUserAvatarHtml(user, 42, 15);

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
    };

    window.handleSubmitChangeRole = function (e) {
      e.preventDefault();
      loadData();

      const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
      const userId = Number(document.getElementById("change-role-user-id").value);
      const user = allUsers.find(u => u.id === userId);
      if (!user) return;

      if (currentUser && String(currentUser.id) === String(user.id)) {
        showToast("Không thể thực hiện thao tác trên tài khoản của chính bạn!", "warning");
        return;
      }

      const newRole = document.getElementById("change-role-select").value;
      const oldRole = user.role || "user";

      if (oldRole === newRole) {
        closeModal("changeRoleModal");
        showToast("Vai trò của người dùng không có thay đổi.", "info");
        return;
      }

      // Đóng modal chọn vai trò và mở modal xác nhận phân quyền
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
        onConfirm: function () {
          user.role = newRole;
          user.updated_at = new Date().toISOString().replace("T", " ").substring(0, 19);

          saveTable("users", allUsers);

          if (typeof createNotification === "function") {
            createNotification({
              user_id: user.id,
              type: "role_changed",
              title: "Vai trò tài khoản đã được cập nhật",
              message: `Quản trị viên đã thay đổi vai trò của bạn từ '${getRoleName(oldRole)}' sang '${getRoleName(newRole)}'.`,
              link: "#"
            });
          }

          closeModal("userActionModal");
          renderPageStructure();
          renderTableRows();
          showToast(`Đã phân quyền tài khoản '${user.full_name}' thành '${getRoleName(newRole)}' thành công!`, "success");
        }
      });
    };

    // =========================================================================
    // DANH SÁCH LÝ DO MẪU ĐỒNG BỘ TOÀN HỆ THỐNG (KHÓA TÀI KHOẢN)
    // =========================================================================
    const ACCOUNT_LOCK_PRESETS = [
      "Vi phạm quy chế sử dụng và điều khoản tòa soạn",
      "Tài khoản có hoạt động bất thường hoặc nghi ngờ bị xâm phạm",
      "Liên tục đăng tải nội dung vi phạm pháp luật / thuần phong mỹ tục",
      "Spam hệ thống hoặc tạo tài khoản giả mạo quấy rối",
      "Khác (Tự nhập lý do bên dưới)"
    ];

    // =========================================================================
    // 2. KHÓA / MỞ KHÓA TÀI KHOẢN (TRUY CẬP HỆ THỐNG)
    // =========================================================================
    window.handleToggleLockUser = function (userId, shouldLock) {
      closeAllActionMenus();
      loadData();
      const user = allUsers.find(u => u.id === userId);
      if (!user) return;

      const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
      if (currentUser && String(currentUser.id) === String(user.id)) {
        showToast("Không thể thực hiện thao tác trên tài khoản của chính bạn!", "warning");
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
          onConfirm: function () {
            const reason = document.getElementById("modal-lock-reason") ? document.getElementById("modal-lock-reason").value.trim() : "";
            user.status = "locked";
            user.lock_reason = reason || ACCOUNT_LOCK_PRESETS[0];
            user.locked_at = new Date().toISOString().replace("T", " ").substring(0, 19);

            saveTable("users", allUsers);

            if (typeof createNotification === "function") {
              createNotification({
                user_id: user.id,
                type: "account_locked",
                title: "Tài khoản của bạn đã bị khóa",
                message: `Tài khoản đã bị tạm khóa với lý do: ${user.lock_reason}. Vui lòng liên hệ ban quản trị nếu có thắc mắc.`,
                link: "#"
              });
            }

            closeModal("userActionModal");
            renderPageStructure();
            renderTableRows();
            showToast(`Đã khóa tài khoản '${user.full_name}' thành công.`, "warning");
          }
        });

        // Gán tương tác đổi mẫu lý do
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
            fetch('/website-tin-tuc/backend/api/admin/users.php', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: user.id, status: 'active' })
            })
              .then(res => res.json())
              .then(async result => {
                if (result.success) {
                  await loadData();
                  if (typeof createNotification === "function") {
                    createNotification({
                      user_id: user.id,
                      type: "account_unlocked",
                      title: "Tài khoản đã được mở khóa",
                      message: "Tài khoản của bạn đã được kích hoạt trở lại. Bạn có thể đăng nhập bình thường.",
                      link: "#"
                    });
                  }

                  closeModal("userActionModal");
                  renderPageStructure();
                  renderTableRows();
                  showToast(`Đã mở khóa tài khoản '${user.full_name}' thành công.`, "success");
                }
              });
          }
        });
      }
    };

    // =========================================================================
    // 3. XÓA TÀI KHOẢN
        // =========================================================================
        window.handleDeleteUser = function (userId) {
          closeAllActionMenus();
          loadData();
          const user = allUsers.find(u => u.id === userId);
          if (!user) return;

          const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
          if (currentUser && String(currentUser.id) === String(user.id)) {
            showToast("Bạn không thể xóa tài khoản đang đăng nhập hiện tại!", "error");
            return;
          }

          openConfirmActionModal({
            title: "Xác nhận xóa tài khoản vĩnh viễn",
            bodyHtml: `
          <p style="font-size: 13.5px; line-height: 1.5; color: var(--ink); margin-bottom: 8px;">
            Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản <strong>${escapeHtml(user.full_name)}</strong> (@${escapeHtml(user.username)}) khỏi hệ thống không?
          </p>
          <p style="font-size: 12px; color: var(--crimson); margin: 0; font-weight: 500;">
            Cảnh báo: Toàn bộ dữ liệu của tài khoản này sẽ bị xóa khỏi danh sách người dùng và không thể hoàn tác.
          </p>
        `,
            confirmText: "Xóa vĩnh viễn",
            confirmBtnClass: "admin-btn--danger",
            onConfirm: function () {
              allUsers = allUsers.filter(u => u.id !== userId);
              saveTable("users", allUsers);

              closeModal("userActionModal");
              renderPageStructure();
              renderTableRows();
              showToast(`Đã xóa tài khoản '${user.full_name}' thành công.`, "success");
            }
          });
        };

        // =========================================================================
        // 4. XEM CHI TIẾT LÝ DO KHÓA TÀI KHOẢN
        // =========================================================================
        window.handleViewLockReason = function (userId) {
          closeAllActionMenus();
          loadData();
          const user = allUsers.find(u => u.id === userId);
          if (!user) return;

          const titleEl = document.getElementById("viewLockReasonTitle");
          const bodyEl = document.getElementById("viewLockReasonBody");
          const footerEl = document.getElementById("viewLockReasonFooter");
          const modal = document.getElementById("viewLockReasonModal");
          if (!modal || !titleEl || !bodyEl || !footerEl) return;

          titleEl.innerHTML = `<span style="color: #DC2626; display: inline-flex; align-items: center; gap: 6px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Chi tiết lý do khóa tài khoản</span>`;

          const reasonText = user.lock_reason || "Vi phạm quy chế hệ thống hoặc có hoạt động bất thường";
          const lockTime = formatDateTime(user.locked_at || user.updated_at);

          const avatarHtml = getUserAvatarHtml(user, 44, 16);

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
        };
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

      function getRoleName(role) {
        switch (role) {
          case "admin": return "Quản trị viên";
          case "editor": return "Biên tập viên";
          case "reporter": return "Phóng viên";
          default: return "Độc giả";
        }
      }

      function formatNumber(num) {
        return Number(num || 0).toLocaleString("vi-VN");
      }

      function formatDateTime(dateStr) {
        if (!dateStr) return '<span style="color: var(--muted); font-size: 11.5px;">—</span>';
        try {
          const d = new Date(String(dateStr).replace(" ", "T"));
          if (isNaN(d.getTime())) return `<span style="font-family: var(--f-mono); font-size: 12px; color: var(--muted);">${escapeHtml(dateStr)}</span>`;
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          const hours = String(d.getHours()).padStart(2, "0");
          const mins = String(d.getMinutes()).padStart(2, "0");
          return `<span style="font-family: var(--f-mono); font-size: 12px; color: var(--muted); white-space: nowrap;">${hours}:${mins} ${day}/${month}/${year}</span>`;
        } catch (e) {
          return escapeHtml(dateStr);
        }
      }

    }) ();
