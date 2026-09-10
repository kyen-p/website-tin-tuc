/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/editor-pending-articles.js
 * PHÂN HỆ: Danh sách Bài viết Chờ duyệt Biên tập viên (Editor Pending Articles Module)
 * MÔ TẢ: Quản lý danh sách và luồng thẩm định các bài viết chờ duyệt:
 *        1. Tải danh sách bài chờ duyệt qua GET backend/api/editor/pending-articles.php và danh mục qua backend/api/public/categories.php.
 *        2. Lọc nhanh theo chuyên mục, tìm kiếm theo tiêu đề bài viết hoặc tên phóng viên.
 *        3. Render bảng bài viết chờ duyệt kèm huy hiệu trạng thái, ảnh đại diện, sapo và thông tin tác giả.
 *        4. Tích hợp kích hoạt Modal Thẩm định toàn diện (phối hợp với editor-pending-articles-modal.js).
 *        5. Cung cấp API nội bộ window.EditorPendingArticles để modal có thể kích hoạt reload dữ liệu sau khi duyệt/từ chối.
 * PHẠM VI SỬ DỤNG:
 *   - frontend/editor/pending-articles.html
 * PHỤ THUỘC:
 *   - frontend/assets/js/admin-layout.js (getCurrentUser, updateSidebarBadge, etc.)
 *   - frontend/assets/js/common.js (resolveApiUrl, escapeHtml, formatDate, extractThumbnail, etc.)
 *   - frontend/assets/js/editor-pending-articles-modal.js (openReviewModal, etc.)
 *   - backend/api/editor/pending-articles.php
 *   - backend/api/public/categories.php
 * ==============================================================================
 */

(function () {
  "use strict";

  // ==============================================================================
  // KHỐI 1: KHỞI TẠO TRANG & TRẠNG THÁI LỌC/TÌM KIẾM BÀI CHỜ DUYỆT
  // ==============================================================================
  let allArticles = [];
  let allCategories = [];
  let currentUser = null;

  let currentCategoryFilter = "all";
  let currentSearchQuery = "";

  document.addEventListener("DOMContentLoaded", () => {
    initPendingArticlesPage();
  });

  window.initPendingArticlesPage = initPendingArticlesPage;

  async function initPendingArticlesPage() {
    currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    await loadData();
    renderLayout();
    renderHeaderStats();
    renderArticlesList();
    attachEventListeners();

    // Tự động mở bài viết nếu có tham số ?id= trên URL
    const urlParams = new URLSearchParams(window.location.search);
    const targetArticleId = urlParams.get("id");
    if (targetArticleId) {
      openReviewModal(targetArticleId);
    }
  }

  // ==============================================================================
  // KHỐI 2: TẢI DỮ LIỆU BÀI VIẾT CHỜ DUYỆT & CHUYÊN MỤC TỪ BACKEND
  // ==============================================================================
  async function loadData() {
    try {
      const [artRes, catRes] = await Promise.all([
        fetch(resolveApiUrl("editor/pending-articles.php"), { credentials: "include" }).then(r => r.json()),
        fetch(resolveApiUrl("public/categories.php")).then(r => r.json())
      ]);
      allArticles = artRes.success && Array.isArray(artRes.data) ? artRes.data : [];
      allCategories = catRes.success && Array.isArray(catRes.data) ? catRes.data : [];
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu duyệt bài:", err);
      allArticles = [];
      allCategories = [];
    }
  }

  // ==============================================================================
  // KHỐI 3: RENDER KHUNG BẢNG & ĐẾM THỐNG KÊ SỐ LƯỢNG CHỜ DUYỆT
  // ==============================================================================
  /**
   * Render khung sườn giao diện
   */
  function renderLayout() {
    const container = document.getElementById("workspace-content");
    if (!container) return;

    container.innerHTML = `
      <!-- Bảng Danh Sách Bài Viết Chờ Duyệt -->
      <div class="admin-card">
        <div class="admin-card__header">
          <div class="admin-card__title-group">
            <h2 class="admin-card__title">Danh sách bài viết chờ duyệt</h2>
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
                placeholder="Tìm theo tiêu đề, phóng viên..."
                value="${escapeHtml(currentSearchQuery)}"
              >
            </div>

            <!-- Lọc Chuyên mục -->
            <select id="filter-category-select" class="admin-form-select" style="max-width: 175px; font-size: 12.5px; height: 38px;">
              <option value="all">Tất cả Chuyên mục</option>
              ${allCategories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="admin-table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="min-width: 320px;">Bài viết</th>
                <th style="min-width: 160px;">Phóng viên</th>
                <th>Chuyên mục</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th style="text-align: right; min-width: 150px;">Hành động</th>
              </tr>
            </thead>
            <tbody id="articles-tbody">
              <!-- Sẽ được đổ bởi renderArticlesList -->
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderHeaderStats() {
    const pendingArticles = allArticles.filter((a) => a.status === "pending");
    const countBadge = document.getElementById("list-count-badge");
    if (countBadge) {
      countBadge.textContent = `${pendingArticles.length} bài`;
    }
    if (typeof updateSidebarBadge === "function") {
      updateSidebarBadge("pending-articles", pendingArticles.length, "warning");
    }
  }

  // ==============================================================================
  // KHỐI 4: LỌC TRẠNG THÁI PENDING, TÌM KIẾM & RENDER DÒNG BÀI VIẾT
  // ==============================================================================
  /**
   * Render Danh sách bài viết dạng Bảng (Table) - Chỉ hiển thị các bài status === 'pending'
   */
  function renderArticlesList() {
    const tbody = document.getElementById("articles-tbody");
    if (!tbody) return;

    // CHỈ LỌC CÁC BÀI VIẾT ĐANG CHỜ DUYỆT (pending)
    let filtered = allArticles.filter((a) => a.status === "pending");

    // 1. Lọc theo Chuyên mục
    if (currentCategoryFilter !== "all") {
      filtered = filtered.filter((a) => String(a.category_id) === String(currentCategoryFilter));
    }

    // 2. Tìm kiếm từ khóa
    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      filtered = filtered.filter((a) => {
        const title = (a.title || "").toLowerCase();
        const sapo = (a.short_description || a.sapo || "").toLowerCase();
        const authorName = (a.author_name || a.author || a.author_username || "").toLowerCase();
        return title.includes(q) || sapo.includes(q) || authorName.includes(q);
      });
    }

    // Sắp xếp: Mới nhất lên đầu
    filtered.sort((a, b) => {
      const tA = new Date(a.updated_at || a.created_at || 0).getTime();
      const tB = new Date(b.updated_at || b.created_at || 0).getTime();
      return tB - tA;
    });

    // Cập nhật số lượng
    const countBadge = document.getElementById("list-count-badge");
    if (countBadge) {
      countBadge.textContent = `${filtered.length} bài`;
    }

    // Trạng thái rỗng
    if (filtered.length === 0) {
      let emptyMsg = "Hiện tại không có bài viết nào đang chờ duyệt";
      if (currentSearchQuery) {
        emptyMsg = `Không tìm thấy bài viết chờ duyệt nào phù hợp với từ khóa "${escapeHtml(currentSearchQuery)}"`;
      } else if (currentCategoryFilter !== "all") {
        emptyMsg = "Không có bài viết chờ duyệt nào trong chuyên mục này";
      }

      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="admin-empty-state" style="padding: 48px 20px;">
              <div class="admin-empty-state__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <p class="admin-empty-state__text">${emptyMsg}</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    // Render các dòng bảng
    tbody.innerHTML = filtered.map((article) => renderArticleRow(article)).join("");

    // Highlight nếu có
    checkAndHighlightArticle();
  }

  /**
   * Render 1 dòng trong bảng bài viết
   */
  function renderArticleRow(article) {
    const category = allCategories.find((c) => String(c.id) === String(article.category_id)) || {
      name: "Thời sự",
      slug: "thoi-su",
    };
    const author = {
      full_name: article.author_name || article.author || "Phóng viên",
      username: article.author_username || "reporter",
      avatar: article.author_avatar || "",
    };

    const coverImg = extractThumbnail(article, category);
    const thumbHtml = renderTableCoverThumb(coverImg, article.title);
    const desc = article.short_description || article.sapo || "";
    const timeDisplay = typeof formatDate === "function" ? formatDate(article.updated_at || article.created_at) : (article.updated_at || article.created_at || "--");

    // Status Badge
    let statusBadge = "";
    if (article.status === "pending") {
      statusBadge = `<span class="admin-status-badge admin-status-badge--pending">Chờ duyệt</span>`;
    } else if (article.status === "rejected") {
      statusBadge = `<span class="admin-status-badge admin-status-badge--rejected">Bị từ chối</span>`;
    } else if (article.status === "published") {
      statusBadge = `<span class="admin-status-badge admin-status-badge--published">Đã xuất bản</span>`;
    } else {
      statusBadge = `<span class="admin-status-badge">${escapeHtml(article.status)}</span>`;
    }

    // Author display
    const authorName = author.full_name || author.username || "Phóng viên";
    const authorUser = author.username ? `@${author.username}` : "";

    // Action button
    let actionBtnHtml = `
      <button 
        type="button" 
        class="btn-open-review-modal admin-btn admin-btn--primary" 
        data-id="${article.id}"
        onclick="window.openReviewModal('${article.id}')"
        title="Thẩm định & Duyệt bài"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        Thẩm định
      </button>
    `;

    return `
      <tr id="article-row-${article.id}" data-id="${article.id}">
        <td>
          <div class="admin-article-cell">
            ${thumbHtml}
            <div class="admin-article-info">
              <div class="admin-article-title-text" title="${escapeHtml(article.title)}">
                ${escapeHtml(article.title || "Chưa đặt tiêu đề")}
              </div>
              ${desc ? `<div class="admin-article-sapo-text" title="${escapeHtml(desc)}">${escapeHtml(desc)}</div>` : ""}
              ${article.is_notable_event ? `
                <div style="margin-top: 5px;">
                  <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #8F7239; background: #FFFDF9; border: 1px solid #F3DFC1; padding: 2px 7px; border-radius: 4px;">
                    Sự kiện đáng chú ý
                  </span>
                </div>
              ` : ""}
            </div>
          </div>
        </td>
        <td>
          <div style="display: flex; flex-direction: column;">
            <strong style="font-size: 13px; color: var(--ink);">${escapeHtml(authorName)}</strong>
            <span style="font-size: 11.5px; color: var(--muted); font-family: var(--f-mono);">${escapeHtml(authorUser)}</span>
          </div>
        </td>
        <td class="admin-col-category">
          <span class="admin-category-pill">${escapeHtml(category.name)}</span>
        </td>
        <td class="admin-col-date">
          ${timeDisplay}
        </td>
        <td>
          ${statusBadge}
        </td>
        <td style="text-align: right;">
          <div class="admin-actions-cell" style="justify-content: flex-end;">
            ${actionBtnHtml}
          </div>
        </td>
      </tr>
    `;
  }

  // ==============================================================================
  // KHỐI 5: GẮN SỰ KIỆN TƯƠNG TÁC & XUẤT API CHO MODAL THẨM ĐỊNH
  // ==============================================================================
  /**
   * Gắn sự kiện tương tác
   */
  function attachEventListeners() {
    // 1. Tìm kiếm & Lọc
    const searchInput = document.getElementById("search-articles-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        currentSearchQuery = (e.target.value || "").trim();
        renderArticlesList();
      });
    }

    const categorySelect = document.getElementById("filter-category-select");
    if (categorySelect) {
      categorySelect.addEventListener("change", (e) => {
        currentCategoryFilter = e.target.value;
        renderArticlesList();
      });
    }

    // 2. Mở Modal thẩm định khi click vào nút "Thẩm định"
    document.addEventListener("click", (e) => {
      const openBtn = e.target.closest(".btn-open-review-modal");
      if (openBtn && openBtn.dataset.id && typeof window.openReviewModal === "function") {
        window.openReviewModal(openBtn.dataset.id);
      }
    });
  }

  window.handleSearchArticles = function (query) {
    currentSearchQuery = (query || "").trim();
    renderArticlesList();
  };

  window.handleFilterCategory = function (catId) {
    currentCategoryFilter = catId;
    renderArticlesList();
  };

  // Cung cấp API cho editor-pending-articles-modal.js tương tác
  window.EditorPendingArticles = {
    getAllArticles: () => allArticles,
    getAllCategories: () => allCategories,
    loadData: loadData,
    renderHeaderStats: renderHeaderStats,
    renderArticlesList: renderArticlesList,
    reloadAndRender: async () => {
      await loadData();
      renderHeaderStats();
      renderArticlesList();
    }
  };
})();
