/**
 * ==============================================================================
 * MẠCH TIN - CATEGORY.JS (Logic hiển thị Trang chuyên mục & lọc theo tag)
 * ==============================================================================
 * 1. Đọc tham số URL: ?slug=... & ?tag=... & ?filter=...
 * 2. Lọc danh sách bài viết theo chuyên mục & tag (status === 'published')
 * 3. Hỗ trợ sắp xếp: Mới nhất / Xem nhiều nhất
 * 4. Render tiêu điểm chuyên mục + lưới bài viết
 * 5. Render Sidebar bài đọc nhiều
 * ==============================================================================
 */

async function initCategoryPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const categorySlug = urlParams.get("slug") || "";
  const filterType = urlParams.get("filter") || ""; // 'latest' hoặc 'notable'
  let currentTagSlug = urlParams.get("tag") || "";
  let currentSort = "newest";

  // 1. Khởi tạo Header và Footer
if (typeof initPublicHeader === "function") {
  await initPublicHeader(categorySlug);
}
if (typeof initPublicFooter === "function") {
  await initPublicFooter();
}

  // 2. Lấy dữ liệu từ backend (PHP + MySQL) cho bài viết, chuyên mục & thẻ tag
  let tags = [];
  let allArticles = [];
  let categories = [];
  try {
    const [articlesRes, categoriesRes, tagsRes] = await Promise.all([
      fetch(resolveApiUrl("public/articles.php")).then((r) => r.json()),
      fetch(resolveApiUrl("public/categories.php")).then((r) => r.json()),
      fetch(resolveApiUrl("public/tags.php")).then((r) => r.json()),
    ]);
    allArticles = articlesRes && articlesRes.success && Array.isArray(articlesRes.data) ? articlesRes.data : [];
    categories = categoriesRes && categoriesRes.success && Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
    tags = tagsRes && tagsRes.success && Array.isArray(tagsRes.data) ? tagsRes.data : [];
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu chuyên mục từ backend", error);
  }

  // Tìm chuyên mục hiện tại
  const currentCategory = categorySlug ? categories.find((c) => c.slug === categorySlug) || null : null;

  // Helpers
  function getCategory(catId) {
    return categories.find((c) => c.id === catId) || { name: "Tin tức", slug: "" };
  }

  function getAuthor(article) {
    return (article && article.author) || { full_name: "Ban Biên Tập", id: "" };
  }

  function getViews(article) {
    return Number(article.view_count || article.views || 0);
  }

  // ============================================================================
  // A. RENDER TIÊU ĐỀ CHUYÊN MỤC, BREADCRUMB & DOCUMENT.TITLE ĐỘNG
  // ============================================================================
  const breadcrumbCategory = document.getElementById("breadcrumb-category");
  const categoryTitle = document.getElementById("category-title");
  const categoryDesc = document.getElementById("category-description");
  const categoryMetaCount = document.getElementById("category-meta-count");

  let titleName = "Tất cả bài viết";
  let descText = "Dòng chảy tin tức tổng hợp 24/7 từ tất cả các lĩnh vực đời sống, kinh tế, xã hội.";
  let pageTitle = "Tất cả bài viết - Mạch Tin";

  if (filterType === "latest") {
    titleName = "Mới cập nhật";
    descText = "Cập nhật các dòng tin tức nóng hổi, mới nhất được xuất bản trong vòng 48 giờ qua.";
    pageTitle = "Mới cập nhật - Mạch Tin";
  } else if (filterType === "notable") {
    titleName = "Sự kiện đáng chú ý";
    descText = "Các tiêu điểm sự kiện, tuyến bài chọn lọc do Ban biên tập Mạch Tin đề xuất theo dõi.";
    pageTitle = "Sự kiện đáng chú ý - Mạch Tin";
  } else if (currentCategory) {
    titleName = currentCategory.name;
    descText = currentCategory.description || `Các bài viết thuộc chuyên mục ${currentCategory.name}.`;
    pageTitle = `${currentCategory.name} - Mạch Tin`;
  }

  // Đổi title trên Tab trình duyệt động theo chuyên mục
  document.title = pageTitle;

  // Đổi tiêu đề H1 và mô tả lớn đầu trang
  if (breadcrumbCategory) breadcrumbCategory.textContent = titleName;
  if (categoryTitle) categoryTitle.textContent = titleName;
  if (categoryDesc) categoryDesc.textContent = descText;

  // ============================================================================
  // B. RENDER CÁC CHIP THẺ TAG
  // ============================================================================
  const tagChipsMount = document.getElementById("category-tags-mount");
  if (tagChipsMount) {
    let relevantTags = tags;
    if (currentCategory) {
      const catArticles = allArticles.filter((a) => a.category_id === currentCategory.id && a.status === "published");
      const relevantTagSet = new Set();
      catArticles.forEach(a => {
        if (Array.isArray(a.tags)) {
          a.tags.forEach(t => relevantTagSet.add(t.slug));
        }
      });
      relevantTags = tags.filter((t) => relevantTagSet.has(t.slug));
    }

    let chipsHtml = `
      <button type="button" class="tag-chip ${!currentTagSlug ? 'tag-chip--active' : ''}" data-tag="">Tất cả</button>
    `;

    chipsHtml += relevantTags
      .map((t) => `
        <button type="button" class="tag-chip ${currentTagSlug === t.slug ? 'tag-chip--active' : ''}" data-tag="${t.slug}">
          #${escapeHtml(t.name)}
        </button>
      `)
      .join("");

    tagChipsMount.innerHTML = chipsHtml;

    // Gắn sự kiện lọc tag
    tagChipsMount.querySelectorAll(".tag-chip").forEach((btn) => {
      btn.addEventListener("click", function () {
        tagChipsMount.querySelectorAll(".tag-chip").forEach((b) => b.classList.remove("tag-chip--active"));
        this.classList.add("tag-chip--active");
        currentTagSlug = this.dataset.tag;
        renderArticlesList();
      });
    });
  }

  // ============================================================================
  // C. SẮP XẾP BÀI VIẾT
  // ============================================================================
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      currentSort = this.value;
      renderArticlesList();
    });
  }

  // ============================================================================
  // D. RENDER DANH SÁCH BÀI VIẾT
  // ============================================================================
  function renderArticlesList() {
    let filtered = allArticles.filter((a) => a.status === "published");

    // Lọc theo chế độ Filter
    if (filterType === "latest") {
      const now = getSystemTime();
      const twoDaysMs = 48 * 60 * 60 * 1000;
      const cutoffTime = now.getTime() - twoDaysMs;

      filtered = filtered.filter((a) => {
        const itemTime = new Date(String(a.published_at || a.created_at).replace(" ", "T")).getTime();
        return !isNaN(itemTime) && itemTime >= cutoffTime && itemTime <= now.getTime();
      });
    } else if (filterType === "notable") {
      filtered = filtered.filter((a) => a.is_notable_event === true);
    } else if (currentCategory) {
      filtered = filtered.filter((a) => a.category_id === currentCategory.id);
    }

    // Lọc theo tag
    if (currentTagSlug) {
      filtered = filtered.filter((a) => Array.isArray(a.tags) && a.tags.some(t => t.slug === currentTagSlug));
    }

    // Sắp xếp
    if (currentSort === "views") {
      filtered.sort((a, b) => getViews(b) - getViews(a));
    } else {
      filtered.sort((a, b) => new Date(String(b.published_at || b.created_at).replace(" ", "T")) - new Date(String(a.published_at || a.created_at).replace(" ", "T")));
    }

    if (categoryMetaCount) {
      categoryMetaCount.textContent = `${filtered.length} bài viết`;
    }

    const featuredMount = document.getElementById("category-featured-mount");
    const gridMount = document.getElementById("category-grid-mount");
    const emptyMount = document.getElementById("category-empty-mount");
    const endNotice = document.getElementById("category-end-notice");

    if (filtered.length === 0) {
      if (featuredMount) featuredMount.style.display = "none";
      if (gridMount) gridMount.innerHTML = "";
      if (emptyMount) emptyMount.style.display = "block";
      if (endNotice) endNotice.style.display = "none";
      return;
    }

    if (emptyMount) emptyMount.style.display = "none";

    // Bài tiêu điểm (bài đầu tiên)
    const featuredArticle = filtered[0];
    const featCat = getCategory(featuredArticle.category_id);
    const featAuthor = getAuthor(featuredArticle);

    if (featuredMount) {
      featuredMount.style.display = "block";
      featuredMount.innerHTML = `
        <article class="article-card category-feature">
          <a href="${getArticleDetailUrl(featuredArticle)}" class="card-link" style="display: block;">
            <div class="hero-grid" style="padding:0; border:none;">
              ${renderCoverImage(featuredArticle.cover_image, featuredArticle.title, "ph--16x9")}
              <div>
                <span class="eyebrow is-crimson">${escapeHtml(featCat.name)}</span>
                <h2 class="headline-lg" style="margin-top: 8px;">${escapeHtml(featuredArticle.title)}</h2>
                <p class="dek">${escapeHtml(featuredArticle.short_description || featuredArticle.summary || "")}</p>
                <div class="meta">
                  <a href="${typeof getAuthorProfileUrl === 'function' ? getAuthorProfileUrl(featAuthor) : 'author.html?username=' + encodeURIComponent(featAuthor.username || featAuthor.id)}">${escapeHtml(featAuthor.full_name)}</a>
                  <span class="dot-sep">·</span>
                  <span>${formatDate(featuredArticle.published_at || featuredArticle.created_at)}</span>
                  <span class="dot-sep">·</span>
                  <span>${formatNumber(getViews(featuredArticle))} lượt đọc</span>
                </div>
              </div>
            </div>
          </a>
        </article>
      `;
    }

    // Các bài còn lại
    const remainingArticles = filtered.slice(1);
    if (gridMount) {
      if (remainingArticles.length === 0) {
        gridMount.innerHTML = "";
      } else {
        gridMount.innerHTML = remainingArticles
          .map((a) => {
            const cat = getCategory(a.category_id);
            const author = getAuthor(a);
            return `
              <article class="article-card" style="padding-bottom: 20px;">
                <a href="${getArticleDetailUrl(a)}" class="card-link" style="display: block;">
                  ${renderCoverImage(a.cover_image, a.title, "ph--4x3")}
                  <span class="eyebrow">${escapeHtml(cat.name)}</span>
                  <h3 class="headline-md" style="margin-top: 6px;">${escapeHtml(a.title)}</h3>
                </a>
                <p class="dek" style="font-size: 13.5px; margin: 4px 0 10px;">${escapeHtml(a.short_description || a.summary || "")}</p>
                <div class="meta">
                  <a href="${typeof getAuthorProfileUrl === 'function' ? getAuthorProfileUrl(author) : 'author.html?username=' + encodeURIComponent(author.username || author.id)}">${escapeHtml(author.full_name)}</a>
                  <span class="dot-sep">·</span>
                  <span>${formatDate(a.published_at || a.created_at)}</span>
                  <span class="dot-sep">·</span>
                  <span>${formatNumber(getViews(a))} lượt đọc</span>
                </div>
              </article>
            `;
          })
          .join("");
      }
    }

    // Hiển thị thông báo khi xem hết danh sách bài mới trong 2 ngày
    if (endNotice) {
      if (filterType === "latest") {
        endNotice.style.display = "block";
        endNotice.innerHTML = `
          <div style="text-align: center; padding: 28px 0 10px; border-top: 1px solid var(--line-soft); margin-top: 24px;">
            <p style="font-family: var(--f-sans); font-size: 13.5px; color: var(--muted); margin: 0; letter-spacing: 0.2px;">
              Bạn đã xem hết những bài đăng mới nhất 2 ngày qua
            </p>
          </div>
        `;
      } else {
        endNotice.style.display = "none";
      }
    }
  }

  // ============================================================================
  // E. RENDER SIDEBAR ĐỌC NHIỀU NHẤT TRONG TUẦN & CHỦ ĐỀ ĐANG QUAN TÂM
  // ============================================================================
  const rankMount = document.getElementById("category-rank-mount");
  if (rankMount) {
    const publishedArticles = allArticles.filter((a) => a.status === "published");
    const topRanked = [...publishedArticles]
      .sort((a, b) => getViews(b) - getViews(a))
      .slice(0, 5);

    if (topRanked.length === 0) {
      rankMount.innerHTML = `<p class="meta">Chưa có bài viết nổi bật.</p>`;
    } else {
      rankMount.innerHTML = topRanked
        .map((a, index) => {
          const isLast = index === topRanked.length - 1 ? "no-border" : "";
          return `
            <div class="rank-item ${isLast}">
              <div>
                <h4 class="rank-item__title">
                  <a href="${getArticleDetailUrl(a)}">${escapeHtml(a.title)}</a>
                </h4>
                <div class="meta">${formatNumber(getViews(a))} lượt đọc</div>
              </div>
            </div>
          `;
        })
        .join("");
    }
  }

  // Render Từ khóa nổi bật (Tag Cloud) ở Sidebar - Điều hướng sang search.html để hiển thị toàn bộ bài viết có tag đó
  const sidebarTagMount = document.getElementById("category-tag-cloud-mount");
  if (sidebarTagMount && tags.length > 0) {
    sidebarTagMount.innerHTML = tags
      .map((t) => `
        <a href="search.html?tag=${t.slug}" class="tag-chip">
          #${escapeHtml(t.name)}
        </a>
      `)
      .join("");
  }

  // Render lần đầu
  renderArticlesList();
}

// Khởi chạy an toàn khi trang đã sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCategoryPage);
} else {
  initCategoryPage();
}
