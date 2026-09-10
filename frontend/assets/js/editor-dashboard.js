/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/editor-dashboard.js
 * PHÂN HỆ: Bảng điều khiển Biên tập viên (Editor Dashboard Module)
 * MÔ TẢ: Thống kê & trực quan hóa số liệu toàn tòa soạn cho Biên tập viên:
 *        1. Tải số liệu từ backend/api/editor/dashboard.php (category_stats, reporter_stats, top_tags).
 *        2. Bảng theo dõi năng suất phóng viên (bài đã đăng, tổng lượt xem, bài đang chờ duyệt).
 *        3. Biểu đồ Cột nhóm (Grouped Bar Chart qua Chart.js): tương quan giữa lượt view và số bài theo chuyên mục.
 *        4. Biểu đồ Cột ngang (Horizontal Bar Chart qua Chart.js): Top 10 thẻ tag có bài viết nhiều nhất.
 * PHẠM VI SỬ DỤNG:
 *   - frontend/editor/dashboard.html
 * PHỤ THUỘC:
 *   - Chart.js (thư viện biểu đồ)
 *   - frontend/assets/js/admin-layout.js
 *   - frontend/assets/js/common.js (resolveApiUrl, etc.)
 *   - backend/api/editor/dashboard.php
 * ==============================================================================
 */

(function () {
  "use strict";

  // ==============================================================================
  // KHỐI 1: KHỞI TẠO BẢNG ĐIỀU KHIỂN & LƯU TRỮ INSTANCE BIỂU ĐỒ
  // ==============================================================================
  // Biến lưu trữ biểu đồ để hủy (destroy) khi re-render
  let categoryChartInstance = null;
  let topTagsChartInstance = null;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initEditorDashboard();
    });
  } else {
    initEditorDashboard();
  }

  window.initEditorDashboard = initEditorDashboard;

  async function initEditorDashboard() {
    let data = {
      category_stats: [],
      reporter_stats: [],
      top_tags: []
    };

    try {
      const res = await fetch(resolveApiUrl("editor/dashboard.php"), {
        credentials: "include"
      });
      const result = await res.json();
      if (result.success && result.data) {
        data = result.data;
      }
    } catch (err) {
      console.error("Lỗi khi tải số liệu Dashboard Biên tập viên:", err);
    }

    // 1. Render Bảng theo dõi năng suất phóng viên
    renderReporterSection(data.reporter_stats || []);

    // 2. Vẽ 2 biểu đồ trực quan (Chart.js)
    initCategoryChart(data.category_stats || []);
    initTopTagsChart(data.top_tags || []);
  }

  // ==============================================================================
  // KHỐI 2: BẢNG THEO DÕI HIỆU SUẤT & NĂNG SUẤT PHÓNG VIÊN
  // ==============================================================================
  function renderReporterSection(reporterStats) {
    const tbody = document.getElementById("reporter-table-body");
    if (!tbody) return;

    if (!reporterStats || reporterStats.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="padding:20px; color:var(--muted);">Chưa có phóng viên nào trong ban.</td></tr>`;
      return;
    }

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
          ${(rep.totalViews || 0).toLocaleString("vi-VN")}
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

  // ==============================================================================
  // KHỐI 3: BIỂU ĐỒ CỘT NHÓM (GROUPED BAR CHART) - TƯƠNG QUAN LƯỢT XEM VÀ BÀI VIẾT
  // ==============================================================================
  function initCategoryChart(catStats) {
    const canvas = document.getElementById("categoryChart");
    if (!canvas || typeof Chart === "undefined") return;

    if (categoryChartInstance) {
      categoryChartInstance.destroy();
    }

    if (!catStats || catStats.length === 0) {
      const parent = canvas.parentElement;
      if (parent) {
        parent.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; min-height: 240px; color: var(--muted); font-size: 13px; font-style: italic; background: #FCFAF6; border-radius: 6px; border: 1px dashed var(--line-soft); text-align: center; padding: 20px;">Chưa có dữ liệu chuyên mục.</div>`;
      }
      return;
    }

    const labels = catStats.map((c) => c.name);
    const views = catStats.map((c) => c.totalViews || 0);
    const articleCounts = catStats.map((c) => c.articleCount || 0);

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

  // ==============================================================================
  // KHỐI 4: BIỂU ĐỒ CỘT NGANG (HORIZONTAL BAR CHART) - TOP 10 THẺ TAG
  // ==============================================================================
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

  // ==============================================================================
  // KHỐI 5: HÀM HỖ TRỢ XỬ LÝ CHUỖI AN TOÀN (HELPER FUNCTIONS)
  // ==============================================================================
  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
