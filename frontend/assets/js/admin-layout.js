/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/admin-layout.js
 * PHÂN HỆ: Khung Giao diện & Điều hướng Tòa soạn (Editorial Workspace Layout & Navigation)
 * MÔ TẢ: Cung cấp layout dùng chung cho 3 phân hệ nội bộ của Tòa soạn Báo Mạch Tin:
 *        - Phân hệ Phóng viên (Reporter): Dashboard, Bài viết của tôi, Soạn bài viết.
 *        - Phân hệ Biên tập viên (Editor): Dashboard, Bài chờ duyệt, Danh mục & Thẻ Tag.
 *        - Phân hệ Quản trị viên (Admin): Dashboard, Quản lý bài đăng, Người dùng, Bình luận, Cấu hình liên hệ.
 *        Bao gồm:
 *        1. Route Guard: Kiểm tra phân quyền truy cập trang, chuyển hướng người dùng trái phép.
 *        2. Dynamic Sidebar Renderer: Tự động dựng cây Menu, hiển thị Role Badge, huy hiệu số lượng (Badge Count).
 *        3. Profile Card & Actions: Hiển thị avatar, tên người dùng, nút xem Trang chủ và Đăng xuất.
 *        4. Table Helper Utilities: Trích xuất thumbnail, render ảnh thu nhỏ cho table, highlight bài viết theo URL param (?id=).
 * PHẠM VI SỬ DỤNG:
 *   - Các trang thuộc frontend/reporter/*.html, frontend/editor/*.html, frontend/admin/*.html.
 * PHỤ THUỘC:
 *   - frontend/assets/js/common.js (getCurrentUser, logout, escapeHtml, getInitials, resolveAssetPath, resolveApiUrl)
 *   - backend/api/editor/pending-articles.php (đếm số bài chờ duyệt cho Editor)
 * ==============================================================================
 */

// ==============================================================================
// KHỐI 1: CẤU HÌNH DANH MỤC MENU THEO VAI TRÒ (WORKSPACE_MENUS)
// ==============================================================================
const WORKSPACE_MENUS = {
  reporter: {
    roleTitle: "Ban Phóng viên",
    roleName: "Phóng viên",
    roleBadgeClass: "admin-sidebar__role-badge--reporter",
    dashboardUrl: "dashboard.html",
    items: [
      {
        key: "dashboard",
        title: "Thống kê bài viết",
        url: "dashboard.html",
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`
      },
      {
        key: "my-articles",
        title: "Bài viết của tôi",
        url: "my-articles.html",
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
      },
      {
        key: "write-article",
        title: "Soạn bài viết",
        url: "write-article.html",
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`
      }
    ]
  },
  editor: {
    roleTitle: "Ban Biên tập",
    roleName: "Biên tập viên",
    roleBadgeClass: "admin-sidebar__role-badge--editor",
    dashboardUrl: "dashboard.html",
    items: [
      {
        key: "dashboard",
        title: "Thống kê nội dung",
        url: "dashboard.html",
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`
      },
      {
        key: "pending-articles",
        title: "Bài chờ duyệt",
        url: "pending-articles.html",
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>`
      },
      {
        key: "categories-tags",
        title: "Danh mục & Tag",
        url: "categories-tags.html",
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`
      }
    ]
  },
  admin: {
    roleTitle: "Ban Quản trị",
    roleName: "Quản trị viên",
    roleBadgeClass: "admin-sidebar__role-badge--admin",
    dashboardUrl: "dashboard.html",
    items: [
      {
        key: "dashboard",
        title: "Thống kê hệ thống",
        url: "dashboard.html",
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`
      },
      {
        key: "published-articles",
        title: "Quản lý bài đã đăng",
        url: "published-articles.html",
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`
      },
      {
        key: "users",
        title: "Quản lý người dùng",
        url: "users.html",
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`
      },
      {
        key: "comments",
        title: "Quản lý bình luận",
        url: "comments.html",
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`
      },
      {
        key: "contact-config",
        title: "Cấu hình liên hệ",
        url: "contact-config.html",
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`
      }
    ]
  }
};

// ==============================================================================
// KHỐI 2: XỬ LÝ BADGE ĐẾM SỐ LƯỢNG TRÊN SIDEBAR
// ==============================================================================

/**
 * Tính toán số lượng huy hiệu (Badge Count)
 */
function getSidebarBadge(key, currentRole, currentUser) {
  return null;
}

/**
 * Cập nhật số lượng huy hiệu (Badge Count) trên Sidebar theo key
 */
function updateSidebarBadge(key, count, type = "warning") {
  const link = document.getElementById(`sidebar-nav-${key}`);
  if (!link) return;
  let badge = link.querySelector(".admin-sidebar__badge");
  const num = Number(count) || 0;
  if (num > 0) {
    if (!badge) {
      badge = document.createElement("span");
      link.appendChild(badge);
    }
    badge.className = `admin-sidebar__badge admin-sidebar__badge--${type}`;
    badge.textContent = num;
  } else if (badge) {
    badge.remove();
  }
}
window.updateSidebarBadge = updateSidebarBadge;

// ==============================================================================
// KHỐI 3: AVATAR VÀ KHỞI TẠO KHUNG GIAO DIỆN TÒA SOẠN (INIT ADMIN LAYOUT)
// ==============================================================================

/**
 * Render Avatar đồng bộ cho Sidebar & Topbar (hỗ trợ ảnh hoặc chữ cái đầu viết tắt)
 */
function renderWorkspaceAvatar(user, customClass) {
  const cls = customClass || "admin-sidebar__avatar-wrap";
  const fullName = (user && (user.full_name || user.username)) || "Thành viên";
  const initials = typeof getInitials === "function" ? getInitials(fullName) : (fullName.charAt(0) || "U").toUpperCase();
  const rawAvatar = user && user.avatar ? user.avatar : "";
  const resolvedAvatar = typeof resolveAssetPath === "function" ? resolveAssetPath(rawAvatar) : rawAvatar;

  if (resolvedAvatar) {
    return `
      <div class="${cls}">
        <img class="admin-avatar-img" src="${resolvedAvatar}" alt="${typeof escapeHtml === "function" ? escapeHtml(fullName) : fullName}" onerror="this.remove()">
        <span class="admin-avatar-fallback">${initials}</span>
      </div>
    `;
  }

  return `
    <div class="${cls}">
      <span class="admin-avatar-fallback">${initials}</span>
    </div>
  `;
}

/**
 * Khởi tạo Layout cho khu vực Tòa soạn (Kiểm tra Route Guard + Render Sidebar)
 * @param {string} currentRole - 'reporter' | 'editor' | 'admin'
 * @param {string} activeKey - Key của menu item đang active
 */
function initAdminLayout(currentRole, activeKey) {
  // 1. Kiểm tra xác thực và quyền truy cập (Route Guard)
  let currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  
  if (!currentUser) {
    window.location.href = "../public/login.html";
    return null;
  }

  // Nếu người dùng không có vai trò hợp lệ
  const validRoles = ["reporter", "editor", "admin"];
  if (!validRoles.includes(currentUser.role)) {
    window.location.href = "../public/index.html";
    return null;
  }

  // Nếu user cố truy cập vào khu vực không thuộc quyền của mình
  if (currentUser.role !== currentRole && currentUser.role !== "admin") {
    const targetFolder = currentUser.role;
    window.location.href = `../${targetFolder}/dashboard.html`;
    return null;
  }

  const roleConfig = WORKSPACE_MENUS[currentRole] || WORKSPACE_MENUS.reporter;
  const fullName = currentUser.full_name || currentUser.username || "Thành viên";

  // 2. Render Sidebar
  const sidebarMount = document.getElementById("admin-sidebar");
  if (sidebarMount) {
    const navItemsHtml = roleConfig.items
      .map((item) => {
        const isActive = item.key === activeKey;
        const badgeInfo = getSidebarBadge(item.key, currentRole, currentUser);
        const badgeHtml = badgeInfo 
          ? `<span class="admin-sidebar__badge admin-sidebar__badge--${badgeInfo.type}">${badgeInfo.count}</span>` 
          : "";

        return `
          <a href="${item.url}" id="sidebar-nav-${item.key}" class="admin-sidebar__link ${isActive ? 'is-active' : ''}">
            <div class="admin-sidebar__link-content">
              ${item.icon}
              <span class="admin-sidebar__link-title">${item.title}</span>
            </div>
            ${badgeHtml}
          </a>
        `;
      })
      .join("");

    sidebarMount.className = "admin-sidebar";
    sidebarMount.innerHTML = `
      <!-- 2.1. Header Sidebar: Logo thương hiệu TĨNH (không link, chuẩn ảnh mẫu) + Role Badge -->
      <div class="admin-sidebar__header">
        <div class="admin-sidebar__brand">
          <svg class="admin-sidebar__logo-pulse" width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <path d="M1 13H7L9.5 6L13.5 20L16 13H25" stroke="var(--crimson)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="admin-sidebar__logo-text">MẠCH <em>TIN</em></div>
        </div>
        <div class="admin-sidebar__role-pill ${roleConfig.roleBadgeClass}">
          <span class="admin-sidebar__role-dot"></span>
          <span>${roleConfig.roleTitle}</span>
        </div>
      </div>

      <!-- 2.2. Navigation Menu -->
      <div class="admin-sidebar__nav-wrapper">
        <div class="admin-sidebar__nav-label">DANH MỤC LÀM VIỆC</div>
        <nav class="admin-sidebar__nav">
          ${navItemsHtml}
        </nav>
      </div>

      <!-- 2.3. Footer Sidebar: Profile Card & Hành động Đăng xuất -->
      <div class="admin-sidebar__footer">
        <div class="admin-sidebar__profile-card">
          <div class="admin-sidebar__profile-info">
            <div class="admin-sidebar__avatar-container">
              ${renderWorkspaceAvatar(currentUser, "admin-sidebar__avatar-wrap")}
              <span class="admin-sidebar__status-dot"></span>
            </div>
            <div class="admin-sidebar__user-meta">
              <div class="admin-sidebar__user-name" title="${escapeHtml(fullName)}">${escapeHtml(fullName)}</div>
              <div class="admin-sidebar__user-email">@${escapeHtml(currentUser.username || '')}</div>
            </div>
          </div>
          <div class="admin-sidebar__profile-actions">
            <a href="../public/index.html" class="admin-sidebar__btn-action" title="Xem trang chủ Mạch Tin" target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Trang chủ</span>
            </a>
            <button type="button" class="admin-sidebar__btn-action admin-sidebar__btn-action--logout" onclick="logout()" title="Đăng xuất khỏi hệ thống">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 3. Topbar: Ẩn/loại bỏ để tối ưu không gian làm việc
  const topbarMount = document.getElementById("admin-topbar");
  if (topbarMount) {
    topbarMount.style.display = "none";
    topbarMount.innerHTML = "";
  }

  // 4. Tự động tải số lượng huy hiệu cho Biên tập viên (Bài chờ duyệt)
  if (currentRole === "editor") {
    const pendingApi = typeof resolveApiUrl === "function" 
      ? resolveApiUrl("editor/pending-articles.php") 
      : "../backend/api/editor/pending-articles.php";
    fetch(pendingApi, { credentials: "include" })
      .then((res) => res.json())
      .then((res) => {
        if (res && res.success && Array.isArray(res.data)) {
          const pendingCount = res.data.filter((a) => a.status === "pending").length;
          updateSidebarBadge("pending-articles", pendingCount, "warning");
        }
      })
      .catch(() => {});
  }

  return currentUser;
}

// ==============================================================================
// KHỐI 4: CÁC TIỆN ÍCH HỖ TRỢ BẢNG DỮ LIỆU QUẢN TRỊ (TABLE & MEDIA HELPERS)
// ==============================================================================

/**
 * Trích xuất ảnh bìa (cover_image) cho các bảng quản trị
 */
function extractThumbnail(article) {
  if (!article) return "";
  if (article.cover_image && article.cover_image.trim() && !article.cover_image.includes("placeholder")) {
    return article.cover_image.trim();
  }
  return "";
}
window.extractThumbnail = extractThumbnail;

/**
 * Render ảnh thu nhỏ cho các hàng của bảng dữ liệu quản trị
 */
function renderTableCoverThumb(imagePath, title) {
  const safeAlt = typeof escapeHtml === "function" ? escapeHtml(title || "Ảnh bài viết") : "Ảnh bài viết";
  const raw = imagePath ? String(imagePath).trim() : "";
  if (!raw || raw.includes("placeholder")) {
    return `<div class="admin-article-thumb-ph" title="Chưa có ảnh bìa"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color:var(--muted); opacity:0.65;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>`;
  }
  const resolvedUrl = typeof resolveAssetPath === "function" ? resolveAssetPath(raw) : raw;

  if (!resolvedUrl) {
    return `<div class="admin-article-thumb-ph" title="Chưa có ảnh bìa"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color:var(--muted); opacity:0.65;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>`;
  }
  return `
    <div class="admin-article-thumb-ph">
      <img src="${typeof escapeHtml === "function" ? escapeHtml(resolvedUrl) : resolvedUrl}" alt="${safeAlt}" loading="lazy" onerror="this.remove()">
    </div>
  `;
}
window.renderTableCoverThumb = renderTableCoverThumb;

/**
 * Tạo ký hiệu mũi tên sắp xếp đồng nhất cho bảng quản trị
 */
function getAdminSortIcon(field, activeField, activeOrder) {
  if (activeField !== field) return "▲▼";
  return activeOrder === "asc" ? "▲" : "▼";
}
window.getAdminSortIcon = getAdminSortIcon;

/**
 * Tự động cuộn đến hàng trong bảng và làm nổi màu (Highlight) khi có tham số ?id= hoặc ?article_id= trên URL
 */
function checkAndHighlightArticle(idPrefix = "article-row-") {
  const urlParams = new URLSearchParams(window.location.search);
  const targetArticleId = urlParams.get("id") || urlParams.get("article_id");
  if (!targetArticleId) return;

  setTimeout(() => {
    const targetElement = document.getElementById(`${idPrefix}${targetArticleId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      targetElement.classList.add("admin-row-highlight-flash");
      setTimeout(() => {
        targetElement.classList.remove("admin-row-highlight-flash");
      }, 2800);
    }
  }, 250);
}
window.checkAndHighlightArticle = checkAndHighlightArticle;

/**
 * Định dạng ngày giờ bảng quản trị đồng nhất với font monospace
 */
function formatAdminDateTime(dateStr, fallback = "Chưa có") {
  if (!dateStr) return `<span style="color: var(--muted); font-size: 11.5px;">${fallback}</span>`;
  try {
    const formatted = typeof formatDateTime === "function" ? formatDateTime(dateStr) : dateStr;
    return `<span style="font-family: var(--f-mono); font-size: 12px; color: var(--muted); white-space: nowrap;">${typeof escapeHtml === "function" ? escapeHtml(formatted) : formatted}</span>`;
  } catch (e) {
    return `<span style="font-family: var(--f-mono); font-size: 12px; color: var(--muted);">${typeof escapeHtml === "function" ? escapeHtml(dateStr) : dateStr}</span>`;
  }
}
window.formatAdminDateTime = formatAdminDateTime;
