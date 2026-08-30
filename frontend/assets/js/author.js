/**
 * ==============================================================================
 * MẠCH TIN - AUTHOR.JS (Logic hiển thị Trang hồ sơ thành viên / tác giả)
 * ==============================================================================
 * 1. Đọc tham số URL: ?id=... (hỗ trợ cả ID số, ID chuỗi, username)
 * 2. Mở cho TẤT CẢ mọi người (Độc giả, Phóng viên, BTV, Admin)
 * 3. Ẩn Email nếu là Độc giả, Hiện Email nếu là Phóng viên/BTV/Admin
 * 4. Thống kê bài viết (với Độc giả hiển thị 0 và thông báo rỗng)
 * ==============================================================================
 */

function initAuthorPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawKey = (urlParams.get("username") || urlParams.get("slug") || urlParams.get("id") || urlParams.get("author_id") || "").trim();

  // 1. Khởi tạo Header và Footer chung
  if (typeof initPublicHeader === "function") initPublicHeader("");
  if (typeof initPublicFooter === "function") initPublicFooter();

  // 2. Lấy dữ liệu
  const users = getTable("users") || [];
  const articles = getTable("articles") || [];
  const categories = getTable("categories") || [];

  function getViews(a) {
    return Number(a.view_count || a.views || 0);
  }

  // Tìm kiếm User (linh hoạt theo username, slug, tên tiếng Việt chuyển slug, hoặc ID)
  let user = null;
  if (rawKey) {
    user = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === rawKey.toLowerCase()) ||
        String(u.id) === String(rawKey) ||
        (u.slug && u.slug.toLowerCase() === rawKey.toLowerCase()) ||
        (typeof slugify === "function" && slugify(u.full_name || "") === rawKey.toLowerCase()) ||
        (typeof slugify === "function" && slugify(u.username || "") === rawKey.toLowerCase())
    );
  }

  // Fallback an toàn nếu không truyền ID: lấy người đầu tiên
  if (!user && users.length > 0) {
    user = users.find((u) => u.role === "reporter") || users[0];
  }

  const container = document.getElementById("author-container");
  const notFound = document.getElementById("author-not-found");

  // Nếu thực sự không có user nào trong database
  if (!user) {
    if (container) container.style.display = "none";
    if (notFound) notFound.style.display = "block";
    const notFoundDesc = document.getElementById("author-not-found-desc");
    if (notFoundDesc) notFoundDesc.textContent = "Thành viên không tồn tại trên hệ thống.";
    const breadcrumbAuthor = document.getElementById("breadcrumb-author");
    if (breadcrumbAuthor) breadcrumbAuthor.textContent = "Không tìm thấy";
    return;
  }

  const author = user;

  if (container) container.style.display = "block";
  if (notFound) notFound.style.display = "none";

  // Cập nhật tiêu đề trang
  document.title = `${author.full_name || author.username} - Hồ sơ | Mạch Tin`;

  // Helpers
  function getCategory(catId) {
    return categories.find((c) => c.id === catId) || { name: "Tin tức", slug: "" };
  }

  // ============================================================================
  // A. THỐNG KÊ & HIỂN THỊ THÔNG TIN TÁC GIẢ / ĐỘC GIẢ
  // ============================================================================
  const authorArticles = articles
    .filter((a) => String(a.author_id) === String(author.id) && a.status === "published")
    .sort((a, b) => new Date(String(b.published_at || b.created_at).replace(" ", "T")) - new Date(String(a.published_at || a.created_at).replace(" ", "T")));

  const totalViews = authorArticles.reduce((sum, a) => sum + (Number(a.views) || 0), 0);

  // 1. Breadcrumb: Trang chủ / Trang cá nhân / [Tên User]
  const breadcrumbAuthor = document.getElementById("breadcrumb-author");
  if (breadcrumbAuthor) breadcrumbAuthor.textContent = author.full_name || author.username;

  // 2. Tên & Avatar
  const authorNameEl = document.getElementById("author-name");
  if (authorNameEl) authorNameEl.textContent = author.full_name || author.username;

  const avatarMount = document.getElementById("author-avatar-mount");
  if (avatarMount && typeof renderUserAvatar === "function") {
    avatarMount.innerHTML = renderUserAvatar(author, "avatar-badge avatar-badge--xl");
  }

  // 3. Badge theo Actor
  const roleBadge = document.getElementById("author-role-badge");
  if (roleBadge) {
    const roleTextMap = {
      admin: "Quản trị viên",
      editor: "Biên tập viên",
      reporter: "Phóng viên",
      user: "Độc giả",
    };
    roleBadge.textContent = roleTextMap[author.role] || "Độc giả";
    roleBadge.className = `badge badge--${author.role || 'user'}`;
  }

  // 4. Quy tắc Email: Ẩn với Độc giả (user), Hiện với Phóng viên/BTV/Admin
  const emailText = document.getElementById("author-email");
  const emailLink = document.getElementById("author-email-link");
  const emailWrap = document.getElementById("author-email-wrap");

  if (author.role === "user" || !author.email) {
    if (emailWrap) emailWrap.style.display = "none";
  } else {
    if (emailWrap) emailWrap.style.display = "inline-flex";
    if (emailText) emailText.textContent = author.email;
    if (emailLink) emailLink.href = `mailto:${author.email}`;
  }

  // 5. Bio lấy đúng từ mock data
  const bioEl = document.getElementById("author-bio");
  if (bioEl) {
    bioEl.textContent = author.bio ? author.bio : (author.role === "user" ? "Độc giả tích cực của tòa soạn Mạch Tin." : "Phóng viên chuyên trách tòa soạn Mạch Tin.");
  }

  // 6. Số đếm thống kê (với Độc giả sẽ là 0)
  const statArticlesEl = document.getElementById("author-stat-articles");
  const statViewsEl = document.getElementById("author-stat-views");
  if (statArticlesEl) statArticlesEl.textContent = `${authorArticles.length}`;
  if (statViewsEl) statViewsEl.textContent = typeof formatNumber === "function" ? formatNumber(totalViews) : totalViews.toLocaleString("vi-VN");

  // ============================================================================
  // B. BỘ LỌC CHUYÊN MỤC CỦA TÁC GIẢ
  // ============================================================================
  const categoryFilter = document.getElementById("author-cat-filter");
  if (categoryFilter) {
    const authorCatIds = [...new Set(authorArticles.map((a) => a.category_id))];
    const authorCats = categories.filter((c) => authorCatIds.includes(c.id));

    let optionsHtml = `<option value="">Tất cả chuyên mục (${authorArticles.length})</option>`;
    authorCats.forEach((c) => {
      const count = authorArticles.filter((a) => a.category_id === c.id).length;
      optionsHtml += `<option value="${c.id}">${typeof escapeHtml === "function" ? escapeHtml(c.name) : c.name} (${count})</option>`;
    });
    categoryFilter.innerHTML = optionsHtml;

    categoryFilter.addEventListener("change", function () {
      renderAuthorArticles(this.value);
    });
  }

  // ============================================================================
  // C. RENDER DANH SÁCH BÀI VIẾT CỦA TÁC GIẢ
  // ============================================================================
  function renderAuthorArticles(filterCatId = "") {
    const listMount = document.getElementById("author-articles-mount");
    const emptyMount = document.getElementById("author-articles-empty");
    if (!listMount) return;

    let filtered = authorArticles;
    if (filterCatId) {
      filtered = filtered.filter((a) => String(a.category_id) === String(filterCatId));
    }

    if (filtered.length === 0) {
      listMount.innerHTML = "";
      if (emptyMount) {
        emptyMount.style.display = "block";
        emptyMount.innerHTML = `
          <div style="padding: 36px 16px; text-align: center; color: var(--muted); font-size: 14px;">
            Chưa có bài viết xuất bản nào trên Mạch Tin.
          </div>
        `;
      }
      return;
    }

    if (emptyMount) emptyMount.style.display = "none";

    listMount.innerHTML = filtered
      .map((a) => {
        const cat = getCategory(a.category_id);
        const safeTitle = typeof escapeHtml === "function" ? escapeHtml(a.title) : a.title;
        const safeDesc = typeof escapeHtml === "function" ? escapeHtml(a.short_description || a.summary || "") : (a.short_description || "");
        const safeDate = typeof formatDate === "function" ? formatDate(a.published_at || a.created_at) : (a.published_at || a.created_at);
        const safeViews = typeof formatNumber === "function" ? formatNumber(getViews(a)) : getViews(a);
        const coverImg = typeof renderCoverImage === "function" ? renderCoverImage(a.cover_image || a.thumbnail, a.title, "ph--4x3") : `<img src="${a.thumbnail || a.cover_image}" alt="${safeTitle}">`;

        return `
          <article class="article-card" style="padding-bottom: 20px;">
            <a href="${getArticleDetailUrl(a)}" class="card-link">
              ${coverImg}
              <span class="eyebrow">${typeof escapeHtml === "function" ? escapeHtml(cat.name) : cat.name}</span>
              <h3 class="headline-md">${safeTitle}</h3>
            </a>
            <p class="dek" style="font-size: 13.5px; margin: 4px 0 10px;">${safeDesc}</p>
            <div class="meta">
              <span>${safeDate}</span>
              <span class="dot-sep">·</span>
              <span>${safeViews} lượt đọc</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  // Render lần đầu
  renderAuthorArticles("");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuthorPage);
} else {
  initAuthorPage();
}