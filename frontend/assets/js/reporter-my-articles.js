/**
 * ==============================================================================
 * REPORTER MY ARTICLES - QUẢN LÝ BÀI VIẾT CỦA PHÓNG VIÊN
 * ==============================================================================
 */

// Biến toàn cục quản lý trạng thái màn hình
    let currentTab = "all"; // all | draft | pending | rejected | published
    let searchQuery = "";
    let reporterArticles = [];
    let categoriesMap = {};

    document.addEventListener("DOMContentLoaded", () => {
      const currentUser = initAdminLayout("reporter", "my-articles");
      initDeleteDraftModal();
      if (currentUser) {
        loadReporterArticles(currentUser);
      }
    });

    /**
     * Tải danh sách bài viết của phóng viên từ Backend PHP API
     */
    async function loadReporterArticles(currentUser) {
      try {
        const [resArticles, resCategories] = await Promise.all([
          fetch(resolveApiUrl("reporter/my-articles.php"), { credentials: "include" }).then(r => r.json()),
          fetch(resolveApiUrl("public/categories.php")).then(r => r.json())
        ]);

        reporterArticles = (resArticles.success && Array.isArray(resArticles.data)) ? resArticles.data : [];
        const allCategories = (resCategories.success && Array.isArray(resCategories.data)) ? resCategories.data : [];

        // Map danh mục
        categoriesMap = {};
        allCategories.forEach(c => {
          categoriesMap[c.id] = c.name;
        });

        // Sắp xếp mặc định theo ngày mới nhất
        reporterArticles.sort((a, b) => {
          const timeA = new Date(a.updated_at || a.published_at || a.created_at || 0).getTime();
          const timeB = new Date(b.updated_at || b.published_at || b.created_at || 0).getTime();
          return timeB - timeA;
        });

        // Kiểm tra tham số ?id= hoặc ?article_id= trên URL để chuyển tab phù hợp & tự mở modal nếu có yêu cầu
        const urlParams = new URLSearchParams(window.location.search);
        const targetArticleId = urlParams.get("id") || urlParams.get("article_id");
        if (targetArticleId) {
          const targetArt = reporterArticles.find(a => String(a.id) === String(targetArticleId));
          if (targetArt) {
            currentTab = targetArt.status; // Chuyển thẳng tới tab chứa bài viết
          }
        }

        renderUI();
        checkAndHighlightArticle();
      } catch (err) {
        console.error("Lỗi khi tải bài viết phóng viên:", err);
        reporterArticles = [];
        renderUI();
      }
    }

    /**
     * Render giao diện Tab + Search + Table
     */
    function renderUI() {
      const mount = document.getElementById("workspace-content");
      if (!mount) return;

      // Đếm số lượng theo từng trạng thái
      const counts = {
        all: reporterArticles.length,
        draft: reporterArticles.filter(a => a.status === "draft").length,
        pending: reporterArticles.filter(a => a.status === "pending").length,
        rejected: reporterArticles.filter(a => a.status === "rejected").length,
        published: reporterArticles.filter(a => a.status === "published").length
      };

      mount.innerHTML = `
        <!-- 1. Tabs Lọc Trạng Thái -->
        <div class="admin-tabs-nav">
          <button class="admin-tab-btn ${currentTab === 'all' ? 'is-active' : ''}" onclick="switchTab('all')">
            Tất cả <span class="tab-badge">${counts.all}</span>
          </button>
          <button class="admin-tab-btn ${currentTab === 'draft' ? 'is-active' : ''}" onclick="switchTab('draft')">
            Bản nháp <span class="tab-badge" style="background:#ECEFF1; color:#546E7A;">${counts.draft}</span>
          </button>
          <button class="admin-tab-btn ${currentTab === 'pending' ? 'is-active' : ''}" onclick="switchTab('pending')">
            Chờ duyệt <span class="tab-badge" style="background:#FFF3E0; color:#E65100;">${counts.pending}</span>
          </button>
          <button class="admin-tab-btn ${currentTab === 'rejected' ? 'is-active' : ''}" onclick="switchTab('rejected')">
            Bị từ chối <span class="tab-badge" style="background:#FFEBEE; color:#C62828;">${counts.rejected}</span>
          </button>
          <button class="admin-tab-btn ${currentTab === 'published' ? 'is-active' : ''}" onclick="switchTab('published')">
            Đã đăng <span class="tab-badge" style="background:#E8F5E9; color:#2E7D32;">${counts.published}</span>
          </button>
        </div>

        <!-- 2. Bảng Danh Sách Bài Viết -->
        <div class="admin-card">
          <div class="admin-card__header">
            <div class="admin-card__title-group">
              <h2 class="admin-card__title" id="tab-title-display">${getTabTitle(currentTab)}</h2>
              <span class="admin-card__count-badge" id="list-count-badge">0 bài</span>
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
                  placeholder="Tìm theo tiêu đề bài viết..."
                  value="${escapeHtml(searchQuery)}"
                  oninput="handleSearch(this.value)"
                >
              </div>
            </div>
          </div>

          <div class="admin-table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th style="min-width: 320px;">Bài viết</th>
                  <th>Chuyên mục</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th style="text-align: right; min-width: 170px;">Hành động</th>
                </tr>
              </thead>
              <tbody id="articles-tbody">
                <!-- Sẽ được đổ bởi renderTableRows -->
              </tbody>
            </table>
          </div>
        </div>
      `;

      renderTableRows();
    }

    /**
     * Lấy tiêu đề hiển thị cho Tab
     */
    function getTabTitle(tab) {
      switch (tab) {
        case "draft": return "Danh sách bản nháp";
        case "pending": return "Bài viết đang chờ duyệt";
        case "rejected": return "Bài viết bị từ chối / cần sửa";
        case "published": return "Bài viết đã xuất bản";
        default: return "Toàn bộ bài viết";
      }
    }

    /**
     * Render các hàng dữ liệu bài viết
     */
    function renderTableRows() {
      const tbody = document.getElementById("articles-tbody");
      const countBadge = document.getElementById("list-count-badge");
      if (!tbody) return;

      // 1. Lọc theo Tab
      let filtered = reporterArticles.filter(art => {
        if (currentTab === "all") return true;
        return art.status === currentTab;
      });

      // 2. Lọc theo Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(art => {
          const title = (art.title || "").toLowerCase();
          const category = (categoriesMap[art.category_id] || "").toLowerCase();
          return title.includes(q) || category.includes(q);
        });
      }

      // Cập nhật số lượng hiển thị
      if (countBadge) {
        countBadge.textContent = `${filtered.length} bài`;
      }

      // 3. Trạng thái rỗng
      if (filtered.length === 0) {
        let emptyMsg = "Bạn chưa có bài viết nào";
        if (searchQuery.trim()) {
          emptyMsg = `Không tìm thấy bài viết nào phù hợp với từ khóa "${escapeHtml(searchQuery)}"`;
        } else if (currentTab === "draft") {
          emptyMsg = "Bạn không có bản nháp nào";
        } else if (currentTab === "pending") {
          emptyMsg = "Không có bài viết nào đang chờ duyệt";
        } else if (currentTab === "rejected") {
          emptyMsg = "Không có bài viết nào bị từ chối";
        } else if (currentTab === "published") {
          emptyMsg = "Bạn chưa có bài viết nào được đăng";
        }

        tbody.innerHTML = `
          <tr>
            <td colspan="5">
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

      // 4. Render các dòng bài viết (Giao diện bảng gọn gàng, tinh tế)
      tbody.innerHTML = filtered.map(art => {
        const catName = categoriesMap[art.category_id] || "Tổng hợp";
        const coverImg = art.cover_image || art.image || art.thumbnail || "";
        const desc = art.sapo || art.short_description || art.summary || art.description || "";
        const timeDisplay = formatTime(art);
        const statusBadge = renderStatusBadge(art.status);
        const actionButtons = renderActionButtons(art);
        const thumbHtml = renderTableCoverThumb(coverImg, art.title);

        const rejectionHtml = (art.status === "rejected" && (art.rejection_reason || "").trim())
          ? `<div style="margin-top: 7px; display: inline-flex; align-items: flex-start; gap: 6px; padding: 5px 10px; background: #FEF2F2; border-left: 3px solid #EF4444; border-radius: 4px; font-size: 12px; color: #991B1B; line-height: 1.4;">
              <svg style="width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span><strong>Ban Biên tập phản hồi:</strong> ${escapeHtml(art.rejection_reason)}</span>
            </div>`
          : "";

        return `
          <tr id="article-row-${art.id}" data-id="${art.id}">
            <td>
              <div class="admin-article-cell">
                ${thumbHtml}
                <div class="admin-article-info">
                  <div class="admin-article-title-text" style="color: var(--ink); font-weight: 700;">
                    ${escapeHtml(art.title || "Chưa đặt tiêu đề")}
                  </div>
                  ${desc ? `<div class="admin-article-sapo-text" title="${escapeHtml(desc)}">${escapeHtml(desc)}</div>` : ''}
                  ${rejectionHtml}
                </div>
              </div>
            </td>
            <td class="admin-col-category">
              <span class="admin-category-pill">${escapeHtml(catName)}</span>
            </td>
            <td class="admin-col-date">
              ${timeDisplay}
            </td>
            <td>
              ${statusBadge}
            </td>
            <td style="text-align: right;">
              <div class="admin-actions-cell" style="justify-content: flex-end;">
                ${actionButtons}
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }

    /**
     * Format hiển thị thời gian
     */
    function formatTime(art) {
      const raw = art.published_at || art.updated_at || art.created_at;
      if (!raw) return "--";
      if (typeof formatDate === "function") {
        return formatDate(raw);
      }
      return raw;
    }

    /**
     * Render Huy hiệu trạng thái
     */
    function renderStatusBadge(status) {
      switch (status) {
        case "draft":
          return `<span class="admin-status-badge admin-status-badge--draft">Bản nháp</span>`;
        case "pending":
          return `<span class="admin-status-badge admin-status-badge--pending">Chờ duyệt</span>`;
        case "rejected":
          return `<span class="admin-status-badge admin-status-badge--rejected">Bị từ chối</span>`;
        case "published":
          return `<span class="admin-status-badge admin-status-badge--published">Đã đăng</span>`;
        default:
          return `<span class="admin-status-badge">${escapeHtml(status)}</span>`;
      }
    }

    /**
     * Render các nút hành động tinh gọn theo đúng quy tắc nghiệp vụ
     */
    function renderActionButtons(art) {
      if (art.status === "draft") {
        return `
          <a href="write-article.html?id=${art.id}" class="admin-btn admin-btn--edit" title="Sửa bản nháp">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Sửa
          </a>
          <button type="button" class="admin-btn admin-btn--danger" onclick="confirmDeleteArticle(${art.id})" title="Xóa bản nháp">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Xóa
          </button>
        `;
      }

      if (art.status === "pending") {
        return `
          <button type="button" class="admin-btn admin-btn--edit" onclick="handleEditPending(${art.id})" title="Chuyển về bản nháp để chỉnh sửa">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Sửa
          </button>
        `;
      }

      if (art.status === "rejected") {
        return `
          <a href="write-article.html?id=${art.id}" class="admin-btn admin-btn--edit" title="Sửa nội dung bài viết">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Sửa
          </a>
          <button type="button" class="admin-btn admin-btn--resubmit" onclick="handleResubmit(${art.id})" title="Gửi duyệt lại lên Ban Biên tập">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <polyline points="7 23 3 19 7 15"></polyline>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
            Gửi lại
          </button>
          <button type="button" class="admin-btn admin-btn--danger" onclick="confirmDeleteArticle(${art.id})" title="Xóa bài viết">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Xóa
          </button>
        `;
      }

      if (art.status === "published") {
        const articleSlug = art.slug || (typeof slugify === "function" ? slugify(art.title) : "") || art.id;
        const detailUrl = `../public/article-detail.html?slug=${encodeURIComponent(articleSlug)}`;
        return `
          <a href="${detailUrl}" target="_blank" class="admin-btn admin-btn--view" title="Xem bài viết đã xuất bản">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Đọc bài
          </a>
        `;
      }

      return "";
    }

    /**
     * Chuyển tab lọc trạng thái
     */
    function switchTab(tab) {
      currentTab = tab;
      renderUI();
    }

    /**
     * Tìm kiếm bài viết
     */
    function handleSearch(val) {
      searchQuery = val;
      renderTableRows();
    }

    /**
     * Nghiệp vụ: Khi sửa bài đang CHỜ DUYỆT -> Chuyển về NHÁP và chuyển trang qua API
     */
    async function handleEditPending(id) {
      try {
        const res = await fetch(resolveApiUrl("reporter/my-articles.php"), {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article_id: id, action: "withdraw" })
        });
        const data = await res.json();
        if (!data.success) {
          showToast(data.message || "Không thể thu hồi bài viết", "error");
          return;
        }

        showToast("Đã thu hồi bài viết về Bản nháp để chỉnh sửa", "info");
        setTimeout(() => {
          window.location.href = `write-article.html?id=${id}`;
        }, 300);
      } catch (err) {
        console.error("Lỗi khi thu hồi bài viết:", err);
        showToast("Lỗi kết nối khi thu hồi bài viết!", "error");
      }
    }

    /**
     * Nghiệp vụ: GỬI DUYỆT LẠI bài bị từ chối qua API
     */
    async function handleResubmit(id) {
      try {
        const res = await fetch(resolveApiUrl("reporter/my-articles.php"), {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article_id: id, action: "submit" })
        });
        const data = await res.json();
        if (!data.success) {
          showToast(data.message || "Không thể gửi duyệt lại", "error");
          return;
        }

        showToast("Đã gửi duyệt lại bài viết lên Ban Biên tập thành công!", "success");
        
        const currentUser = getCurrentUser();
        if (currentUser) {
          loadReporterArticles(currentUser);
        }
      } catch (err) {
        console.error("Lỗi khi gửi duyệt lại bài viết:", err);
        showToast("Lỗi kết nối khi gửi duyệt lại!", "error");
      }
    }

    /**
     * ==============================================================================
     * QUẢN LÝ XÓA BÀI VIẾT (BẢN NHÁP / BÀI BỊ TỪ CHỐI)
     * ==============================================================================
     */
    let deletingArticleId = null;

    /**
     * Khởi tạo Modal xác nhận xóa bài viết vào DOM container
     */
    function initDeleteDraftModal() {
      const container = document.getElementById("delete-modal-container");
      if (!container) return;

      container.innerHTML = `
        <div id="deleteDraftModal" class="admin-modal-overlay" style="display: none;">
          <div class="admin-modal" style="max-width: 440px;">
            <div class="admin-modal__header">
              <div class="admin-modal__title" style="color: #DC2626;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span id="deleteModalHeaderTitle">Xóa bài viết</span>
              </div>
              <button type="button" class="admin-btn--icon" id="btnCloseDeleteDraftModal" style="background:none; border:none; cursor:pointer; font-size:22px; line-height:1; color:var(--muted); padding:4px;" title="Đóng">&times;</button>
            </div>
            <div class="admin-modal__body">
              <p style="margin: 0 0 10px 0; color: var(--ink);">Bạn có chắc chắn muốn xóa bài viết này không?</p>
              <div id="deleteDraftTitle" style="font-weight: 700; color: var(--ink); background: #FAF8F4; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--line-soft); word-break: break-word; font-size: 13.5px;"></div>
              <p style="margin: 10px 0 0 0; font-size: 12.5px; color: #DC2626;">
                Lưu ý: Dữ liệu và các tệp đính kèm sẽ bị xóa vĩnh viễn khỏi hệ thống và không thể khôi phục.
              </p>
            </div>
            <div class="admin-modal__footer">
              <button type="button" class="admin-btn admin-btn--default" id="btnCancelDeleteDraft">Hủy bỏ</button>
              <button type="button" class="admin-btn admin-btn--danger" id="btnConfirmDeleteDraft" style="background: #DC2626; color: #FFF; border: none; font-weight: 600;">Xác nhận xóa</button>
            </div>
          </div>
        </div>
      `;

      const modal = document.getElementById("deleteDraftModal");
      const btnClose = document.getElementById("btnCloseDeleteDraftModal");
      const btnCancel = document.getElementById("btnCancelDeleteDraft");
      const btnConfirm = document.getElementById("btnConfirmDeleteDraft");

      if (btnClose) btnClose.onclick = closeDeleteDraftModal;
      if (btnCancel) btnCancel.onclick = closeDeleteDraftModal;
      if (btnConfirm) btnConfirm.onclick = executeDeleteDraft;

      if (modal) {
        modal.onclick = (e) => {
          if (e.target === modal) closeDeleteDraftModal();
        };
      }

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal && modal.style.display !== "none") {
          closeDeleteDraftModal();
        }
      });
    }

    /**
     * Mở modal xác nhận xóa bài viết
     */
    function confirmDeleteArticle(id) {
      const article = reporterArticles.find(a => Number(a.id) === Number(id));
      if (!article) return;

      deletingArticleId = id;

      const headerTitle = document.getElementById("deleteModalHeaderTitle");
      if (headerTitle) {
        headerTitle.textContent = article.status === "rejected" ? "Xóa bài viết bị từ chối" : "Xóa bản nháp";
      }

      const titleEl = document.getElementById("deleteDraftTitle");
      if (titleEl) {
        titleEl.textContent = article.title || "Chưa đặt tiêu đề";
      }

      const modal = document.getElementById("deleteDraftModal");
      if (modal) {
        modal.style.display = "flex";
      }
    }
    window.confirmDeleteArticle = confirmDeleteArticle;
    window.confirmDeleteDraft = confirmDeleteArticle; // Alias tương thích ngược

    /**
     * Đóng modal xóa
     */
    function closeDeleteDraftModal() {
      deletingArticleId = null;
      const modal = document.getElementById("deleteDraftModal");
      if (modal) {
        modal.style.display = "none";
      }
      const btnConfirm = document.getElementById("btnConfirmDeleteDraft");
      if (btnConfirm) {
        btnConfirm.disabled = false;
        btnConfirm.textContent = "Xác nhận xóa";
      }
    }
    window.closeDeleteDraftModal = closeDeleteDraftModal;

    /**
     * Thực thi gọi API DELETE bài viết
     */
    async function executeDeleteDraft() {
      if (!deletingArticleId) return;

      const btnConfirm = document.getElementById("btnConfirmDeleteDraft");
      if (btnConfirm) {
        btnConfirm.disabled = true;
        btnConfirm.textContent = "Đang xóa...";
      }

      try {
        const res = await fetch(resolveApiUrl("reporter/my-articles.php"), {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ article_id: deletingArticleId })
        });

        const text = await res.text();
        const data = (typeof safeJsonParse === "function" ? safeJsonParse(text) : null) || (res.ok ? { success: true, message: "Đã xóa bài viết thành công" } : { success: false, message: "Lỗi phản hồi từ máy chủ" });

        if (!data.success) {
          showToast(data.message || "Không thể xóa bài viết", "error");
          if (btnConfirm) {
            btnConfirm.disabled = false;
            btnConfirm.textContent = "Xác nhận xóa";
          }
          return;
        }

        showToast(data.message || "Đã xóa bài viết thành công!", "success");
        closeDeleteDraftModal();

        const currentUser = getCurrentUser();
        if (currentUser) {
          loadReporterArticles(currentUser);
        }
      } catch (err) {
        console.error("Lỗi khi xóa bài viết:", err);
        showToast("Lỗi kết nối khi xóa bài viết!", "error");
        if (btnConfirm) {
          btnConfirm.disabled = false;
          btnConfirm.textContent = "Xác nhận xóa";
        }
      }
    }
    window.executeDeleteDraft = executeDeleteDraft;



