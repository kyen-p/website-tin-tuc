/**
 * ==============================================================================
 * MẠCH TIN - SEARCH.JS (Xử lý Tìm kiếm, Lọc thẻ Tag, Chuyên mục & Highlight từ khóa)
 * ==============================================================================
 */

async function initSearchPage() {
  // 1. Khởi tạo Header và Footer dùng chung
  if (typeof initPublicHeader === "function") await initPublicHeader("search");
  if (typeof initPublicFooter === "function") await initPublicFooter();

  // 2. Lấy tham số URL
  const urlParams = new URLSearchParams(window.location.search);
  let queryParam = (urlParams.get("q") || "").trim();
  let tagParam = (urlParams.get("tag") || "").trim();
  let selectedCategory = urlParams.get("cat") || "all";
  let selectedSort = urlParams.get("sort") || "newest";

  // 3. Lấy dữ liệu bài viết, chuyên mục & thẻ tag từ backend (PHP + MySQL).
  let tags = [];
  let articles = [];
  let categories = [];
  try {
    const [articlesRes, categoriesRes, tagsRes] = await Promise.all([
      fetch(resolveApiUrl("public/articles.php")).then((r) => r.json()),
      fetch(resolveApiUrl("public/categories.php")).then((r) => r.json()),
      fetch(resolveApiUrl("public/tags.php")).then((r) => r.json()),
    ]);
    articles = articlesRes && articlesRes.success && Array.isArray(articlesRes.data) ? articlesRes.data : [];
    categories = categoriesRes && categoriesRes.success && Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
    tags = tagsRes && tagsRes.success && Array.isArray(tagsRes.data) ? tagsRes.data : [];
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu tìm kiếm từ backend", error);
  }

  // Helper lấy tác giả (đã được API nhúng sẵn trong article.author)
  function getAuthor(article) {
    return (article && article.author) || { full_name: "Ban Biên Tập", id: 1 };
  }

  // DOM Elements
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const searchSummaryText = document.getElementById("searchSummaryText");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortFilter = document.getElementById("sortFilter");
  const searchResultsList = document.getElementById("searchResultsList");
  const hotTagsMount = document.getElementById("hotTagsMount");
  const sidebarAllTagsMount = document.getElementById("sidebarAllTagsMount");
  const topViewsMount = document.getElementById("topViewsMount");
  const breadcrumbCurrent = document.getElementById("breadcrumb-current");

  // Điền sẵn từ khóa vào ô search input
  if (searchInput) {
    searchInput.value = queryParam;
  }

  // 4. Render các thành phần tĩnh & danh mục
  setupCategoryOptions();
  renderHotTags();

  // Khởi tạo Sidebar chung đồng nhất (Đọc nhiều nhất trong tuần & Tag nổi bật)
  await initPublicSidebar({
    rankMountId: "topViewsMount",
    tagMountId: "sidebarAllTagsMount"
  });

  // 5. Lắng nghe sự kiện Lọc & Sắp xếp
  if (categoryFilter) {
    categoryFilter.addEventListener("change", (e) => {
      selectedCategory = e.target.value;
      executeSearch();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener("change", (e) => {
      selectedSort = e.target.value;
      executeSearch();
    });
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (searchInput) {
        queryParam = searchInput.value.trim();
        // Cập nhật lại URL mà không cần tải lại toàn bộ trang
        const newUrl = new URL(window.location.href);
        if (queryParam) {
          newUrl.searchParams.set("q", queryParam);
        } else {
          newUrl.searchParams.delete("q");
        }
        window.history.pushState({}, "", newUrl);
        executeSearch();
      }
    });
  }

  // 6. Thực thi tìm kiếm lần đầu khi tải trang
  executeSearch();

  // ==========================================================================
  // HÀM XỬ LÝ TÌM KIẾM & LỌC CHÍNH
  // ==========================================================================
  function executeSearch() {
    let publishedArticles = articles.filter((a) => a.status === "published");

    // A. Lọc theo Tag (nếu có tham số ?tag=...)
    let activeTagObj = null;
    if (tagParam) {
      const tagLower = tagParam.toLowerCase();
      activeTagObj = tags.find(
        (t) =>
          (t.slug && t.slug.toLowerCase() === tagLower) ||
          (t.name && t.name.toLowerCase() === tagLower) ||
          String(t.id) === tagParam
      );

      if (activeTagObj) {
        publishedArticles = publishedArticles.filter((a) =>
          Array.isArray(a.tags) && a.tags.some(
            (t) => t.id === activeTagObj.id || t.slug === activeTagObj.slug
          )
        );
      }
    }

    // B. Lọc theo Từ khóa tìm kiếm (?q=...)
    if (queryParam) {
      const qLower = removeVietnameseTones(queryParam.toLowerCase());

      publishedArticles = publishedArticles.filter((a) => {
        const titleMatch = removeVietnameseTones((a.title || "").toLowerCase()).includes(qLower);
        const summaryMatch = removeVietnameseTones((a.summary || a.short_description || "").toLowerCase()).includes(qLower);
        const contentMatch = removeVietnameseTones((a.content || "").toLowerCase()).includes(qLower);
        return titleMatch || summaryMatch || contentMatch;
      });
    }

    // C. Lọc theo Chuyên mục đã chọn
    if (selectedCategory !== "all") {
      publishedArticles = publishedArticles.filter((a) => String(a.category_id) === String(selectedCategory));
    }

    // D. Sắp xếp kết quả
    if (selectedSort === "views") {
      publishedArticles.sort((a, b) => (Number(b.views || b.view_count) || 0) - (Number(a.views || a.view_count) || 0));
    } else if (selectedSort === "oldest") {
      publishedArticles.sort((a, b) => {
        const dateA = new Date(String(a.published_at || a.created_at).replace(" ", "T")).getTime();
        const dateB = new Date(String(b.published_at || b.created_at).replace(" ", "T")).getTime();
        return dateA - dateB;
      });
    } else {
      // Mặc định: newest (mới nhất)
      publishedArticles.sort((a, b) => {
        const dateA = new Date(String(a.published_at || a.created_at).replace(" ", "T")).getTime();
        const dateB = new Date(String(b.published_at || b.created_at).replace(" ", "T")).getTime();
        return dateB - dateA;
      });
    }

    // E. Cập nhật Breadcrumb & Tiêu đề trang
    if (breadcrumbCurrent) {
      if (activeTagObj) {
        breadcrumbCurrent.textContent = `Tag: #${activeTagObj.name}`;
        document.title = `#${activeTagObj.name} - Mạch Tin`;
      } else if (queryParam) {
        breadcrumbCurrent.textContent = `Tìm kiếm: "${queryParam}"`;
        document.title = `Tìm kiếm: ${queryParam} - Mạch Tin`;
      } else {
        breadcrumbCurrent.textContent = "Tìm kiếm tin tức";
        document.title = "Tìm kiếm tin tức - Mạch Tin";
      }
    }

    // F. Cập nhật dòng Thống kê kết quả
    updateSummaryText(publishedArticles.length, queryParam, activeTagObj);

    // G. Highlight lại các chip tag đang kích hoạt
    highlightActiveTagChips(activeTagObj);

    // H. Render danh sách bài viết kết quả
    renderArticleCards(publishedArticles, queryParam);
  }

  // ==========================================================================
  // HÀM RENDER KẾT QUẢ VÀ HIGHLIGHT TỪ KHÓA
  // ==========================================================================
  function renderArticleCards(list, keyword) {
    if (!searchResultsList) return;

    if (list.length === 0) {
      searchResultsList.innerHTML = `
        <div class="search-empty-box">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px;">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <h3 class="headline-md" style="margin: 0 0 8px; font-size: 18px;">Không tìm thấy bài viết nào phù hợp</h3>
          <p class="meta" style="font-size: 13.5px; margin: 0;">
            ${keyword ? `Không có kết quả cho từ khóa "<strong>${escapeHtml(keyword)}</strong>"` : "Không có bài viết nào phù hợp với bộ lọc hiện tại."}
          </p>

          <div class="search-empty-tips">
            <strong>Gợi ý tìm kiếm:</strong>
            <ul>
              <li>Kiểm tra lại lỗi chính tả của các từ khóa.</li>
              <li>Thử sử dụng từ khóa ngắn hơn hoặc phổ biến hơn.</li>
              <li>Bấm vào các #TAG để tìm kiếm nhanh.</li>
              <li>Chọn lại bộ lọc <em>"Tất cả chuyên mục"</em>.</li>
            </ul>
          </div>
        </div>
      `;
      return;
    }

    searchResultsList.innerHTML = list
      .map((article) => {
        const cat = categories.find((c) => c.id === article.category_id) || { name: "Tin tức", slug: "tin-tuc" };
        const author = getAuthor(article);
        const safeDate = typeof formatDate === "function" ? formatDate(article.published_at || article.created_at) : article.published_at || "";
        const safeViews = (Number(article.views || article.view_count) || 0).toLocaleString("vi-VN");

        // Highlight từ khóa trong Tiêu đề và Tóm tắt nếu có từ khóa
        const rawTitle = article.title || "";
        const rawSummary = article.summary || article.short_description || "";
        const highlightedTitle = highlightKeyword(rawTitle, keyword);
        const highlightedSummary = highlightKeyword(rawSummary, keyword);

        // Lấy danh sách tag của bài viết này
        const thisArticleTagIds = articleTags.filter((at) => at.article_id === article.id).map((at) => at.tag_id);
        const thisTags = tags.filter((t) => thisArticleTagIds.includes(t.id));
        const tagsHtml = thisTags.length > 0
          ? `<div class="search-article-card__tags">
              ${thisTags.map((t) => `<a href="search.html?tag=${t.slug}" class="tag-chip" style="font-size: 11.5px; padding: 2px 7px;">#${escapeHtml(t.name)}</a>`).join("")}
            </div>`
          : "";

        const coverHtml = typeof renderCoverImage === "function"
          ? renderCoverImage(article.cover_image, article.title, "ph--16x9")
          : `<div class="ph ph--16x9"><img src="${article.cover_image || ''}" alt="${escapeHtml(article.title)}"></div>`;

        return `
          <article class="search-article-card">
            <a href="${getArticleDetailUrl(article)}" class="search-article-card__thumb" aria-label="${escapeHtml(article.title)}">
              ${coverHtml}
            </a>
            <div class="search-article-card__body">
              <div>
                <a href="category.html?slug=${cat.slug}" class="eyebrow">${escapeHtml(cat.name)}</a>
                <h3 class="search-article-card__title">
                  <a href="${getArticleDetailUrl(article)}">
                    ${highlightedTitle}
                  </a>
                </h3>
                <p class="search-article-card__dek">
                  ${highlightedSummary}
                </p>
                ${tagsHtml}
              </div>
              <div class="search-article-card__meta">
                <a href="${typeof getAuthorProfileUrl === 'function' ? getAuthorProfileUrl(author) : 'author.html?username=' + encodeURIComponent(author.username || author.id)}">${escapeHtml(author.full_name)}</a>
                <span class="dot-sep">·</span>
                <span>${safeDate}</span>
                <span class="dot-sep">·</span>
                <span>${safeViews} lượt đọc</span>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  // ==========================================================================
  // CÁC HÀM TIỆN ÍCH
  // ==========================================================================
  function highlightKeyword(text, keyword) {
    if (!text) return "";
    if (!keyword) return escapeHtml(text);

    try {
      const escapedKw = escapeRegex(keyword);
      const regex = new RegExp(`(${escapedKw})`, "gi");
      return escapeHtml(text).replace(regex, `<mark class="search-highlight">$1</mark>`);
    } catch (e) {
      return escapeHtml(text);
    }
  }

  function escapeRegex(string) {
    return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function removeVietnameseTones(str) {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  }

  function updateSummaryText(count, query, tagObj) {
    if (!searchSummaryText) return;

    let clearTagBtn = "";
    if (tagObj) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("tag");
      clearTagBtn = `<a href="${cleanUrl.toString()}" class="tag-clear-btn" title="Bỏ lọc theo thẻ này">✕</a>`;
    }

    if (tagObj && query) {
      searchSummaryText.innerHTML = `Tìm thấy <strong>${count}</strong> bài viết gắn thẻ <span class="tag-chip tag-chip--active" style="display:inline-flex; align-items:center;">#${escapeHtml(tagObj.name)}${clearTagBtn}</span> với từ khóa "<strong>${escapeHtml(query)}</strong>"`;
    } else if (tagObj) {
      searchSummaryText.innerHTML = `Tìm thấy <strong>${count}</strong> bài viết gắn thẻ <span class="tag-chip tag-chip--active" style="display:inline-flex; align-items:center;">#${escapeHtml(tagObj.name)}${clearTagBtn}</span>`;
    } else if (query) {
      searchSummaryText.innerHTML = `Tìm thấy <strong>${count}</strong> kết quả cho từ khóa "<strong>${escapeHtml(query)}</strong>"`;
    } else {
      searchSummaryText.innerHTML = `Hiển thị <strong>${count}</strong> bài viết`;
    }
  }

  function setupCategoryOptions() {
    if (!categoryFilter) return;
    categories.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      if (String(c.id) === String(selectedCategory)) opt.selected = true;
      categoryFilter.appendChild(opt);
    });
  }

  function highlightActiveTagChips(activeTagObj) {
    const allTagChips = document.querySelectorAll(".tag-chip[data-slug]");
    allTagChips.forEach((chip) => {
      if (activeTagObj && chip.getAttribute("data-slug") === activeTagObj.slug) {
        chip.classList.add("tag-chip--active");
      } else {
        chip.classList.remove("tag-chip--active");
      }
    });
  }

  function renderHotTags() {
    if (!hotTagsMount) return;
    const hotTags = tags.slice(0, 6);
    hotTagsMount.innerHTML = hotTags
      .map((t) => {
        const isActive = tagParam && (t.slug === tagParam || t.name.toLowerCase() === tagParam.toLowerCase());
        return `<a href="search.html?tag=${t.slug}" class="tag-chip ${isActive ? 'tag-chip--active' : ''}" data-slug="${t.slug}" style="font-size: 12px;">#${escapeHtml(t.name)}</a>`;
      })
      .join("");
  }
}

// Khởi chạy an toàn khi trang đã sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSearchPage);
} else {
  initSearchPage();
}
