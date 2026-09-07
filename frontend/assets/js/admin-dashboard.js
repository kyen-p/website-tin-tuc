/**
 * ==============================================================================
 * ADMIN DASHBOARD - GIÁM SÁT HỆ THỐNG TOÀN DIỆN
 * Đồng bộ 100% Layout & Visual Language với Editor/Reporter Dashboard
 * ==============================================================================
 */

(function () {
  "use strict";

  let trendChartInstance = null;
  let categoryChartInstance = null;

  document.addEventListener("DOMContentLoaded", () => {
    initAdminDashboard();
  });

  async function initAdminDashboard() {
    const container = document.getElementById("workspace-content");
    if (!container) return;

    try {
      const [usersRes, articlesRes, categoriesRes, commentsRes] = await Promise.all([
        fetch(resolveApiUrl('admin/users.php')).then(r => r.json()),
        fetch(resolveApiUrl('admin/published-articles.php')).then(r => r.json()),
        fetch(resolveApiUrl('public/categories.php')).then(r => r.json()),
        fetch(resolveApiUrl('admin/comments.php')).then(r => r.json())
      ]);

      const users = usersRes.data || [];
      const articles = articlesRes.data || [];
      const categories = categoriesRes.data || [];
      const comments = commentsRes.data || [];

      const kpiData = calculateKPI(users, articles, comments);
      renderDashboardLayout(container, kpiData);
      initTrendChart(articles, categories);
      initCategoryShareChart(articles, categories);
      renderTopArticles(articles, categories, users);
      renderTopReporters(articles, users);
    } catch (err) {
      container.innerHTML = `<p>Không tải được dữ liệu thống kê.</p>`;
    }
  }

  /**
   * Tính toán các chỉ số KPI
   */
  function calculateKPI(users, articles, comments) {
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === "admin").length;
    const editorCount = users.filter(u => u.role === "editor").length;
    const reporterCount = users.filter(u => u.role === "reporter").length;
    const readerCount = users.filter(u => u.role === "user").length;

    const totalViews = articles.reduce((sum, a) => sum + (Number(a.view_count || a.views) || 0), 0);
    const publishedArticles = articles.filter(a => a.status === "published");
    const hiddenArticles = articles.filter(a => a.status === "hidden");
    const avgViewsPerArticle = publishedArticles.length > 0
      ? Math.round(totalViews / publishedArticles.length)
      : 0;

    const publishedCount = publishedArticles.length;
    const hiddenCount = hiddenArticles.length;
    const totalPublishedAndHidden = publishedCount + hiddenCount;
    const totalArticles = articles.length;

    const activeComments = comments.filter(c => !c.is_deleted);
    const totalComments = comments.length;

    return {
      totalUsers,
      adminCount,
      editorCount,
      reporterCount,
      readerCount,
      totalViews,
      avgViewsPerArticle,
      publishedCount,
      hiddenCount,
      totalPublishedAndHidden,
      totalArticles,
      totalComments,
      activeCommentsCount: activeComments.length
    };
  }

  /**
   * Render HTML giao diện đồng bộ class với hệ thống admin-layout.css
   */
  function renderDashboardLayout(container, kpi) {
    container.innerHTML = `
      <!-- TẦNG 1: 4 THẺ CHỈ SỐ KPI TỔNG QUAN (ADMIN STATS GRID ĐỒNG BỘ) -->
      <div class="admin-stats-grid">
        
        <!-- KPI 1: TỔNG TÀI KHOẢN (NÊU ĐẦY ĐỦ 4 CHỨC NĂNG) -->
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
            <div class="admin-stat-card__value">${kpi.totalUsers}</div>
            <div style="font-size: 11.5px; color: var(--muted); margin-top: 4px; line-height: 1.4;">
              ${kpi.adminCount} Quản trị · ${kpi.editorCount} BTV · ${kpi.reporterCount} Phóng viên · ${kpi.readerCount} Độc giả
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
            <div class="admin-stat-card__value">${kpi.totalViews.toLocaleString("vi-VN")}</div>
            <div style="font-size: 11.5px; color: var(--muted); margin-top: 4px;">
              Bình quân: ~${kpi.avgViewsPerArticle.toLocaleString("vi-VN")} lượt / bài
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
              ${kpi.publishedCount} / ${kpi.totalPublishedAndHidden} <span style="font-size: 13px; font-weight: normal; color: var(--muted);">bài</span>
            </div>
            <div style="font-size: 11.5px; color: var(--muted); margin-top: 4px;">
              ${kpi.publishedCount} đang hiển thị · <span style="color: ${kpi.hiddenCount > 0 ? '#C62828' : 'inherit'}; font-weight: ${kpi.hiddenCount > 0 ? '600' : 'normal'};">${kpi.hiddenCount} đã ẩn</span>
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
            <div class="admin-stat-card__value">${kpi.totalComments}</div>
            <div style="font-size: 11.5px; color: var(--muted); margin-top: 4px;">
              ${kpi.activeCommentsCount} bình luận của độc giả
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

  /**
   * Khởi tạo Biểu đồ Xu hướng 7 ngày qua (Chart.js)
   */
  function initTrendChart(articles) {
    const ctx = document.getElementById("trendChart");
    if (!ctx || typeof Chart === "undefined") return;

    // Tìm mốc ngày mới nhất trong dữ liệu các bài viết đã xuất bản để làm mốc tham chiếu
    let maxDate = null;
    articles.forEach(a => {
      if (a.status === "published" && a.published_at) {
        const dt = new Date(a.published_at);
        if (!isNaN(dt.getTime())) {
          if (!maxDate || dt > maxDate) {
            maxDate = dt;
          }
        }
      }
    });

    if (!maxDate) {
      maxDate = getSystemTime();
    }

    const labels = [];
    const articleCounts = [];
    const viewCounts = [];

    // Tạo danh sách 7 ngày gần nhất
    for (let i = 6; i >= 0; i--) {
      const d = new Date(maxDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      labels.push(dayLabel);

      const dayArticles = articles.filter(a => {
        const aDate = (a.published_at || a.created_at || "").substring(0, 10);
        return aDate === dateStr && a.status === "published";
      });

      articleCounts.push(dayArticles.length);
      const dayViews = dayArticles.reduce((sum, a) => sum + (Number(a.view_count || a.views) || 0), 0);
      viewCounts.push(dayViews);
    }

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
   * Khởi tạo Biểu đồ Cơ cấu Chuyên mục (Chart.js)
   */
  function initCategoryShareChart(articles, categories) {
    const ctx = document.getElementById("categoryShareChart");
    if (!ctx || typeof Chart === "undefined") return;

    const published = articles.filter(a => a.status === "published");
    const counts = {};

    categories.forEach(c => {
      counts[c.name] = published.filter(a => String(a.category_id) === String(c.id)).length;
    });

    const labels = Object.keys(counts);
    const dataValues = Object.values(counts);

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

  /**
   * Trích xuất thumbnail thông minh
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
    const catSlug = category ? category.slug : "thoi-su";
    return `../assets/images/categories/${catSlug}.jpg`;
  }

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
   * Render Top 5 Bài viết xem nhiều nhất (Đồng bộ với Editor/Reporter table row)
   */
  function renderTopArticles(articles, categories, users) {
    const tbody = document.getElementById("top-articles-tbody");
    if (!tbody) return;

    const published = articles.filter(a => a.status === "published");
    published.sort((a, b) => (Number(b.view_count || b.views) || 0) - (Number(a.view_count || a.views) || 0));
    const top5 = published.slice(0, 5);

    if (top5.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 24px; color: var(--muted);">Chưa có bài viết xuất bản nào</td></tr>`;
      return;
    }

    tbody.innerHTML = top5.map((art) => {
      const cat = categories.find(c => String(c.id) === String(art.category_id));
      const author = users.find(u => String(u.id) === String(art.author_id));

      const catName = cat ? cat.name : "Thời sự";
      const authorName = author ? (author.full_name || author.username) : "Phóng viên";
      const views = Number(art.view_count || art.views) || 0;

      const coverImg = extractThumbnail(art, cat);
      const thumbHtml = renderTableCoverThumb(coverImg, art.title);
      const detailUrl = typeof getArticleDetailUrl === "function" ? getArticleDetailUrl(art, "../public/") : `../public/article-detail.html?slug=${encodeURIComponent(art.slug || art.id)}`;

      return `
        <tr>
          <td>
            <div class="admin-article-cell">
              <a href="${detailUrl}" target="_blank" title="Bấm để xem chi tiết bài viết" style="display: block; flex-shrink: 0; text-decoration: none;">
                ${thumbHtml}
              </a>
              <div class="admin-article-info">
                <a href="${detailUrl}" target="_blank" class="admin-article-title-link" title="${escapeHtml(art.title)}">
                  ${escapeHtml(art.title)}
                </a>
                <div class="admin-article-sapo-text">${escapeHtml(art.short_description || "")}</div>
              </div>
            </div>
          </td>
          <td class="admin-col-category">
            <span class="admin-category-pill">${escapeHtml(catName)}</span>
          </td>
          <td>
            <div style="font-size: 13px; font-weight: 600; color: var(--ink);">${escapeHtml(authorName)}</div>
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
  function renderTopReporters(articles, users) {
    const tbody = document.getElementById("top-reporters-tbody");
    if (!tbody) return;

    const reporters = users.filter(u => u.role === "reporter");

    const reporterStats = reporters.map(rep => {
      const repArticles = articles.filter(a => Number(a.author_id) === Number(rep.id));
      const published = repArticles.filter(a => a.status === "published");
      const pending = repArticles.filter(a => a.status === "pending");
      const totalViews = published.reduce((sum, a) => sum + (Number(a.view_count || a.views) || 0), 0);

      return {
        id: rep.id,
        name: rep.full_name || rep.username,
        username: rep.username,
        publishedCount: published.length,
        pendingCount: pending.length,
        totalViews: totalViews
      };
    });

    reporterStats.sort((a, b) => b.publishedCount - a.publishedCount || b.totalViews - a.totalViews);

    tbody.innerHTML = reporterStats.map(rep => {
      return `
        <tr>
          <td>
            <div style="display: flex; flex-direction: column;">
              <strong style="font-size: 13px; color: var(--ink);">${escapeHtml(rep.name)}</strong>
              <span style="font-size: 11.5px; color: var(--muted); font-family: var(--f-mono);">@${escapeHtml(rep.username)}</span>
            </div>
          </td>
          <td style="text-align: right;">
            <strong style="font-size: 13px; font-family: var(--f-mono); color: var(--ink);">${rep.publishedCount}</strong>
          </td>
          <td style="text-align: right;">
            <span style="font-size: 12.5px; font-family: var(--f-mono); font-weight: 600; color: #2563EB;">
              ${rep.totalViews.toLocaleString("vi-VN")}
            </span>
          </td>
        </tr>
      `;
    }).join("");
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
