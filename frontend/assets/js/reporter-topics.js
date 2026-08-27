/**
 * reporter-topics.js - Quản lý và xử lý nghiệp vụ trang "Đề tài của tôi" (reporter/my-topics.html)
 * Đáp ứng đầy đủ các trạng thái và nghiệp vụ:
 * 1. assigned: Đã giao -> Nút "Viết bài" (chuyển sang write-article.html?topic_id=...)
 * 2. overdue: Quá hạn (deadline < now) -> Nút "Viết bài" (cho phép viết bù)
 * 3. submitted: Đã nộp bài (đã gửi duyệt) -> Nút "Xem bài viết" (mở bài viết liên kết trong my-articles hoặc xem chi tiết)
 * 4. completed: Hoàn thành (bài viết đã được BTV duyệt published) -> Nút "Xem bài đăng" (mở xem công khai)
 */

(function () {
  "use strict";

  // Biến trạng thái của trang
  let currentFilterStatus = "all"; // 'all', 'assigned', 'overdue', 'submitted', 'completed'
  let currentSearchQuery = "";
  let currentCategoryFilter = "all";
  let currentSortBy = "deadline_asc"; // 'deadline_asc', 'deadline_desc', 'created_desc'

  let allTopics = [];
  let allCategories = [];
  let allUsers = [];
  let allArticles = [];
  let allTopicTags = [];
  let allTags = [];
  let currentUser = null;

  // Khởi chạy khi DOM sẵn sàng
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReporterTopicsPage);
  } else {
    initReporterTopicsPage();
  }

  function initReporterTopicsPage() {
    // 1. Xác thực user hiện tại
    if (typeof getCurrentUser === "function") {
      currentUser = getCurrentUser();
    }
    if (!currentUser) {
      const users = fetchTable("users");
      currentUser = users.find(u => u.role === "reporter") || users[0];
    }

    // 2. Tải dữ liệu từ database
    loadData();

    // 3. Render giao diện bộ lọc và danh sách
    renderFilterBar();
    renderTopicsList();

    // 4. Lắng nghe các sự kiện tìm kiếm & lọc
    attachEventListeners();
  }

  /**
   * Helper an toàn để lấy dữ liệu từ localStorage hoặc Mock Data
   */
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

  /**
   * Helper lấy mốc thời gian tham chiếu của hệ thống
   */
  function getRefTime() {
    if (typeof getSystemTime === "function") {
      return getSystemTime();
    }
    return new Date("2026-08-14T23:59:59");
  }

  /**
   * Đọc dữ liệu từ nguồn
   */
  function loadData() {
    allTopics = fetchTable("topics");
    allCategories = fetchTable("categories");
    allUsers = fetchTable("users");
    allArticles = fetchTable("articles");
    allTopicTags = fetchTable("topic_tags");
    allTags = fetchTable("tags");
  }

  /**
   * Tính toán trạng thái thực tế của đề tài
   * - Nếu status ban đầu là 'assigned' nhưng deadline < currentTime -> 'overdue'
   * - Nếu bài viết đang ở bản nháp (draft) do PV thu bài về hoặc bị từ chối (rejected) -> 'assigned' (hoặc 'overdue' nếu quá hạn)
   * - Nếu bài viết đã gửi duyệt (pending) hoặc đã xuất bản (published) -> 'submitted' (Đã nộp bài)
   */
  function computeTopicStatus(topic) {
    const refNow = getRefTime().getTime();
    const deadlineTime = topic.deadline ? new Date(topic.deadline).getTime() : 0;

    // Tìm bài viết tương ứng với topic này của phóng viên hiện tại
    const linkedArticle = allArticles.find(
      a => String(a.topic_id) === String(topic.id) && String(a.author_id) === String(topic.reporter_id)
    );

    if (linkedArticle) {
      if (linkedArticle.status === "draft" || linkedArticle.status === "rejected") {
        // Phóng viên đang viết bản nháp hoặc thu hồi bài về viết lại hoặc bài bị từ chối -> Quay về Đã giao (Đang làm)
        if (deadlineTime > 0 && deadlineTime < refNow) {
          return "overdue";
        }
        return "assigned";
      }
      if (linkedArticle.status === "published" || linkedArticle.status === "pending") {
        // Bài đã nộp duyệt hoặc đã xuất bản
        return "submitted";
      }
    }

    if (topic.status === "submitted" || topic.status === "completed") {
      if (linkedArticle && (linkedArticle.status === "draft" || linkedArticle.status === "rejected")) {
        if (deadlineTime > 0 && deadlineTime < refNow) {
          return "overdue";
        }
        return "assigned";
      }
      return "submitted";
    }

    // Nếu là assigned hoặc in_progress: kiểm tra hạn deadline
    if (topic.status === "assigned" || topic.status === "in_progress" || topic.status === "overdue") {
      if (deadlineTime > 0 && deadlineTime < refNow) {
        return "overdue";
      }
      return "assigned";
    }

    return topic.status || "assigned";
  }

  /**
   * Lấy danh sách đề tài của phóng viên hiện tại kèm đầy đủ thông tin bổ trợ
   */
  function getReporterEnrichedTopics() {
    const currentUserId = currentUser ? currentUser.id : 6;

    // Lọc các đề tài được phân công cho phóng viên này
    const myRawTopics = allTopics.filter(
      t => String(t.reporter_id) === String(currentUserId) || String(t.assigned_to) === String(currentUserId)
    );

    return myRawTopics.map(topic => {
      const actualStatus = computeTopicStatus(topic);
      const category = allCategories.find(c => String(c.id) === String(topic.category_id)) || {
        id: 0,
        name: "Thời sự",
        slug: "thoi-su"
      };

      const editor = allUsers.find(u => String(u.id) === String(topic.editor_id || topic.assigned_by)) || {
        full_name: "Ban Biên tập",
        username: "editor"
      };

      // Lấy danh sách tags gợi ý của đề tài
      const tagIds = allTopicTags
        .filter(tt => String(tt.topic_id) === String(topic.id))
        .map(tt => tt.tag_id);
      const tags = allTags.filter(t => tagIds.includes(t.id));

      // Lấy bài viết liên kết (nếu có)
      const linkedArticle = allArticles.find(
        a => String(a.topic_id) === String(topic.id) && String(a.author_id) === String(currentUserId)
      );

      return {
        ...topic,
        actualStatus,
        category,
        editor,
        tags,
        linkedArticle
      };
    });
  }

  /**
   * Render Thanh bộ lọc Tabs trạng thái
   */
  function renderFilterBar() {
    const enrichedTopics = getReporterEnrichedTopics();

    const totalCount = enrichedTopics.length;
    const assignedCount = enrichedTopics.filter(t => t.actualStatus === "assigned").length;
    const overdueCount = enrichedTopics.filter(t => t.actualStatus === "overdue").length;
    const submittedCount = enrichedTopics.filter(t => t.actualStatus === "submitted").length;

    const filterMount = document.getElementById("topic-filter-mount");
    if (!filterMount) return;

    filterMount.innerHTML = `
      <div class="admin-card" style="padding: 12px 16px; margin-bottom: 20px;">
        <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
          <button type="button" class="admin-tab-btn ${currentFilterStatus === "all" ? "active" : ""}" data-status="all">
            Tất cả <span class="tab-badge">${totalCount}</span>
          </button>
          <button type="button" class="admin-tab-btn ${currentFilterStatus === "assigned" ? "active" : ""}" data-status="assigned">
            Đã giao <span class="tab-badge" style="background:#E3F2FD; color:#1565C0;">${assignedCount}</span>
          </button>
          <button type="button" class="admin-tab-btn ${currentFilterStatus === "overdue" ? "active" : ""}" data-status="overdue">
            Quá hạn <span class="tab-badge" style="background:#FFEBEE; color:#C62828;">${overdueCount}</span>
          </button>
          <button type="button" class="admin-tab-btn ${currentFilterStatus === "submitted" ? "active" : ""}" data-status="submitted">
            Đã nộp bài <span class="tab-badge" style="background:#FFF3E0; color:#E65100;">${submittedCount}</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render Danh sách Đề tài
   */
  function renderTopicsList() {
    const listMount = document.getElementById("topic-list-mount");
    if (!listMount) return;

    let topics = getReporterEnrichedTopics();

    // 1. Lọc theo trạng thái tab
    if (currentFilterStatus !== "all") {
      topics = topics.filter(t => t.actualStatus === currentFilterStatus);
    }

    // 2. Sắp xếp mặc định: Hạn nộp gần nhất
    topics.sort((a, b) => {
      const tA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const tB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return tA - tB;
    });

    // 3. Kiểm tra rỗng
    if (topics.length === 0) {
      listMount.innerHTML = `
        <div class="admin-card" style="padding: 40px 24px; text-align: center; background: #FCFAF6;">
          <div style="width: 48px; height: 48px; margin: 0 auto 12px; background: rgba(184, 147, 79, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #8F7239;">
            <svg style="width: 24px; height: 24px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h3 style="font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 4px;">Chưa có đề tài nào</h3>
          <p style="font-size: 13px; color: var(--muted); margin: 0;">
            Hiện tại không có đề tài nào trong danh sách này.
          </p>
        </div>
      `;
      return;
    }

    // 6. Render danh sách thẻ Đề tài
    const refNow = getRefTime().getTime();

    listMount.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${topics.map(topic => {
          return renderTopicCard(topic, refNow);
        }).join("")}
      </div>
    `;
  }

  /**
   * Render từng Card Đề tài chi tiết
   */
  function renderTopicCard(topic, refNow) {
    const { actualStatus, category, editor, tags, linkedArticle } = topic;

    // Trạng thái & Màu sắc
    let statusBadge = "";
    let actionBtn = "";
    let deadlineWarning = "";
    let deadlineColor = "var(--ink)";

    const deadlineTime = topic.deadline ? new Date(topic.deadline).getTime() : 0;
    const isOverdue = deadlineTime > 0 && deadlineTime < refNow;
    const hoursLeft = deadlineTime > 0 ? (deadlineTime - refNow) / (1000 * 60 * 60) : 0;

    // Format ngày giờ: HH:MM DD/MM/YYYY
    const deadlineFormatted = formatDateTime(topic.deadline);
    const createdFormatted = formatDateTime(topic.created_at);

    // Ngày giờ nộp bài (nếu đã nộp)
    const submittedTime = topic.submitted_at || (linkedArticle ? (linkedArticle.created_at || linkedArticle.updated_at) : null);
    const submittedFormatted = submittedTime ? formatDateTime(submittedTime) : null;

    if (actualStatus === "assigned") {
      statusBadge = `<span class="admin-badge" style="background: #E3F2FD; color: #1565C0; border: 1px solid #BBDEFB; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11.5px;">Đã giao (Đang làm)</span>`;
      
      // Cảnh báo nếu sắp hết hạn (< 24 giờ)
      if (hoursLeft > 0 && hoursLeft <= 24) {
        deadlineWarning = `
          <span style="font-size: 11.5px; color: #E65100; font-weight: 700; background: #FFF3E0; border: 1px solid #FFE0B2; padding: 2px 8px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px;">
            <svg style="width: 12px; height: 12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Sắp hết hạn (${Math.round(hoursLeft)}h nữa)
          </span>
        `;
        deadlineColor = "#E65100";
      }

      let writeBtnUrl = `write-article.html?topic_id=${topic.id}`;
      let writeBtnText = "Viết bài";
      if (linkedArticle && (linkedArticle.status === "draft" || linkedArticle.status === "rejected")) {
        writeBtnUrl = `write-article.html?id=${linkedArticle.id}`;
        writeBtnText = linkedArticle.status === "draft" ? "Tiếp tục viết" : "Sửa bài viết";
      }

      actionBtn = `
        <button type="button" class="topic-btn-action" onclick="openTopicDetailModal(${topic.id})" style="background: #FFFFFF; color: var(--ink); border: 1px solid var(--line-soft); cursor: pointer;">
          <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Chi tiết
        </button>
        <a href="${writeBtnUrl}" class="topic-btn-action admin-btn--primary" style="background: var(--ink); color: #fff;">
          <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          ${writeBtnText}
        </a>
      `;
    } else if (actualStatus === "overdue") {
      statusBadge = `<span class="admin-badge" style="background: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11.5px;">Quá hạn</span>`;
      deadlineWarning = `
        <span style="font-size: 11.5px; color: #C62828; font-weight: 700; background: #FFEBEE; border: 1px solid #FFCDD2; padding: 2px 8px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px;">
          <svg style="width: 12px; height: 12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Đã quá hạn
        </span>
      `;
      deadlineColor = "#C62828";

      let writeBtnUrl = `write-article.html?topic_id=${topic.id}`;
      let writeBtnText = "Viết bù";
      if (linkedArticle && (linkedArticle.status === "draft" || linkedArticle.status === "rejected")) {
        writeBtnUrl = `write-article.html?id=${linkedArticle.id}`;
        writeBtnText = linkedArticle.status === "draft" ? "Tiếp tục viết" : "Sửa bài viết";
      }

      // Vẫn cho phép viết bài nộp bù
      actionBtn = `
        <button type="button" class="topic-btn-action" onclick="openTopicDetailModal(${topic.id})" style="background: #FFFFFF; color: var(--ink); border: 1px solid var(--line-soft); cursor: pointer;">
          <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Chi tiết
        </button>
        <a href="${writeBtnUrl}" class="topic-btn-action" style="background: #C62828; color: #fff;">
          <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          ${writeBtnText}
        </a>
      `;
    } else if (actualStatus === "submitted" || actualStatus === "completed") {
      statusBadge = `<span class="admin-badge" style="background: #FFF3E0; color: #E65100; border: 1px solid #FFE0B2; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11.5px;">Đã nộp bài</span>`;
      
      const targetUrl = linkedArticle ? `my-articles.html?id=${linkedArticle.id}` : "my-articles.html";
      actionBtn = `
        <button type="button" class="topic-btn-action" onclick="openTopicDetailModal(${topic.id})" style="background: #FFFFFF; color: var(--ink); border: 1px solid var(--line-soft); cursor: pointer;">
          <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Chi tiết
        </button>
        <a href="${targetUrl}" class="topic-btn-action admin-btn--outline" style="background: #FFFFFF; color: var(--ink); border: 1px solid var(--line-soft);">
          <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Xem bài viết
        </a>
      `;
    }

    return `
      <div class="topic-card-item">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 14px;">
          
          <!-- Nhóm Tiêu đề & Chuyên mục -->
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
              <span class="admin-category-pill" style="background: rgba(184, 147, 79, 0.12); color: #8F7239; border: 1px solid rgba(184, 147, 79, 0.3); font-size: 11.5px; font-weight: 600; padding: 2px 10px; border-radius: 12px;">
                ${escapeHTML(category.name)}
              </span>
              ${statusBadge}
              ${deadlineWarning}
            </div>
            
            <h3 style="font-size: 16.5px; font-weight: 700; color: var(--ink); line-height: 1.4; margin: 0 0 10px 0; cursor: pointer;" onclick="openTopicDetailModal(${topic.id})" title="Bấm để xem chi tiết đề tài">
              ${escapeHTML(topic.title)}
            </h3>

            <!-- Mô tả / Yêu cầu từ BTV -->
            <div style="font-size: 13.5px; color: var(--ink-soft); line-height: 1.6; background: #FCFAF6; padding: 12px 16px; border-radius: 6px; border-left: 3.5px solid var(--brass); border: 1px solid var(--line-soft); border-left-width: 3.5px; border-left-color: var(--brass);">
              <div style="font-weight: 700; color: var(--ink); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px; display: flex; align-items: center; gap: 5px;">
                Định hướng từ Biên tập viên:
              </div>
              <div style="color: #4A463B;">
                ${escapeHTML(topic.description || "Không có ghi chú thêm.")}
              </div>
            </div>
          </div>

          <!-- Nút Hành Động -->
          <div style="white-space: nowrap; padding-top: 4px; display: flex; align-items: center; gap: 8px;">
            ${actionBtn}
          </div>

        </div>

        <!-- Thẻ tags gợi ý nếu có -->
        ${tags && tags.length > 0 ? `
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--line-soft);">
            <span style="font-size: 12px; color: var(--muted); font-weight: 600;">Tags gợi ý:</span>
            ${tags.map(t => `
              <span class="admin-badge" style="background: rgba(19, 27, 46, 0.05); color: var(--ink-soft); font-size: 11.5px; border-radius: 4px; padding: 2px 8px; font-weight: 500;">
                #${escapeHTML(t.name)}
              </span>
            `).join("")}
          </div>
        ` : ""}

        <!-- Footer thông tin Người giao, Thời gian nộp & Deadline -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--line-soft); font-size: 12.5px; color: var(--muted);">
          
          <!-- Người giao & Ngày giao & Ngày nộp bài -->
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <svg style="width: 14px; height: 14px; color: var(--muted);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>BTV giao: <strong style="color: var(--ink); font-weight: 600;">${escapeHTML(editor.full_name || editor.username)}</strong></span>
            <span style="color: var(--line-soft);">•</span>
            <span>Ngày giao: ${createdFormatted}</span>
            ${submittedFormatted && (actualStatus === "submitted" || actualStatus === "completed") ? `
              <span style="color: var(--line-soft);">•</span>
              <span style="color: #2E7D32; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;">
                <svg style="width: 13px; height: 13px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Ngày nộp: <strong style="color: #1B5E20; font-family: var(--f-mono); font-weight: 600;">${submittedFormatted}</strong>
              </span>
            ` : ""}
          </div>

          <!-- Hạn chót Deadline -->
          <div style="display: flex; align-items: center; gap: 6px;">
            <svg style="width: 14px; height: 14px; color: ${deadlineColor};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Hạn nộp: <strong style="color: ${deadlineColor}; font-family: var(--f-mono); font-weight: 700;">${deadlineFormatted}</strong></span>
          </div>

        </div>
      </div>
    `;
  }

  /**
   * MỞ MODAL XEM CHI TIẾT ĐỀ TÀI PHÂN CÔNG (CHUẨN BÁO CHÍ ĐỒNG BỘ)
   */
  window.openTopicDetailModal = function (topicId) {
    const enrichedTopics = getReporterEnrichedTopics();
    const topic = enrichedTopics.find(t => Number(t.id) === Number(topicId));
    if (!topic) {
      if (typeof showToast === "function") showToast("Không tìm thấy thông tin đề tài", "warning");
      return;
    }

    const { actualStatus, category, editor, tags, linkedArticle } = topic;
    const refNow = getRefTime().getTime();
    const deadlineTime = topic.deadline ? new Date(topic.deadline).getTime() : 0;
    const isOverdue = deadlineTime > 0 && deadlineTime < refNow;
    const deadlineFormatted = formatDateTime(topic.deadline);
    const createdFormatted = formatDateTime(topic.created_at);

    // Xác định trạng thái bài viết & lý do từ chối nếu có
    let articleStatusBadge = "";
    let articleStatusText = "Chưa có bài viết nộp cho đề tài này";
    let articleRejectionBanner = "";

    if (linkedArticle) {
      if (linkedArticle.status === "rejected") {
        articleStatusBadge = `<span class="admin-badge" style="background: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11px;">Bị từ chối / Cần sửa</span>`;
        articleStatusText = "Bài viết đã bị Ban Biên tập trả về yêu cầu sửa đổi.";
        const rejectReason = linkedArticle.reject_reason || linkedArticle.rejection_reason || "Chưa có ghi chú lý do cụ thể.";
        
        articleRejectionBanner = `
          <div style="background: #FFEBEE; border: 1.5px solid #FFCDD2; border-left: 4px solid #DC2626; border-radius: 6px; padding: 12px 14px; margin-top: 10px;">
            <div style="color: #C62828; font-weight: 700; font-size: 11.5px; text-transform: uppercase; display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Lý do từ chối từ Ban Biên tập:
            </div>
            <div style="font-size: 13px; color: #B71C1C; line-height: 1.5; font-weight: 500;">
              ${escapeHTML(rejectReason)}
            </div>
          </div>
        `;
      } else if (linkedArticle.status === "pending") {
        articleStatusBadge = `<span class="admin-badge" style="background: #FFF3E0; color: #E65100; border: 1px solid #FFE0B2; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11px;">Đang chờ duyệt</span>`;
        articleStatusText = "Bài viết đã được nộp và đang nằm trong hàng đợi thẩm định của Ban Biên tập.";
      } else if (linkedArticle.status === "published") {
        articleStatusBadge = `<span class="admin-badge" style="background: #E8F5E9; color: #2E7D32; border: 1px solid #C8E6C9; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11px;">Đã xuất bản</span>`;
        articleStatusText = "Bài viết đã được duyệt và xuất bản chính thức trên Mạch Tin.";
      } else if (linkedArticle.status === "draft") {
        articleStatusBadge = `<span class="admin-badge" style="background: #ECEFF1; color: #546E7A; border: 1px solid #CFD8DC; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11px;">Bản nháp</span>`;
        articleStatusText = "Bạn đang soạn thảo bản nháp cho đề tài này, chưa gửi duyệt.";
      }
    }

    // Các nút hành động dưới modal
    let modalActionBtns = "";
    if (linkedArticle && linkedArticle.status === "rejected") {
      modalActionBtns = `
        <a href="write-article.html?id=${linkedArticle.id}" class="topic-btn-action admin-btn--primary" style="background: var(--ink); color: #fff; font-weight: 700; padding: 9px 20px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Sửa bài viết theo yêu cầu
        </a>
      `;
    } else if (linkedArticle && linkedArticle.status === "draft") {
      modalActionBtns = `
        <a href="write-article.html?id=${linkedArticle.id}" class="topic-btn-action admin-btn--primary" style="background: var(--ink); color: #fff; font-weight: 700; padding: 9px 20px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Tiếp tục viết bài
        </a>
      `;
    } else if (linkedArticle && linkedArticle.status === "pending") {
      modalActionBtns = `
        <a href="my-articles.html?id=${linkedArticle.id}" class="topic-btn-action admin-btn--outline" style="background: #FFFFFF; color: var(--ink); border: 1px solid var(--line-soft); font-weight: 700; padding: 9px 18px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Xem chi tiết bài viết
        </a>
      `;
    } else if (linkedArticle && linkedArticle.status === "published") {
      modalActionBtns = `
        <a href="../public/article-detail.html?id=${linkedArticle.id}" target="_blank" class="topic-btn-action admin-btn--primary" style="background: #2E7D32; color: #fff; font-weight: 700; padding: 9px 20px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Xem bài viết trên báo
        </a>
      `;
    } else {
      modalActionBtns = `
        <a href="write-article.html?topic_id=${topic.id}" class="topic-btn-action admin-btn--primary" style="background: var(--ink); color: #fff; font-weight: 700; padding: 9px 20px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Bắt đầu viết bài cho đề tài này
        </a>
      `;
    }

    const modalMount = document.getElementById("topic-detail-modal-container");
    if (!modalMount) return;

    modalMount.innerHTML = `
      <div id="topic-detail-modal" style="display: flex; position: fixed; inset: 0; z-index: 1050; background: rgba(19, 27, 46, 0.65); backdrop-filter: blur(3px); align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
        <div class="admin-modal-container" style="max-width: 900px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; background: #FFF; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid var(--line-soft);">
          
          <!-- Modal Header -->
          <div class="admin-modal-header" style="padding: 16px 24px; border-bottom: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--ink);">Chi tiết Đề tài phân công</h3>
                <span class="admin-category-pill" style="background: rgba(184, 147, 79, 0.12); color: #8F7239; border: 1px solid rgba(184, 147, 79, 0.3); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px;">${escapeHTML(category.name)}</span>
              </div>
              <p style="margin: 0; font-size: 12px; color: var(--muted);">Xem định hướng tác nghiệp từ Biên tập viên và tiến độ thực hiện bài viết.</p>
            </div>
            <button type="button" onclick="closeTopicDetailModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--muted); line-height: 1; padding: 4px;">&times;</button>
          </div>

          <!-- Modal Body -->
          <div class="admin-modal-body" style="padding: 24px; overflow-y: auto; flex: 1; box-sizing: border-box;">
            <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 24px; min-width: 0;">
              
              <!-- CỘT TRÁI: THÔNG TIN ĐỀ TÀI & BÀI VIẾT LIÊN KẾT -->
              <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0;">
                
                <!-- Tiêu đề đề tài -->
                <div>
                  <div style="font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                    Tên đề tài được giao:
                  </div>
                  <div style="font-size: 16.5px; font-weight: 700; color: var(--ink); line-height: 1.45; font-family: var(--f-serif, serif); padding: 12px 14px; background: #FAF9F6; border: 1px solid var(--line-soft); border-radius: 6px;">
                    ${escapeHTML(topic.title)}
                  </div>
                </div>

                <!-- Định hướng chi tiết từ BTV -->
                <div>
                  <div style="font-size: 11px; font-weight: 700; color: #8F7239; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                    Yêu cầu & Định hướng từ Biên tập viên:
                  </div>
                  <div style="font-size: 13.5px; line-height: 1.65; color: #3E3B32; padding: 14px 16px; background: #FFFDF9; border: 1px solid #F3DFC1; border-left: 4px solid var(--brass); border-radius: 6px;">
                    ${escapeHTML(topic.description || "Biên tập viên không để lại ghi chú thêm. Hãy triển khai tác nghiệp theo đúng quy chuẩn tòa soạn.")}
                  </div>
                </div>

                <!-- Khối thông tin Bài viết liên kết thực hiện đề tài -->
                <div style="border: 1px solid var(--line-soft); border-radius: 6px; padding: 14px 16px; background: #FAF8F5;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; font-weight: 700; color: var(--ink); text-transform: uppercase;">Tiến độ bài viết liên kết</span>
                    ${articleStatusBadge}
                  </div>

                  ${linkedArticle ? `
                    <div style="display: flex; align-items: center; gap: 7px; font-weight: 700; font-size: 14px; color: var(--ink); margin-bottom: 4px;">
                      <svg style="width: 15px; height: 15px; color: var(--ink-soft); flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      <span>${escapeHTML(linkedArticle.title || "Chưa đặt tiêu đề")}</span>
                    </div>
                    <div style="font-size: 12.5px; color: var(--ink-soft); line-height: 1.5; font-style: italic;">
                      ${escapeHTML(linkedArticle.sapo || linkedArticle.short_description || "Đã tạo bài viết thực hiện đề tài.")}
                    </div>
                    ${articleRejectionBanner}
                  ` : `
                    <div style="font-size: 13px; color: var(--muted); font-style: italic; line-height: 1.5;">
                      Chưa có bài viết nào được nộp cho đề tài này. Phóng viên vui lòng bấm nút <strong>"Bắt đầu viết bài"</strong> bên dưới để thực hiện trước hạn chót.
                    </div>
                  `}
                </div>

              </div>

              <!-- CỘT PHẢI: QUY TRÌNH & THÔNG TIN TIẾN ĐỘ -->
              <div style="background: #FCFAF6; border: 1px solid var(--line-soft); border-radius: 8px; padding: 18px; display: flex; flex-direction: column; gap: 16px; min-width: 0;">
                
                <div style="font-size: 13px; font-weight: 700; color: var(--ink); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--line-soft); padding-bottom: 8px;">
                  Vòng đời & Tiến độ thực hiện
                </div>

                <!-- Timeline Quy trình -->
                <div style="display: flex; flex-direction: column; gap: 12px;">
                  
                  <!-- Bước 1: Giao đề tài -->
                  <div style="display: flex; gap: 10px; align-items: flex-start;">
                    <div style="width: 22px; height: 22px; border-radius: 50%; background: #2E7D32; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0;">✓</div>
                    <div>
                      <div style="font-size: 12.5px; font-weight: 700; color: var(--ink);">1. BTV giao đề tài</div>
                      <div style="font-size: 11px; color: var(--muted); font-family: var(--f-mono);">${createdFormatted} (BTV ${escapeHTML(editor.full_name || editor.username)})</div>
                    </div>
                  </div>

                  <!-- Bước 2: Tác nghiệp & Nộp bài -->
                  <div style="display: flex; gap: 10px; align-items: flex-start;">
                    <div style="width: 22px; height: 22px; border-radius: 50%; background: ${linkedArticle && (linkedArticle.status === 'pending' || linkedArticle.status === 'published') ? '#2E7D32' : '#B8934F'}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0;">
                      ${linkedArticle && (linkedArticle.status === 'pending' || linkedArticle.status === 'published') ? '✓' : '2'}
                    </div>
                    <div>
                      <div style="font-size: 12.5px; font-weight: 700; color: var(--ink);">2. Tác nghiệp & Nộp bài</div>
                      <div style="font-size: 11px; color: var(--muted);">
                        ${linkedArticle && (linkedArticle.status === 'pending' || linkedArticle.status === 'published') ? 'Đã nộp bài viết' : linkedArticle && linkedArticle.status === 'draft' ? 'Đang viết bản nháp (Chưa nộp)' : linkedArticle && linkedArticle.status === 'rejected' ? 'Đang sửa lại theo yêu cầu' : 'Đang tác nghiệp (Chưa nộp)'}
                      </div>
                    </div>
                  </div>

                  <!-- Bước 3: Ban Biên tập Thẩm định -->
                  <div style="display: flex; gap: 10px; align-items: flex-start;">
                    <div style="width: 22px; height: 22px; border-radius: 50%; background: ${linkedArticle && linkedArticle.status === 'published' ? '#2E7D32' : linkedArticle && linkedArticle.status === 'rejected' ? '#C62828' : linkedArticle && linkedArticle.status === 'pending' ? '#E65100' : '#CFD8DC'}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0;">
                      ${linkedArticle && linkedArticle.status === 'published' ? '✓' : linkedArticle && linkedArticle.status === 'rejected' ? '!' : '3'}
                    </div>
                    <div>
                      <div style="font-size: 12.5px; font-weight: 700; color: var(--ink);">3. Ban Biên tập Thẩm định</div>
                      <div style="font-size: 11px; color: var(--muted);">
                        ${linkedArticle && linkedArticle.status === 'published' ? 'Đã duyệt đạt chuẩn' : linkedArticle && linkedArticle.status === 'rejected' ? 'Yêu cầu sửa lại' : linkedArticle && linkedArticle.status === 'pending' ? 'Đang duyệt' : 'Chờ nộp bài'}
                      </div>
                    </div>
                  </div>

                  <!-- Bước 4: Xuất bản -->
                  <div style="display: flex; gap: 10px; align-items: flex-start;">
                    <div style="width: 22px; height: 22px; border-radius: 50%; background: ${linkedArticle && linkedArticle.status === 'published' ? '#2E7D32' : '#CFD8DC'}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0;">
                      ${linkedArticle && linkedArticle.status === 'published' ? '✓' : '4'}
                    </div>
                    <div>
                      <div style="font-size: 12.5px; font-weight: 700; color: var(--ink);">4. Xuất bản bài báo</div>
                      <div style="font-size: 11px; color: var(--muted);">
                        ${linkedArticle && linkedArticle.status === 'published' ? 'Đã lên trang chủ' : 'Chưa xuất bản'}
                      </div>
                    </div>
                  </div>

                </div>

                <!-- Hạn chót Deadline -->
                <div style="border-top: 1px dashed var(--line-soft); padding-top: 12px; font-size: 12px;">
                  <div style="color: var(--muted); margin-bottom: 2px;">Hạn chót nộp bài:</div>
                  <div style="display: flex; align-items: center; gap: 6px; font-family: var(--f-mono); font-weight: 700; font-size: 13.5px; color: ${isOverdue ? '#C62828' : 'var(--ink)'};">
                    <svg style="width: 14px; height: 14px; color: ${isOverdue ? '#C62828' : 'var(--muted)'}; flex-shrink: 0;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>${deadlineFormatted} ${isOverdue ? '(Đã quá hạn)' : ''}</span>
                  </div>
                </div>

                <!-- Tags gợi ý -->
                ${tags && tags.length > 0 ? `
                  <div style="border-top: 1px dashed var(--line-soft); padding-top: 12px;">
                    <div style="font-size: 11.5px; color: var(--muted); font-weight: 600; margin-bottom: 6px;">Tags gợi ý từ BTV:</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                      ${tags.map(t => `
                        <span style="font-size: 11px; background: rgba(184, 147, 79, 0.1); color: #8F7239; border: 1px solid rgba(184, 147, 79, 0.25); padding: 2px 7px; border-radius: 10px; font-weight: 600;">
                          #${escapeHTML(t.name)}
                        </span>
                      `).join("")}
                    </div>
                  </div>
                ` : ""}

              </div>

            </div>
          </div>

          <!-- Modal Footer -->
          <div class="admin-modal-footer" style="padding: 14px 24px; border-top: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <div>
              <button type="button" class="topic-btn-action admin-btn--secondary" onclick="closeTopicDetailModal()" style="padding: 8px 18px; border-radius: 6px; cursor: pointer; background: #ECEFF1; color: var(--ink); border: 1px solid #CFD8DC;">
                ✕ Đóng
              </button>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
              ${modalActionBtns}
            </div>
          </div>

        </div>
      </div>
    `;
  };

  /**
   * Đóng Modal Chi tiết Đề tài
   */
  window.closeTopicDetailModal = function () {
    const modalMount = document.getElementById("topic-detail-modal-container");
    if (modalMount) modalMount.innerHTML = "";
  };

  /**
   * Gắn sự kiện tương tác
   */
  function attachEventListeners() {
    // Chuyển Tab trạng thái
    document.addEventListener("click", (e) => {
      const tabBtn = e.target.closest(".admin-tab-btn");
      if (tabBtn && tabBtn.dataset.status) {
        currentFilterStatus = tabBtn.dataset.status;
        renderFilterBar();
        renderTopicsList();
      }
    });
  }

  /**
   * Chuyển tab lọc nhanh từ click card KPI
   */
  window.setTopicFilter = function (status) {
    currentFilterStatus = status;
    renderFilterBar();
    renderTopicsList();
  };

  /**
   * Helper định dạng Ngày & Giờ: HH:MM DD/MM/YYYY
   */
  function formatDateTime(str) {
    if (!str) return "--";
    try {
      const d = new Date(String(str).replace(" ", "T"));
      if (isNaN(d.getTime())) return str;
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${min} ${dd}/${mm}/${yyyy}`;
    } catch (e) {
      return str;
    }
  }

  function formatDate(str) {
    if (!str) return "--";
    try {
      const d = new Date(String(str).replace(" ", "T"));
      if (isNaN(d.getTime())) return str;
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${min} ${dd}/${mm}/${yyyy}`;
    } catch (e) {
      return str;
    }
  }

  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Cung cấp API reload nếu cần
  window.reloadReporterTopics = function () {
    loadData();
    renderFilterBar();
    renderTopicsList();
  };

})();
