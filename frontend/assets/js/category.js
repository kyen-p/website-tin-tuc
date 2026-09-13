/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/category.js
 * PHÂN HỆ: Trang Chuyên mục & Lọc theo Thẻ Tag (Category & Tag Filter Module)
 * MÔ TẢ: Quản lý hiển thị danh sách bài viết theo chuyên mục, thẻ chủ đề hoặc các bộ lọc đặc biệt:
 *        1. Phân tích tham số URL: ?slug= (chuyên mục), ?tag= (thẻ tag), ?filter= (latest: 48h qua, notable: sự kiện nổi bật).
 *        2. Tải dữ liệu bài viết, chuyên mục, danh sách thẻ từ Backend API.
 *        3. Cập nhật tiêu đề trang (Document Title), Breadcrumb và Mô tả chuyên mục động.
 *        4. Hiển thị thanh cuộn thẻ tag ngang (Tag Chips Bar), điều khiển cuộn qua 2 nút trượt và xử lý sự kiện lọc nhanh.
 *        5. Render bố cục danh sách: 1 bài tiêu điểm lớn (Featured Article) phía trên và lưới bài viết phía dưới.
 *        6. Tích hợp Sidebar Đọc nhiều nhất trong tuần & Đám mây thẻ Tag qua initPublicSidebar.
 * PHẠM VI SỬ DỤNG:
 *   - frontend/public/category.html
 * PHỤ THUỘC:
 *   - frontend/assets/js/common.js (initPublicHeader, initPublicFooter, initPublicSidebar, resolveApiUrl, getArticleDetailUrl, etc.)
 *   - backend/api/public/articles.php
 *   - backend/api/public/categories.php
 *   - backend/api/public/tags.php
 * ==============================================================================
 */

async function initCategoryPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const categorySlug = urlParams.get("slug") || "";
  const filterType = urlParams.get("filter") || ""; // 'latest' hoặc 'notable'
  let currentTagSlug = urlParams.get("tag") || "";
  let currentPage = parseInt(urlParams.get("page") || "1", 10);
  if (isNaN(currentPage) || currentPage < 1) currentPage = 1;

  // ==============================================================================
  // KHỐI 1: KHỞI TẠO KHUNG TRANG & TẢI DỮ LIỆU TỪ BACKEND
  // ==============================================================================
  if (typeof initPublicHeader === "function") {
    await initPublicHeader(categorySlug);
  }
  if (typeof initPublicFooter === "function") {
    await initPublicFooter();
  }

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

  // ==============================================================================
  // KHỐI 2: CÁC TIỆN ÍCH HỖ TRỢ TRÍCH XUẤT THÔNG TIN BÀI VIẾT
  // ==============================================================================
  function getCategory(catId) {
    return categories.find((c) => c.id === catId) || { name: "Tin tức", slug: "" };
  }

  function getAuthor(article) {
    return (article && article.author) || { full_name: "Ban Biên Tập", id: "" };
  }

  function getViews(article) {
    return typeof getArticleViews === "function" ? getArticleViews(article) : Number(article?.view_count || 0);
  }

  // ==============================================================================
  // KHỐI 3: RENDER TIÊU ĐỀ CHUYÊN MỤC, BREADCRUMB & DOCUMENT.TITLE ĐỘNG
  // ==============================================================================
  const breadcrumbCategory = document.getElementById("breadcrumb-category");
  const categoryTitle = document.getElementById("category-title");
  const categoryDesc = document.getElementById("category-description");

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

  // ==============================================================================
  // KHỐI 4: RENDER BĂNG CHIP THẺ TAG (TAG CHIPS BAR)
  // ==============================================================================
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
        currentPage = 1;
        const currentUrl = new URL(window.location);
        if (currentTagSlug) {
          currentUrl.searchParams.set("tag", currentTagSlug);
        } else {
          currentUrl.searchParams.delete("tag");
        }
        currentUrl.searchParams.set("page", "1");
        window.history.pushState({}, "", currentUrl);
        renderArticlesList();
      });
    });

    // Thiết lập 2 nút điều hướng cuộn ngang (< >)
    const prevBtn = document.getElementById("category-tag-prev");
    const nextBtn = document.getElementById("category-tag-next");

    function updateTagScrollButtons() {
      if (!tagChipsMount || !prevBtn || !nextBtn) return;
      const isOverflowing = tagChipsMount.scrollWidth > tagChipsMount.clientWidth + 2;
      if (!isOverflowing) {
        prevBtn.style.display = "none";
        nextBtn.style.display = "none";
        return;
      }
      prevBtn.style.display = "inline-flex";
      nextBtn.style.display = "inline-flex";

      const atStart = tagChipsMount.scrollLeft <= 2;
      const atEnd = tagChipsMount.scrollLeft + tagChipsMount.clientWidth >= tagChipsMount.scrollWidth - 2;

      prevBtn.disabled = atStart;
      prevBtn.style.opacity = atStart ? "0.35" : "1";
      prevBtn.style.cursor = atStart ? "default" : "pointer";

      nextBtn.disabled = atEnd;
      nextBtn.style.opacity = atEnd ? "0.35" : "1";
      nextBtn.style.cursor = atEnd ? "default" : "pointer";
    }

    if (prevBtn) {
      prevBtn.onclick = () => {
        tagChipsMount.scrollBy({ left: -220, behavior: "smooth" });
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        tagChipsMount.scrollBy({ left: 220, behavior: "smooth" });
      };
    }

    tagChipsMount.addEventListener("scroll", updateTagScrollButtons, { passive: true });
    window.addEventListener("resize", updateTagScrollButtons);

    // Tự động cuộn chip đang kích hoạt vào giữa tầm nhìn nếu có
    const activeChip = tagChipsMount.querySelector(".tag-chip--active");
    if (activeChip && activeChip.dataset.tag) {
      setTimeout(() => {
        activeChip.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }, 100);
    }

    // Cập nhật trạng thái hiển thị của 2 nút trượt ban đầu
    setTimeout(updateTagScrollButtons, 60);
  }

  // ==============================================================================
  // KHỐI 5: LỌC VÀ RENDER DANH SÁCH BÀI VIẾT (TIÊU ĐIỂM + LƯỚI BÀI VIẾT)
  // ==============================================================================
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

    // Sắp xếp bài viết mới nhất lên đầu
    filtered.sort((a, b) => new Date(String(b.published_at || b.created_at).replace(" ", "T")) - new Date(String(a.published_at || a.created_at).replace(" ", "T")));

    const featuredMount = document.getElementById("category-featured-mount");
    const gridMount = document.getElementById("category-grid-mount");
    const emptyMount = document.getElementById("category-empty-mount");
    const endNotice = document.getElementById("category-end-notice");
    const paginationMount = document.getElementById("category-pagination-mount");

    if (filtered.length === 0) {
      if (featuredMount) featuredMount.style.display = "none";
      if (gridMount) gridMount.innerHTML = "";
      if (emptyMount) emptyMount.style.display = "block";
      if (endNotice) endNotice.style.display = "none";
      if (paginationMount) paginationMount.style.display = "none";
      return;
    }

    if (emptyMount) emptyMount.style.display = "none";

    // Phân trang danh sách: Trang 1 gồm 1 bài Tiêu điểm + 6 bài lưới; Trang 2+ gồm 6 bài lưới
    const PAGE_SIZE = 6;
    const totalItems = filtered.length;
    const totalPages = totalItems <= 7 ? 1 : 1 + Math.ceil((totalItems - 7) / PAGE_SIZE);

    if (currentPage > totalPages) {
      currentPage = Math.max(1, totalPages);
    }

    let featuredArticle = null;
    let gridArticles = [];

    if (currentPage === 1) {
      featuredArticle = filtered[0];
      gridArticles = filtered.slice(1, 1 + PAGE_SIZE);
    } else {
      featuredArticle = null;
      const startIndex = 7 + (currentPage - 2) * PAGE_SIZE;
      gridArticles = filtered.slice(startIndex, startIndex + PAGE_SIZE);
    }

    // Bước 1: Render Bài tiêu điểm nổi bật (Featured Article - kích thước lớn, chỉ hiển thị ở trang 1)
    if (featuredMount) {
      if (featuredArticle) {
        featuredMount.style.display = "block";
        const featCat = getCategory(featuredArticle.category_id);
        const featAuthor = getAuthor(featuredArticle);
        featuredMount.innerHTML = `
          <article class="article-card category-feature">
            <a href="${getArticleDetailUrl(featuredArticle)}" class="card-link" style="display: block;">
              <div class="hero-grid" style="padding:0; border:none;">
                ${renderCoverImage(featuredArticle.cover_image, featuredArticle.title, "ph--16x9")}
                <div>
                  <span class="eyebrow is-crimson">${escapeHtml(featCat.name)}</span>
                  <h2 class="headline-lg" style="margin-top: 8px;">${escapeHtml(featuredArticle.title)}</h2>
                  <p class="dek">${escapeHtml(featuredArticle.short_description || "")}</p>
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
      } else {
        featuredMount.style.display = "none";
        featuredMount.innerHTML = "";
      }
    }

    // Bước 2: Render các bài viết còn lại trong trang dưới dạng lưới thẻ chuẩn (Grid Cards)
    if (gridMount) {
      if (gridArticles.length === 0) {
        gridMount.innerHTML = "";
      } else {
        gridMount.innerHTML = gridArticles
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
                <p class="dek" style="font-size: 13.5px; margin: 4px 0 10px;">${escapeHtml(a.short_description || "")}</p>
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

    // Bước 3: Render thanh phân trang số dùng chung (Pagination Controls)
    if (typeof renderPublicPagination === "function") {
      renderPublicPagination("category-pagination-mount", {
        currentPage,
        totalPages,
        totalRecords: totalItems,
        scrollTarget: "#category-title",
        onPageChange: (newPage) => {
          currentPage = newPage;
          const currentUrl = new URL(window.location);
          currentUrl.searchParams.set("page", String(newPage));
          window.history.pushState({}, "", currentUrl);
          renderArticlesList();
        }
      });
    }

    // Hiển thị thông báo khi xem hết danh sách bài mới trong 2 ngày (chỉ ở trang cuối)
    if (endNotice) {
      if (filterType === "latest" && currentPage >= totalPages) {
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

  // Bắt sự kiện back/forward trên trình duyệt để khôi phục trang
  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    currentPage = parseInt(params.get("page") || "1", 10) || 1;
    currentTagSlug = params.get("tag") || "";
    if (tagChipsMount) {
      tagChipsMount.querySelectorAll(".tag-chip").forEach((b) => {
        b.classList.toggle("tag-chip--active", b.dataset.tag === currentTagSlug);
      });
    }
    renderArticlesList();
  });

  // ==============================================================================
  // KHỐI 6: RENDER SIDEBAR CHUNG (ĐỌC NHIỀU NHẤT & ĐÁM MÂY THẺ TAG)
  // ==============================================================================
  await initPublicSidebar({
    rankMountId: "category-rank-mount",
    tagMountId: "category-tag-cloud-mount"
  });

  // Bước 4: Khởi tạo hiển thị danh sách bài viết theo chuyên mục lần đầu
  renderArticlesList();
}

// ==============================================================================
// KHỐI 7: KHỞI CHẠY AN TOÀN TRANG CHUYÊN MỤC
// ==============================================================================
// Bước 5: Khởi chạy module khi cây cấu trúc tài liệu DOM đã sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCategoryPage);
} else {
  initCategoryPage();
}
