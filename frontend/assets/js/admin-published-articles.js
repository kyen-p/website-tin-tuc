/*
==============================================================================
TÊN FILE: frontend/assets/js/admin-published-articles.js
PHÂN HỆ: Quản lý bài viết đã xuất bản
MÔ TẢ: Quản trị danh sách các bài viết đã duyệt xuất bản trên hệ thống:
       - Tải dữ liệu qua admin/published-articles.php, public/categories.php, admin/users.php
       - Lọc theo tab: Đang hiển thị, Đã tạm ẩn, Tất cả
       - Tìm kiếm theo tiêu đề, tóm tắt sapo hoặc tác giả
       - Sắp xếp trực tiếp trên tiêu đề các cột (Ngày xuất bản, Lượt xem)
       - Thao tác: Chỉnh sửa nội dung đè, Ẩn/Hiện bài viết, Xóa bài viết vĩnh viễn
PHẠM VI SỬ DỤNG:
       - frontend/admin/published-articles.html
PHỤ THUỘC:
       - frontend/assets/js/common.js
       - backend/api/admin/published-articles.php
       - backend/api/public/categories.php
       - backend/api/admin/users.php
==============================================================================
*/

(function () {
  "use strict";

  // 1. Khởi tạo trang và trạng thái bộ lọc / sắp xếp
  let allArticles = [];
  let allCategories = [];
  let allUsers = [];
  let allTags = [];

  // Bộ lọc hiện tại
  let currentTab = "published"; // 'all' | 'published' | 'hidden'
  let searchQuery = "";

  // Phân trang dữ liệu bảng quản trị
  let currentPage = 1;
  let perPage = 10;

  // Sắp xếp dữ liệu (Sort: chỉ Ngày xuất bản và Lượt xem)
  let sortField = "published_at"; // 'published_at' | 'views'
  let sortOrder = "desc"; // 'desc' | 'asc'

  // ID bài viết đang chỉnh sửa / xóa & mảng thẻ tag đang chỉnh sửa
  let editingArticleId = null;
  let deletingArticleId = null;
  let currentEditTags = [];

  document.addEventListener("DOMContentLoaded", () => {
    initPublishedArticlesPage();
  });

  // Xuất dữ liệu ra toàn cục để Modal thẩm định dùng chung có thể truy cập
  window.AdminPublishedArticles = {
    getAllArticles: () => allArticles,
    getAllCategories: () => allCategories,
    getAllTags: () => allTags
  };

  async function initPublishedArticlesPage() {
    await loadData();
    renderPageStructure();
    bindEvents();
    renderTableRows();
  }

  // 2. Tải dữ liệu bài viết đã đăng, danh mục, người dùng và tags từ API
  async function loadData() {
    try {
      const [articlesRes, categoriesRes, usersRes, tagsRes] = await Promise.all([
        fetch(resolveApiUrl('admin/published-articles.php')).then(r => r.json()),
        fetch(resolveApiUrl('public/categories.php')).then(r => r.json()),
        fetch(resolveApiUrl('admin/users.php')).then(r => r.json()),
        fetch(resolveApiUrl('public/tags.php')).then(r => r.json()).catch(() => ({ data: [] }))
      ]);
      allArticles = articlesRes.data || [];
      allCategories = categoriesRes.data || [];
      allUsers = usersRes.data || [];
      allTags = (tagsRes && tagsRes.data) || [];
    } catch (err) {
      allArticles = [];
      allCategories = [];
      allUsers = [];
      allTags = [];
    }
  }

  /**
   * Biểu tượng mũi tên sắp xếp đồng bộ chuẩn với trang Thống kê Phóng viên
   */
  function getSortIcon(field) {
    return getAdminSortIcon(field, sortField, sortOrder);
  }

  // 3. Hiển thị khung bố cục, các tab trạng thái và gắn sự kiện tìm kiếm
  function renderPageStructure() {
    const container = document.getElementById("workspace-content");
    if (!container) return;

    const counts = {
      all: allArticles.filter(a => a.status === "published" || a.status === "hidden").length,
      published: allArticles.filter(a => a.status === "published").length,
      hidden: allArticles.filter(a => a.status === "hidden").length
    };

    container.innerHTML = `
      <!-- 1. TABS LỌC TRẠNG THÁI -->
      <div class="admin-tabs-nav">
        <button type="button" class="admin-tab-btn ${currentTab === 'published' ? 'is-active' : ''}" data-tab="published" onclick="window.switchPublishedTab('published')">
          Đang hiển thị <span class="tab-badge" style="background:#E8F5E9; color:#2E7D32;">${counts.published}</span>
        </button>
        <button type="button" class="admin-tab-btn ${currentTab === 'hidden' ? 'is-active' : ''}" data-tab="hidden" onclick="window.switchPublishedTab('hidden')">
          Đã tạm ẩn <span class="tab-badge" style="background:#FFEBEE; color:#C62828;">${counts.hidden}</span>
        </button>
        <button type="button" class="admin-tab-btn ${currentTab === 'all' ? 'is-active' : ''}" data-tab="all" onclick="window.switchPublishedTab('all')">
          Tất cả bài đã đăng <span class="tab-badge">${counts.all}</span>
        </button>
      </div>

      <!-- 2. BẢNG DANH SÁCH BÀI VIẾT (CHUẨN ADMIN-CARD & TOOLBAR) -->
      <div class="admin-card">
        <div class="admin-card__header">
          <div class="admin-card__title-group">
            <h2 class="admin-card__title" id="tab-title-display">${getTabTitle(currentTab)}</h2>
            <span class="admin-card__count-badge" id="list-count-badge">0 bài</span>
          </div>

          <div class="admin-card__toolbar">
            <!-- Tìm kiếm -->
            <div class="admin-search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                id="search-articles-input" 
                class="admin-search-input" 
                placeholder="Tìm theo tiêu đề, tác giả..."
                value="${escapeHtml(searchQuery)}"
              >
            </div>
          </div>
        </div>

        <div class="admin-table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="min-width: 280px;">Bài viết</th>
                <th style="white-space: nowrap;">Tác giả</th>
                <th style="white-space: nowrap;">Người duyệt</th>
                <th class="is-sortable admin-col-date ${sortField === 'published_at' ? 'is-sorted' : ''}" onclick="window.handleSortTable('published_at')" style="text-align: center; white-space: nowrap;">
                  <div class="admin-th-content" style="justify-content: center;">
                    <span>Ngày xuất bản</span>
                    <span class="admin-sort-icon">${getSortIcon('published_at')}</span>
                  </div>
                </th>
                <th class="is-sortable admin-col-num ${sortField === 'views' ? 'is-sorted' : ''}" onclick="window.handleSortTable('views')" style="text-align: right; white-space: nowrap;">
                  <div class="admin-th-content" style="justify-content: flex-end;">
                    <span>Lượt xem</span>
                    <span class="admin-sort-icon">${getSortIcon('views')}</span>
                  </div>
                </th>
                <th style="text-align: center; white-space: nowrap;">Trạng thái</th>
                <th style="text-align: center; width: 60px; min-width: 60px; white-space: nowrap;">Thao tác</th>
              </tr>
            </thead>
            <tbody id="articles-tbody">
              <!-- Render JS -->
            </tbody>
          </table>
        </div>

        <!-- Thanh phân trang bảng quản trị (Data Table Pagination) -->
        <div id="admin-articles-pagination"></div>
      </div>

      <!-- MODAL 1: SỬA ĐÈ NỘI DUNG (ADMIN OVERRIDE) -->
      <div id="editArticleModal" class="admin-modal-overlay" style="display: none;">
        <div class="admin-modal" style="max-width: 760px; width: 100%; max-height: 90vh; display: flex; flex-direction: column;">
          
          <div class="admin-modal__header">
            <div class="admin-modal__title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: var(--brass-dark);">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Sửa đè nội dung bài viết</span>
              <span class="admin-badge" style="background: #FEF9C3; color: #854D0E; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 600; margin-left: 6px;">Quyền Admin</span>
            </div>
            <button type="button" class="btn-close-edit-modal" style="background: none; border: none; font-size: 22px; color: var(--muted); cursor: pointer;">&times;</button>
          </div>
          
          <div class="admin-modal__body" style="overflow-y: auto; flex: 1; padding: 20px 24px;">
            <form id="editArticleForm">
              
              <div class="admin-form-group">
                <label class="admin-form-label">Tiêu đề bài viết <span class="required-mark">*</span></label>
                <input type="text" id="editTitle" class="admin-form-input" required style="font-family: var(--f-body); font-size: 14.5px; font-weight: 600;">
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="admin-form-group">
                  <label class="admin-form-label">Chuyên mục</label>
                  <select id="editCategory" class="admin-form-select" required>
                    ${allCategories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join("")}
                  </select>
                </div>

                <div class="admin-form-group">
                  <label class="admin-form-label">Trạng thái hiển thị</label>
                  <select id="editStatus" class="admin-form-select" required>
                    <option value="published">Đang hiển thị (Published)</option>
                    <option value="hidden">Tạm ẩn bài (Hidden)</option>
                  </select>
                </div>
              </div>

              <!-- Tùy chọn Sự kiện đáng chú ý -->
              <div class="admin-form-group" style="background: #FFFDF9; border: 1.5px solid #F3DFC1; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; margin: 0; font-size: 13px; font-weight: 700; color: #8F7239;">
                  <input type="checkbox" id="editIsNotable" style="width: 17px; height: 17px; accent-color: #B8934F; cursor: pointer;">
                  <span>Đưa vào <strong>"Sự kiện đáng chú ý"</strong> trên Trang chủ</span>
                </label>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">Tóm tắt ngắn (Lead / Sapo)</label>
                <textarea id="editDescription" class="admin-form-textarea" rows="2"></textarea>
              </div>

              <!-- Quản lý Thẻ bài viết (Tags) cho Admin -->
              <div class="admin-form-group">
                <label class="admin-form-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span>Thẻ bài viết (Tags)</span>
                  <span style="font-size: 11.5px; color: var(--muted); font-weight: normal;">Nhập tên thẻ và bấm Enter hoặc click gợi ý để thêm</span>
                </label>
                <!-- Danh sách thẻ đã chọn -->
                <div id="admin-edit-tags-container" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; min-height: 32px; padding: 6px 10px; background: #F9FAFB; border: 1px dashed var(--line-soft); border-radius: 6px; align-items: center;"></div>
                
                <!-- Ô nhập tìm kiếm / tạo thẻ mới -->
                <div style="position: relative;">
                  <input type="text" id="admin-edit-tag-input" class="admin-form-input" placeholder="Gõ tên thẻ tag (ví dụ: Kinh tế, Chuyển đổi số)..." style="font-size: 13px;">
                  <div id="admin-edit-tag-dropdown" style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #fff; border: 1px solid var(--line-soft); border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.12); max-height: 180px; overflow-y: auto; z-index: 1050;"></div>
                </div>

                <!-- Thẻ gợi ý từ hệ thống -->
                <div style="margin-top: 8px;">
                  <span style="font-size: 11.5px; color: var(--muted); margin-right: 6px;">Gợi ý từ hệ thống:</span>
                  <div id="admin-edit-tag-suggestions" style="display: inline-flex; flex-wrap: wrap; gap: 6px; vertical-align: middle;"></div>
                </div>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label">Nội dung bài viết</label>
                <textarea id="editContent" class="admin-form-textarea" rows="8"></textarea>
              </div>

            </form>
          </div>

          <div class="admin-modal__footer">
            <button type="button" class="admin-btn admin-btn--default btn-close-edit-modal">Hủy bỏ</button>
            <button type="button" id="saveEditBtn" class="admin-btn admin-btn--primary">Lưu thay đổi</button>
          </div>

        </div>
      </div>

      <!-- MODAL 2: XÁC NHẬN XÓA BÀI VIẾT (CHUẨN ADMIN MODAL DANGER) -->
      <div id="deleteArticleModal" class="admin-modal-overlay" style="display: none;">
        <div class="admin-modal" style="max-width: 440px;">
          
          <div class="admin-modal__header">
            <div class="admin-modal__title" style="color: var(--crimson);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Xóa vĩnh viễn bài viết</span>
            </div>
            <button type="button" class="btn-close-delete-modal" style="background: none; border: none; font-size: 22px; color: var(--muted); cursor: pointer;">&times;</button>
          </div>

          <div class="admin-modal__body">
            <p style="margin: 0 0 12px 0;">
              Bạn có chắc chắn muốn xóa bài viết sau khỏi cơ sở dữ liệu?
            </p>
            <div id="deleteArticleTitle" style="font-weight: 600; font-size: 14px; color: var(--ink); padding: 10px 12px; background: #FAF8F5; border: 1px solid var(--line-soft); border-radius: 6px; font-family: var(--f-body, sans-serif); margin-bottom: 12px;"></div>
            <div style="background: #FEE2E2; border-left: 3px solid #DC2626; padding: 8px 12px; font-size: 12px; color: #991B1B; border-radius: 4px;">
              Cảnh báo: Hành động này không thể hoàn tác. Toàn bộ bình luận và dữ liệu tương tác của bài viết sẽ bị xóa.
            </div>
          </div>

          <div class="admin-modal__footer">
            <button type="button" class="admin-btn admin-btn--default btn-close-delete-modal">Hủy</button>
            <button type="button" id="confirmDeleteBtn" class="admin-btn admin-btn--danger">Xác nhận Xóa</button>
          </div>

        </div>
      </div>
    `;
  }

  function getTabTitle(tab) {
    switch (tab) {
      case "hidden": return "Danh sách bài viết đã tạm ẩn";
      case "all": return "Tất cả bài viết đã đăng";
      case "published":
      default: return "Bài viết đang hiển thị công khai";
    }
  }

  function bindEvents() {
    const searchInput = document.getElementById("search-articles-input");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        currentPage = 1;
        renderTableRows();
      });
    }

    // Modal Edit
    document.querySelectorAll(".btn-close-edit-modal").forEach(btn => {
      btn.addEventListener("click", closeEditModal);
    });
    const editModalEl = document.getElementById("editArticleModal");
    if (editModalEl) {
      editModalEl.addEventListener("click", (e) => {
        if (e.target === editModalEl) closeEditModal();
      });
    }
    const saveEditBtn = document.getElementById("saveEditBtn");
    if (saveEditBtn) saveEditBtn.addEventListener("click", handleSaveEdit);

    // Modal Delete
    document.querySelectorAll(".btn-close-delete-modal").forEach(btn => {
      btn.addEventListener("click", closeDeleteModal);
    });
    const deleteModalEl = document.getElementById("deleteArticleModal");
    if (deleteModalEl) {
      deleteModalEl.addEventListener("click", (e) => {
        if (e.target === deleteModalEl) closeDeleteModal();
      });
    }
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener("click", handleConfirmDelete);

    // Đóng modal khi nhấn phím Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (editModalEl && editModalEl.style.display !== "none") closeEditModal();
        if (deleteModalEl && deleteModalEl.style.display !== "none") closeDeleteModal();
      }
    });
  }

  window.switchPublishedTab = function (tab) {
    currentTab = tab;
    currentPage = 1;
    renderPageStructure();
    bindEvents();
    renderTableRows();
  };

  /**
   * Đổi cột và chiều sắp xếp khi bấm vào Header cột
   */
  window.handleSortTable = function (field) {
    if (sortField === field) {
      sortOrder = sortOrder === "desc" ? "asc" : "desc";
    } else {
      sortField = field;
      sortOrder = (field === "published_at" || field === "views") ? "desc" : "asc";
    }
    currentPage = 1;
    renderPageStructure();
    bindEvents();
    renderTableRows();
  };

  // 4. Hiển thị bảng bài viết, sắp xếp cột và phân loại theo tab / từ khóa
  function renderTableRows() {
    const tbody = document.getElementById("articles-tbody");
    const countBadge = document.getElementById("list-count-badge");
    if (!tbody) return;


    // 1. Lọc theo Tab (Chỉ quản lý bài đã đăng: published hoặc hidden)
    let filtered = allArticles.filter(art => {
      if (currentTab === "published") return art.status === "published";
      if (currentTab === "hidden") return art.status === "hidden";
      return art.status === "published" || art.status === "hidden"; // "all"
    });

    // 2. Lọc theo Search Query
    if (searchQuery) {
      filtered = filtered.filter(art => {
        const title = (art.title || "").toLowerCase();
        const sapo = (art.short_description || "").toLowerCase();
        const author = allUsers.find(u => String(u.id) === String(art.author_id));
        const authorName = (author ? author.full_name || author.username : art.author || "").toLowerCase();
        return title.includes(searchQuery) || sapo.includes(searchQuery) || authorName.includes(searchQuery);
      });
    }

    // 3. Sắp xếp theo lựa chọn sortField & sortOrder (Ngày xuất bản hoặc Lượt xem)
    filtered.sort((a, b) => {
      if (sortField === "views") {
        const vA = getArticleViews(a);
        const vB = getArticleViews(b);
        return sortOrder === "asc" ? vA - vB : vB - vA;
      } else {
        // Mặc định: published_at
        const tA = new Date(a.published_at || a.created_at || a.updated_at || 0).getTime();
        const tB = new Date(b.published_at || b.created_at || b.updated_at || 0).getTime();
        return sortOrder === "asc" ? tA - tB : tB - tA;
      }
    });

    if (countBadge) {
      countBadge.textContent = `${filtered.length} bài`;
    }

    const totalRecords = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / perPage));
    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="admin-empty-state" style="padding: 48px 20px;">
              <div class="admin-empty-state__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <p class="admin-empty-state__text">Không có bài viết nào phù hợp với bộ lọc hiện tại</p>
            </div>
          </td>
        </tr>
      `;
      const pagEl = document.getElementById("admin-articles-pagination");
      if (pagEl) pagEl.innerHTML = "";
      return;
    }

    const startIndex = (currentPage - 1) * perPage;
    const pageItems = filtered.slice(startIndex, startIndex + perPage);

    tbody.innerHTML = pageItems.map(art => {
      const author = allUsers.find(u => String(u.id) === String(art.author_id)) || { full_name: art.author || "Phóng viên", username: "reporter" };
      const approver = allUsers.find(u => String(u.id) === String(art.approved_by));

      const authorName = author.full_name || author.username || "Phóng viên";
      const authorUser = author.username ? `@${author.username}` : "";
      const approverName = approver ? (approver.full_name || approver.username) : (art.approved_by ? `BTV #${art.approved_by}` : "Chưa ghi nhận");
      const approverUser = approver && approver.username ? `@${approver.username}` : "";

      const desc = art.short_description || "";
      const detailUrl = typeof getArticleDetailUrl === "function" ? getArticleDetailUrl(art, "../public/") : `../public/article-detail.html?slug=${encodeURIComponent(art.slug || art.id)}`;

      // Badge Trạng thái
      let statusBadge = "";
      if (art.status === "published") {
        statusBadge = `<span class="admin-status-badge admin-status-badge--published">Đang hiển thị</span>`;
      } else if (art.status === "hidden") {
        statusBadge = `<span class="admin-status-badge admin-status-badge--rejected">Đã tạm ẩn</span>`;
      } else if (art.status === "pending") {
        statusBadge = `<span class="admin-status-badge admin-status-badge--pending">Chờ duyệt</span>`;
      } else {
        statusBadge = `<span class="admin-status-badge admin-status-badge--draft">Bản nháp</span>`;
      }

      const isHidden = art.status === "hidden";
      const toggleHideLabel = isHidden ? "Hiển thị lại bài" : "Tạm ẩn bài";

      return `
        <tr>
          <td>
            <div class="admin-article-info" style="margin: 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <a href="javascript:void(0)" onclick="window.adminViewArticleDetail(${art.id}, event)" class="admin-article-title-link" title="Bấm để xem chi tiết bài viết (đầy đủ định dạng bảng, danh sách, đa phương tiện)">
                  ${escapeHtml(art.title || "Chưa đặt tiêu đề")}
                </a>
                <a href="${detailUrl}" target="_blank" style="color: var(--muted); display: inline-flex; align-items: center;" title="Xem bài viết trên trang công khai (Mở tab mới)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
              ${desc ? `<div class="admin-article-sapo-text" title="${escapeHtml(desc)}">${escapeHtml(desc)}</div>` : ""}
              ${art.is_notable_event ? `
                <div style="margin-top: 4px;">
                  <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #8F7239; background: #FFFDF9; border: 1px solid #F3DFC1; padding: 2px 7px; border-radius: 4px;">
                    Sự kiện đáng chú ý
                  </span>
                </div>
              ` : ""}
            </div>
          </td>
          <td>
            <div style="display: flex; flex-direction: column;">
              <strong style="font-size: 13px; color: var(--ink);">${escapeHtml(authorName)}</strong>
              <span style="font-size: 11px; color: var(--muted); font-family: var(--f-mono);">${escapeHtml(authorUser)}</span>
            </div>
          </td>
          <td>
            <div style="display: flex; flex-direction: column;">
              <strong style="font-size: 13px; color: #1B2A4A;">${escapeHtml(approverName)}</strong>
              ${approverUser ? `<span style="font-size: 11px; color: var(--muted); font-family: var(--f-mono);">${escapeHtml(approverUser)}</span>` : ""}
            </div>
          </td>
          <td style="text-align: center;">
            ${formatAdminDateTime(art.published_at || art.created_at)}
          </td>
          <td class="admin-col-num">
            <div class="admin-num-badge admin-num-badge--views">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>${getArticleViews(art).toLocaleString("vi-VN")}</span>
            </div>
          </td>
          <td style="text-align: center;">
            ${statusBadge}
          </td>
          <td style="text-align: center;">
            <!-- NÚT 3 CHẤM (MORE ACTIONS MENU) -->
            <div class="admin-action-dropdown-wrapper">
              <button 
                type="button" 
                class="admin-btn-more-actions" 
                onclick="window.toggleAdminActionMenu(event, ${art.id})" 
                title="Tùy chọn thao tác" 
                aria-label="Tùy chọn thao tác"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                  <circle cx="12" cy="12" r="1.5"></circle>
                  <circle cx="19" cy="12" r="1.5"></circle>
                  <circle cx="5" cy="12" r="1.5"></circle>
                </svg>
              </button>

              <div id="action-menu-${art.id}" class="admin-action-dropdown-menu" style="display: none;">
                <!-- Xem chi tiết bài (Dùng chung modal chuẩn định dạng CKEditor 5) -->
                <button type="button" class="admin-dropdown-item" onclick="window.adminViewArticleDetail(${art.id}, event)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <span>Xem chi tiết bài</span>
                </button>

                <!-- Sửa đè -->
                <button type="button" class="admin-dropdown-item" onclick="window.adminOpenEditArticle(${art.id})">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Sửa bài viết</span>
                </button>

                <!-- Ẩn / Hiện -->
                <button type="button" class="admin-dropdown-item" onclick="window.adminToggleHideArticle(${art.id})">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    ${isHidden
          ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>'
          : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
        }
                  </svg>
                  <span>${toggleHideLabel}</span>
                </button>

                <div class="admin-dropdown-divider"></div>

                <!-- Xóa vĩnh viễn -->
                <button type="button" class="admin-dropdown-item admin-dropdown-item--danger" onclick="window.adminOpenDeleteArticle(${art.id})">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <span>Xóa vĩnh viễn</span>
                </button>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Render thanh phân trang chuẩn bảng dữ liệu quản trị
    if (typeof renderTablePagination === "function") {
      renderTablePagination("admin-articles-pagination", {
        currentPage,
        perPage,
        totalRecords,
        totalPages,
        perPageOptions: [10, 25, 50],
        onPageChange: (newPage) => {
          currentPage = newPage;
          renderTableRows();
        },
        onLimitChange: (newLimit) => {
          perPage = newLimit;
          currentPage = 1;
          renderTableRows();
        }
      });
    }
  }

  // 5. Menu thao tác ba chấm và các nghiệp vụ quản trị viên (ẩn/hiện, sửa đè, xóa)

  function closeAllActionMenus() {
    document.querySelectorAll(".admin-action-dropdown-menu").forEach(menu => {
      menu.style.display = "none";
    });
    document.querySelectorAll(".admin-btn-more-actions").forEach(btn => {
      btn.classList.remove("is-active");
    });
  }

  window.toggleAdminActionMenu = function (event, articleId) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    const targetMenu = document.getElementById(`action-menu-${articleId}`);
    if (!targetMenu) return;

    const isVisible = targetMenu.style.display === "flex";
    closeAllActionMenus();

    if (!isVisible) {
      targetMenu.style.display = "flex";
      const btn = event?.currentTarget;
      if (btn) btn.classList.add("is-active");
    }
  };

  // Đóng menu khi click ra ngoài
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".admin-action-dropdown-wrapper")) {
      closeAllActionMenus();
    }
  });

  // 6. Các hàm xử lý thao tác của quản trị viên

  let adminEditorInstance = null;

  /**
   * Khởi tạo CKEditor 5 cho Admin Edit Modal sử dụng Module dùng chung window.initArticleEditor
   * Đảm bảo nhất quán 100% với Phóng viên: Căn lề, Bảng biểu, Nhúng video và Tải ảnh lên máy chủ (upload.php).
   */
  async function ensureAdminEditor() {
    if (adminEditorInstance) return adminEditorInstance;
    const textarea = document.querySelector("#editContent");
    if (!textarea) return null;

    if (typeof window.initArticleEditor === "function") {
      adminEditorInstance = await window.initArticleEditor("#editContent", {
        placeholder: "Chỉnh sửa nội dung bài viết trực quan tại đây (hỗ trợ kéo thả ảnh, chèn video, kẻ bảng biểu, trích dẫn)..."
      });
      return adminEditorInstance;
    }

    // Fallback dự phòng nếu chưa kịp nạp ckeditor-helper.js
    const EditorConstructor = (window.CKEDITOR && window.CKEDITOR.ClassicEditor) || window.ClassicEditor;
    if (!EditorConstructor) {
      return null;
    }

    try {
      adminEditorInstance = await EditorConstructor.create(textarea);
      return adminEditorInstance;
    } catch (err) {
      console.warn("Lỗi khi tạo CKEditor 5 cho Admin:", err);
      return null;
    }
  }

  // 7. Quản lý thẻ bài viết (tags) cho modal sửa đè của admin
  /**
   * Hiển thị danh sách các thẻ tag đã chọn trong form sửa của Admin
   */
  function renderAdminEditTags() {
    const container = document.getElementById("admin-edit-tags-container");
    if (!container) return;

    if (!currentEditTags || currentEditTags.length === 0) {
      container.innerHTML = `<span style="font-size: 12.5px; color: var(--muted); font-style: italic;">Chưa gắn thẻ tag nào cho bài viết.</span>`;
      return;
    }

    container.innerHTML = currentEditTags.map((tag, idx) => `
      <span class="admin-badge" style="background: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; font-size: 12px; padding: 4px 10px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 6px; font-weight: 500;">
        #${escapeHtml(tag)}
        <span onclick="window.removeAdminEditTag(${idx})" style="cursor: pointer; font-size: 14px; font-weight: bold; color: #3B82F6; line-height: 1;" title="Gỡ thẻ này">&times;</span>
      </span>
    `).join("");
  }

  /**
   * Thêm một thẻ tag vào danh sách bài viết đang sửa
   */
  window.addAdminEditTag = function (tagName) {
    const clean = (tagName || "").trim().replace(/^#/, "");
    if (!clean) return;
    if (!currentEditTags.some(t => t.toLowerCase() === clean.toLowerCase())) {
      currentEditTags.push(clean);
      renderAdminEditTags();
    }
    const input = document.getElementById("admin-edit-tag-input");
    if (input) input.value = "";
    const dropdown = document.getElementById("admin-edit-tag-dropdown");
    if (dropdown) dropdown.style.display = "none";
  };

  /**
   * Xóa một thẻ tag khỏi danh sách
   */
  window.removeAdminEditTag = function (index) {
    currentEditTags.splice(index, 1);
    renderAdminEditTags();
  };

  /**
   * Hiển thị danh sách thẻ gợi ý nhanh từ kho thẻ hệ thống
   */
  function renderAdminTagSuggestions() {
    const mount = document.getElementById("admin-edit-tag-suggestions");
    if (!mount) return;

    mount.innerHTML = allTags.slice(0, 10).map(t => `
      <span class="admin-tag-suggest-item" onclick="window.addAdminEditTag('${escapeHtml(t.name)}')" style="font-size: 11.5px; padding: 2px 8px; background: #F3F4F6; color: #374151; border-radius: 4px; cursor: pointer; border: 1px solid #E5E7EB; user-select: none;">
        + #${escapeHtml(t.name)}
      </span>
    `).join("");
  }

  /**
   * Gắn sự kiện gõ tìm kiếm và phím Enter cho ô nhập thẻ tag của Admin
   */
  function bindAdminTagInputEvents() {
    const tagInput = document.getElementById("admin-edit-tag-input");
    const dropdown = document.getElementById("admin-edit-tag-dropdown");
    if (!tagInput || !dropdown) return;

    tagInput.oninput = () => {
      const query = tagInput.value.trim().replace(/^#/, "");
      if (!query) {
        dropdown.style.display = "none";
        return;
      }

      const lowerQuery = query.toLowerCase();
      const matched = allTags.filter(t => (t.name || "").toLowerCase().includes(lowerQuery));
      const exactMatch = allTags.some(t => (t.name || "").toLowerCase() === lowerQuery);

      let html = "";
      if (matched.length > 0) {
        html += matched.map(t => {
          const isSelected = currentEditTags.some(st => st.toLowerCase() === t.name.toLowerCase());
          return `
            <div onclick="window.addAdminEditTag('${escapeHtml(t.name)}')" style="padding: 7px 12px; font-size: 12.5px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border-bottom: 1px solid var(--line-soft); ${isSelected ? 'background: #F3F4F6; color: var(--muted);' : 'background: #fff; color: var(--ink);'}">
              <span><strong>#${escapeHtml(t.name)}</strong></span>
              ${isSelected ? '<span style="font-size: 11px; color: var(--muted);">Đã chọn</span>' : '<span style="font-size: 11px; color: #2563EB; font-weight: 600;">+ Chọn</span>'}
            </div>
          `;
        }).join("");
      }

      if (!exactMatch) {
        html += `
          <div onclick="window.addAdminEditTag('${escapeHtml(query)}')" style="padding: 8px 12px; font-size: 12.5px; color: #15803D; background: #F0FDF4; display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <span>+ Tạo thẻ mới: <strong>#${escapeHtml(query)}</strong></span>
          </div>
        `;
      }

      dropdown.innerHTML = html;
      dropdown.style.display = "block";
    };

    tagInput.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const query = tagInput.value.trim().replace(/^#/, "").replace(/,/g, "");
        if (query) {
          window.addAdminEditTag(query);
        }
      }
    };
  }

  /**
   * 1. Mở Modal Xem chi tiết bài viết (Dùng chung Modal thẩm định của Tòa soạn, chuẩn CKEditor 5)
   */
  window.adminViewArticleDetail = function (id, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    closeAllActionMenus();
    const article = allArticles.find(a => String(a.id) === String(id));
    if (!article) {
      console.warn("Không tìm thấy bài viết với id:", id);
      if (typeof showToast === "function") {
        showToast("Không tìm thấy thông tin chi tiết bài viết này.", "error");
      }
      return;
    }

    const reviewModalFn = window.openArticleReviewModal || window.openReviewModal;
    if (typeof reviewModalFn === "function") {
      reviewModalFn(article, {
        mode: "admin",
        articles: allArticles,
        categories: allCategories,
        tags: allTags,
        onEdit: (art) => {
          window.adminOpenEditArticle(art.id);
        },
        onToggleStatus: (art) => {
          window.adminToggleHideArticle(art.id);
        }
      });
    } else {
      console.warn("Chưa tải được openArticleReviewModal, tiến hành nạp DOM...");
      if (typeof window.ensureReviewModalsExist === "function") {
        window.ensureReviewModalsExist();
        if (typeof window.openReviewModal === "function") {
          window.openReviewModal(article, {
            mode: "admin",
            articles: allArticles,
            categories: allCategories,
            tags: allTags,
            onEdit: (art) => {
              window.adminOpenEditArticle(art.id);
            },
            onToggleStatus: (art) => {
              window.adminToggleHideArticle(art.id);
            }
          });
          return;
        }
      }
      if (typeof showToast === "function") {
        showToast("Hộp thoại chi tiết chưa sẵn sàng. Vui lòng tải lại trang.", "warning");
      }
    }
  };

  /**
   * 2. Ẩn / Hiện lại bài viết
   */
  window.adminToggleHideArticle = async function (id) {
    closeAllActionMenus();

    const res = await fetch(resolveApiUrl('admin/published-articles.php'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, toggle_status: true })
    });
    const result = await res.json();

    if (result.success) {
      const msg = result.data.status === "hidden" ? "Đã tạm ẩn bài viết" : "Đã hiển thị lại bài viết";
      if (typeof showToast === "function") showToast(msg, result.data.status === "hidden" ? "warning" : "success");
    }

    await loadData();
    renderPageStructure();
    bindEvents();
    renderTableRows();
  };

  /**
   * 3. Mở Modal Sửa đè nội dung bài viết
   */
  window.adminOpenEditArticle = async function (id) {
    closeAllActionMenus();
    const article = allArticles.find(a => Number(a.id) === Number(id));
    if (!article) return;

    editingArticleId = id;
    const titleInput = document.getElementById("editTitle");
    const categorySelect = document.getElementById("editCategory");
    const statusSelect = document.getElementById("editStatus");
    const isNotableCheckbox = document.getElementById("editIsNotable");
    const descInput = document.getElementById("editDescription");
    const contentInput = document.getElementById("editContent");

    if (titleInput) titleInput.value = article.title || "";
    if (categorySelect) categorySelect.value = article.category_id || allCategories[0]?.id || 1;
    if (statusSelect) statusSelect.value = article.status === "hidden" ? "hidden" : "published";
    if (isNotableCheckbox) isNotableCheckbox.checked = Boolean(article.is_notable_event);
    if (descInput) descInput.value = article.short_description || "";

    // Đồng bộ thẻ tag của bài viết vào form sửa
    currentEditTags = [];
    if (article.tags && Array.isArray(article.tags)) {
      currentEditTags = article.tags.map(t => (typeof t === "string" ? t : (t.name || ""))).filter(Boolean);
    }
    renderAdminEditTags();
    renderAdminTagSuggestions();
    bindAdminTagInputEvents();

    const modal = document.getElementById("editArticleModal");
    if (modal) {
      modal.style.display = "flex";
    }

    // Tích hợp CKEditor 5 cho Admin
    const editor = await ensureAdminEditor();
    if (editor) {
      editor.setData(article.content || "");
    } else if (contentInput) {
      contentInput.value = article.content || "";
    }
  };

  function closeEditModal() {
    editingArticleId = null;
    currentEditTags = [];
    const modal = document.getElementById("editArticleModal");
    if (modal) {
      modal.style.display = "none";
    }
    const dropdown = document.getElementById("admin-edit-tag-dropdown");
    if (dropdown) dropdown.style.display = "none";
    if (adminEditorInstance) {
      adminEditorInstance.setData("");
    }
  }

  async function handleSaveEdit() {
    if (!editingArticleId) return;

    const title = (document.getElementById("editTitle")?.value || "").trim();
    const categoryId = Number(document.getElementById("editCategory")?.value) || 1;
    const status = document.getElementById("editStatus")?.value || "published";
    const isNotable = Boolean(document.getElementById("editIsNotable")?.checked);
    const description = (document.getElementById("editDescription")?.value || "").trim();
    
    let content = "";
    if (adminEditorInstance) {
      content = adminEditorInstance.getData().trim();
    } else {
      content = (document.getElementById("editContent")?.value || "").trim();
    }

    if (!title) {
      if (typeof showToast === "function") showToast("Vui lòng nhập tiêu đề bài viết.", "error");
      else alert("Vui lòng nhập tiêu đề bài viết.");
      return;
    }

    const res = await fetch(resolveApiUrl('admin/published-articles.php'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingArticleId,
        title,
        category_id: categoryId,
        status,
        is_notable_event: isNotable,
        short_description: description,
        content,
        tags: currentEditTags
      })
    });
    const result = await res.json();

    if (result.success) {
      if (typeof showToast === "function") {
        showToast("Đã cập nhật bài viết và đồng bộ thẻ tag thành công (Quyền Admin)!", "success");
      }
    } else {
      if (typeof showToast === "function") {
        showToast(result.message || "Lỗi cập nhật bài viết!", "error");
      }
      return;
    }

    closeEditModal();
    await loadData();
    renderPageStructure();
    bindEvents();
    renderTableRows();
  }
  /**
   * 3. Mở Modal Xóa bài viết
   */
  window.adminOpenDeleteArticle = function (id) {
    closeAllActionMenus();
    const article = allArticles.find(a => Number(a.id) === Number(id));
    if (!article) return;

    deletingArticleId = id;
    const titleEl = document.getElementById("deleteArticleTitle");
    if (titleEl) {
      titleEl.textContent = article.title || "Bài viết không tiêu đề";
    }

    const modal = document.getElementById("deleteArticleModal");
    if (modal) {
      modal.style.display = "flex";
    }
  };

  function closeDeleteModal() {
    deletingArticleId = null;
    const modal = document.getElementById("deleteArticleModal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  async function handleConfirmDelete() {
    if (!deletingArticleId) return;

    const res = await fetch(resolveApiUrl('admin/published-articles.php'), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deletingArticleId })
    });
    const result = await res.json();

    if (result.success && typeof showToast === "function") {
      showToast("Đã xóa vĩnh viễn bài viết khỏi hệ thống.", "success");
    }

    closeDeleteModal();
    await loadData();
    renderPageStructure();
    bindEvents();
    renderTableRows();
  }

})();
