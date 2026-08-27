/**
 * editor-topics.js - Quản lý Phân công đề tài cho Ban Biên tập
 * Quy chuẩn nghiệp vụ:
 * 1. BẮT BUỘC chọn đúng 1 Chuyên mục khi Editor tạo đề tài.
 * 2. Gắn tối đa 5 Thẻ Tag gợi ý cho phóng viên (không bắt buộc).
 * 3. Phân công cho Phóng viên cụ thể, đặt hạn chót nộp bài (Deadline).
 * 4. Theo dõi trực quan tiến độ: Đã giao / Đang làm, Quá hạn, Đã nộp bài, Đã duyệt hoàn thành.
 */

(function () {
  "use strict";

  let allTopics = [];
  let allCategories = [];
  let allUsers = [];
  let allArticles = [];
  let allTopicTags = [];
  let allTags = [];
  let currentUser = null;

  let currentStatusFilter = "all";
  let currentSearchQuery = "";
  let currentCategoryFilter = "all";
  let currentReporterFilter = "all";

  let modalSelectedTags = [];

  document.addEventListener("DOMContentLoaded", () => {
    initEditorTopicsPage();
  });

  window.initEditorTopicsPage = initEditorTopicsPage;

  function initEditorTopicsPage() {
    currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    loadData();
    renderLayout();
    renderPageHeaderStats();
    renderTopicsList();
    attachEventListeners();
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
    allTopics = fetchTable("topics");
    allCategories = fetchTable("categories");
    allUsers = fetchTable("users");
    allArticles = fetchTable("articles");
    allTopicTags = fetchTable("topic_tags");
    allTags = fetchTable("tags");
  }

  /**
   * Tính trạng thái thực tế của đề tài
   */
  function computeTopicStatus(topic) {
    const refNow = getRefTime().getTime();
    const deadlineTime = topic.deadline ? new Date(topic.deadline).getTime() : 0;

    const linkedArticle = allArticles.find((a) => String(a.topic_id) === String(topic.id));

    if (linkedArticle) {
      if (linkedArticle.status === "published" || topic.status === "approved" || topic.status === "completed") {
        return "completed";
      }
      if (linkedArticle.status === "pending") {
        return "submitted";
      }
      if (linkedArticle.status === "draft" || linkedArticle.status === "rejected") {
        if (deadlineTime > 0 && deadlineTime < refNow) {
          return "overdue";
        }
        return "assigned";
      }
    }

    if (topic.status === "submitted") {
      if (linkedArticle && (linkedArticle.status === "draft" || linkedArticle.status === "rejected")) {
        if (deadlineTime > 0 && deadlineTime < refNow) {
          return "overdue";
        }
        return "assigned";
      }
      return "submitted";
    }
    if (topic.status === "approved" || topic.status === "completed") return "completed";

    if (topic.status === "assigned" || topic.status === "in_progress" || topic.status === "overdue") {
      if (deadlineTime > 0 && deadlineTime < refNow) {
        return "overdue";
      }
      return "assigned";
    }

    return topic.status || "assigned";
  }

  /**
   * Danh sách đề tài đã chuẩn hóa
   */
  function getEnrichedTopics() {
    return allTopics.map((topic) => {
      const actualStatus = computeTopicStatus(topic);
      const category = allCategories.find((c) => String(c.id) === String(topic.category_id)) || {
        id: 0,
        name: "Thời sự",
        slug: "thoi-su",
      };

      const reporter = allUsers.find((u) => String(u.id) === String(topic.reporter_id || topic.assigned_to)) || {
        id: 0,
        full_name: "Chưa phân công",
        username: "unassigned",
      };

      const editor = allUsers.find((u) => String(u.id) === String(topic.editor_id || topic.assigned_by)) || {
        id: 0,
        full_name: "Ban Biên tập",
        username: "editor",
      };

      const tagIds = allTopicTags.filter((tt) => String(tt.topic_id) === String(topic.id)).map((tt) => tt.tag_id);
      const tags = allTags.filter((t) => tagIds.includes(t.id));

      const linkedArticle = allArticles.find((a) => String(a.topic_id) === String(topic.id));

      return {
        ...topic,
        actualStatus,
        category,
        reporter,
        editor,
        tags,
        linkedArticle,
      };
    });
  }

  /**
   * Render bộ khung giao diện
   */
  function renderLayout() {
    const container = document.getElementById("workspace-content");
    if (!container) return;

    const reporters = allUsers.filter((u) => u.role === "reporter" && u.status !== "locked");

    container.innerHTML = `
      <!-- Thanh Công cụ: Nút tạo mới, Bộ lọc và Tìm kiếm -->
      <div class="admin-card" style="padding: 16px 20px; margin-bottom: 20px;">
        <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between;">
          
          <!-- Nhóm Tìm kiếm & Lọc nhanh -->
          <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center; flex: 1; min-width: 280px;">
            <input 
              type="text" 
              id="search-topics" 
              class="admin-form-input" 
              placeholder="Tìm kiếm theo tiêu đề hoặc nội dung đề tài..." 
              style="max-width: 320px; font-size: 13px; padding: 7px 12px;"
            >

            <!-- Lọc Chuyên mục -->
            <select id="filter-category" class="admin-form-select" style="max-width: 170px; font-size: 12.5px; padding: 7px 10px;">
              <option value="all">Tất cả Chuyên mục</option>
              ${allCategories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}
            </select>

            <!-- Lọc Phóng viên -->
            <select id="filter-reporter" class="admin-form-select" style="max-width: 170px; font-size: 12.5px; padding: 7px 10px;">
              <option value="all">Tất cả Phóng viên</option>
              ${reporters.map((r) => `<option value="${r.id}">${escapeHtml(r.full_name || r.username)}</option>`).join("")}
            </select>
          </div>

          <!-- Nút Tạo đề tài mới -->
          <div>
            <button type="button" class="admin-btn admin-btn--primary" id="btn-open-create-topic" style="background: #1B2A4A; color: #FFF; font-weight: 600; font-size: 13px; padding: 8px 18px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;">
              <span>+ Giao đề tài mới</span>
            </button>
          </div>

        </div>

        <!-- Thanh Tabs Trạng thái -->
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--line-soft);" id="topic-tabs-mount">
          <!-- Render dynamically -->
        </div>
      </div>

      <!-- Danh sách đề tài -->
      <div id="topic-list-mount">
        <!-- Render cards -->
      </div>

      <!-- MODAL TẠO / SỬA ĐỀ TÀI -->
      <div id="modal-topic" style="display: none; position: fixed; inset: 0; z-index: 1050; background: rgba(19, 27, 46, 0.65); backdrop-filter: blur(3px); align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
        <div class="admin-modal-container" style="max-width: 600px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; background: #FFF; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid var(--line-soft);">
          <div class="admin-modal-header" style="padding: 16px 22px; border-bottom: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <h3 id="modal-topic-title" style="margin: 0; font-size: 16px; font-weight: 700; color: var(--ink);">Giao đề tài mới cho Phóng viên</h3>
            <button type="button" class="btn-close-topic-modal" style="background: none; border: none; font-size: 22px; cursor: pointer; color: var(--muted); line-height: 1;">&times;</button>
          </div>

          <div class="admin-modal-body" style="padding: 22px; overflow-y: auto;">
            <input type="hidden" id="modal-topic-id" value="">

            <!-- Tiêu đề đề tài (Không bắt buộc) -->
            <div class="admin-form-group" style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label class="admin-form-label" style="font-weight: 700; font-size: 13px; margin: 0;">Tiêu đề đề tài gợi ý:</label>
                <span style="font-size: 11.5px; color: var(--muted); font-style: italic;">(Không bắt buộc đặt trước)</span>
              </div>
              <input type="text" id="modal-topic-name" class="admin-form-input" placeholder="Ví dụ: Phóng sự điều tra ô nhiễm nguồn nước sông Đáy... (để trống nếu để phóng viên tự đặt)">
              <div style="font-size: 11.5px; color: var(--muted); margin-top: 3px;">Nếu để trống tiêu đề, hệ thống sẽ tự động đặt theo định hướng và chuyên mục để phóng viên tự phát triển.</div>
            </div>

            <!-- Định hướng & Yêu cầu từ BTV (BẮT BUỘC) -->
            <div class="admin-form-group" style="margin-bottom: 16px;">
              <label class="admin-form-label" style="font-weight: 700; font-size: 13px;">
                Định hướng nội dung & Yêu cầu của BTV <span style="color:red;">*</span>:
              </label>
              <textarea 
                id="modal-topic-desc" 
                class="admin-form-textarea" 
                rows="4" 
                placeholder="Biên tập viên ghi rõ các yêu cầu bắt buộc: góc nhìn tiếp cận, phỏng vấn nhân chứng, số liệu khảo sát, chụp ảnh hiện trường..."
                required
                style="border-color: rgba(184, 147, 79, 0.5); background: #FFFCF7;"
              ></textarea>
              <div style="font-size: 11.5px; color: #854D0E; margin-top: 3px; font-weight: 500;">
                Bắt buộc: BTV phải ghi rõ định hướng chi tiết để phóng viên nắm vững đề bài khi tác nghiệp.
              </div>
            </div>

            <!-- Chuyên mục bắt buộc -->
            <div class="admin-form-group" style="margin-bottom: 16px;">
              <label class="admin-form-label" style="font-weight: 700; font-size: 13px;">Chuyên mục bài viết <span style="color:red;">*</span> (Bắt buộc 1 mục):</label>
              <select id="modal-topic-category" class="admin-form-select" required>
                <option value="">-- Chọn 1 Chuyên mục --</option>
                ${allCategories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("")}
              </select>
            </div>

            <!-- Phóng viên & Deadline -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
              <div class="admin-form-group">
                <label class="admin-form-label" style="font-weight: 700; font-size: 13px;">Phóng viên thực hiện <span style="color:red;">*</span>:</label>
                <select id="modal-topic-reporter" class="admin-form-select" required>
                  <option value="">-- Chọn Phóng viên --</option>
                  ${reporters.map((r) => `<option value="${r.id}">${escapeHtml(r.full_name || r.username)} (@${escapeHtml(r.username)})</option>`).join("")}
                </select>
              </div>

              <div class="admin-form-group">
                <label class="admin-form-label" style="font-weight: 700; font-size: 13px;">Hạn chót nộp bài (Deadline):</label>
                <input type="date" id="modal-topic-deadline" class="admin-form-input" value="2026-08-20">
              </div>
            </div>

            <!-- Thẻ Tag gợi ý (Tối đa 5 thẻ) -->
            <div class="admin-form-group" style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <label class="admin-form-label" style="font-weight: 700; font-size: 13px; margin: 0;">Thẻ Tag gợi ý:</label>
                <span id="modal-topic-tag-count" style="font-size: 11.5px; font-family: var(--f-mono); color: var(--muted); font-weight: 600;">0/5 thẻ</span>
              </div>
              <div class="admin-tags-input-container" id="modal-topic-tags-box" style="min-height: 40px; padding: 6px 8px; background: #FFF; border: 1px solid var(--line-soft); border-radius: 6px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; cursor: text;">
                <div id="modal-topic-selected-tags-mount" style="display: contents;"></div>
                <input 
                  type="text" 
                  id="modal-topic-tag-input" 
                  class="admin-tag-text-input" 
                  placeholder="Nhập tag rồi Enter (tối đa 5)..."
                  style="border: none; outline: none; font-size: 12px; min-width: 140px; flex: 1; padding: 2px 4px;"
                >
              </div>
              <div style="font-size: 11.5px; color: var(--muted); margin-top: 4px;">Phóng viên có thể dùng các thẻ này hoặc tạo thêm thẻ mới khi viết bài.</div>
            </div>
          </div>

          <div class="admin-modal-footer" style="padding: 14px 22px; border-top: 1px solid var(--line-soft); display: flex; justify-content: flex-end; gap: 10px; background: #FAF8F5; flex-shrink: 0;">
            <button type="button" class="admin-btn admin-btn--secondary btn-close-topic-modal">Hủy</button>
            <button type="button" class="admin-btn admin-btn--primary" id="btn-save-topic" style="background: #1B2A4A; color: #FFF;">Giao đề tài</button>
          </div>
        </div>
      </div>

      <!-- CONTAINER MODAL XEM CHI TIẾT ĐỀ TÀI PHÂN CÔNG -->
      <div id="editor-topic-detail-modal-container"></div>
    `;
  }

  /**
   * Render Thanh Tabs Trạng thái
   */
  function renderPageHeaderStats() {
    const topics = getEnrichedTopics();

    const totalCount = topics.length;
    const assignedCount = topics.filter((t) => t.actualStatus === "assigned").length;
    const overdueCount = topics.filter((t) => t.actualStatus === "overdue").length;
    const submittedCount = topics.filter((t) => t.actualStatus === "submitted").length;
    const completedCount = topics.filter((t) => t.actualStatus === "completed").length;

    // Render Tabs
    const tabsMount = document.getElementById("topic-tabs-mount");
    if (tabsMount) {
      tabsMount.innerHTML = `
        <button type="button" class="admin-tab-btn ${currentStatusFilter === "all" ? "active" : ""}" data-status="all">
          Tất cả <span class="tab-badge">${totalCount}</span>
        </button>
        <button type="button" class="admin-tab-btn ${currentStatusFilter === "assigned" ? "active" : ""}" data-status="assigned">
          Đang làm <span class="tab-badge" style="background:#E3F2FD; color:#1565C0;">${assignedCount}</span>
        </button>
        <button type="button" class="admin-tab-btn ${currentStatusFilter === "overdue" ? "active" : ""}" data-status="overdue">
          Quá hạn <span class="tab-badge" style="background:#FFEBEE; color:#C62828;">${overdueCount}</span>
        </button>
        <button type="button" class="admin-tab-btn ${currentStatusFilter === "submitted" ? "active" : ""}" data-status="submitted">
          Đã nộp bài <span class="tab-badge" style="background:#FFF3E0; color:#E65100;">${submittedCount}</span>
        </button>
        <button type="button" class="admin-tab-btn ${currentStatusFilter === "completed" ? "active" : ""}" data-status="completed">
          Hoàn thành <span class="tab-badge" style="background:#E8F5E9; color:#2E7D32;">${completedCount}</span>
        </button>
      `;
    }
  }

  /**
   * Render Danh sách Đề tài
   */
  function renderTopicsList() {
    const listMount = document.getElementById("topic-list-mount");
    if (!listMount) return;

    let topics = getEnrichedTopics();

    // 1. Lọc theo trạng thái tab
    if (currentStatusFilter !== "all") {
      topics = topics.filter((t) => t.actualStatus === currentStatusFilter);
    }

    // 2. Lọc theo chuyên mục
    if (currentCategoryFilter !== "all") {
      topics = topics.filter((t) => String(t.category_id) === String(currentCategoryFilter));
    }

    // 3. Lọc theo phóng viên
    if (currentReporterFilter !== "all") {
      topics = topics.filter((t) => String(t.reporter_id || t.assigned_to) === String(currentReporterFilter));
    }

    // 4. Tìm kiếm từ khóa
    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      topics = topics.filter(
        (t) =>
          (t.title || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          (t.reporter.full_name || "").toLowerCase().includes(q)
      );
    }

    // Sắp xếp: Hạn chót tăng dần
    topics.sort((a, b) => {
      const tA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const tB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return tA - tB;
    });

    if (topics.length === 0) {
      listMount.innerHTML = `
        <div class="admin-card" style="padding: 40px 24px; text-align: center; background: #FCFAF6;">
          <h3 style="font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 4px;">Không tìm thấy đề tài nào</h3>
          <p style="font-size: 13px; color: var(--muted); margin: 0;">
            Thử thay đổi bộ lọc hoặc bấm "Giao đề tài mới" để tạo phân công cho phóng viên.
          </p>
        </div>
      `;
      return;
    }

    const refNow = getRefTime().getTime();

    listMount.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${topics.map((topic) => renderTopicItem(topic, refNow)).join("")}
      </div>
    `;
  }

  /**
   * Render 1 đề tài item
   */
  function renderTopicItem(topic, refNow) {
    const { actualStatus, category, reporter, tags, linkedArticle } = topic;

    let statusBadge = "";
    let actionButtons = "";
    let deadlineWarning = "";
    let deadlineColor = "var(--ink)";

    const deadlineTime = topic.deadline ? new Date(topic.deadline).getTime() : 0;
    const hoursLeft = deadlineTime > 0 ? (deadlineTime - refNow) / (1000 * 60 * 60) : 0;

    const deadlineFormatted = formatDateTime(topic.deadline);
    const createdFormatted = formatDateTime(topic.created_at);

    // Ngày giờ nộp bài (nếu đã nộp)
    const submittedTime = topic.submitted_at || (linkedArticle ? (linkedArticle.created_at || linkedArticle.updated_at) : null);
    const submittedFormatted = submittedTime ? formatDateTime(submittedTime) : null;

    if (actualStatus === "assigned") {
      statusBadge = `<span class="admin-badge" style="background: #E3F2FD; color: #1565C0; border: 1px solid #BBDEFB; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11.5px;">Đang thực hiện</span>`;
      if (hoursLeft > 0 && hoursLeft <= 24) {
        deadlineWarning = `<span style="font-size: 11.5px; color: #E65100; font-weight: 700; background: #FFF3E0; border: 1px solid #FFE0B2; padding: 2px 8px; border-radius: 12px;">Sắp hết hạn (${Math.round(hoursLeft)}h)</span>`;
        deadlineColor = "#E65100";
      }
    } else if (actualStatus === "overdue") {
      statusBadge = `<span class="admin-badge" style="background: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11.5px;">Quá hạn</span>`;
      deadlineWarning = `<span style="font-size: 11.5px; color: #C62828; font-weight: 700; background: #FFEBEE; border: 1px solid #FFCDD2; padding: 2px 8px; border-radius: 12px;">Quá hạn</span>`;
      deadlineColor = "#C62828";
    } else if (actualStatus === "submitted") {
      statusBadge = `<span class="admin-badge" style="background: #FFF3E0; color: #E65100; border: 1px solid #FFE0B2; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11.5px;">Đã nộp bài</span>`;
    } else if (actualStatus === "completed") {
      statusBadge = `<span class="admin-badge" style="background: #E8F5E9; color: #2E7D32; border: 1px solid #C8E6C9; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11.5px;">Hoàn thành</span>`;
    }

    // Nút hành động
    if (linkedArticle) {
      if (actualStatus === "submitted") {
        actionButtons = `
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" class="admin-btn admin-btn--secondary" onclick="window.openEditorTopicDetailModal(${topic.id})" style="font-size: 12px; padding: 6px 12px; cursor: pointer;">
              Chi tiết
            </button>
            <a href="pending-articles.html?id=${linkedArticle.id}" class="admin-btn admin-btn--primary" style="font-size: 12px; padding: 6px 14px; background: #854D0E; color:#FFF; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
              <span>Duyệt bài ngay</span>
            </a>
          </div>
        `;
      } else if (actualStatus === "completed") {
        actionButtons = `
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" class="admin-btn admin-btn--secondary" onclick="window.openEditorTopicDetailModal(${topic.id})" style="font-size: 12px; padding: 6px 12px; cursor: pointer;">
              Chi tiết
            </button>
            <a href="../public/article-detail.html?id=${linkedArticle.id}" target="_blank" class="admin-btn admin-btn--secondary" style="font-size: 12px; padding: 6px 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
              <span>Xem bài đăng</span>
            </a>
          </div>
        `;
      }
    } else {
      actionButtons = `
        <div style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="admin-btn admin-btn--secondary" onclick="window.openEditorTopicDetailModal(${topic.id})" style="font-size: 11.5px; padding: 5px 10px; cursor: pointer;">
            Chi tiết
          </button>
          <button type="button" class="btn-edit-topic admin-btn admin-btn--secondary" data-id="${topic.id}" style="font-size: 11.5px; padding: 5px 10px;">
            Sửa
          </button>
          <button type="button" class="btn-delete-topic admin-btn admin-btn--danger" data-id="${topic.id}" data-title="${escapeHtml(topic.title)}" style="font-size: 11.5px; padding: 5px 10px; background: #FEE2E2; color: #DC2626; border: 1px solid #FECACA;">
            Hủy
          </button>
        </div>
      `;
    }

    return `
      <div class="topic-card-item" style="background: #FFF; border: 1px solid var(--line-soft); border-radius: 8px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 12px;">
          
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
              <span class="admin-category-pill" style="background: rgba(184, 147, 79, 0.12); color: #8F7239; border: 1px solid rgba(184, 147, 79, 0.3); font-size: 11.5px; font-weight: 600; padding: 2px 10px; border-radius: 12px;">
                ${escapeHtml(category.name)}
              </span>
              ${statusBadge}
              ${deadlineWarning}
            </div>

            <h3 style="font-size: 16px; font-weight: 700; color: var(--ink); line-height: 1.4; margin: 0 0 8px; cursor: pointer;" onclick="window.openEditorTopicDetailModal(${topic.id})" title="Bấm để xem chi tiết đề tài">
              ${escapeHtml(topic.title)}
            </h3>

            <div style="font-size: 13px; color: var(--ink-soft); line-height: 1.55; background: #FCFAF6; padding: 10px 14px; border-radius: 6px; border-left: 3px solid var(--brass); margin-bottom: 8px;">
              <strong style="color: var(--ink); font-size: 11px; text-transform: uppercase;">Định hướng:</strong> 
              ${escapeHtml(topic.description || "Không có ghi chú thêm.")}
            </div>
          </div>

          <div style="white-space: nowrap;">
            ${actionButtons}
          </div>

        </div>

        <!-- Tags gợi ý nếu có -->
        ${
          tags && tags.length > 0
            ? `
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--line-soft);">
            <span style="font-size: 11.5px; color: var(--muted); font-weight: 600;">Tags:</span>
            ${tags
              .map(
                (t) => `
              <span class="admin-badge" style="background: rgba(19, 27, 46, 0.05); color: var(--ink-soft); font-size: 11px; border-radius: 4px; padding: 1px 7px;">
                #${escapeHtml(t.name)}
              </span>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }

        <!-- Footer thông tin Phóng viên, Ngày nộp & Deadline -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--line-soft); font-size: 12px; color: var(--muted);">
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span>Giao cho: <strong style="color: var(--ink);">${escapeHtml(reporter.full_name || reporter.username)}</strong> (@${escapeHtml(reporter.username)})</span>
            <span>•</span>
            <span>Ngày giao: ${createdFormatted}</span>
            ${submittedFormatted && (actualStatus === "submitted" || actualStatus === "completed") ? `
              <span>•</span>
              <span style="color: #2E7D32; font-weight: 500;">
                Ngày nộp: <strong style="color: #1B5E20; font-family: var(--f-mono); font-weight: 600;">${submittedFormatted}</strong>
              </span>
            ` : ""}
          </div>

          <div>
            <span>Hạn nộp: <strong style="color: ${deadlineColor}; font-family: var(--f-mono);">${deadlineFormatted}</strong></span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Modal Tag handling
   */
  function renderModalTags() {
    const mount = document.getElementById("modal-topic-selected-tags-mount");
    const countBadge = document.getElementById("modal-topic-tag-count");
    if (countBadge) {
      countBadge.textContent = `${modalSelectedTags.length}/5 thẻ`;
      countBadge.style.color = modalSelectedTags.length === 5 ? "#E65100" : "var(--muted)";
    }
    if (!mount) return;

    mount.innerHTML = modalSelectedTags
      .map(
        (t) => `
      <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(184, 147, 79, 0.15); border: 1px solid rgba(184, 147, 79, 0.35); color: #8F7239; font-weight: 600; font-size: 11.5px; padding: 2px 8px; border-radius: 12px;">
        #${escapeHtml(t)}
        <button type="button" class="btn-remove-topic-modal-tag" data-tag="${escapeHtml(t)}" style="background: none; border: none; cursor: pointer; color: #8F7239; font-size: 12px; line-height: 1; padding: 0;">&times;</button>
      </span>
    `
      )
      .join("");
  }

  function addModalTag(tagName) {
    const trimmed = tagName.trim().replace(/^#/, "");
    if (!trimmed) return;
    if (modalSelectedTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;

    if (modalSelectedTags.length >= 5) {
      if (typeof showToast === "function") showToast("Mỗi đề tài chỉ được gắn tối đa 5 thẻ tag!", "warning");
      return;
    }

    modalSelectedTags.push(trimmed);
    renderModalTags();
  }

  function removeModalTag(tagName) {
    modalSelectedTags = modalSelectedTags.filter((t) => t.toLowerCase() !== tagName.toLowerCase());
    renderModalTags();
  }

  /**
   * Gắn sự kiện
   */
  function attachEventListeners() {
    // 1. Tìm kiếm & Lọc
    const searchInput = document.getElementById("search-topics");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        currentSearchQuery = (e.target.value || "").trim();
        renderTopicsList();
      });
    }

    const catSelect = document.getElementById("filter-category");
    if (catSelect) {
      catSelect.addEventListener("change", (e) => {
        currentCategoryFilter = e.target.value;
        renderTopicsList();
      });
    }

    const repSelect = document.getElementById("filter-reporter");
    if (repSelect) {
      repSelect.addEventListener("change", (e) => {
        currentReporterFilter = e.target.value;
        renderTopicsList();
      });
    }

    // 2. Chuyển Tab trạng thái
    document.addEventListener("click", (e) => {
      const tabBtn = e.target.closest(".admin-tab-btn");
      if (tabBtn && tabBtn.dataset.status) {
        currentStatusFilter = tabBtn.dataset.status;
        renderPageHeaderStats();
        renderTopicsList();
      }
    });

    // 3. Mở modal tạo đề tài mới
    const btnOpenCreate = document.getElementById("btn-open-create-topic");
    if (btnOpenCreate) {
      btnOpenCreate.addEventListener("click", () => {
        document.getElementById("modal-topic-id").value = "";
        document.getElementById("modal-topic-name").value = "";
        document.getElementById("modal-topic-category").value = "";
        document.getElementById("modal-topic-reporter").value = "";
        document.getElementById("modal-topic-deadline").value = "2026-08-20";
        document.getElementById("modal-topic-desc").value = "";
        document.getElementById("modal-topic-title").textContent = "Giao đề tài mới cho Phóng viên";
        modalSelectedTags = [];
        renderModalTags();
        document.getElementById("modal-topic").style.display = "flex";
      });
    }

    // 4. Đóng modal
    document.addEventListener("click", (e) => {
      const closeBtn = e.target.closest(".btn-close-topic-modal");
      if (closeBtn) {
        document.getElementById("modal-topic").style.display = "none";
      }
    });

    // 5. Thêm/Xóa tag trong modal
    const tagInput = document.getElementById("modal-topic-tag-input");
    if (tagInput) {
      tagInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          const val = tagInput.value.trim().replace(/,/g, "");
          if (val) {
            addModalTag(val);
            tagInput.value = "";
          }
        }
      });
    }

    document.addEventListener("click", (e) => {
      const removeTagBtn = e.target.closest(".btn-remove-topic-modal-tag");
      if (removeTagBtn && removeTagBtn.dataset.tag) {
        removeModalTag(removeTagBtn.dataset.tag);
      }
    });

    // 6. Lưu đề tài
    const btnSaveTopic = document.getElementById("btn-save-topic");
    if (btnSaveTopic) {
      btnSaveTopic.addEventListener("click", handleSaveTopic);
    }

    // 7. Sửa đề tài
    document.addEventListener("click", (e) => {
      const btnEdit = e.target.closest(".btn-edit-topic");
      if (btnEdit) {
        const topicId = btnEdit.dataset.id;
        window.openEditTopicModal(topicId);
      }
    });

    // 8. Hủy/Xóa đề tài
    document.addEventListener("click", (e) => {
      const btnDel = e.target.closest(".btn-delete-topic");
      if (btnDel) {
        const topicId = btnDel.dataset.id;
        const topicTitle = btnDel.dataset.title;
        handleDeleteTopic(topicId, topicTitle);
      }
    });
  }

  window.openEditTopicModal = function (topicId) {
    const topic = allTopics.find((t) => String(t.id) === String(topicId));
    if (topic) {
      document.getElementById("modal-topic-id").value = topic.id;
      document.getElementById("modal-topic-name").value = topic.title || "";
      document.getElementById("modal-topic-category").value = topic.category_id || "";
      document.getElementById("modal-topic-reporter").value = topic.reporter_id || topic.assigned_to || "";
      document.getElementById("modal-topic-deadline").value = topic.deadline ? topic.deadline.substring(0, 10) : "";
      document.getElementById("modal-topic-desc").value = topic.description || "";
      document.getElementById("modal-topic-title").textContent = `Chỉnh sửa Đề tài: "${topic.title}"`;

      const tagIds = allTopicTags.filter((tt) => String(tt.topic_id) === String(topic.id)).map((tt) => tt.tag_id);
      modalSelectedTags = allTags.filter((t) => tagIds.includes(t.id)).map((t) => t.name);
      renderModalTags();

      document.getElementById("modal-topic").style.display = "flex";
    }
  };

  /**
   * MỞ MODAL XEM CHI TIẾT ĐỀ TÀI PHÂN CÔNG (DÀNH CHO BIÊN TẬP VIÊN)
   */
  window.openEditorTopicDetailModal = function (topicId) {
    const enrichedTopics = getEnrichedTopics();
    const topic = enrichedTopics.find((t) => Number(t.id) === Number(topicId));
    if (!topic) {
      if (typeof showToast === "function") showToast("Không tìm thấy thông tin đề tài", "warning");
      return;
    }

    const { actualStatus, category, reporter, editor, tags, linkedArticle } = topic;
    const refNow = getRefTime().getTime();
    const deadlineTime = topic.deadline ? new Date(topic.deadline).getTime() : 0;
    const isOverdue = deadlineTime > 0 && deadlineTime < refNow;
    const deadlineFormatted = formatDateTime(topic.deadline);
    const createdFormatted = formatDateTime(topic.created_at);

    // Xác định trạng thái bài viết & lý do từ chối nếu có
    let articleStatusBadge = "";
    let articleRejectionBanner = "";

    if (linkedArticle) {
      if (linkedArticle.status === "rejected") {
        articleStatusBadge = `<span class="admin-badge" style="background: #FFEBEE; color: #C62828; border: 1px solid #FFCDD2; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11px;">Bị từ chối / Cần sửa</span>`;
        const rejectReason = linkedArticle.reject_reason || linkedArticle.rejection_reason || "Chưa có ghi chú lý do cụ thể.";
        
        articleRejectionBanner = `
          <div style="background: #FFEBEE; border: 1.5px solid #FFCDD2; border-left: 4px solid #DC2626; border-radius: 6px; padding: 12px 14px; margin-top: 10px;">
            <div style="color: #C62828; font-weight: 700; font-size: 11.5px; text-transform: uppercase; margin-bottom: 3px;">
              Lý do từ chối từ Ban Biên tập:
            </div>
            <div style="font-size: 13px; color: #B71C1C; line-height: 1.5; font-weight: 500;">
              ${escapeHtml(rejectReason)}
            </div>
          </div>
        `;
      } else if (linkedArticle.status === "pending") {
        articleStatusBadge = `<span class="admin-badge" style="background: #FFF3E0; color: #E65100; border: 1px solid #FFE0B2; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11px;">Đang chờ duyệt</span>`;
      } else if (linkedArticle.status === "published") {
        articleStatusBadge = `<span class="admin-badge" style="background: #E8F5E9; color: #2E7D32; border: 1px solid #C8E6C9; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11px;">Đã xuất bản</span>`;
      } else if (linkedArticle.status === "draft") {
        articleStatusBadge = `<span class="admin-badge" style="background: #ECEFF1; color: #546E7A; border: 1px solid #CFD8DC; font-weight: 700; padding: 3px 10px; border-radius: 12px; font-size: 11px;">Bản nháp</span>`;
      }
    }

    // Các nút hành động dưới modal
    let modalActionBtns = "";
    if (linkedArticle && actualStatus === "submitted") {
      modalActionBtns = `
        <a href="pending-articles.html?id=${linkedArticle.id}" class="admin-btn admin-btn--primary" style="background: #854D0E; color: #FFF; font-weight: 700; padding: 9px 20px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          Duyệt bài ngay
        </a>
      `;
    } else if (linkedArticle && actualStatus === "completed") {
      modalActionBtns = `
        <a href="../public/article-detail.html?id=${linkedArticle.id}" target="_blank" class="admin-btn admin-btn--primary" style="background: #2E7D32; color: #FFF; font-weight: 700; padding: 9px 20px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          Xem bài viết trên báo
        </a>
      `;
    } else if (!linkedArticle) {
      modalActionBtns = `
        <button type="button" class="admin-btn admin-btn--secondary" onclick="window.closeEditorTopicDetailModal(); window.openEditTopicModal(${topic.id});" style="font-weight: 600; padding: 9px 18px; border-radius: 6px; cursor: pointer;">
          Sửa đề tài
        </button>
      `;
    }

    const modalMount = document.getElementById("editor-topic-detail-modal-container");
    if (!modalMount) return;

    modalMount.innerHTML = `
      <div id="editor-topic-detail-modal" style="display: flex; position: fixed; inset: 0; z-index: 1050; background: rgba(19, 27, 46, 0.65); backdrop-filter: blur(3px); align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
        <div class="admin-modal-container" style="max-width: 900px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; background: #FFF; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid var(--line-soft);">
          
          <!-- Modal Header -->
          <div class="admin-modal-header" style="padding: 16px 24px; border-bottom: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--ink);">Chi tiết Đề tài phân công</h3>
                <span class="admin-category-pill" style="background: rgba(184, 147, 79, 0.12); color: #8F7239; border: 1px solid rgba(184, 147, 79, 0.3); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px;">${escapeHtml(category.name)}</span>
              </div>
              <p style="margin: 0; font-size: 12px; color: var(--muted);">Xem định hướng tác nghiệp từ Biên tập viên và tiến độ thực hiện bài viết.</p>
            </div>
            <button type="button" onclick="window.closeEditorTopicDetailModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--muted); line-height: 1; padding: 4px;">&times;</button>
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
                    ${escapeHtml(topic.title)}
                  </div>
                </div>

                <!-- Định hướng chi tiết từ BTV -->
                <div>
                  <div style="font-size: 11px; font-weight: 700; color: #8F7239; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
                    Yêu cầu & Định hướng từ Biên tập viên:
                  </div>
                  <div style="font-size: 13.5px; line-height: 1.65; color: #3E3B32; padding: 14px 16px; background: #FFFDF9; border: 1px solid #F3DFC1; border-left: 4px solid var(--brass); border-radius: 6px;">
                    ${escapeHtml(topic.description || "Biên tập viên không để lại ghi chú thêm. Phóng viên triển khai tác nghiệp theo đúng quy chuẩn tòa soạn.")}
                  </div>
                </div>

                <!-- Khối thông tin Bài viết liên kết thực hiện đề tài -->
                <div style="border: 1px solid var(--line-soft); border-radius: 6px; padding: 14px 16px; background: #FAF8F5;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; font-weight: 700; color: var(--ink); text-transform: uppercase;">Tiến độ bài viết liên kết</span>
                    ${articleStatusBadge}
                  </div>

                  ${linkedArticle ? `
                    <div style="font-weight: 700; font-size: 14px; color: var(--ink); margin-bottom: 4px;">
                      ${escapeHtml(linkedArticle.title || "Chưa đặt tiêu đề")}
                    </div>
                    <div style="font-size: 12.5px; color: var(--ink-soft); line-height: 1.5; font-style: italic;">
                      ${escapeHtml(linkedArticle.sapo || linkedArticle.short_description || "Đã tạo bài viết thực hiện đề tài.")}
                    </div>
                    ${articleRejectionBanner}
                  ` : `
                    <div style="font-size: 13px; color: var(--muted); font-style: italic; line-height: 1.5;">
                      Phóng viên chưa nộp bài viết cho đề tài này. Hệ thống sẽ tự động liên kết bài viết khi phóng viên gửi duyệt bài.
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
                      <div style="font-size: 11px; color: var(--muted); font-family: var(--f-mono);">${createdFormatted} (BTV ${escapeHtml(editor.full_name || editor.username)})</div>
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

                <!-- Phóng viên phụ trách -->
                <div style="border-top: 1px dashed var(--line-soft); padding-top: 12px; font-size: 12px;">
                  <div style="color: var(--muted); margin-bottom: 2px;">Phóng viên thực hiện:</div>
                  <div style="font-weight: 700; color: var(--ink); font-size: 13px;">
                    ${escapeHtml(reporter.full_name || reporter.username)} <span style="font-weight: 400; color: var(--muted); font-size: 12px;">(@${escapeHtml(reporter.username)})</span>
                  </div>
                </div>

                <!-- Hạn chót Deadline -->
                <div style="border-top: 1px dashed var(--line-soft); padding-top: 12px; font-size: 12px;">
                  <div style="color: var(--muted); margin-bottom: 2px;">Hạn chót nộp bài:</div>
                  <div style="font-family: var(--f-mono); font-weight: 700; font-size: 13.5px; color: ${isOverdue ? '#C62828' : 'var(--ink)'};">
                    ${deadlineFormatted} ${isOverdue ? '(Đã quá hạn)' : ''}
                  </div>
                </div>

                <!-- Tags gợi ý -->
                ${tags && tags.length > 0 ? `
                  <div style="border-top: 1px dashed var(--line-soft); padding-top: 12px;">
                    <div style="font-size: 11.5px; color: var(--muted); font-weight: 600; margin-bottom: 6px;">Tags gợi ý từ BTV:</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                      ${tags.map((t) => `
                        <span style="font-size: 11px; background: rgba(184, 147, 79, 0.1); color: #8F7239; border: 1px solid rgba(184, 147, 79, 0.25); padding: 2px 7px; border-radius: 10px; font-weight: 600;">
                          #${escapeHtml(t.name)}
                        </span>
                      `).join("")}
                    </div>
                  </div>
                ` : ""}

              </div>

            </div>
          </div>

          <!-- Modal Footer -->
          <div class="admin-modal-footer" style="padding: 14px 24px; border-top: 1px solid var(--line-soft); background: #FAF8F5; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
            <button type="button" class="admin-btn admin-btn--secondary" onclick="window.closeEditorTopicDetailModal()" style="font-weight: 600; padding: 8px 18px; border-radius: 6px; cursor: pointer;">
              ✕ Đóng
            </button>
            <div style="display: flex; gap: 8px; align-items: center;">
              ${modalActionBtns}
            </div>
          </div>

        </div>
      </div>
    `;
  };

  window.closeEditorTopicDetailModal = function () {
    const modalMount = document.getElementById("editor-topic-detail-modal-container");
    if (modalMount) modalMount.innerHTML = "";
  };

  /**
   * Lưu / Cập nhật Đề tài
   */
  function handleSaveTopic() {
    const idVal = document.getElementById("modal-topic-id").value;
    const titleVal = document.getElementById("modal-topic-name").value.trim();
    const categoryVal = document.getElementById("modal-topic-category").value;
    const reporterVal = document.getElementById("modal-topic-reporter").value;
    const deadlineVal = document.getElementById("modal-topic-deadline").value;
    const descVal = document.getElementById("modal-topic-desc").value.trim();

    // Kiểm tra Định hướng & Yêu cầu từ BTV (BẮT BUỘC)
    if (!descVal) {
      if (typeof showToast === "function") showToast("Biên tập viên bắt buộc phải ghi rõ Định hướng & Yêu cầu đề tài!", "warning");
      document.getElementById("modal-topic-desc").focus();
      return;
    }

    if (!categoryVal) {
      if (typeof showToast === "function") showToast("Bắt buộc chọn 1 Chuyên mục cho đề tài!", "warning");
      document.getElementById("modal-topic-category").focus();
      return;
    }

    if (!reporterVal) {
      if (typeof showToast === "function") showToast("Vui lòng chọn Phóng viên thực hiện!", "warning");
      document.getElementById("modal-topic-reporter").focus();
      return;
    }

    // Nếu Editor không đặt tiêu đề trước, tự động đặt tiêu đề theo chuyên mục và định hướng gợi mở
    let finalTitle = titleVal;
    if (!finalTitle) {
      const selectedCat = allCategories.find((c) => String(c.id) === String(categoryVal));
      const catName = selectedCat ? selectedCat.name : "Thời sự";
      const shortDesc = descVal.length > 50 ? descVal.substring(0, 47) + "..." : descVal;
      finalTitle = `[${catName}] ${shortDesc}`;
    }

    const refNow = getRefTime();
    const nowIso = refNow.toISOString().replace("T", " ").substring(0, 19);
    const deadlineIso = deadlineVal ? `${deadlineVal} 23:59:59` : nowIso;

    let topics = fetchTable("topics");
    let allTags = fetchTable("tags");
    let topicTags = fetchTable("topic_tags");

    // Xử lý các Tags (tối đa 5 thẻ)
    const tagIdsForThisTopic = [];
    modalSelectedTags.forEach((tagName) => {
      let found = allTags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
      if (!found) {
        const newTagId = allTags.length > 0 ? Math.max(...allTags.map((t) => t.id || 0)) + 1 : 1;
        found = {
          id: newTagId,
          name: tagName,
          slug: typeof slugify === "function" ? slugify(tagName) : tagName.toLowerCase().replace(/\s+/g, "-"),
          created_at: nowIso,
        };
        allTags.push(found);
      }
      tagIdsForThisTopic.push(found.id);
    });

    let targetTopicId = idVal ? Number(idVal) : null;

    if (idVal) {
      // SỬA ĐỀ TÀI
      const idx = topics.findIndex((t) => String(t.id) === String(idVal));
      if (idx !== -1) {
        topics[idx].title = finalTitle;
        topics[idx].category_id = Number(categoryVal);
        topics[idx].reporter_id = Number(reporterVal);
        topics[idx].assigned_to = Number(reporterVal);
        topics[idx].deadline = deadlineIso;
        topics[idx].description = descVal;
        topics[idx].updated_at = nowIso;
      }
      if (typeof showToast === "function") showToast(`Đã cập nhật đề tài "${finalTitle}" thành công!`, "success");
    } else {
      // TẠO MỚI ĐỀ TÀI
      targetTopicId = topics.length > 0 ? Math.max(...topics.map((t) => t.id || 0)) + 1 : 1;
      topics.unshift({
        id: targetTopicId,
        title: finalTitle,
        category_id: Number(categoryVal),
        reporter_id: Number(reporterVal),
        assigned_to: Number(reporterVal),
        editor_id: currentUser ? currentUser.id : 7,
        assigned_by: currentUser ? currentUser.id : 7,
        deadline: deadlineIso,
        description: descVal,
        status: "assigned",
        created_at: nowIso,
        updated_at: nowIso,
      });

      if (typeof showToast === "function") showToast(`Đã giao đề tài mới cho phóng viên thành công!`, "success");
    }

    // Cập nhật topic_tags
    topicTags = topicTags.filter((tt) => String(tt.topic_id) !== String(targetTopicId));
    tagIdsForThisTopic.forEach((tagId) => {
      topicTags.push({ topic_id: targetTopicId, tag_id: tagId });
    });

    saveTableData("topics", topics);
    saveTableData("tags", allTags);
    saveTableData("topic_tags", topicTags);

    document.getElementById("modal-topic").style.display = "none";
    loadData();
    renderPageHeaderStats();
    renderTopicsList();
  }

  /**
   * Hủy / Xóa đề tài
   */
  function handleDeleteTopic(topicId, topicTitle) {
    if (!confirm(`Bạn có chắc chắn muốn hủy và xóa đề tài "${topicTitle}"?`)) return;

    let topics = fetchTable("topics");
    let topicTags = fetchTable("topic_tags");

    topics = topics.filter((t) => String(t.id) !== String(topicId));
    topicTags = topicTags.filter((tt) => String(tt.topic_id) !== String(topicId));

    saveTableData("topics", topics);
    saveTableData("topic_tags", topicTags);

    if (typeof showToast === "function") showToast(`Đã hủy đề tài "${topicTitle}" thành công!`, "info");
    loadData();
    renderPageHeaderStats();
    renderTopicsList();
  }

  window.setEditorTopicFilter = function (status) {
    currentStatusFilter = status;
    renderPageHeaderStats();
    renderTopicsList();
  };

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
