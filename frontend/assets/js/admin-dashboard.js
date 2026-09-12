/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/admin-dashboard.js
 * PHÂN HỆ: Tổng quan Giám sát Hệ thống Quản trị viên (Admin Dashboard Module)
 * MÔ TẢ: Thu thập dữ liệu và biểu diễn các chỉ số KPI toàn hệ thống:
 *        1. Tải dữ liệu tổng hợp trực tiếp từ API backend/api/admin/dashboard.php (Server-Side Aggregation tối ưu hóa).
 *        2. Render lưới thẻ chỉ số KPI tổng quan đồng bộ chuẩn Editorial: Tổng tài khoản (phân tách 4 vai trò admin,
 *           editor, reporter, user), tổng bài viết xuất bản/ẩn, tổng lượt xem, bình quân lượt xem và tổng bình luận.
 *        3. Biểu đồ Chart.js: Xu hướng bài đăng & lượt xem 7 ngày gần nhất; Cơ cấu bài viết theo chuyên mục.
 *        4. Bảng Top 5 bài viết có lượt xem cao nhất và Bảng Năng suất Phóng viên (số bài xuất bản, tổng view).
 * PHẠM VI SỬ DỤNG:
 *   - frontend/admin/dashboard.html
 * PHỤ THUỘC:
 *   - Chart.js (thư viện biểu đồ)
 *   - frontend/assets/js/common.js (resolveApiUrl, escapeHtml, extractThumbnail, renderTableCoverThumb, getArticleDetailUrl)
 *   - backend/api/admin/dashboard.php
 * ==============================================================================
 */

(function () {
  "use strict";

  // Sử dụng escapeHtml từ common.js (hoặc fallback an toàn nếu common.js chưa tải)
  const safeEscapeHtml = typeof escapeHtml === "function" ? escapeHtml : function (str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // ==============================================================================
  // KHỐI 1: KHỞI TẠO DASHBOARD & TẢI DỮ LIỆU TỔNG HỢP QUA API (SERVER-SIDE)
  // ==============================================================================
  let trendChartInstance = null;
  let categoryChartInstance = null;

  document.addEventListener("DOMContentLoaded", () => {
    initAdminDashboard();
  });

  async function initAdminDashboard() {
    const container = document.getElementById("workspace-content");
    if (!container) return;

    try {
      // Gọi API chuyên dụng của Admin Dashboard (Toàn bộ số liệu đã được Server MySQL tổng hợp)
      const res = await fetch(resolveApiUrl('admin/dashboard.php')).then(r => r.json());

      if (!res || !res.success || !res.data) {
        throw new Error(res?.message || "Không thể tải dữ liệu thống kê.");
      }

      const { kpi, trend, category_share, top_articles, reporter_stats } = res.data;

      // 1. Render khung bố cục 4 thẻ chỉ số KPI
      renderDashboardLayout(container, kpi);

      // 2. Khởi tạo Biểu đồ Xu hướng 7 ngày (Line/Bar kết hợp)
      initTrendChart(trend);

      // 3. Khởi tạo Biểu đồ Cơ cấu Chuyên mục (Doughnut)
      initCategoryShareChart(category_share);

      // 4. Render Bảng Top 5 bài viết xem nhiều nhất
      renderTopArticles(top_articles);

      // 5. Render Bảng Năng suất Phóng viên
      renderTopReporters(reporter_stats);

    } catch (err) {
      container.innerHTML = `
        <div style="padding: 32px; text-align: center; color: var(--muted); background: var(--surface); border: 1px solid var(--border); border-radius: 8px;">
          <p style="margin-bottom: 8px; font-weight: 600; color: #C62828;">Không tải được dữ liệu thống kê hệ thống</p>
          <p style="font-size: 13px;">${safeEscapeHtml(err.message || "Vui lòng kiểm tra lại kết nối cơ sở dữ liệu.")}</p>
        </div>
      `;
    }
  }

  // ==============================================================================
  // KHỐI 2: RENDER KHUNG BỐ CỤC DASHBOARD & CÁC THẺ CHỈ SỐ KPI TỔNG QUAN
  // ==============================================================================
  /**
   * Render HTML giao diện đồng bộ class với hệ thống admin-layout.css
   */
  function renderDashboardLayout(container, kpi) {
    const safeKpi = kpi || {};
    const totalUsers = Number(safeKpi.totalUsers) || 0;
    const adminCount = Number(safeKpi.adminCount) || 0;
    const editorCount = Number(safeKpi.editorCount) || 0;
    const reporterCount = Number(safeKpi.reporterCount) || 0;
    const readerCount = Number(safeKpi.readerCount) || 0;
    const totalViews = Number(safeKpi.totalViews) || 0;
    const avgViewsPerArticle = Number(safeKpi.avgViewsPerArticle) || 0;
    const publishedCount = Number(safeKpi.publishedCount) || 0;
    const hiddenCount = Number(safeKpi.hiddenCount) || 0;
    const totalPublishedAndHidden = Number(safeKpi.totalPublishedAndHidden) || (publishedCount + hiddenCount);
    const totalComments = Number(safeKpi.totalComments) || 0;
    const activeCommentsCount = Number(safeKpi.activeCommentsCount) || totalComments;

    container.innerHTML = `
      <!-- TẦNG 1: 4 THẺ CHỈ SỐ KPI TỔNG QUAN (ADMIN STATS GRID ĐỒNG BỘ) -->
      <div class="admin-stats-grid">
        
        <!-- KPI 1: TỔNG TÀI KHOẢN (NÊU ĐẦY ĐỦ 4 VAI TRÒ) -->
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon-wrap admin-stat-card__icon-wrap--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="admin-stat-card__content">
            <div class="admin-stat-card__label">Tổng tài khoản</div>
            <div class="admin-stat-card__value">${totalUsers}</div>
            <div style="font-size: 11.5px; color: var(--muted); margin-top: 4px; line-height: 1.4;">
              ${adminCount} Quản trị · ${editorCount} BTV · ${reporterCount} Phóng viên · ${readerCount} Độc giả
            </div>
          </div>
        </div>

        <!-- KPI 2: TỔNG LƯỢT XEM -->
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon-wrap admin-stat-card__icon-wrap--views">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </div>
          <div class="admin-stat-card__content">
            <div class="admin-stat-card__label">Tổng lượt xem</div>
            <div class="admin-stat-card__value">${totalViews.toLocaleString("vi-VN")}</div>
            <div style="font-size: 11.5px; color: var(--muted); margin-top: 4px;">
              Bình quân: ~${avgViewsPerArticle.toLocaleString("vi-VN")} lượt / bài
            </div>
          </div>
        </div>

        <!-- KPI 3: BÀI ĐÃ XUẤT BẢN (SO ĐÃ ĐĂNG VỚI ĐÃ ẨN) -->
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
            <div class="admin-stat-card__label">Bài đã xuất bản</div>
            <div class="admin-stat-card__value">
              ${publishedCount} / ${totalPublishedAndHidden} <span style="font-size: 13px; font-weight: normal; color: var(--muted);">bài</span>
            </div>
            <div style="font-size: 11.5px; color: var(--muted); margin-top: 4px;">
              ${publishedCount} đang hiển thị · <span style="color: ${hiddenCount > 0 ? '#C62828' : 'inherit'}; font-weight: ${hiddenCount > 0 ? '600' : 'normal'};">${hiddenCount} đã ẩn</span>
            </div>
          </div>
        </div>

        <!-- KPI 4: TỔNG BÌNH LUẬN TOÀN HỆ THỐNG -->
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon-wrap admin-stat-card__icon-wrap--comments">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div class="admin-stat-card__content">
            <div class="admin-stat-card__label">Tổng bình luận</div>
            <div class="admin-stat-card__value">${totalComments}</div>
            <div style="font-size: 11.5px; color: var(--muted); margin-top: 4px;">
              ${activeCommentsCount} bình luận của độc giả
            </div>
          </div>
        </div>

      </div>

      <!-- TẦNG 2: 2 BIỂU ĐỒ TRỰC QUAN (ĐỒNG BỘ KHUNG CARD VỚI EDITOR DASHBOARD) -->
      <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 24px; margin-bottom: 24px; align-items: stretch;">
        
        <!-- BIỂU ĐỒ 1: XU HƯỚNG 7 NGÀY QUA -->
        <div class="admin-card" style="display: flex; flex-direction: column;">
          <div class="admin-card__header">
            <div class="admin-card__title-group">
              <h2 class="admin-card__title">Xu hướng bài xuất bản & Lượt xem</h2>
              <span class="admin-badge" style="background: rgba(184, 147, 79, 0.12); color: #8F7239; border: 1px solid rgba(184, 147, 79, 0.3); font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 600;">7 ngày qua</span>
            </div>
            <p style="font-size: 12.5px; color: var(--muted); margin: 0;">Tương quan giữa số bài đăng và lưu lượng độc giả truy cập</p>
          </div>
          <div style="padding: 20px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <div style="position: relative; height: 280px; width: 100%;">
              <canvas id="trendChart"></canvas>
            </div>
          </div>
        </div>

        <!-- BIỂU ĐỒ 2: CƠ CẤU CHUYÊN MỤC -->
        <div class="admin-card" style="display: flex; flex-direction: column;">
          <div class="admin-card__header">
            <div class="admin-card__title-group">
              <h2 class="admin-card__title">Cơ cấu bài theo Chuyên mục</h2>
              <span class="admin-badge" style="background: rgba(19, 27, 46, 0.06); color: var(--ink-soft); font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 600;">Tỷ trọng</span>
            </div>
            <p style="font-size: 12.5px; color: var(--muted); margin: 0;">Phân bổ khối lượng bài viết xuất bản theo lĩnh vực</p>
          </div>
          <div style="padding: 20px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <div style="position: relative; height: 280px; width: 100%;">
              <canvas id="categoryShareChart"></canvas>
            </div>
          </div>
        </div>

      </div>

      <!-- TẦNG 3: 2 KHỐI BẢNG TOP (TOP BÀI VIẾT & NĂNG SUẤT PHÓNG VIÊN) -->
      <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 24px; align-items: stretch;">
        
        <!-- BẢNG 1: TOP 5 BÀI VIẾT LƯỢT XEM CAO NHẤT -->
        <div class="admin-card" style="display: flex; flex-direction: column;">
          <div class="admin-card__header">
            <div class="admin-card__title-group">
              <h2 class="admin-card__title">Top bài viết xem nhiều nhất</h2>
              <span class="admin-card__count-badge" id="top-articles-badge">Top 5</span>
            </div>
            <a href="published-articles.html" style="font-size: 12.5px; font-weight: 600; color: #8F7239; text-decoration: none;">Xem tất cả bài đã đăng &rarr;</a>
          </div>
          
          <div class="admin-table-responsive" style="flex: 1;">
            <table class="admin-table">
              <thead>
                <tr>
                  <th style="min-width: 280px;">Bài viết</th>
                  <th>Chuyên mục</th>
                  <th>Tác giả</th>
                  <th style="text-align: right;">Lượt xem</th>
                </tr>
              </thead>
              <tbody id="top-articles-tbody">
                <!-- Render từ JS -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- BẢNG 2: NĂNG SUẤT PHÓNG VIÊN -->
        <div class="admin-card" style="display: flex; flex-direction: column;">
          <div class="admin-card__header">
            <div class="admin-card__title-group">
              <h2 class="admin-card__title">Năng suất Phóng viên</h2>
              <span class="admin-badge" style="background: rgba(46, 125, 50, 0.1); color: #2E7D32; border: 1px solid rgba(46, 125, 50, 0.25); font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 600;">Ban Phóng viên</span>
            </div>
          </div>

          <div class="admin-table-responsive" style="flex: 1;">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Phóng viên</th>
                  <th style="text-align: right;">Đã đăng</th>
                  <th style="text-align: right;">Tổng view</th>
                </tr>
              </thead>
              <tbody id="top-reporters-tbody">
                <!-- Render từ JS -->
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  // ==============================================================================
  // KHỐI 3: KHỞI TẠO BIỂU ĐỒ TRỰC QUAN CHART.JS (XU HƯỚNG & CƠ CẤU CHUYÊN MỤC)
  // ==============================================================================
  /**
   * Khởi tạo Biểu đồ Xu hướng 7 ngày qua (Chart.js) từ dữ liệu đã tổng hợp của Server
   */
  function initTrendChart(trend) {
    const ctx = document.getElementById("trendChart");
    if (!ctx || typeof Chart === "undefined") return;

    const labels = (trend && Array.isArray(trend.labels)) ? trend.labels : [];
    const articleCounts = (trend && Array.isArray(trend.articleCounts)) ? trend.articleCounts : [];
    const viewCounts = (trend && Array.isArray(trend.viewCounts)) ? trend.viewCounts : [];

    if (trendChartInstance) {
      trendChartInstance.destroy();
    }

    trendChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            type: "line",
            label: "Lượt xem",
            data: viewCounts,
            borderColor: "#D97086",
            backgroundColor: "rgba(217, 112, 134, 0.15)",
            borderWidth: 2.5,
            tension: 0.35,
            yAxisID: "y1",
            pointRadius: 4.5,
            pointBackgroundColor: "#D97086",
            pointBorderColor: "#FFFFFF",
            pointBorderWidth: 1.5,
            fill: true
          },
          {
            type: "bar",
            label: "Bài xuất bản",
            data: articleCounts,
            backgroundColor: "rgba(108, 142, 191, 0.85)",
            hoverBackgroundColor: "#6C8EBF",
            borderRadius: 4,
            yAxisID: "y",
            barThickness: 22
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 12,
              font: { family: "var(--f-sans, sans-serif)", size: 12 }
            }
          },
          tooltip: {
            padding: 10,
            cornerRadius: 6
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: "var(--f-sans, sans-serif)", size: 11 } }
          },
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: { display: true, text: "Số bài viết", font: { size: 11, weight: "bold" }, color: "#6C8EBF" },
            ticks: { stepSize: 1, font: { size: 10.5 }, color: "#6C8EBF" }
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            grid: { drawOnChartArea: false },
            title: { display: true, text: "Lượt xem", font: { size: 11, weight: "bold" }, color: "#D97086" },
            ticks: { font: { size: 10.5 }, color: "#D97086" }
          }
        }
      }
    });
  }

  /**
   * Khởi tạo Biểu đồ Cơ cấu Chuyên mục (Chart.js) từ dữ liệu đã tổng hợp của Server
   */
  function initCategoryShareChart(categoryShare) {
    const ctx = document.getElementById("categoryShareChart");
    if (!ctx || typeof Chart === "undefined") return;

    const labels = (categoryShare && Array.isArray(categoryShare.labels)) ? categoryShare.labels : [];
    const dataValues = (categoryShare && Array.isArray(categoryShare.counts)) ? categoryShare.counts : [];

    // Bộ màu Pastel đầm, trang nhã và hài hòa cho chuyên mục
    const chartColors = [
      "#6C8EBF", // Dusty Denim Blue
      "#6EAA8F", // Sage Green Pastel
      "#D4A373", // Warm Sandalwood / Amber Pastel
      "#D97086", // Dusty Rose Pastel
      "#9A8C98", // Vintage Mauve Pastel
      "#E29578", // Terracotta Coral Pastel
      "#588B8B", // Muted Teal Pastel
      "#7F9183"  // Eucalyptus Grey-Green
    ];

    if (categoryChartInstance) {
      categoryChartInstance.destroy();
    }

    categoryChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: chartColors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: "#FFFFFF"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 10,
              padding: 12,
              font: { family: "var(--f-sans, sans-serif)", size: 12 }
            }
          }
        }
      }
    });
  }

  // ==============================================================================
  // KHỐI 4: RENDER BẢNG TOP BÀI VIẾT XEM NHIỀU & BẢNG NĂNG SUẤT PHÓNG VIÊN
  // ==============================================================================
  /**
   * Render Top 5 Bài viết xem nhiều nhất (Đồng bộ với Editor/Reporter table row)
   */
  function renderTopArticles(topArticles) {
    const tbody = document.getElementById("top-articles-tbody");
    if (!tbody) return;

    const list = Array.isArray(topArticles) ? topArticles : [];
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px; color: var(--muted);">Chưa có bài viết xuất bản nào</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((art) => {
      const catName = art.category_name || "Thời sự";
      const authorName = art.author_name || art.author_username || "Phóng viên";
      const views = Number(art.view_count) || 0;

      const coverImg = (typeof extractThumbnail === "function") 
        ? extractThumbnail(art, { name: catName }) 
        : (art.cover_image || "");
      const thumbHtml = (typeof renderTableCoverThumb === "function") 
        ? renderTableCoverThumb(coverImg, art.title) 
        : `<img src="${coverImg}" class="admin-table-thumb" alt="${safeEscapeHtml(art.title)}" />`;
      const detailUrl = (typeof getArticleDetailUrl === "function") 
        ? getArticleDetailUrl(art, "../public/") 
        : `../public/article-detail.html?slug=${encodeURIComponent(art.slug || art.id)}`;

      return `
        <tr>
          <td>
            <div class="admin-article-cell">
              <a href="${detailUrl}" target="_blank" title="Bấm để xem chi tiết bài viết" style="display: block; flex-shrink: 0; text-decoration: none;">
                ${thumbHtml}
              </a>
              <div class="admin-article-info">
                <a href="${detailUrl}" target="_blank" class="admin-article-title-link" title="${safeEscapeHtml(art.title)}">
                  ${safeEscapeHtml(art.title)}
                </a>
                <div class="admin-article-sapo-text">${safeEscapeHtml(art.short_description || "")}</div>
              </div>
            </div>
          </td>
          <td class="admin-col-category">
            <span class="admin-category-pill">${safeEscapeHtml(catName)}</span>
          </td>
          <td>
            <div style="font-size: 13px; font-weight: 600; color: var(--ink);">${safeEscapeHtml(authorName)}</div>
          </td>
          <td class="admin-col-num">
            <div class="admin-num-badge admin-num-badge--views">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>${views.toLocaleString("vi-VN")}</span>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  /**
   * Render Bảng Năng suất Phóng viên (Đồng bộ cột với Editor Dashboard)
   */
  function renderTopReporters(reporterStats) {
    const tbody = document.getElementById("top-reporters-tbody");
    if (!tbody) return;

    const list = Array.isArray(reporterStats) ? reporterStats : [];
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 24px; color: var(--muted);">Chưa có dữ liệu phóng viên</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(rep => {
      const pubCount = Number(rep.publishedCount) || 0;
      const totalViews = Number(rep.totalViews) || 0;
      return `
        <tr>
          <td>
            <div style="display: flex; flex-direction: column;">
              <strong style="font-size: 13px; color: var(--ink);">${safeEscapeHtml(rep.name || rep.username)}</strong>
              <span style="font-size: 11.5px; color: var(--muted); font-family: var(--f-mono);">@${safeEscapeHtml(rep.username)}</span>
            </div>
          </td>
          <td style="text-align: right;">
            <strong style="font-size: 13px; font-family: var(--f-mono); color: var(--ink);">${pubCount}</strong>
          </td>
          <td style="text-align: right;">
            <span style="font-size: 12.5px; font-family: var(--f-mono); font-weight: 600; color: #2563EB;">
              ${totalViews.toLocaleString("vi-VN")}
            </span>
          </td>
        </tr>
      `;
    }).join("");
  }

})();
