/**
 * ==============================================================================
 * MẠCH TIN - FAVORITES.JS (Quản lý và hiển thị Bài viết yêu thích)
 * ==============================================================================
 */

function initFavoritesPage() {
  // 1. Kiểm tra đăng nhập (Bảo vệ tuyến đường)
  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  if (!currentUser) {
    if (typeof showToast === "function") {
      showToast("Vui lòng đăng nhập để xem bài viết yêu thích", "warning");
    }
    setTimeout(() => {
      window.location.href = "../public/login.html?redirect=" + encodeURIComponent(window.location.href);
    }, 400);
    return;
  }

  // 2. Khởi tạo Header và Footer chung
  if (typeof initPublicHeader === "function") initPublicHeader("favorites");
  if (typeof initPublicFooter === "function") initPublicFooter();

  // 3. Render danh sách bài viết yêu thích
  renderFavoritesList(currentUser);
}

/**
 * Hiển thị danh sách bài viết yêu thích của người dùng
 * Layout & Style đúng chuẩn dạng hàng ngang Mạch Tin (giống ảnh mẫu)
 */
function renderFavoritesList(currentUser) {
  const mount = document.getElementById("favorites-mount");
  if (!mount) return;

  // Lấy dữ liệu bảng favorites, articles, categories, users, tags, article_tags
  const allFavorites = typeof getTable === "function" ? getTable("favorites") : [];
  const allArticles = typeof getTable === "function" ? getTable("articles") : (typeof MOCK_ARTICLES !== "undefined" ? MOCK_ARTICLES : []);
  const allCategories = typeof getTable === "function" ? getTable("categories") : (typeof MOCK_CATEGORIES !== "undefined" ? MOCK_CATEGORIES : []);
  const allUsers = typeof getTable === "function" ? getTable("users") : (typeof MOCK_USERS !== "undefined" ? MOCK_USERS : []);
  const allTags = typeof getTable === "function" ? getTable("tags") : (typeof MOCK_TAGS !== "undefined" ? MOCK_TAGS : []);
  const allArticleTags = typeof getTable === "function" ? getTable("article_tags") : (typeof MOCK_ARTICLE_TAGS !== "undefined" ? MOCK_ARTICLE_TAGS : []);

  // Lọc các bản ghi yêu thích của user hiện tại
  const userFavorites = allFavorites
    .filter((f) => String(f.user_id) === String(currentUser.id))
    .sort((a, b) => new Date(String(b.created_at).replace(" ", "T")) - new Date(String(a.created_at).replace(" ", "T")));

  // Lấy danh sách chi tiết các bài viết tương ứng
  const favoriteArticles = [];
  userFavorites.forEach((fav) => {
    const article = allArticles.find((a) => String(a.id) === String(fav.article_id));
    if (article && article.status === "published") {
      favoriteArticles.push(article);
    }
  });

  // Trường hợp không có bài viết yêu thích
  if (favoriteArticles.length === 0) {
    mount.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 48px 16px; color: var(--ink-soft); font-size: 15px;">
        <p style="margin: 0; font-family: var(--font-serif); font-size: 17px; color: var(--ink-muted);">Bạn chưa lưu bài viết nào</p>
      </div>
    `;
    return;
  }

  // Trường hợp có bài viết yêu thích: render dạng danh sách chuẩn phong cách Mạch Tin (như ảnh mẫu)
  mount.innerHTML = `
    <div class="favorites-articles-list">
      ${favoriteArticles.map((article) => {
        const cat = allCategories.find((c) => String(c.id) === String(article.category_id)) || { name: "Tin tức", slug: "tin-tuc" };
        const author = allUsers.find((u) => String(u.id) === String(article.author_id)) || { full_name: article.author_name || "Ban Biên Tập" };
        const detailUrl = `../public/article-detail.html?id=${article.id}`;
        
        // Thời gian & lượt đọc theo đúng chuẩn định dạng hệ thống
        const safeDate = typeof formatDate === "function" ? formatDate(article.published_at || article.created_at) : (article.published_at || "");
        const viewCount = Number(article.views || article.view_count || 0);
        const safeViews = typeof formatNumber === "function" ? formatNumber(viewCount) : viewCount.toLocaleString("vi-VN");

        // Lấy danh sách tags của bài viết
        const thisArticleTagIds = allArticleTags.filter((at) => at.article_id === article.id).map((at) => at.tag_id);
        const thisTags = allTags.filter((t) => thisArticleTagIds.includes(t.id));
        const tagsHtml = thisTags.length > 0
          ? `<div class="search-article-card__tags" style="margin-top: 4px; margin-bottom: 12px; display: flex; gap: 6px; flex-wrap: wrap;">
              ${thisTags.map((t) => `
                <a href="../public/search.html?tag=${t.slug}" class="tag-chip" style="font-size: 11.5px; padding: 3px 8px; text-decoration: none; border-radius: 3px; background: var(--bg-soft); border: 1px solid var(--line-soft); color: var(--ink-soft);" onclick="event.stopPropagation();">
                  #${typeof escapeHtml === "function" ? escapeHtml(t.name) : t.name}
                </a>
              `).join("")}
            </div>`
          : "";

        const coverHtml = typeof renderCoverImage === "function"
          ? renderCoverImage(article.cover_image || article.thumbnail, article.title, "ph--16x9")
          : `<div class="ph ph--16x9"><img src="${article.cover_image || article.thumbnail || ''}" alt="${escapeHtml(article.title)}"></div>`;

        return `
          <article class="search-article-card" style="cursor: pointer;" onclick="window.location.href='${detailUrl}'">
            
            <!-- Thumbnail ảnh bài viết -->
            <a href="${detailUrl}" class="search-article-card__thumb" aria-label="${typeof escapeHtml === "function" ? escapeHtml(article.title) : article.title}" onclick="event.stopPropagation();">
              ${coverHtml}
            </a>

            <!-- Nội dung bài viết -->
            <div class="search-article-card__body">
              <div>
                <!-- Chuyên mục (Eyebrow) -->
                <a href="../public/category.html?slug=${cat.slug}" class="eyebrow" style="text-decoration: none;" onclick="event.stopPropagation();">
                  ${typeof escapeHtml === "function" ? escapeHtml(cat.name) : cat.name}
                </a>

                <!-- Tiêu đề bài viết -->
                <h3 class="search-article-card__title" style="margin: 4px 0 8px;">
                  <a href="${detailUrl}" onclick="event.stopPropagation();">
                    ${typeof escapeHtml === "function" ? escapeHtml(article.title) : article.title}
                  </a>
                </h3>

                <!-- Tóm tắt bài viết -->
                <p class="search-article-card__dek" style="margin: 0 0 8px;">
                  ${typeof escapeHtml === "function" ? escapeHtml(article.summary || article.short_description || "") : (article.summary || article.short_description || "")}
                </p>

                <!-- Danh sách Hashtag Chips -->
                ${tagsHtml}
              </div>

              <!-- Meta: Tác giả · Thời gian · Lượt đọc -->
              <div class="search-article-card__meta">
                <a href="../public/author.html?id=${article.author_id}" onclick="event.stopPropagation();">${typeof escapeHtml === "function" ? escapeHtml(author.full_name) : author.full_name}</a>
                <span class="dot-sep">·</span>
                <span>${safeDate}</span>
                <span class="dot-sep">·</span>
                <span>${safeViews} lượt đọc</span>
              </div>

            </div>

          </article>
        `;
      }).join("")}
    </div>
  `;
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", initFavoritesPage);
