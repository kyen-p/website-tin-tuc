/**
 * ==============================================================================
 * MẠCH TIN - HOME.JS (Logic hiển thị Trang chủ)
 * ==============================================================================
 * 1. Lấy danh sách bài viết đã xuất bản (status === 'published')
 * 2. Tính điểm "Nóng" = Views / (Giờ trôi qua + 1) để chọn 5 bài Tiêu điểm Khối 1
 * 3. Render Khối bài viết nổi bật (Hero Grid: 2 bài đinh trái, 3 bài nhỏ phải, chuyên mục đỏ)
 * 4. Render Khối bài viết mới cập nhật (Latest Grid: lấy theo thời gian thực)
 * 5. Render Cột bài viết theo dòng sự kiện (Topic-based Event Stream: gom theo đề tài topic_id)
 * 6. Render Bảng xếp hạng bài viết đọc nhiều nhất trong tuần (Top 5 tuần qua)
 * 7. Render Khối chủ đề thịnh hành (Tag Cloud)
 * ==============================================================================
 */

function initHomePage() {
  // 1. Khởi tạo Header và Footer chung
  initPublicHeader("");
  initPublicFooter();

  // 2. Lấy dữ liệu cần thiết từ Database Helper
  const categories = getTable("categories");
  const users = getTable("users");
  const tags = getTable("tags");
  const allArticles = getTable("articles");
  const topics = getTable("topics");

  // Helper lấy chuyên mục theo ID
  function getCategory(categoryId) {
    return categories.find((c) => c.id === categoryId) || { name: "Tin tức", slug: "" };
  }

  // Helper lấy tác giả theo ID
  function getAuthor(authorId) {
    return users.find((u) => u.id === authorId) || { full_name: "Ban Biên Tập", id: "" };
  }

  // Helper lấy đề tài theo ID
  function getTopic(topicId) {
    return topics.find((t) => t.id === topicId) || null;
  }

  // Lọc chỉ lấy bài viết đã đăng chính thức và có ngày xuất bản
  const publishedArticles = allArticles.filter((a) => a.status === "published" && a.published_at);

  // Mốc thời gian hệ thống
  const now = typeof getSystemTime === "function" ? getSystemTime() : new Date("2026-08-14T23:59:59");

  // Helper chuẩn hóa định dạng số lượt đọc
  function getViews(a) {
    return Number(a.view_count || a.views || 0);
  }

  // Helper render dòng meta chuẩn đồng bộ: Tác giả · Thời gian · Lượt đọc
  function renderCardMeta(a, author) {
    const viewsFormatted = formatNumber(getViews(a));
    return `
      <div class="meta">
        <a href="author.html?id=${author.id}">${escapeHtml(author.full_name)}</a>
        <span class="dot-sep">·</span>
        <span>${timeAgo(a.published_at)}</span>
        <span class="dot-sep">·</span>
        <span>${viewsFormatted} lượt đọc</span>
      </div>
    `;
  }

  // ============================================================================
  // A. TÍNH ĐỘ "NÓNG" CHO KHỐI 1 (HERO GRID - 5 BÀI TIÊU ĐIỂM)
  // Điểm Nóng = Views / (Số giờ trôi qua + 1)
  // ============================================================================
  const scoredArticles = publishedArticles.map((a) => {
    const pubDate = new Date(String(a.published_at).replace(" ", "T"));
    const hoursDiff = Math.max(0, (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60));
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

      const leadCat = getCategory(leadArticle.category_id);
      const leadAuthor = getAuthor(leadArticle.author_id);

      let leftHtml = `
        <div class="hero-grid__main">
          <!-- Bài đinh số 1 (Lead Hero) -->
          <article class="article-card">
            <a href="article-detail.html?id=${leadArticle.id}" class="card-link">
              ${renderCoverImage(leadArticle.cover_image, leadArticle.title, "ph--16x9")}
              <span class="eyebrow is-crimson">${escapeHtml(leadCat.name)}</span>
              <h1 class="headline-xl">${escapeHtml(leadArticle.title)}</h1>
              <p class="dek">${escapeHtml(leadArticle.short_description || leadArticle.summary || "")}</p>
            </a>
            ${renderCardMeta(leadArticle, leadAuthor)}
          </article>
      `;

      if (subLeadArticle) {
        const subCat = getCategory(subLeadArticle.category_id);
        const subAuthor = getAuthor(subLeadArticle.author_id);
        leftHtml += `
          <!-- Bài đinh số 2 (Đồng bộ cỡ chữ và cấu trúc y hệt bài đinh số 1) -->
          <article class="article-card">
            <a href="article-detail.html?id=${subLeadArticle.id}" class="card-link">
              ${renderCoverImage(subLeadArticle.cover_image, subLeadArticle.title, "ph--16x9")}
              <span class="eyebrow is-crimson">${escapeHtml(subCat.name)}</span>
              <h2 class="headline-xl">${escapeHtml(subLeadArticle.title)}</h2>
              <p class="dek">${escapeHtml(subLeadArticle.short_description || subLeadArticle.summary || "")}</p>
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
                const cat = getCategory(a.category_id);
                const author = getAuthor(a.author_id);
                return `
                  <article class="article-card">
                    <a href="article-detail.html?id=${a.id}" class="card-link">
                      ${renderCoverImage(a.cover_image, a.title, "ph--16x9")}
                      <span class="eyebrow is-crimson">${escapeHtml(cat.name)}</span>
                      <h2 class="headline-md">${escapeHtml(a.title)}</h2>
                      <p class="dek--sm">${escapeHtml(a.short_description || a.summary || "")}</p>
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

  // ============================================================================
  // B. RENDER KHỐI MỚI CẬP NHẬT (LATEST SECTION - 2 NGÀY GẦN NHẤT)
  // Sắp xếp bài mới xuất bản nhất trong 48 giờ qua
  // ============================================================================
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
          const cat = getCategory(a.category_id);
          const author = getAuthor(a.author_id);
          return `
            <article class="article-card">
              <a href="article-detail.html?id=${a.id}" class="card-link">
                ${renderCoverImage(a.cover_image, a.title, "ph--4x3")}
                <span class="eyebrow">${escapeHtml(cat.name)}</span>
                <h3 class="headline-md">${escapeHtml(a.title)}</h3>
                <p class="dek--sm">${escapeHtml(a.short_description || a.summary || "")}</p>
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

  // ============================================================================
  // C. RENDER SỰ KIỆN ĐÁNG CHÚ Ý (NOTABLE EVENTS SELECTED BY EDITOR)
  // Lọc các bài viết được Editor đánh dấu đáng chú ý (is_notable_event === true)
  // ============================================================================
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
          const cat = getCategory(a.category_id);
          const author = getAuthor(a.author_id);
          const isLast = index === displayList.length - 1 ? "no-border" : "";

          return `
            <article class="article-card--row ${isLast}">
              <a href="article-detail.html?id=${a.id}" class="card-link" style="display: block;">
                ${renderCoverImage(a.cover_image, a.title, "ph--4x3")}
              </a>
              <div>
                <span class="eyebrow">${escapeHtml(cat.name)}</span>
                <h3 class="headline-md">
                  <a href="article-detail.html?id=${a.id}">${escapeHtml(a.title)}</a>
                </h3>
                <p class="dek--sm">${escapeHtml(a.short_description || a.summary || "")}</p>
                ${renderCardMeta(a, author)}
              </div>
            </article>
          `;
        })
        .join("");
    }
  }

  // ============================================================================
  // D. RENDER BẢNG XẾP HẠNG "ĐỌC NHIỀU NHẤT TRONG TUẦN" (TOP 5 TUẦN QUA)
  // Lọc bài viết xuất bản trong vòng 7 ngày và sort theo views cao nhất
  // ============================================================================
  const rankMount = document.getElementById("rank-mount");
  const rankHeader = document.querySelector("aside .panel h3");
  if (rankHeader) {
    rankHeader.textContent = "Đọc nhiều nhất trong tuần";
  }

  if (rankMount) {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyArticles = publishedArticles.filter((a) => {
      if (!a.published_at) return false;
      const pubDate = new Date(String(a.published_at).replace(" ", "T"));
      return !isNaN(pubDate.getTime()) && pubDate >= oneWeekAgo && pubDate <= now;
    });

    const topWeeklyArticles = (weeklyArticles.length > 0 ? weeklyArticles : publishedArticles)
      .sort((a, b) => getViews(b) - getViews(a))
      .slice(0, 5);

    if (topWeeklyArticles.length === 0) {
      rankMount.innerHTML = `<p class="meta">Chưa có bài viết nổi bật trong tuần.</p>`;
    } else {
      rankMount.innerHTML = topWeeklyArticles
        .map((a, index) => {
          const isLast = index === topWeeklyArticles.length - 1 ? "no-border" : "";
          const views = getViews(a);
          return `
            <div class="rank-item ${isLast}">
              <div>
                <h4 class="rank-item__title">
                  <a href="article-detail.html?id=${a.id}">${escapeHtml(a.title)}</a>
                </h4>
                <div class="meta">${formatNumber(views)} lượt đọc</div>
              </div>
            </div>
          `;
        })
        .join("");
    }
  }

  // ============================================================================
  // E. RENDER CHỦ ĐỀ ĐƯỢC QUAN TÂM (TAG CLOUD)
  // ============================================================================
  const tagMount = document.getElementById("tag-mount");
  if (tagMount && tags.length > 0) {
    tagMount.innerHTML = tags
      .map((t) => `<a href="search.html?tag=${t.slug}" class="tag-chip">#${escapeHtml(t.name)}</a>`)
      .join("");
  }
}

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