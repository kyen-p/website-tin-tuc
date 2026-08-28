/**
 * editor-dashboard.js - Controller xử lý tính toán & hiển thị số liệu thống kê cho Dashboard Biên tập viên (Editor)
 * 1. Tương quan Chuyên mục (Biểu đồ Cột nhóm: Tổng lượt view vs Số bài viết)
 * 2. Bảng theo dõi năng suất Phóng viên (Đã đăng, Tổng view, Chờ duyệt)
 * 3. Xu hướng Thẻ Tag (Biểu đồ Cột ngang: Top 10 Thẻ Tag)
 */

(function () {
  "use strict";

  // Biến lưu trữ biểu đồ để hủy (destroy) khi re-render
  let categoryChartInstance = null;
  let topTagsChartInstance = null;

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
   * Cột: Tên & Username Phóng viên, Bài đã đăng, Tổng view, Chờ duyệt
   * =========================================================================
   */
  function renderReporterSection() {
    const users = fetchTable("users");
    const articles = fetchTable("articles");

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

      return {
        id: rep.id,
        name: rep.full_name || rep.username,
        username: rep.username || (rep.email ? rep.email.split("@")[0] : `reporter${rep.id}`),
        email: rep.email || "",
        publishedCount,
        totalViews,
        pendingCount,
      };
    });

    const tbody = document.getElementById("reporter-table-body");
    if (tbody) {
      if (reporterStats.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding:20px; color:var(--muted);">Chưa có phóng viên nào trong ban.</td></tr>`;
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
            <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">
              ${
                rep.pendingCount > 0
                  ? `<span class="admin-badge" style="background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; font-weight: 700; font-family: var(--f-mono); padding: 2px 8px; border-radius: 12px; font-size: 11.5px;">${rep.pendingCount} bài</span>`
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
              drawOnChartArea: false,
            },
          },
        },
      },
    });
  }

  /**
   * =========================================================================
   * BIỂU ĐỒ 2: HORIZONTAL BAR CHART (CỘT NGANG) - TOP 10 THẺ TAG
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
        parent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 240px; color: var(--muted); font-size: 13px; font-style: italic; background: #FCFAF6; border-radius: 6px; border: 1px dashed var(--line-soft); text-align: center; padding: 20px;">Không có dữ liệu thẻ tag.</div>`;
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
            backgroundColor: "rgba(110, 170, 143, 0.85)",
            hoverBackgroundColor: "#5D967B",
            borderColor: "#6EAA8F",
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 13,
          },
        ],
      },
      options: {
        indexAxis: "y",
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

  window.editorDashboardLogic = {
    getCategoryStats: calculateCategoryStats,
    getTopTagsStats: calculateTop10Tags,
  };
})();
