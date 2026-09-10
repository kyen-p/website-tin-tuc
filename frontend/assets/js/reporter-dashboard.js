/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/reporter-dashboard.js
 * PHÂN HỆ: Bảng điều khiển Phóng viên (Reporter Dashboard Module)
 * MÔ TẢ: Thống kê hiệu suất bài viết cá nhân của phóng viên:
 *        1. Tải dữ liệu tổng quan qua GET backend/api/reporter/dashboard.php.
 *        2. Tổng hợp các chỉ số KPI: bài đã đăng, tổng lượt xem, tổng bình luận, tổng lượt lưu bài.
 *        3. Render lưới thẻ thống kê KPI và bảng chi tiết hiệu quả từng bài viết.
 *        4. Hỗ trợ tìm kiếm bài viết theo từ khóa, sắp xếp đa chiều (lượt xem, ngày đăng, bình luận, lưu bài).
 * PHẠM VI SỬ DỤNG:
 *   - frontend/reporter/dashboard.html
 * PHỤ THUỘC:
 *   - frontend/assets/js/admin-layout.js (initAdminLayout, getCurrentUser, etc.)
 *   - frontend/assets/js/common.js (resolveApiUrl, escapeHtml, formatDate, getArticleViews, etc.)
 *   - backend/api/reporter/dashboard.php
 * ==============================================================================
 */

// ==============================================================================
// KHỐI 1: KHỞI TẠO BẢNG ĐIỀU KHIỂN & TRẠNG THÁI TÌM KIẾM/SẮP XẾP
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
      const currentUser = initAdminLayout("reporter", "dashboard");
      if (currentUser) {
        renderReporterDashboard(currentUser);
      }
    });

    // Trạng thái tìm kiếm và sắp xếp của Dashboard
    let currentSortField = "published_at";
    let currentSortDirection = "desc";
    let searchQuery = "";
    let reporterArticlesData = [];

    // ==============================================================================
    // KHỐI 2: TẢI DỮ LIỆU THỐNG KÊ KPI & DỰNG KHUNG BẢNG ĐIỀU KHIỂN
    // ==============================================================================
    /**
     * Tải và tính toán dữ liệu thống kê cho Phóng viên từ LocalStorage / API
     */
    async function renderReporterDashboard(currentUser) {
      const mount = document.getElementById("workspace-content");
      if (!mount) return;

      try {
        const response = await fetch(resolveApiUrl("reporter/dashboard.php"), {
          credentials: "include"
        });
        const result = await response.json();
        
        if (!result.success || !result.data) {
          mount.innerHTML = `<div class="admin-card" style="padding: 24px; text-align: center; color: var(--muted);">Không thể tải dữ liệu thống kê từ máy chủ.</div>`;
          return;
        }

        const data = result.data;
        const allArticles = data.articles || [];

        // Lọc các bài viết ĐÃ XUẤT BẢN
        const publishedArticles = allArticles.filter(art => art.status === "published");

        // Chuẩn hóa dữ liệu cho từng bài viết
        reporterArticlesData = publishedArticles.map(art => {
          return {
            id: art.id,
            title: art.title || "Chưa đặt tiêu đề",
            category_id: art.category_id,
            category_name: art.category_name || "Tổng hợp",
            published_at: art.published_at || art.created_at || "",
            view_count: getArticleViews(art),
            comments_count: Number(art.comment_count || 0),
            favorites_count: Number(art.favorite_count || 0)
          };
        });
      } catch (err) {
        console.error("Lỗi khi tải bảng điều khiển phóng viên:", err);
        reporterArticlesData = [];
      }

      // Tính toán các chỉ số KPI tổng quan
      const totalPublished = reporterArticlesData.length;
      const totalViews = reporterArticlesData.reduce((sum, item) => sum + item.view_count, 0);
      const totalComments = reporterArticlesData.reduce((sum, item) => sum + item.comments_count, 0);
      const totalFavorites = reporterArticlesData.reduce((sum, item) => sum + item.favorites_count, 0);

      // Nếu phóng viên chưa có bài nào được đăng
      if (totalPublished === 0) {
        mount.innerHTML = `
          <!-- KPI Metrics Tổng quan (Đều là 0) -->
          <div class="admin-stats-grid">
            <div class="admin-stat-card">
              <div class="admin-stat-card__icon-wrap admin-stat-card__icon-wrap--primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
              <div class="admin-stat-card__content">
                <div class="admin-stat-card__label">Bài đã đăng</div>
                <div class="admin-stat-card__value">0</div>
              </div>
            </div>

            <div class="admin-stat-card">
              <div class="admin-stat-card__icon-wrap admin-stat-card__icon-wrap--views">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <div class="admin-stat-card__content">
                <div class="admin-stat-card__label">Tổng lượt xem</div>
                <div class="admin-stat-card__value">0</div>
              </div>
            </div>

            <div class="admin-stat-card">
              <div class="admin-stat-card__icon-wrap admin-stat-card__icon-wrap--comments">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <div class="admin-stat-card__content">
                <div class="admin-stat-card__label">Tổng bình luận</div>
                <div class="admin-stat-card__value">0</div>
              </div>
            </div>

            <div class="admin-stat-card">
              <div class="admin-stat-card__icon-wrap admin-stat-card__icon-wrap--likes">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <div class="admin-stat-card__content">
                <div class="admin-stat-card__label">Tổng lượt lưu/thích</div>
                <div class="admin-stat-card__value">0</div>
              </div>
            </div>
          </div>

          <!-- Bảng Trống State (Theo đúng chuẩn UC-RP03) -->
          <div class="admin-card">
            <div class="admin-card__header">
              <div class="admin-card__title-group">
                <h2 class="admin-card__title">Chi tiết hiệu quả bài viết</h2>
                <span class="admin-card__count-badge">0 bài</span>
              </div>
            </div>
            <div class="admin-empty-state">
              <div class="admin-empty-state__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <p class="admin-empty-state__text">Bạn chưa có bài viết nào được đăng</p>
            </div>
          </div>
        `;
        return;
      }

      // Khung chứa đầy đủ KPI + Toolbar + Data Table
      mount.innerHTML = `
        <!-- 1. KPI Metrics Grid -->
        <div class="admin-stats-grid">
          <div class="admin-stat-card">
            <div class="admin-stat-card__icon-wrap admin-stat-card__icon-wrap--primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <div class="admin-stat-card__content">
              <div class="admin-stat-card__label">Bài đã đăng</div>
              <div class="admin-stat-card__value">${totalPublished.toLocaleString('vi-VN')}</div>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-card__icon-wrap admin-stat-card__icon-wrap--views">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <div class="admin-stat-card__content">
              <div class="admin-stat-card__label">Tổng lượt xem</div>
              <div class="admin-stat-card__value">${totalViews.toLocaleString('vi-VN')}</div>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-card__icon-wrap admin-stat-card__icon-wrap--comments">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>
            <div class="admin-stat-card__content">
              <div class="admin-stat-card__label">Tổng bình luận</div>
              <div class="admin-stat-card__value">${totalComments.toLocaleString('vi-VN')}</div>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-card__icon-wrap admin-stat-card__icon-wrap--likes">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
            <div class="admin-stat-card__content">
              <div class="admin-stat-card__label">Tổng lượt lưu/thích</div>
              <div class="admin-stat-card__value">${totalFavorites.toLocaleString('vi-VN')}</div>
            </div>
          </div>
        </div>

        <!-- 2. Data Table Card -->
        <div class="admin-card">
          <div class="admin-card__header">
            <div class="admin-card__title-group">
              <h2 class="admin-card__title">Chi tiết hiệu quả bài viết</h2>
              <span class="admin-card__count-badge" id="table-count-badge">${totalPublished} bài</span>
            </div>
            <div class="admin-card__toolbar">
              <div class="admin-search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  class="admin-search-input" 
                  id="table-search-input" 
                  placeholder="Tìm theo tiêu đề bài viết..."
                  oninput="handleSearch(this.value)"
                >
              </div>
            </div>
          </div>

          <div class="admin-table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th class="admin-col-index">STT</th>
                  <th>Tiêu đề bài viết</th>
                  <th>Chuyên mục</th>
                  <th class="is-sortable ${currentSortField === 'published_at' ? 'is-sorted' : ''}" onclick="handleSort('published_at')">
                    <div class="admin-th-content">
                      <span>Ngày đăng</span>
                      <span class="admin-sort-icon">${getSortIcon('published_at')}</span>
                    </div>
                  </th>
                  <th class="is-sortable admin-col-num ${currentSortField === 'views' ? 'is-sorted' : ''}" onclick="handleSort('views')">
                    <div class="admin-th-content" style="justify-content: flex-end;">
                      <span>Lượt xem</span>
                      <span class="admin-sort-icon">${getSortIcon('views')}</span>
                    </div>
                  </th>
                  <th class="is-sortable admin-col-num ${currentSortField === 'comments_count' ? 'is-sorted' : ''}" onclick="handleSort('comments_count')">
                    <div class="admin-th-content" style="justify-content: flex-end;">
                      <span>Bình luận</span>
                      <span class="admin-sort-icon">${getSortIcon('comments_count')}</span>
                    </div>
                  </th>
                  <th class="is-sortable admin-col-num ${currentSortField === 'favorites_count' ? 'is-sorted' : ''}" onclick="handleSort('favorites_count')">
                    <div class="admin-th-content" style="justify-content: flex-end;">
                      <span>Lưu bài</span>
                      <span class="admin-sort-icon">${getSortIcon('favorites_count')}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody id="table-body-mount">
                <!-- Nội dung hàng sẽ được render ở hàm renderTableRows -->
              </tbody>
            </table>
          </div>
        </div>
      `;

      renderTableRows();
    }

    // ==============================================================================
    // KHỐI 3: LỌC TÌM KIẾM, SẮP XẾP DỮ LIỆU & RENDER DANH SÁCH BÀI VIẾT
    // ==============================================================================
    /**
     * Render các hàng dữ liệu sau khi lọc và sắp xếp
     */
    function renderTableRows() {
      const tbody = document.getElementById("table-body-mount");
      const countBadge = document.getElementById("table-count-badge");
      if (!tbody) return;

      // 1. Lọc theo từ khóa tìm kiếm
      let filtered = reporterArticlesData.filter(item => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase().trim();
        return item.title.toLowerCase().includes(q) || item.category_name.toLowerCase().includes(q);
      });

      // 2. Sắp xếp theo cột và hướng
      filtered.sort((a, b) => {
        let valA = a[currentSortField];
        let valB = b[currentSortField];

        if (currentSortField === "published_at") {
          valA = new Date(valA || 0).getTime();
          valB = new Date(valB || 0).getTime();
        }

        if (valA < valB) return currentSortDirection === "asc" ? -1 : 1;
        if (valA > valB) return currentSortDirection === "asc" ? 1 : -1;
        return 0;
      });

      // Cập nhật số lượng
      if (countBadge) {
        countBadge.textContent = `${filtered.length} bài`;
      }

      // Nếu tìm kiếm không có kết quả
      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 40px 20px; color: var(--muted);">
              Không tìm thấy bài viết nào phù hợp với từ khóa "${escapeHtml(searchQuery)}"
            </td>
          </tr>
        `;
        return;
      }

      // Render từng hàng bài viết
      tbody.innerHTML = filtered.map((item, index) => {
        const formattedDate = typeof formatDate === "function" ? formatDate(item.published_at) : (item.published_at || "--");
        const articleSlug = item.slug || (typeof slugify === "function" ? slugify(item.title) : "") || item.id;
        const detailUrl = `../public/article-detail.html?slug=${encodeURIComponent(articleSlug)}`;

        return `
          <tr>
            <td class="admin-col-index">${index + 1}</td>
            <td class="admin-col-title">
              <a href="${detailUrl}" target="_blank" class="admin-article-link" title="Xem bài viết trên giao diện độc giả">
                ${escapeHtml(item.title)}
              </a>
            </td>
            <td class="admin-col-category">
              <span class="admin-category-pill">${escapeHtml(item.category_name)}</span>
            </td>
            <td class="admin-col-date">${formattedDate}</td>
            <td class="admin-col-num">
              <span class="admin-num-badge admin-num-badge--views">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                ${item.view_count.toLocaleString('vi-VN')}
              </span>
            </td>
            <td class="admin-col-num">
              <span class="admin-num-badge admin-num-badge--comments">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                ${item.comments_count.toLocaleString('vi-VN')}
              </span>
            </td>
            <td class="admin-col-num">
              <span class="admin-num-badge admin-num-badge--likes">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                ${item.favorites_count.toLocaleString('vi-VN')}
              </span>
            </td>
          </tr>
        `;
      }).join("");
    }

    /**
     * Xử lý sự kiện click Sắp xếp cột
     */
    function handleSort(field) {
      if (currentSortField === field) {
        currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
      } else {
        currentSortField = field;
        currentSortDirection = (field === "published_at" || field === "views" || field === "comments_count" || field === "favorites_count") ? "desc" : "asc";
      }

      // Cập nhật lại UI bảng
      const currentUser = getCurrentUser();
      if (currentUser) {
        renderReporterDashboard(currentUser);
      }
    }

    /**
     * Biểu tượng mũi tên sắp xếp
     */
    function getSortIcon(field) {
      if (currentSortField !== field) {
        return "▲▼";
      }
      return currentSortDirection === "asc" ? "▲" : "▼";
    }

    /**
     * Xử lý sự kiện tìm kiếm
     */
    function handleSearch(val) {
      searchQuery = val;
      renderTableRows();
    }
