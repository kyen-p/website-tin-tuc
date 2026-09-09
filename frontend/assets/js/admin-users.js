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
 * 8. Bảo vệ an toàn tài khoản Quản trị viên và duy trì toàn vẹn dữ liệu (sử dụng Khóa/Mở khóa)
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
    try {
      const [usersRes, articlesRes, commentsRes, categoriesRes] = await Promise.all([
        fetch(resolveApiUrl("admin/users.php"), { credentials: "include" }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(resolveApiUrl("admin/published-articles.php"), { credentials: "include" }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(resolveApiUrl("admin/comments.php"), { credentials: "include" }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(resolveApiUrl("public/categories.php")).then(r => r.json()).catch(() => ({ success: false }))
      ]);

      allUsers = (usersRes && usersRes.data) || [];
      allArticles = (articlesRes && articlesRes.data) || [];
      allComments = (commentsRes && commentsRes.data) || [];
      allCategories = (categoriesRes && categoriesRes.data) || [];
    } catch (e) {
      console.error("Lỗi tải dữ liệu người dùng:", e);
      allUsers = [];
      allArticles = [];
      allComments = [];
      allCategories = [];
    }
  }

  /**
   * Tính toán số lượng theo từng nhóm tab
   */
  function calculateCounts() {
    const total = allUsers.length;
    const staff = allUsers.filter(u => u.role === "admin" || u.role === "editor" || u.role === "reporter").length;
    const readers = allUsers.filter(u => u.role === "user").length;
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
      ${window.AdminUsersModals ? window.AdminUsersModals.renderModalsHtml() : ""}
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
    return getAdminSortIcon(field, sortField, sortOrder);
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
      filtered = filtered.filter(u => u.role === "user");
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
        const commentsCount = allComments.filter(c => String(c.user_id) === String(user.id)).length;
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
            ${isSelf || user.role === "admin" ? `
              <span style="color: var(--muted); font-size: 13px; font-weight: 500;" title="${isSelf ? 'Không thể thao tác trên tài khoản của chính bạn' : 'Tài khoản Quản trị viên được bảo vệ cố định'}">—</span>
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
                </div>
              </div>
            `}
          </td>
        </tr>
      `;
    }).join("");
  }

  /**
   * Helper sinh HTML avatar người dùng đồng nhất với toàn bộ hệ thống (sử dụng renderUserAvatar từ common.js)
   */
  function getUserAvatarHtml(user, size = 38) {
    let sizeClass = "avatar-badge--md";
    if (size <= 30) sizeClass = "avatar-badge--sm";
    else if (size <= 40) sizeClass = "avatar-badge--md";
    else if (size <= 60) sizeClass = "avatar-badge--lg";
    else sizeClass = "avatar-badge--xl";

    if (typeof renderUserAvatar === "function") {
      return renderUserAvatar(user, `avatar-badge ${sizeClass}`);
    }

    // Fallback an toàn nếu chưa tải common.js
    const initials = (user && (user.full_name || user.username) || "U").substring(0, 2).toUpperCase();
    return `<div class="avatar-badge ${sizeClass}">${initials}</div>`;
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

    // Xuất giao diện truy xuất và đóng menu cho admin-users-modal.js
    window.closeAllUserActionMenus = closeAllActionMenus;
  }

  window.AdminUsers = {
    getAllUsers: () => allUsers,
    reloadAndRender: async () => {
      await loadData();
      renderPageStructure();
      renderTableRows();
    }
  };

})();
