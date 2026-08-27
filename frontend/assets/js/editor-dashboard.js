/**
 * editor-dashboard.js - Controller xử lý tính toán & hiển thị số liệu thống kê cho Dashboard Biên tập viên (Editor)
 * Đáp ứng đầy đủ 4 phần:
 * 1. Tương quan Chuyên mục (Bảng số liệu + Biểu đồ Cột nhóm: Tổng lượt view vs Số bài viết)
 * 2. Bảng theo dõi năng suất Phóng viên (Đã đăng, Tổng view, Chờ duyệt, Đề tài đang thực hiện)
 * 3. Xu hướng Thẻ Tag (Biểu đồ 2: Top 10 Tags 7 ngày qua - Cột ngang)
 * 4. Bảng xếp hạng Top 10 Bài viết đã đăng trong 7 ngày qua
 */

(function () {
  "use strict";

  // Biến lưu trữ biểu đồ để hủy (destroy) khi re-render
  let categoryChartInstance = null;
  let topTagsChartInstance = null;

  // Trạng thái sắp xếp & tìm kiếm bảng theo dõi đề tài & hạn chót:
  // sortBy: 'deadline'
  // sortDirection: 'asc' hoặc 'desc'
  let currentSortBy = "deadline";
  let currentSortDirection = "asc";
  let topicsDeadlineData = [];
  let topicsSearchQuery = "";
  let topicsStatusFilter = "all";

  /**
   * Khởi chạy khi trang sẵn sàng
   */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initEditorDashboard();
    });
  } else {
    initEditorDashboard();
  }

  window.initEditorDashboard = initEditorDashboard;

  function initEditorDashboard() {
    // 1. Tính toán & render dữ liệu các bảng
    const catStats = calculateCategoryStats();
    renderReporterSection();
    const topTagsStats = renderTopTagsSection();
    if (document.getElementById("topics-deadline-table")) {
      renderTopicsDeadlineSection();
    }

    // 2. Vẽ 2 biểu đồ trực quan (Chart.js)
    initCategoryChart(catStats);
    initTopTagsChart(topTagsStats);
  }

  /**
   * Helper: Lấy thời gian tham chiếu của hệ thống (đồng bộ qua getSystemTime trong common.js)
   */
  function getLatestReferenceDate() {
    if (typeof getSystemTime === "function") {
      return getSystemTime();
    }
    return new Date("2026-08-14T23:59:59");
  }

  function isWithinLast7Days(dateString, refDate) {
    if (!dateString) return false;
    const itemDate = new Date(String(dateString).replace(" ", "T")).getTime();
    if (isNaN(itemDate)) return false;
    const targetRef = refDate || getLatestReferenceDate();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const refTime = targetRef.getTime();
    // Nằm trong khoảng [refTime - 7 ngày, refTime]
    return itemDate >= (refTime - sevenDaysMs) && itemDate <= refTime;
  }

  /**
   * Helper an toàn để lấy dữ liệu bảng (qua getTable của common.js hoặc MOCK_DATA)
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
   * =========================================================================
   * PHẦN 1: TƯƠNG QUAN CHUYÊN MỤC (TÍNH TOÁN DỮ LIỆU CHO BIỂU ĐỒ)
   * =========================================================================
   */
  function calculateCategoryStats() {
    const categories = fetchTable("categories");
    const articles = fetchTable("articles");

    const catStats = categories.map((cat) => {
      // Đếm bài đã xuất bản thuộc chuyên mục
      const catArticles = articles.filter(
        (a) => String(a.category_id) === String(cat.id) && a.status === "published"
      );
      const articleCount = catArticles.length;
      const totalViews = catArticles.reduce((sum, a) => sum + (Number(a.view_count || a.views) || 0), 0);

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug || "",
        articleCount: articleCount,
        totalViews: totalViews,
      };
    });

    return catStats;
  }

  /**
   * =========================================================================
   * PHẦN 2: BẢNG THEO DÕI NĂNG SUẤT PHÓNG VIÊN
   * Lọc toàn bộ user có role: 'reporter'
   * Cột: Tên & Username Phóng viên (Bỏ Avatar), Bài đã đăng, Tổng view, Chờ duyệt, Đề tài đang thực hiện
   * =========================================================================
   */
  function renderReporterSection() {
    const users = fetchTable("users");
    const articles = fetchTable("articles");
    const topics = fetchTable("topics");

    // Lọc toàn bộ phóng viên
    const reporters = users.filter((u) => u.role === "reporter");

    const reporterStats = reporters.map((rep) => {
      // Các bài viết của phóng viên
      const repArticles = articles.filter(
        (a) => String(a.author_id) === String(rep.id) || (a.author && a.author === rep.full_name)
      );

      const publishedCount = repArticles.filter((a) => a.status === "published").length;
      const pendingCount = repArticles.filter((a) => a.status === "pending").length;
      const totalViews = repArticles
        .filter((a) => a.status === "published")
        .reduce((sum, a) => sum + (Number(a.view_count || a.views) || 0), 0);

      // Đề tài đã làm (trạng thái đã nộp: 'submitted')
      const submittedTopicsCount = topics.filter(
        (t) => (String(t.reporter_id) === String(rep.id) || String(t.assigned_to) === String(rep.id)) &&
               t.status === "submitted"
      ).length;

      return {
        id: rep.id,
        name: rep.full_name || rep.username,
        username: rep.username || (rep.email ? rep.email.split("@")[0] : `reporter${rep.id}`),
        email: rep.email || "",
        publishedCount,
        totalViews,
        pendingCount,
        submittedTopicsCount,
      };
    });

    const tbody = document.getElementById("reporter-table-body");
    if (tbody) {
      if (reporterStats.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:20px; color:var(--muted);">Chưa có phóng viên nào trong ban.</td></tr>`;
      } else {
        tbody.innerHTML = reporterStats
          .map(
            (rep) => `
          <tr>
            <td style="padding: 12px 16px;">
              <div style="font-weight: 700; color: var(--ink); font-size: 13.5px; line-height: 1.3;">
                ${escapeHTML(rep.name)}
              </div>
              <div style="font-size: 11.5px; color: var(--muted); font-family: var(--f-mono); margin-top: 2px;">
                @${escapeHTML(rep.username)}
              </div>
            </td>
            <td style="padding: 12px 14px; text-align: right; font-weight: 600; font-family: var(--f-mono); color: var(--ink); white-space: nowrap;">
              ${rep.publishedCount} <span style="font-size: 11px; color: var(--muted); font-weight: normal;">bài</span>
            </td>
            <td style="padding: 12px 14px; text-align: right; font-weight: 700; font-family: var(--f-mono); color: #8F7239; white-space: nowrap;">
              ${rep.totalViews.toLocaleString("vi-VN")}
            </td>
            <td style="padding: 12px 14px; text-align: center; white-space: nowrap;">
              ${
                rep.pendingCount > 0
                  ? `<span class="admin-badge" style="background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; font-weight: 700; font-family: var(--f-mono); padding: 2px 8px; border-radius: 12px; font-size: 11.5px;">${rep.pendingCount} bài</span>`
                  : `<span style="color: var(--muted); font-size: 12px; font-family: var(--f-mono);">0</span>`
              }
            </td>
            <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">
              ${
                rep.submittedTopicsCount > 0
                  ? `<span class="admin-badge" style="background: rgba(184, 147, 79, 0.15); color: #8F7239; border: 1px solid rgba(184, 147, 79, 0.3); font-weight: 700; font-family: var(--f-mono); padding: 2px 8px; border-radius: 12px; font-size: 11.5px;">${rep.submittedTopicsCount} đề tài</span>`
                  : `<span style="color: var(--muted); font-size: 12px; font-family: var(--f-mono);">0</span>`
              }
            </td>
          </tr>
        `
          )
          .join("");
      }
    }
  }

  /**
   * =========================================================================
   * PHẦN 3: XU HƯỚNG THẺ TAG TOÀN HỆ THỐNG
   * Quét từ quan hệ article_tags và tags để tính tổng số lần mỗi tag được gắn
   * =========================================================================
   */
  function calculateTop10Tags() {
    const articles = fetchTable("articles");
    const articleTags = fetchTable("article_tags");
    const tags = fetchTable("tags");

    // 1. Lọc ID các bài viết đã xuất bản
    const publishedArticles = articles.filter((a) => a.status === "published");
    const publishedArticleIds = publishedArticles.map((a) => a.id);

    if (publishedArticleIds.length === 0) {
      return [];
    }

    // 2. Đếm tần suất mỗi tag_id
    const tagCountMap = {};
    articleTags.forEach((rel) => {
      if (publishedArticleIds.some((id) => String(id) === String(rel.article_id))) {
        tagCountMap[rel.tag_id] = (tagCountMap[rel.tag_id] || 0) + 1;
      }
    });

    // 3. Ghép thông tin và sắp xếp giảm dần, lấy Top 10
    const tagStats = tags
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug || "",
        count: tagCountMap[tag.id] || 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return tagStats;
  }

  function renderTopTagsSection() {
    return calculateTop10Tags();
  }

  /**
   * =========================================================================
   * PHẦN 4: ⏱️ THEO DÕI ĐỀ TÀI & HẠN CHÓT NỘP BÀI (DEADLINES)
   * - Hiển thị danh sách đề tài được phân công, hạn chót và tiến độ thực hiện
   * - Cảnh báo các đề tài sắp tới hạn (trong 24-48h) hoặc đã quá hạn
   * - Hỗ trợ lọc trạng thái, tìm kiếm và liên kết nhanh đến bài nộp/thẩm định
   * =========================================================================
   */
  function renderTopicsDeadlineSection() {
    const topics = fetchTable("topics");
    const categories = fetchTable("categories");
    const users = fetchTable("users");
    const articles = fetchTable("articles");
    const topicTags = fetchTable("topic_tags");
    const tags = fetchTable("tags");

    const refDate = getLatestReferenceDate();
    const nowMs = refDate.getTime();

    topicsDeadlineData = topics.map((t) => {
      const cat = categories.find((c) => String(c.id) === String(t.category_id));
      const reporter = users.find((u) => String(u.id) === String(t.reporter_id));
      
      // Lấy danh sách tag của đề tài
      const currentTopicTagIds = topicTags
        .filter((tt) => String(tt.topic_id) === String(t.id))
        .map((tt) => tt.tag_id);
      const attachedTags = tags.filter((tag) => currentTopicTagIds.includes(tag.id));

      // Lấy bài viết liên quan (nếu phóng viên đã nộp)
      const relArticle = articles.find((a) => String(a.topic_id) === String(t.id));

      // Tính hạn chót
      const deadlineDate = new Date(String(t.deadline).replace(" ", "T"));
      const deadlineMs = deadlineDate.getTime();
      const diffMs = deadlineMs - nowMs;
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let actualStatus = t.status;
      let statusLabel = "Đang thực hiện";
      let statusBadgeClass = "admin-status-badge--pending";
      let deadlineNote = "";

      if (t.status === "submitted") {
        actualStatus = "submitted";
        statusLabel = "Đã nộp bài";
        statusBadgeClass = "admin-status-badge--published";
        deadlineNote = t.submitted_at ? `Đã nộp lúc: ${formatSimpleDate(t.submitted_at)}` : "Đang chờ thẩm định";
      } else if (t.status === "overdue" || nowMs > deadlineMs) {
        actualStatus = "overdue";
        statusLabel = "Quá hạn";
        statusBadgeClass = "admin-status-badge--rejected";
        const overdueDays = Math.max(1, Math.abs(diffDays));
        deadlineNote = `Trễ ${overdueDays} ngày`;
      } else {
        actualStatus = "assigned";
        statusLabel = "Đang làm";
        statusBadgeClass = "admin-status-badge--pending";
        if (diffHours <= 0) {
          deadlineNote = "Hết hạn hôm nay";
        } else if (diffHours <= 24) {
          deadlineNote = `Còn ${diffHours} giờ`;
        } else {
          deadlineNote = `Còn ${diffDays} ngày`;
        }
      }

      return {
        id: t.id,
        title: t.title,
        description: t.description || "",
        categoryName: cat ? cat.name : "Thời sự",
        reporterName: reporter ? reporter.full_name : "Phóng viên",
        reporterAvatar: reporter ? reporter.avatar : "/assets/images/avatar-5.png",
        tags: attachedTags,
        deadline: t.deadline,
        deadlineMs: isNaN(deadlineMs) ? 0 : deadlineMs,
        submitted_at: t.submitted_at,
        actualStatus: actualStatus,
        statusLabel: statusLabel,
        statusBadgeClass: statusBadgeClass,
        deadlineNote: deadlineNote,
        articleId: relArticle ? relArticle.id : null,
        articleTitle: relArticle ? relArticle.title : "",
      };
    });

    // Gắn sự kiện
    attachTopicsDeadlineEvents();

    // Sắp xếp và render
    sortAndRenderTopicsDeadlineTable();
  }

  function formatSimpleDate(dateStr) {
    if (!dateStr) return "--";
    const cleanStr = String(dateStr).replace("T", " ");
    const parts = cleanStr.substring(0, 16).split(" ");
    if (parts.length >= 2) {
      const d = parts[0].split("-");
      const time = parts[1];
      if (d.length === 3) {
        return `${time} ${d[2]}/${d[1]}`;
      }
    }
    return cleanStr;
  }

  function attachTopicsDeadlineEvents() {
    const searchInput = document.getElementById("topics-deadline-search");
    if (searchInput && !searchInput.dataset.hasListener) {
      searchInput.dataset.hasListener = "true";
      searchInput.addEventListener("input", (e) => {
        topicsSearchQuery = (e.target.value || "").trim();
        sortAndRenderTopicsDeadlineTable();
      });
    }

    const statusFilter = document.getElementById("topics-status-filter");
    if (statusFilter && !statusFilter.dataset.hasListener) {
      statusFilter.dataset.hasListener = "true";
      statusFilter.addEventListener("change", (e) => {
        topicsStatusFilter = e.target.value || "all";
        sortAndRenderTopicsDeadlineTable();
      });
    }

    const thDeadline = document.getElementById("th-sort-deadline");
    if (thDeadline && !thDeadline.dataset.hasListener) {
      thDeadline.dataset.hasListener = "true";
      thDeadline.addEventListener("click", () => {
        currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
        sortAndRenderTopicsDeadlineTable();
      });
    }
  }

  function updateTopicsSortHeaderIcon() {
    const thDeadline = document.getElementById("th-sort-deadline");
    const deadlineIcon = document.getElementById("sort-deadline-icon");

    if (thDeadline && deadlineIcon) {
      thDeadline.classList.add("is-sorted");
      deadlineIcon.innerHTML = currentSortDirection === "asc" ? "▲" : "▼";
    }
  }

  function sortAndRenderTopicsDeadlineTable() {
    updateTopicsSortHeaderIcon();

    // 1. Lọc theo trạng thái và từ khóa tìm kiếm
    let filtered = topicsDeadlineData.filter((item) => {
      if (topicsStatusFilter !== "all" && item.actualStatus !== topicsStatusFilter) {
        return false;
      }
      if (!topicsSearchQuery) return true;
      const q = topicsSearchQuery.toLowerCase();
      const matchTag = item.tags.some((t) => t.name.toLowerCase().includes(q));
      return (
        item.title.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q) ||
        item.reporterName.toLowerCase().includes(q) ||
        matchTag
      );
    });

    // 2. Cập nhật huy hiệu số lượng
    const countBadge = document.getElementById("topics-deadline-count-badge");
    if (countBadge) {
      countBadge.textContent = `${filtered.length} đề tài`;
    }

    // 3. Sắp xếp theo hạn chót (tăng dần: gần hạn/quá hạn lên đầu)
    filtered.sort((a, b) => {
      return currentSortDirection === "asc"
        ? a.deadlineMs - b.deadlineMs
        : b.deadlineMs - a.deadlineMs;
    });

    const tbody = document.getElementById("topics-deadline-body");
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px 20px; color: var(--muted); font-size: 13.5px; font-style: italic;">Không tìm thấy đề tài nào phù hợp.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered
      .map((item, index) => {
        // Format ngày hạn chót DD/MM/YYYY HH:mm
        let deadlineStr = "--";
        if (item.deadline) {
          const parts = String(item.deadline).split(" ");
          if (parts.length >= 2) {
            const datePart = parts[0].split("-");
            if (datePart.length === 3) {
              deadlineStr = `${datePart[2]}/${datePart[1]}/${datePart[0]} <span style="color: var(--muted); font-size: 11.5px;">(${parts[1].substring(0, 5)})</span>`;
            }
          }
        }

        // Tag gợi ý
        const tagsHtml =
          item.tags.length > 0
            ? `<div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 5px;">
                ${item.tags
                  .map(
                    (t) =>
                      `<span style="background: rgba(184, 147, 79, 0.12); color: #8F7239; font-size: 10.5px; padding: 1px 6px; border-radius: 4px; font-weight: 500;">#${escapeHTML(
                        t.name
                      )}</span>`
                  )
                  .join("")}
              </div>`
            : "";

        // Nút hành động
        let actionButtons = "";
        if (item.actualStatus === "submitted" && item.articleId) {
          actionButtons = `
            <a href="pending-articles.html?id=${item.articleId}" class="admin-btn admin-btn--primary" style="font-size: 11.5px; padding: 4px 10px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; background: #1B2A4A; color: #FFF;" title="Thẩm định bài nộp">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>Thẩm định</span>
            </a>
          `;
        } else {
          actionButtons = `
            <a href="topics.html?id=${item.id}" class="admin-btn admin-btn--default" style="font-size: 11.5px; padding: 4px 10px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="Xem chi tiết đề tài">
              <span>Chi tiết</span>
            </a>
          `;
        }

        return `
        <tr>
          <td class="admin-col-index">
            ${index + 1}
          </td>
          <td style="vertical-align: middle;">
            <a href="topics.html?id=${item.id}" style="font-weight: 600; color: var(--ink); text-decoration: none; font-size: 13.5px; line-height: 1.4; display: block;" title="Xem đề tài">
              ${escapeHTML(item.title)}
            </a>
            ${tagsHtml}
          </td>
          <td class="admin-col-category">
            <span class="admin-category-pill">
              ${escapeHTML(item.categoryName)}
            </span>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${item.reporterAvatar}" alt="" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 1px solid var(--line);">
              <span style="font-weight: 500; font-size: 13px; color: var(--ink);">
                ${escapeHTML(item.reporterName)}
              </span>
            </div>
          </td>
          <td class="admin-col-date">
            <div style="font-weight: 600; font-size: 12.5px; color: var(--ink);">
              ${deadlineStr}
            </div>
            <div style="font-size: 11px; margin-top: 2px; color: ${item.actualStatus === "overdue" ? "#DC2626" : item.actualStatus === "submitted" ? "#16A34A" : "#D97706"}; font-weight: 600;">
              ${item.deadlineNote}
            </div>
          </td>
          <td>
            <span class="admin-status-badge ${item.statusBadgeClass}">
              ${item.statusLabel}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            ${actionButtons}
          </td>
        </tr>
      `;
      })
      .join("");
  }

  /**
   * =========================================================================
   * BIỂU ĐỒ 1: GROUPED BAR CHART (CỘT NHÓM) - TƯƠNG QUAN CHUYÊN MỤC
   * Trục X: Tên chuyên mục
   * Trục Y: 2 cột so sánh trực quan bên cạnh nhau:
   *   Cột 1: Tổng lượt view (Vàng đồng cao cấp)
   *   Cột 2: Số lượng bài viết (Mực in Xanh Đen)
   * =========================================================================
   */
  function initCategoryChart(catStats) {
    const canvas = document.getElementById("categoryChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (categoryChartInstance) {
      categoryChartInstance.destroy();
    }

    const labels = catStats.map((c) => c.name);
    const views = catStats.map((c) => c.totalViews);
    const articleCounts = catStats.map((c) => c.articleCount);

    const ctx = canvas.getContext("2d");
    categoryChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Tổng lượt view",
            data: views,
            backgroundColor: "rgba(217, 112, 134, 0.85)", // Dusty Rose Pastel
            hoverBackgroundColor: "#D97086",
            borderColor: "#D97086",
            borderWidth: 1,
            borderRadius: { topLeft: 4, topRight: 4 },
            barPercentage: 0.65,
            categoryPercentage: 0.75,
            yAxisID: "yViews",
          },
          {
            label: "Số bài viết đã xuất bản",
            data: articleCounts,
            backgroundColor: "rgba(108, 142, 191, 0.85)", // Dusty Denim Blue Pastel
            hoverBackgroundColor: "#6C8EBF",
            borderColor: "#6C8EBF",
            borderWidth: 1,
            borderRadius: { topLeft: 4, topRight: 4 },
            barPercentage: 0.65,
            categoryPercentage: 0.75,
            yAxisID: "yArticles",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: "circle",
              font: {
                size: 11.5,
                weight: "600",
              },
              color: "#5C584B",
              padding: 16,
            },
          },
          tooltip: {
            backgroundColor: "#131B2E",
            titleFont: { size: 12.5, weight: "bold" },
            bodyFont: { size: 12 },
            padding: 12,
            cornerRadius: 6,
            boxPadding: 4,
            callbacks: {
              label: function (context) {
                if (context.datasetIndex === 0) {
                  return ` Tổng lượt view: ${context.parsed.y.toLocaleString("vi-VN")} lượt đọc`;
                } else {
                  return ` Số bài viết: ${context.parsed.y} bài xuất bản`;
                }
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: { size: 12, weight: "600" },
              color: "#131B2E",
              padding: 6,
            },
          },
          yViews: {
            type: "linear",
            position: "left",
            beginAtZero: true,
            title: {
              display: true,
              text: "Lượt view tích lũy",
              color: "#D97086",
              font: { size: 11, weight: "bold" },
              padding: 6,
            },
            ticks: {
              font: { size: 10.5 },
              color: "#D97086",
              callback: function (val) {
                return val >= 1000 ? (val / 1000).toFixed(1) + "k" : val;
              },
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
          yArticles: {
            type: "linear",
            position: "right",
            beginAtZero: true,
            title: {
              display: true,
              text: "Số lượng bài viết",
              color: "#6C8EBF",
              font: { size: 11, weight: "bold" },
              padding: 6,
            },
            ticks: {
              stepSize: 1,
              font: { size: 10.5 },
              color: "#6C8EBF",
            },
            grid: {
              drawOnChartArea: false, // Tránh chồng chéo lưới
            },
          },
        },
      },
    });
  }

  /**
   * =========================================================================
   * BIỂU ĐỒ 2: HORIZONTAL BAR CHART (CỘT NGANG) - TOP 10 THẺ TAG (7 NGÀY QUA)
   * Trục Y: Tên 10 thẻ tag
   * Độ dài thanh bar: Số lượng bài viết đã gắn tag đó
   * =========================================================================
   */
  function initTopTagsChart(topTagsStats) {
    const canvas = document.getElementById("topTagsChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (topTagsChartInstance) {
      topTagsChartInstance.destroy();
    }

    if (!topTagsStats || topTagsStats.length === 0) {
      const parent = canvas.parentElement;
      if (parent) {
        parent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 240px; color: var(--muted); font-size: 13px; font-style: italic; background: #FCFAF6; border-radius: 6px; border: 1px dashed var(--line-soft); text-align: center; padding: 20px;">Không có dữ liệu thẻ tag trong 7 ngày gần nhất.</div>`;
      }
      return;
    }

    const labels = topTagsStats.map((t) => t.name);
    const counts = topTagsStats.map((t) => t.count);

    const ctx = canvas.getContext("2d");
    topTagsChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Số bài viết gắn thẻ",
            data: counts,
            backgroundColor: "rgba(110, 170, 143, 0.85)", // Sage Green Pastel đồng nhất
            hoverBackgroundColor: "#5D967B",
            borderColor: "#6EAA8F",
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 13,
          },
        ],
      },
      options: {
        indexAxis: "y", // Cột ngang
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#131B2E",
            titleFont: { size: 12, weight: "bold" },
            bodyFont: { size: 11.5 },
            padding: 8,
            cornerRadius: 6,
            callbacks: {
              label: function (context) {
                return ` Số bài viết: ${context.parsed.x} bài`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { size: 10.5 },
              color: "#5C584B",
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
            title: {
              display: true,
              text: "Số bài viết",
              color: "#5C584B",
              font: { size: 10.5 },
            },
          },
          y: {
            ticks: {
              font: { size: 11.5, weight: "600" },
              color: "#131B2E",
            },
            grid: {
              display: false,
            },
          },
        },
      },
    });
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

  // Export hàm logic để tái sử dụng nếu cần
  window.editorDashboardLogic = {
    getCategoryStats: calculateCategoryStats,
    getTopTagsStats: calculateTop10Tags7Days,
  };
})();
