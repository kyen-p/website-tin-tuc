/**
 * editor-pending-articles.js - Quản lý & Thẩm định duyệt bài viết cho Biên tập viên
 * 1. 2 Tab phân loại chính: Bài tự do | Bài theo đề tài
 * 2. Bảng danh sách tinh gọn chuẩn Editorial: Ẩn lý do từ chối và huy hiệu đáng chú ý ở ngoài bảng
 * 3. Bộ lọc tinh gọn: Tìm kiếm từ khóa/tác giả + Lọc Trạng thái (Tất cả / Chờ duyệt / Bị từ chối / Đã xuất bản) + Lọc Chuyên mục
 * 4. Modal thẩm định toàn diện:
 *    - Đọc toàn bộ nội dung, sapo, chuyên mục, thẻ tag do phóng viên gắn
 *    - Xem định hướng đề tài hoặc lý do từ chối chi tiết
 *    - Thao tác: "Duyệt & Xuất bản ngay" HOẶC "Từ chối bài viết" (kèm lý do chuyển về phóng viên)
 */

(function () {
  "use strict";

  let allArticles = [];
  let allCategories = [];
  let allUsers = [];
  let allTopics = [];
  let allTags = [];
  let allArticleTags = [];
  let currentUser = null;

  let currentTab = "freelance"; // 'freelance' | 'topic'
  let currentCategoryFilter = "all";
  let currentSearchQuery = "";

  let reviewingArticle = null;
  let modalSelectedTags = [];

  document.addEventListener("DOMContentLoaded", () => {
    initPendingArticlesPage();
  });

  window.initPendingArticlesPage = initPendingArticlesPage;

  function initPendingArticlesPage() {
    currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    loadData();
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

  function fetchTable(tableName) {
    if (typeof getTable === "function") {
      const data = getTable(tableName);
      if (Array.isArray(data) && data.length > 0) return data;
    }
    if (typeof MOCK_DATA !== "undefined" && Array.isArray(MOCK_DATA[tableName])) {
      return MOCK_DATA[tableName];
    }
    return [];
  }

  function saveTableData(tableName, data) {
    if (typeof saveTable === "function") {
      saveTable(tableName, data);
    } else if (typeof setTable === "function") {
      setTable(tableName, data);
    }
  }

  function getRefTime() {
    if (typeof getSystemTime === "function") {
      return getSystemTime();
    }
    return new Date("2026-08-14T23:59:59");
  }

  function loadData() {
    allArticles = fetchTable("articles");
    allCategories = fetchTable("categories");
    allUsers = fetchTable("users");
    allTopics = fetchTable("topics");
    allTags = fetchTable("tags");
    allArticleTags = fetchTable("article_tags");
  }

  /**
   * Trích xuất thumbnail thông minh (ảnh bìa hoặc ảnh đầu tiên trong nội dung)
   */
  function extractThumbnail(article, category) {
    if (article.cover_image && article.cover_image.trim()) {
      return article.cover_image;
    }
    if (article.image && article.image.trim()) {
      return article.image;
    }
    if (article.content) {
      const match = article.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (match && match[1]) {
        return match[1];
      }
    }
    // Fallback theo chuyên mục
    const catSlug = category ? category.slug : "thoi-su";
    return `../assets/images/categories/${catSlug}.jpg`;
  }

  /**
   * Render khung sườn giao diện đồng nhất với phong cách trang của Phóng viên (reporter/my-articles.html)
   */
  function renderLayout() {
    const container = document.getElementById("workspace-content");
    if (!container) return;

    container.innerHTML = `
      <!-- 1. Tabs Lọc 2 Thẻ: Bài tự do | Bài theo đề tài -->
      <div class="admin-tabs-nav" id="pending-tabs-mount">
        <!-- Sẽ được đổ bởi renderHeaderStats -->
      </div>

      <!-- 2. Bảng Danh Sách Bài Viết Cần Xử Lý -->
      <div class="admin-card">
        <div class="admin-card__header">
          <div class="admin-card__title-group">
            <h2 class="admin-card__title" id="tab-title-display">Bài viết tự do chờ duyệt</h2>
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
                oninput="window.handleSearchArticles(this.value)"
              >
            </div>

            <!-- Lọc Chuyên mục -->
            <select id="filter-category-select" class="admin-form-select" style="max-width: 175px; font-size: 12.5px; height: 38px;" onchange="window.handleFilterCategory(this.value)">
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

      <!-- MODAL TOÀN DIỆN: XEM NỘI DUNG & THẨM ĐỊNH DUYỆT BÀI (READ-ONLY: TÔN TRỌNG BẢN QUYỀN BÀI VIẾT CỦA PHÓNG VIÊN) -->
      <div id="modal-review-article" style="display: none; position: fixed; inset: 0; z-index: 1050; background: rgba(19, 27, 46, 0.65); backdrop-filter: blur(3px); align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
        <div class="admin-modal-container" style="max-width: 980px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; background: #FFF; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid var(--line-soft);">
          
          <!-- Modal Header -->
          <div class="admin-modal-header" style="padding: 16px 24px; border-bottom: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <div>
              <h3 id="modal-review-heading" style="margin: 0; font-size: 16px; font-weight: 700; color: var(--ink);">Thẩm định bài viết</h3>
              <p id="modal-review-subheading" style="margin: 2px 0 0; font-size: 12px; color: var(--muted);">Đọc duyệt nguyên bản bài viết của phóng viên. Biên tập viên thẩm định, duyệt xuất bản hoặc từ chối kèm lý do.</p>
            </div>
            <button type="button" class="btn-close-review-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--muted); line-height: 1; padding: 4px;">&times;</button>
          </div>

          <!-- Modal Body (2 Cột) -->
          <div class="admin-modal-body" style="padding: 24px; overflow-y: auto; flex: 1; box-sizing: border-box;">
            <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 24px; min-width: 0;">
              
              <!-- CỘT TRÁI: ĐỌC NỘI DUNG BÀI VIẾT NGUYÊN BẢN (READ-ONLY) -->
              <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0;">
                
                <!-- Banner Đề tài & Yêu cầu BTV nếu có -->
                <div id="modal-topic-banner" style="display: none; background: #FFFDF9; border: 1.5px solid #F3DFC1; border-left: 4px solid var(--brass); border-radius: 6px; padding: 12px 14px;">
                  <div style="font-size: 11px; font-weight: 700; color: #8F7239; text-transform: uppercase;">Bài viết thực hiện theo Đề tài được phân công:</div>
                  <div id="modal-topic-title" style="font-size: 13.5px; font-weight: 700; color: var(--ink); margin-top: 2px;"></div>
                  <div id="modal-topic-desc" style="font-size: 12.5px; color: #78350F; background: rgba(184, 147, 79, 0.08); padding: 6px 10px; border-radius: 4px; margin-top: 6px; line-height: 1.5;"></div>
                </div>

                <!-- Lý do từ chối nếu có -->
                <div id="modal-rejection-banner" style="display: none; background: #FFEBEE; border-left: 3px solid #DC2626; border-radius: 4px; padding: 10px 14px;">
                  <div style="font-size: 11px; font-weight: 700; color: #C62828; text-transform: uppercase;">Lý do yêu cầu sửa đổi từ Ban Biên tập:</div>
                  <div id="modal-rejection-reason" style="font-size: 13px; color: #B71C1C; margin-top: 2px;"></div>
                </div>

                <!-- Tiêu đề bài viết -->
                <div class="admin-form-group">
                  <label class="admin-form-label" style="font-weight: 700; font-size: 12.5px; color: var(--muted); text-transform: uppercase;">Tiêu đề bài viết:</label>
                  <div id="modal-article-title-display" style="font-weight: 700; font-size: 16px; font-family: var(--f-serif, serif); color: var(--ink); line-height: 1.45; padding: 8px 12px; background: #FAF9F6; border: 1px solid var(--line-soft); border-radius: 6px;"></div>
                </div>

                <!-- Tóm tắt Sapo -->
                <div class="admin-form-group">
                  <label class="admin-form-label" style="font-weight: 700; font-size: 12.5px; color: var(--muted); text-transform: uppercase;">Tóm tắt (Sapo):</label>
                  <div id="modal-article-sapo-display" style="font-size: 13.5px; line-height: 1.6; color: var(--ink-soft); padding: 10px 12px; background: #FAF9F6; border: 1px solid var(--line-soft); border-radius: 6px; font-style: italic;"></div>
                </div>

                <!-- Nội dung chi tiết -->
                <div class="admin-form-group">
                  <label class="admin-form-label" style="font-weight: 700; font-size: 12.5px; color: var(--muted); text-transform: uppercase;">Nội dung bài viết:</label>
                  <div id="modal-article-content" style="border: 1px solid var(--line-soft); border-radius: 6px; padding: 16px; background: #FFF; max-height: 320px; overflow-y: auto; font-size: 13.5px; line-height: 1.65; color: var(--ink); word-break: break-word;"></div>
                </div>

              </div>

              <!-- CỘT PHẢI: THÔNG TIN PHÂN LOẠI & THẺ DO PHÓNG VIÊN GẮN (READ-ONLY) -->
              <div style="background: #FCFAF6; border: 1px solid var(--line-soft); border-radius: 8px; padding: 18px; display: flex; flex-direction: column; gap: 14px; min-width: 0;">
                
                <div style="font-size: 13px; font-weight: 700; color: var(--ink); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--line-soft); padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span>Thông tin xuất bản</span>
                  <span style="font-size: 11px; background: rgba(30, 41, 59, 0.08); color: var(--ink); padding: 2px 6px; border-radius: 4px; font-weight: 600;">Chế độ thẩm định</span>
                </div>

                <!-- Thông tin tác giả phóng viên -->
                <div style="font-size: 12.5px;">
                  <div style="color: var(--muted); margin-bottom: 3px;">Phóng viên thực hiện:</div>
                  <div id="modal-reporter-name" style="font-weight: 700; color: var(--ink);"></div>
                </div>

                <!-- Thời gian nộp / gửi -->
                <div style="font-size: 12.5px;">
                  <div style="color: var(--muted); margin-bottom: 3px;">Thời gian nộp bài:</div>
                  <div id="modal-submitted-time" style="font-family: var(--f-mono); color: var(--ink);"></div>
                </div>

                <!-- Chuyên mục bài viết do phóng viên chọn -->
                <div class="admin-form-group">
                  <label class="admin-form-label" style="font-weight: 700; font-size: 12.5px;">
                    Chuyên mục:
                  </label>
                  <div id="modal-category-display" style="padding: 7px 12px; background: #FFF; border: 1px solid var(--line-soft); border-radius: 6px; font-weight: 600; color: var(--ink); font-size: 13px;"></div>
                </div>

                <!-- Thẻ Tag do phóng viên gán -->
                <div class="admin-form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <label class="admin-form-label" style="font-weight: 700; font-size: 12.5px; margin: 0;">Thẻ Tag bài viết:</label>
                    <span id="modal-tag-count-hint" style="font-size: 11px; font-family: var(--f-mono); color: var(--muted); font-weight: 600;">0 thẻ</span>
                  </div>

                  <!-- Container các tag của bài viết -->
                  <div id="modal-selected-tags-mount" style="min-height: 42px; padding: 8px 10px; background: #FFF; border: 1px solid var(--line-soft); border-radius: 6px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;"></div>
                  <div style="font-size: 11px; color: var(--muted); margin-top: 5px;">
                    💡 <em>Khi duyệt bài, nếu có tag mới do phóng viên gắn, hệ thống sẽ tự động khởi tạo vào danh mục thẻ của tòa soạn. Nếu tag không phù hợp, BTV từ chối bài và yêu cầu PV sửa.</em>
                  </div>
                </div>

                <!-- Ghi chú thẩm định biên tập viên -->
                <div style="background: rgba(184, 147, 79, 0.08); border: 1px solid rgba(184, 147, 79, 0.25); border-radius: 6px; padding: 10px 12px; font-size: 11.5px; color: #78350F; line-height: 1.5;">
                  <strong>Quy chuẩn tòa soạn:</strong> Biên tập viên không tự ý sửa đổi văn bản hay tag của tác giả. Nếu bài chưa đạt yêu cầu, vui lòng chọn <strong>"Từ chối bài viết"</strong> và ghi rõ lý do để phóng viên tự hoàn thiện.
                </div>

              </div>

            </div>
          </div>

          <!-- Modal Footer: Hành động -->
          <div class="admin-modal-footer" style="padding: 14px 24px; border-top: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <div>
              <button type="button" class="admin-btn admin-btn--secondary btn-close-review-modal" style="padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                ✕ Đóng
              </button>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
              <!-- Nút Từ chối nếu bài đang ở trạng thái pending -->
              <button type="button" id="btn-trigger-reject" class="admin-btn admin-btn--danger" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FECACA; font-weight: 600; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                Từ chối bài viết
              </button>
              <button type="button" id="btn-save-publish" class="admin-btn admin-btn--primary" style="background: #1B2A4A; color: #FFF; font-weight: 700; padding: 8px 22px; border-radius: 6px; cursor: pointer;">
                Duyệt & Xuất bản ngay
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- MODAL XÁC NHẬN DUYỆT & XUẤT BẢN NGAY -->
      <div id="modal-confirm-publish" style="display: none; position: fixed; inset: 0; z-index: 1150; background: rgba(19, 27, 46, 0.7); backdrop-filter: blur(3px); align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
        <div class="admin-modal-container" style="max-width: 480px; width: 100%; background: #FFF; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.35); border: 1px solid var(--line-soft);">
          <div class="admin-modal-header" style="padding: 16px 20px; border-bottom: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(27, 42, 74, 0.1); color: #1B2A4A; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">
                ✓
              </div>
              <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: #1B2A4A;">Xác nhận duyệt & xuất bản</h3>
            </div>
            <button type="button" style="background: none; border: none; font-size: 22px; cursor: pointer; color: var(--muted); line-height: 1;" onclick="document.getElementById('modal-confirm-publish').style.display='none'">&times;</button>
          </div>
          <div class="admin-modal-body" style="padding: 20px;">
            <p style="font-size: 13.5px; color: var(--ink); margin: 0 0 10px; line-height: 1.5;">
              Bạn có chắc chắn muốn duyệt và <strong>xuất bản ngay</strong> bài viết này lên trang chủ của báo không?
            </p>
            <div id="confirm-publish-article-title" style="font-size: 13.5px; font-weight: 700; color: #1B2A4A; padding: 10px 12px; background: #FAF8F5; border: 1px solid var(--line-soft); border-radius: 6px; font-family: var(--f-serif, serif);">
            </div>
            <p style="font-size: 12px; color: var(--muted); margin: 10px 0 0; line-height: 1.4;">
              * Độc giả sẽ có thể đọc bài viết này ngay lập tức trên trang công khai.
            </p>
          </div>
          <div class="admin-modal-footer" style="padding: 12px 20px; border-top: 1px solid var(--line-soft); display: flex; justify-content: space-between; align-items: center; background: #FAF8F5;">
            <button type="button" class="admin-btn admin-btn--secondary" id="btn-cancel-publish-prompt" style="padding: 7px 16px; border-radius: 6px; cursor: pointer;">
              ✕ Hủy
            </button>
            <button type="button" class="admin-btn admin-btn--primary" id="btn-confirm-publish-prompt" style="background: #1B2A4A; color: #FFF; font-weight: 700; padding: 7px 20px; border-radius: 6px; cursor: pointer;">
              Đồng ý Xuất bản
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL NHẬP LÝ DO TỪ CHỐI -->
      <div id="modal-reject-reason" style="display: none; position: fixed; inset: 0; z-index: 1150; background: rgba(19, 27, 46, 0.7); backdrop-filter: blur(3px); align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
        <div class="admin-modal-container" style="max-width: 520px; width: 100%; background: #FFF; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.35); border: 1px solid var(--line-soft);">
          <div class="admin-modal-header" style="padding: 16px 20px; border-bottom: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: #DC2626;">Yêu cầu chỉnh sửa bài viết</h3>
            <button type="button" style="background: none; border: none; font-size: 22px; cursor: pointer; color: var(--muted); line-height: 1;" onclick="document.getElementById('modal-reject-reason').style.display='none'">&times;</button>
          </div>
          <div class="admin-modal-body" style="padding: 20px;">
            <p style="font-size: 13px; color: var(--ink); margin: 0 0 10px;">
              Vui lòng nhập lý do hoặc các điểm cần hoàn thiện để phóng viên tiến hành sửa đổi:
            </p>
            <textarea id="reject-reason-textarea" class="admin-form-textarea" rows="4" placeholder="Ví dụ: Cần bổ sung nguồn số liệu trích dẫn, ảnh minh họa chưa đạt yêu cầu..." style="width: 100%; font-size: 13px; padding: 10px; box-sizing: border-box;"></textarea>
          </div>
          <div class="admin-modal-footer" style="padding: 12px 20px; border-top: 1px solid var(--line-soft); display: flex; justify-content: flex-end; gap: 10px; background: #FAF8F5;">
            <button type="button" class="admin-btn admin-btn--secondary" id="btn-cancel-reject-prompt">Hủy</button>
            <button type="button" class="admin-btn" id="btn-confirm-reject-prompt" style="background: #DC2626; color: #FFF; border: none; font-weight: 700; padding: 7px 18px; border-radius: 6px; cursor: pointer;">
              Xác nhận Từ chối
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Lấy tiêu đề hiển thị theo Tab
   */
  function getTabTitle(tab) {
    switch (tab) {
      case "topic": return "Bài viết theo đề tài chờ duyệt";
      case "freelance":
      default: return "Bài viết tự do chờ duyệt";
    }
  }

  /**
   * Render Tabs lọc 2 Thẻ chính: Bài tự do | Bài theo đề tài (chỉ tính bài chờ duyệt)
   */
  function renderHeaderStats() {
    loadData();

    const pendingArticles = allArticles.filter((a) => a.status === "pending");
    const freelanceCount = pendingArticles.filter((a) => !a.topic_id).length;
    const topicCount = pendingArticles.filter((a) => a.topic_id != null && a.topic_id !== "").length;

    // Cập nhật tiêu đề card
    const titleDisplay = document.getElementById("tab-title-display");
    if (titleDisplay) {
      titleDisplay.textContent = getTabTitle(currentTab);
    }

    // Render 2 Tabs: Bài tự do | Bài theo đề tài
    const tabsMount = document.getElementById("pending-tabs-mount");
    if (tabsMount) {
      tabsMount.innerHTML = `
        <button type="button" class="admin-tab-btn ${currentTab === "freelance" ? "is-active" : ""}" data-tab="freelance" onclick="window.setPendingArticleTab('freelance')">
          Bài tự do <span class="tab-badge">${freelanceCount}</span>
        </button>
        <button type="button" class="admin-tab-btn ${currentTab === "topic" ? "is-active" : ""}" data-tab="topic" onclick="window.setPendingArticleTab('topic')">
          Bài theo đề tài <span class="tab-badge">${topicCount}</span>
        </button>
      `;
    }
  }

  /**
   * Render ảnh thumbnail bài viết trong bảng
   */
  function renderTableCoverThumb(imagePath, title) {
    const safeAlt = escapeHtml(title || "Ảnh bài viết");
    const raw = imagePath ? String(imagePath).trim() : "";
    const resolvedUrl = raw && typeof resolveAssetPath === "function" ? resolveAssetPath(raw) : raw;

    if (!resolvedUrl) {
      return `<div class="admin-article-thumb-ph" title="Chưa có ảnh bìa"></div>`;
    }
    return `
      <div class="admin-article-thumb-ph">
        <img src="${escapeHtml(resolvedUrl)}" alt="${safeAlt}" loading="lazy" onerror="this.remove()">
      </div>
    `;
  }

  /**
   * Render Danh sách bài viết dạng Bảng (Table) - Chỉ hiển thị đúng các bài status === 'pending'
   */
  function renderArticlesList() {
    const tbody = document.getElementById("articles-tbody");
    const countBadge = document.getElementById("list-count-badge");
    if (!tbody) return;

    loadData();

    // CHỈ LỌC CÁC BÀI VIẾT ĐANG CHỜ DUYỆT (pending)
    let filtered = allArticles.filter((a) => a.status === "pending");

    // 1. Lọc theo 2 Tab chính: Bài tự do vs Bài theo đề tài
    if (currentTab === "topic") {
      filtered = filtered.filter((a) => a.topic_id != null && a.topic_id !== "");
    } else {
      // 'freelance'
      filtered = filtered.filter((a) => !a.topic_id);
    }

    // 2. Lọc theo Chuyên mục
    if (currentCategoryFilter !== "all") {
      filtered = filtered.filter((a) => String(a.category_id) === String(currentCategoryFilter));
    }

    // 3. Tìm kiếm từ khóa
    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      filtered = filtered.filter((a) => {
        const title = (a.title || "").toLowerCase();
        const sapo = (a.short_description || a.sapo || "").toLowerCase();
        const author = allUsers.find((u) => String(u.id) === String(a.author_id));
        const authorName = (author ? author.full_name || author.username : a.author || "").toLowerCase();
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
    if (countBadge) {
      countBadge.textContent = `${filtered.length} bài`;
    }

    // Trạng thái rỗng
    if (filtered.length === 0) {
      let emptyMsg = currentTab === "topic" 
        ? "Hiện tại không có bài viết theo đề tài nào đang chờ duyệt" 
        : "Hiện tại không có bài viết tự do nào đang chờ duyệt";
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
   * Render 1 dòng trong bảng bài viết (Tinh gọn: Không hiển thị lý do từ chối hay huy hiệu đáng chú ý ở ngoài)
   */
  function renderArticleRow(article) {
    const category = allCategories.find((c) => String(c.id) === String(article.category_id)) || {
      name: "Thời sự",
      slug: "thoi-su",
    };
    const author = allUsers.find((u) => String(u.id) === String(article.author_id)) || {
      full_name: article.author || "Phóng viên",
      username: "reporter",
    };
    const topic = article.topic_id ? allTopics.find((t) => String(t.id) === String(article.topic_id)) : null;

    const coverImg = extractThumbnail(article, category);
    const thumbHtml = renderTableCoverThumb(coverImg, article.title);
    const desc = article.short_description || article.sapo || "";
    const timeDisplay = typeof formatDate === "function" ? formatDate(article.updated_at || article.created_at) : (article.updated_at || article.created_at || "--");

    // Hiển thị tên đề tài nhỏ gọn nếu bài viết theo đề tài
    let topicTagHtml = "";
    if (topic) {
      topicTagHtml = `
        <div style="font-size: 11px; font-weight: 600; color: #8F7239; margin-bottom: 3px; display: inline-flex; align-items: center; gap: 4px;">
          <svg style="width: 12px; height: 12px; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span>Đề tài: ${escapeHtml(topic.title)}</span>
        </div>
      `;
    }

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
    let actionBtnHtml = "";
    if (article.status === "pending") {
      actionBtnHtml = `
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
    } else {
      actionBtnHtml = `
        <button 
          type="button" 
          class="btn-open-review-modal admin-btn admin-btn--default" 
          data-id="${article.id}"
          onclick="window.openReviewModal('${article.id}')"
          title="Xem chi tiết"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Chi tiết
        </button>
      `;
    }

    return `
      <tr id="article-row-${article.id}" data-id="${article.id}">
        <td>
          <div class="admin-article-cell">
            ${thumbHtml}
            <div class="admin-article-info">
              ${topicTagHtml}
              <div class="admin-article-title-text" title="${escapeHtml(article.title)}">
                ${escapeHtml(article.title || "Chưa đặt tiêu đề")}
              </div>
              ${desc ? `<div class="admin-article-sapo-text" title="${escapeHtml(desc)}">${escapeHtml(desc)}</div>` : ""}
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

  /**
   * Mở Modal Xem & Thẩm định bài viết
   */
  function openReviewModal(articleId) {
    loadData();
    const article = allArticles.find((a) => String(a.id) === String(articleId));
    if (!article) return;

    reviewingArticle = article;

    const category = allCategories.find((c) => String(c.id) === String(article.category_id)) || {
      id: 1,
      name: "Thời sự",
    };
    const author = allUsers.find((u) => String(u.id) === String(article.author_id)) || {
      full_name: article.author || "Phóng viên",
      username: "reporter",
    };
    const topic = article.topic_id ? allTopics.find((t) => String(t.id) === String(article.topic_id)) : null;

    // Điền dữ liệu vào Modal (Read-only view)
    const titleDisplay = document.getElementById("modal-article-title-display");
    if (titleDisplay) titleDisplay.textContent = article.title || "Chưa có tiêu đề";
    
    const sapoDisplay = document.getElementById("modal-article-sapo-display");
    if (sapoDisplay) sapoDisplay.textContent = article.short_description || article.sapo || "Chưa có tóm tắt Sapo";
    
    document.getElementById("modal-article-content").innerHTML = article.content || "<p>Chưa có nội dung chi tiết.</p>";

    // Banner Đề tài & Yêu cầu của BTV
    const topicBanner = document.getElementById("modal-topic-banner");
    const topicTitleEl = document.getElementById("modal-topic-title");
    const topicDescEl = document.getElementById("modal-topic-desc");
    if (topic) {
      topicBanner.style.display = "block";
      topicTitleEl.textContent = topic.title || "Đề tài theo định hướng BTV";
      if (topicDescEl) {
        topicDescEl.textContent = `Yêu cầu / Định hướng BTV: ${topic.description || "Thực hiện theo tiêu chuẩn bài viết của chuyên mục."}`;
      }
    } else {
      topicBanner.style.display = "none";
    }

    // Banner Từ chối
    const rejectBanner = document.getElementById("modal-rejection-banner");
    const rejectReasonEl = document.getElementById("modal-rejection-reason");
    if (article.status === "rejected" && article.rejection_reason) {
      rejectBanner.style.display = "block";
      rejectReasonEl.textContent = article.rejection_reason;
    } else {
      rejectBanner.style.display = "none";
    }

    // Metadata cột phải
    document.getElementById("modal-reporter-name").textContent = `${author.full_name || author.username} (@${author.username})`;
    document.getElementById("modal-submitted-time").textContent =
      typeof formatDateTime === "function" ? formatDateTime(article.created_at) : (article.created_at || "");

    const catDisplay = document.getElementById("modal-category-display");
    if (catDisplay) {
      catDisplay.textContent = category.name || "Thời sự";
    }

    // Nạp Tags của bài viết do phóng viên gán (bao gồm cả tag có trong article.tags_text hoặc article_tags)
    let assignedTagNames = [];
    if (article.tags_text && Array.isArray(article.tags_text) && article.tags_text.length > 0) {
      assignedTagNames = [...article.tags_text];
    } else {
      const currentTagIds = allArticleTags
        .filter((rel) => String(rel.article_id) === String(article.id))
        .map((rel) => rel.tag_id);

      assignedTagNames = allTags
        .filter((t) => currentTagIds.includes(t.id))
        .map((t) => t.name);
    }

    modalSelectedTags = assignedTagNames;
    renderModalTags();

    // Nút hành động ở chân Modal tùy theo status
    const rejectBtn = document.getElementById("btn-trigger-reject");
    const saveBtn = document.getElementById("btn-save-publish");

    if (article.status === "pending") {
      rejectBtn.style.display = "inline-block";
      saveBtn.textContent = "Duyệt & Xuất bản ngay";
      saveBtn.style.background = "#1B2A4A";
    } else if (article.status === "rejected") {
      rejectBtn.style.display = "none";
      saveBtn.textContent = "Duyệt & Xuất bản ngay";
      saveBtn.style.background = "#1B2A4A";
    } else if (article.status === "published") {
      rejectBtn.style.display = "none";
      saveBtn.textContent = "Đã xuất bản";
      saveBtn.style.background = "#2E7D32";
      saveBtn.disabled = true;
    }

    document.getElementById("modal-review-article").style.display = "flex";
  }

  function closeReviewModal() {
    document.getElementById("modal-review-article").style.display = "none";
    reviewingArticle = null;
    modalSelectedTags = [];
  }

  /**
   * Hiển thị danh sách Thẻ Tag của bài viết (Read-only tags)
   */
  function renderModalTags() {
    const selectedMount = document.getElementById("modal-selected-tags-mount");
    const countHint = document.getElementById("modal-tag-count-hint");

    if (countHint) {
      countHint.textContent = `${modalSelectedTags.length} thẻ`;
    }

    if (selectedMount) {
      if (modalSelectedTags.length === 0) {
        selectedMount.innerHTML = `<span style="font-size: 12px; color: var(--muted); font-style: italic;">Bài viết không gắn thẻ tag nào.</span>`;
        return;
      }

      selectedMount.innerHTML = modalSelectedTags
        .map(
          (tag) => `
          <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(184, 147, 79, 0.12); border: 1px solid rgba(184, 147, 79, 0.35); color: #8F7239; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 14px;">
            #${escapeHtml(tag)}
          </span>
        `
        )
        .join("");
    }
  }

  /**
   * XỬ LÝ: DUYỆT & XUẤT BẢN NGUYÊN BẢN BÀI VIẾT (TẠO TAG MỚI NẾU CÓ)
   */
  function handleSaveOrPublish() {
    if (!reviewingArticle) return;

    const refNow = getRefTime();
    const nowIso = refNow.toISOString().replace("T", " ").substring(0, 19);

    let articles = fetchTable("articles");
    let topics = fetchTable("topics");
    let articleTags = fetchTable("article_tags");
    let tagsTable = fetchTable("tags");

    // 1. Cập nhật trạng thái xuất bản cho bài viết
    const artIndex = articles.findIndex((a) => String(a.id) === String(reviewingArticle.id));
    if (artIndex !== -1) {
      articles[artIndex].status = "published";
      articles[artIndex].rejection_reason = null;
      articles[artIndex].approved_by = currentUser ? currentUser.id : 7;
      if (!articles[artIndex].published_at) {
        articles[artIndex].published_at = nowIso;
      }
      articles[artIndex].updated_at = nowIso;
    }

    // 2. Nếu có đề tài liên quan -> Tự động đánh dấu hoàn thành 'completed'
    let topicTitle = "";
    if (reviewingArticle.topic_id) {
      const topicIndex = topics.findIndex((t) => String(t.id) === String(reviewingArticle.topic_id));
      if (topicIndex !== -1) {
        topicTitle = topics[topicIndex].title;
        topics[topicIndex].status = "completed";
        topics[topicIndex].updated_at = nowIso;
      }
    }

    // 3. Xử lý lưu các Tags của bài viết vào bảng Tags hệ thống khi BTV Duyệt bài
    const tagIdsForThisArticle = [];
    modalSelectedTags.forEach((tagName) => {
      let found = tagsTable.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
      if (!found) {
        const newTagId = tagsTable.length > 0 ? Math.max(...tagsTable.map((t) => t.id || 0)) + 1 : 1;
        found = {
          id: newTagId,
          name: tagName,
          slug: typeof slugify === "function" ? slugify(tagName) : tagName.toLowerCase().replace(/\s+/g, "-"),
          created_at: nowIso,
        };
        tagsTable.push(found);
      }
      tagIdsForThisArticle.push(found.id);
    });

    // Cập nhật quan hệ article_tags
    articleTags = articleTags.filter((rel) => String(rel.article_id) !== String(reviewingArticle.id));
    tagIdsForThisArticle.forEach((tagId) => {
      articleTags.push({ article_id: reviewingArticle.id, tag_id: tagId });
    });

    // Lưu toàn bộ dữ liệu vào LocalStorage
    saveTableData("articles", articles);
    saveTableData("topics", topics);
    saveTableData("tags", tagsTable);
    saveTableData("article_tags", articleTags);

    if (typeof showToast === "function") {
      showToast(`Đã duyệt và xuất bản bài viết "${reviewingArticle.title}" thành công!`, "success");
    }

    closeReviewModal();
    renderHeaderStats();
    renderArticlesList();
  }

  /**
   * XỬ LÝ: TỪ CHỐI BÀI VIẾT
   */
  function handleConfirmReject() {
    if (!reviewingArticle) return;

    const reason = document.getElementById("reject-reason-textarea").value.trim();
    if (!reason) {
      if (typeof showToast === "function") showToast("Vui lòng nhập lý do từ chối để phóng viên chỉnh sửa lại!", "warning");
      return;
    }

    const refNow = getRefTime();
    const nowIso = refNow.toISOString().replace("T", " ").substring(0, 19);

    let articles = fetchTable("articles");
    let topics = fetchTable("topics");

    // 1. Cập nhật bài viết thành 'rejected'
    const artIndex = articles.findIndex((a) => String(a.id) === String(reviewingArticle.id));
    if (artIndex !== -1) {
      articles[artIndex].status = "rejected";
      articles[artIndex].rejection_reason = reason;
      articles[artIndex].updated_at = nowIso;
    }

    // 2. Nếu có đề tài liên quan -> Mở lại trạng thái 'assigned' để PV tiếp tục làm
    let topicTitle = "";
    if (reviewingArticle.topic_id) {
      const topicIndex = topics.findIndex((t) => String(t.id) === String(reviewingArticle.topic_id));
      if (topicIndex !== -1) {
        topicTitle = topics[topicIndex].title;
        topics[topicIndex].status = "assigned";
        topics[topicIndex].updated_at = nowIso;
      }
    }

    saveTableData("articles", articles);
    saveTableData("topics", topics);

    document.getElementById("modal-reject-reason").style.display = "none";
    closeReviewModal();

    if (typeof showToast === "function") {
      showToast("Đã từ chối bài viết và gửi lý do cho phóng viên!", "info");
    }

    renderHeaderStats();
    renderArticlesList();
  }

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

    // 2. Chuyển Tab trạng thái (Bài tự do / Bài theo đề tài)
    document.addEventListener("click", (e) => {
      const tabBtn = e.target.closest(".admin-tab-btn");
      if (tabBtn && tabBtn.dataset.tab) {
        currentTab = tabBtn.dataset.tab;
        renderHeaderStats();
        renderArticlesList();
      }
    });

    // 3. Mở Modal thẩm định khi click vào nút "Thẩm định" hoặc "Chi tiết"
    document.addEventListener("click", (e) => {
      const openBtn = e.target.closest(".btn-open-review-modal");
      if (openBtn && openBtn.dataset.id) {
        openReviewModal(openBtn.dataset.id);
      }
    });

    // 4. Đóng Modal
    document.addEventListener("click", (e) => {
      const closeBtn = e.target.closest(".btn-close-review-modal");
      if (closeBtn) {
        closeReviewModal();
      }
    });

    // 5. Nút Duyệt / Xuất bản (Mở popup xác nhận)
    const btnSave = document.getElementById("btn-save-publish");
    if (btnSave) {
      btnSave.addEventListener("click", () => {
        if (!reviewingArticle) return;
        const titleEl = document.getElementById("confirm-publish-article-title");
        if (titleEl) {
          titleEl.textContent = reviewingArticle.title || "Bài viết không tiêu đề";
        }
        const confirmModal = document.getElementById("modal-confirm-publish");
        if (confirmModal) {
          confirmModal.style.display = "flex";
        }
      });
    }

    // 6. Hủy & Xác nhận Xuất bản trong Popup
    const btnCancelPublish = document.getElementById("btn-cancel-publish-prompt");
    if (btnCancelPublish) {
      btnCancelPublish.addEventListener("click", () => {
        const confirmModal = document.getElementById("modal-confirm-publish");
        if (confirmModal) confirmModal.style.display = "none";
      });
    }

    const btnConfirmPublish = document.getElementById("btn-confirm-publish-prompt");
    if (btnConfirmPublish) {
      btnConfirmPublish.addEventListener("click", () => {
        const confirmModal = document.getElementById("modal-confirm-publish");
        if (confirmModal) confirmModal.style.display = "none";
        handleSaveOrPublish();
      });
    }

    // 7. Nút Mở Popup Từ chối
    const btnTriggerReject = document.getElementById("btn-trigger-reject");
    if (btnTriggerReject) {
      btnTriggerReject.addEventListener("click", () => {
        document.getElementById("reject-reason-textarea").value = "";
        document.getElementById("modal-reject-reason").style.display = "flex";
      });
    }

    // 8. Hủy & Xác nhận Từ chối
    const btnCancelReject = document.getElementById("btn-cancel-reject-prompt");
    if (btnCancelReject) {
      btnCancelReject.addEventListener("click", () => {
        document.getElementById("modal-reject-reason").style.display = "none";
      });
    }

    const btnConfirmReject = document.getElementById("btn-confirm-reject-prompt");
    if (btnConfirmReject) {
      btnConfirmReject.addEventListener("click", handleConfirmReject);
    }
  }

  window.setPendingArticleTab = function (tab) {
    currentTab = tab;
    renderHeaderStats();
    renderArticlesList();
  };

  window.openReviewModal = openReviewModal;
  window.closeReviewModal = closeReviewModal;

  window.handleSearchArticles = function (query) {
    currentSearchQuery = (query || "").trim();
    renderArticlesList();
  };

  window.handleFilterCategory = function (catId) {
    currentCategoryFilter = catId;
    renderArticlesList();
  };

  window.triggerRejectModal = function () {
    const textarea = document.getElementById("reject-reason-textarea");
    if (textarea) textarea.value = "";
    const rejectModal = document.getElementById("modal-reject-reason");
    if (rejectModal) rejectModal.style.display = "flex";
  };

  window.closeRejectModal = function () {
    const rejectModal = document.getElementById("modal-reject-reason");
    if (rejectModal) rejectModal.style.display = "none";
  };

  window.handleSaveOrPublish = handleSaveOrPublish;
  window.handleConfirmReject = handleConfirmReject;

  /**
   * Tự động cuộn đến bài viết và làm nổi màu (Highlight) khi có tham số ?id= hoặc ?article_id= trên URL
   */
  function checkAndHighlightArticle() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetArticleId = urlParams.get("id") || urlParams.get("article_id");
    if (!targetArticleId) return;

    setTimeout(() => {
      const targetElement = document.getElementById(`article-row-${targetArticleId}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        targetElement.classList.add("admin-row-highlight-flash");
        setTimeout(() => {
          targetElement.classList.remove("admin-row-highlight-flash");
        }, 2800);
      }
    }, 250);
  }

  function formatDateTime(str) {
    if (!str) return "--";
    try {
      const d = new Date(str);
      if (isNaN(d.getTime())) return str;
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch (e) {
      return str;
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
