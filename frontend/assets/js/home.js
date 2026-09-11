/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/home.js
 * PHÂN HỆ: Trang chủ Công khai (Public Homepage Module)
 * MÔ TẢ: Khởi tạo dữ liệu và render toàn bộ các phân vùng giao diện Trang chủ Báo Mạch Tin:
 *        1. Tải dữ liệu bài viết đã xuất bản và danh sách thẻ tag từ Backend API.
 *        2. Phân vùng Hero Grid: Tính điểm "Nóng" = Lượt xem / (Giờ trôi qua + 1) để chọn 5 bài tiêu điểm (2 bài đinh lớn bên trái, 3 bài nhỏ bên phải).
 *        3. Phân vùng Mới cập nhật (Latest Grid): Lọc và hiển thị các bài đăng trong vòng 48 giờ gần nhất.
 *        4. Phân vùng Dòng sự kiện nổi bật (Notable Events Stream): Danh sách bài viết do Ban Biên tập chọn lọc.
 *        5. Phân vùng Sidebar chung: Đọc nhiều nhất trong tuần và Đám mây thẻ Tag nổi bật (qua initPublicSidebar).
 *        6. Tự động đồng bộ số lượt đọc khi người dùng quay lại (pageshow event).
 * PHẠM VI SỬ DỤNG:
 *   - frontend/public/index.html (hoặc gốc /)
 * PHỤ THUỘC:
 *   - frontend/assets/js/common.js (initPublicHeader, initPublicFooter, initPublicSidebar, resolveApiUrl, getArticleDetailUrl, renderCoverImage, etc.)
 *   - backend/api/public/articles.php
 *   - backend/api/public/tags.php
 * ==============================================================================
 */

async function initHomePage() {
  // ==============================================================================
  // KHỐI 1: KHỞI TẠO KHUNG TRANG (HEADER & FOOTER) VÀ TẢI DỮ LIỆU TỪ BACKEND
  // ==============================================================================
  await initPublicHeader("");
  await initPublicFooter();

  let tags = [];
  let allArticles = [];
  try {
    const [articleResult, tagResult] = await Promise.all([
      fetch(resolveApiUrl("public/articles.php")).then(r => r.json()).catch(() => null),
      fetch(resolveApiUrl("public/tags.php")).then(r => r.json()).catch(() => null)
    ]);
    allArticles = articleResult && articleResult.success && Array.isArray(articleResult.data) ? articleResult.data : [];
    tags = tagResult && tagResult.success && Array.isArray(tagResult.data) ? tagResult.data : [];
  } catch (error) {
    allArticles = [];
    tags = [];
  }

  // ==============================================================================
  // KHỐI 2: CÁC TIỆN ÍCH DỰNG THẺ BÀI VIẾT (CARD HELPERS & FORMATTERS)
  // ==============================================================================
  // Helper lấy chuyên mục của 1 bài viết (đã được API nhúng sẵn trong a.category)
  function getCategory(a) {
    return a.category || { name: "Tin tức", slug: "" };
  }

  // Helper lấy tác giả của 1 bài viết (đã được API nhúng sẵn trong a.author)
  function getAuthor(a) {
    return a.author || { full_name: "Ban Biên Tập", id: "" };
  }

  // Bài viết trả về từ API đã là bài đã xuất bản và có published_at
  const publishedArticles = allArticles.filter((a) => a.published_at);

  // Mốc thời gian hệ thống
  const now = getSystemTime();

  // Helper chuẩn hóa định dạng số lượt đọc
  function getViews(a) {
    return typeof getArticleViews === "function" ? getArticleViews(a) : Number(a.view_count || 0);
  }

  // Helper render dòng meta chuẩn đồng bộ: Tác giả · Thời gian · Lượt đọc
  function renderCardMeta(a, author) {
    const viewsFormatted = formatNumber(getViews(a));
    const authorUrl = typeof getAuthorProfileUrl === "function" ? getAuthorProfileUrl(author) : `author.html?username=${encodeURIComponent(author.username || author.id)}`;
    return `
      <div class="meta">
        <a href="${authorUrl}">${escapeHtml(author.full_name)}</a>
        <span class="dot-sep">·</span>
        <span>${timeAgo(a.published_at)}</span>
        <span class="dot-sep">·</span>
        <span>${viewsFormatted} lượt đọc</span>
      </div>
    `;
  }

  // ==============================================================================
  // KHỐI 3: PHÂN VÙNG HERO GRID (5 BÀI TIÊU ĐIỂM NÓNG NHẤT)
  // Điểm Nóng = Views / (Số giờ trôi qua + 1)
  // ==============================================================================
  const scoredArticles = publishedArticles.map((a) => {
    const pubDate = typeof parseSystemDate === "function" ? parseSystemDate(a.published_at) : new Date(String(a.published_at).replace(" ", "T"));
    const hoursDiff = Math.max(0, (now.getTime() - (pubDate ? pubDate.getTime() : now.getTime())) / (1000 * 60 * 60));
    const views = getViews(a);
    const hotScore = views / (hoursDiff + 1);
    return { ...a, hotScore, hoursDiff };
  });

  // Sắp xếp theo Điểm Nóng giảm dần
  const hotArticles = [...scoredArticles].sort((a, b) => b.hotScore - a.hotScore);

  const heroMount = document.getElementById("hero-mount");
  if (heroMount) {
    if (hotArticles.length === 0) {
      heroMount.innerHTML = `<div class="meta" style="padding: 30px; text-align: center;">Chưa có bài viết nào được xuất bản.</div>`;
    } else {
      // 2 bài đinh bên trái (#1 và #2)
      const leadArticle = hotArticles[0];
      const subLeadArticle = hotArticles.length > 1 ? hotArticles[1] : null;

      const leadCat = getCategory(leadArticle);
      const leadAuthor = getAuthor(leadArticle);

      let leftHtml = `
        <div class="hero-grid__main">
          <!-- Bài đinh số 1 (Lead Hero) -->
          <article class="article-card">
            <a href="${getArticleDetailUrl(leadArticle)}" class="card-link">
              ${renderCoverImage(leadArticle.cover_image, leadArticle.title, "ph--16x9")}
              <span class="eyebrow is-crimson">${escapeHtml(leadCat.name)}</span>
              <h1 class="headline-xl">${escapeHtml(leadArticle.title)}</h1>
              <p class="dek">${escapeHtml(leadArticle.short_description || "")}</p>
            </a>
            ${renderCardMeta(leadArticle, leadAuthor)}
          </article>
      `;

      if (subLeadArticle) {
        const subCat = getCategory(subLeadArticle);
        const subAuthor = getAuthor(subLeadArticle);
        leftHtml += `
          <!-- Bài đinh số 2 (Đồng bộ cỡ chữ và cấu trúc y hệt bài đinh số 1) -->
          <article class="article-card">
            <a href="${getArticleDetailUrl(subLeadArticle)}" class="card-link">
              ${renderCoverImage(subLeadArticle.cover_image, subLeadArticle.title, "ph--16x9")}
              <span class="eyebrow is-crimson">${escapeHtml(subCat.name)}</span>
              <h2 class="headline-xl">${escapeHtml(subLeadArticle.title)}</h2>
              <p class="dek">${escapeHtml(subLeadArticle.short_description || "")}</p>
            </a>
            ${renderCardMeta(subLeadArticle, subAuthor)}
          </article>
        `;
      }
      leftHtml += `</div>`;

      // 3 bài nhỏ bên phải (#3, #4, #5)
      const sideArticles = hotArticles.slice(2, 5);
      let rightHtml = "";
      if (sideArticles.length > 0) {
        rightHtml = `
          <div class="hero-grid__side">
            ${sideArticles
              .map((a) => {
                const cat = getCategory(a);
                const author = getAuthor(a);
                return `
                  <article class="article-card">
                    <a href="${getArticleDetailUrl(a)}" class="card-link">
                      ${renderCoverImage(a.cover_image, a.title, "ph--16x9")}
                      <span class="eyebrow is-crimson">${escapeHtml(cat.name)}</span>
                      <h2 class="headline-md">${escapeHtml(a.title)}</h2>
                      <p class="dek--sm">${escapeHtml(a.short_description || "")}</p>
                    </a>
                    ${renderCardMeta(a, author)}
                  </article>
                `;
              })
              .join("")}
          </div>
        `;
      }

      heroMount.innerHTML = leftHtml + rightHtml;
    }
  }

  // ==============================================================================
  // KHỐI 4: PHÂN VÙNG MỚI CẬP NHẬT (LATEST SECTION - 48 GIỜ GẦN NHẤT)
  // ==============================================================================
  const latestSection = document.getElementById("latest-section");
  const latestMount = document.getElementById("latest-mount");
  if (latestSection && latestMount) {
    const timeSortedArticles = [...publishedArticles]
      .sort((a, b) => new Date(String(b.published_at || b.created_at).replace(" ", "T")) - new Date(String(a.published_at || a.created_at).replace(" ", "T")));

    // Lọc các bài đăng trong vòng 2 ngày (48 giờ) tính từ mốc bài mới nhất
    const allDates = timeSortedArticles.map((a) => new Date(String(a.published_at || a.created_at).replace(" ", "T")).getTime());
    const maxDate = allDates.length > 0 ? Math.max(...allDates) : Date.now();
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    const cutoffTime = maxDate - twoDaysMs;

    const recentTwoDays = timeSortedArticles.filter((a) => {
      const itemTime = new Date(String(a.published_at || a.created_at).replace(" ", "T")).getTime();
      return itemTime >= cutoffTime;
    });

    // Lấy tối đa 3 bài mới nhất trong 2 ngày để hiển thị lưới trang chủ
    const latestArticles = recentTwoDays.length > 0 ? recentTwoDays.slice(0, 3) : timeSortedArticles.slice(0, 3);
    if (latestArticles.length > 0) {
      latestSection.style.display = "block";
      latestMount.innerHTML = latestArticles
        .map((a) => {
          const cat = getCategory(a);
          const author = getAuthor(a);
          return `
            <article class="article-card">
              <a href="${getArticleDetailUrl(a)}" class="card-link">
                ${renderCoverImage(a.cover_image, a.title, "ph--4x3")}
                <span class="eyebrow">${escapeHtml(cat.name)}</span>
                <h3 class="headline-md">${escapeHtml(a.title)}</h3>
                <p class="dek--sm">${escapeHtml(a.short_description || "")}</p>
              </a>
              ${renderCardMeta(a, author)}
            </article>
          `;
        })
        .join("");
    } else {
      latestSection.style.display = "none";
    }
  }

  // ==============================================================================
  // KHỐI 5: PHÂN VÙNG SỰ KIỆN ĐÁNG CHÚ Ý (NOTABLE EVENTS STREAM)
  // Lọc các bài viết được Editor đánh dấu đáng chú ý (is_notable_event === true)
  // ==============================================================================
  const streamMount = document.getElementById("stream-mount");
  if (streamMount) {
    // Lấy các bài được Editor chọn đưa vào sự kiện đáng chú ý
    const notableArticles = publishedArticles.filter((a) => a.is_notable_event === true);
    
    // Sắp xếp bài mới nhất lên trước
    const sortedNotable = [...notableArticles].sort(
      (a, b) => new Date(String(b.published_at || b.created_at).replace(" ", "T")) - new Date(String(a.published_at || a.created_at).replace(" ", "T"))
    );

    // Nếu chưa có bài nào đánh dấu, lấy 4 bài đã xuất bản làm dự phòng
    const displayList = sortedNotable.length > 0
      ? sortedNotable.slice(0, 5)
      : publishedArticles.slice(0, 5);

    if (displayList.length === 0) {
      streamMount.innerHTML = `<p class="meta">Chưa có sự kiện đáng chú ý nào.</p>`;
    } else {
      streamMount.innerHTML = displayList
        .map((a, index) => {
          const cat = getCategory(a);
          const author = getAuthor(a);
          const isLast = index === displayList.length - 1 ? "no-border" : "";

          return `
            <article class="article-card--row ${isLast}">
              <a href="${getArticleDetailUrl(a)}" class="card-link" style="display: block;">
                ${renderCoverImage(a.cover_image, a.title, "ph--4x3")}
              </a>
              <div>
                <span class="eyebrow">${escapeHtml(cat.name)}</span>
                <h3 class="headline-md">
                  <a href="${getArticleDetailUrl(a)}">${escapeHtml(a.title)}</a>
                </h3>
                <p class="dek--sm">${escapeHtml(a.short_description || "")}</p>
                ${renderCardMeta(a, author)}
              </div>
            </article>
          `;
        })
        .join("");
    }
  }

  // ==============================================================================
  // KHỐI 6: PHÂN VÙNG SIDEBAR ("ĐỌC NHIỀU NHẤT TRONG TUẦN" & "TAG NỔI BẬT")
  // ==============================================================================
  await initPublicSidebar({
    rankMountId: "rank-mount",
    tagMountId: "tag-mount"
  });
}

// ==============================================================================
// KHỐI 7: KHỞI CHẠY VÀ ĐỒNG BỘ KHI QUAY LẠI TRANG (PAGESHOW)
// ==============================================================================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomePage);
} else {
  initHomePage();
}

// Tự động đồng bộ lại số view mới nhất khi người đọc bấm nút Back từ bài viết về trang chủ
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    initHomePage();
  }
});
