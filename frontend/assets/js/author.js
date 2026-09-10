/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/author.js
 * PHÂN HỆ: Trang Hồ sơ Tác giả & Độc giả (Public Author/Member Profile Module)
 * MÔ TẢ: Khởi tạo và xử lý hiển thị trang hồ sơ công khai của thành viên (Độc giả, Phóng viên, Biên tập viên, Quản trị viên):
 *        1. Tiếp nhận tham số nhận diện qua URL: ?username= hoặc ?id= hoặc ?slug=.
 *        2. Gọi API public/author.php để lấy thông tin hồ sơ và danh sách bài viết đã xuất bản.
 *        3. Quy chuẩn chính sách quyền riêng tư: Ẩn email đối với Độc giả thông thường, hiển thị liên hệ đối với Phóng viên/BTV/Admin.
 *        4. Tính toán tổng lượt đọc, tổng số bài viết và danh sách các chuyên mục tác giả từng viết.
 *        5. Lọc bài viết theo chuyên mục ngay tại trang hồ sơ tác giả.
 * PHẠM VI SỬ DỤNG:
 *   - frontend/public/author.html
 * PHỤ THUỘC:
 *   - frontend/assets/js/common.js (initPublicHeader, initPublicFooter, resolveApiUrl, renderUserAvatar, renderCoverImage, etc.)
 *   - backend/api/public/author.php
 * ==============================================================================
 */

async function initAuthorPage() {
  // ==============================================================================
  // KHỐI 1: ĐỌC THAM SỐ URL & TẢI DỮ LIỆU TÁC GIẢ TỪ BACKEND
  // ==============================================================================
  const urlParams = new URLSearchParams(window.location.search);
  const rawKey = (urlParams.get("username") || urlParams.get("slug") || urlParams.get("id") || urlParams.get("author_id") || "").trim();

  // 1. Khởi tạo Header và Footer chung
  if (typeof initPublicHeader === "function") await initPublicHeader("");
  if (typeof initPublicFooter === "function") await initPublicFooter();
  function getViews(a) {
    return typeof getArticleViews === "function" ? getArticleViews(a) : Number(a?.view_count || 0);
  }

  const container = document.getElementById("author-container");
  const notFound = document.getElementById("author-not-found");

  // 2. Lấy dữ liệu tác giả + danh sách bài viết đã xuất bản từ backend (PHP + MySQL).
  //    public/authors.php nhận "id" (số) hoặc "username" - trang author.html hiện tại
  //    điều hướng chủ yếu bằng ?username=..., nên ưu tiên username khi rawKey không phải số.
  let author = null;
  let authorArticles = [];

  if (rawKey) {
    try {
      const isNumericId = /^\d+$/.test(rawKey);
      const apiUrl = resolveApiUrl(`public/author.php?${isNumericId ? "id" : "username"}=${encodeURIComponent(rawKey)}`); const res = await fetch(apiUrl);
      const result = await res.json();
      if (result && result.success && result.data) {
        author = result.data;
        authorArticles = Array.isArray(author.articles) ? author.articles : [];
      }
    } catch (error) {
      console.error("Lỗi khi tải hồ sơ tác giả từ backend", error);
    }
  }

  // Nếu thực sự không có user nào khớp
  if (!author) {
    if (container) container.style.display = "none";
    if (notFound) notFound.style.display = "block";
    const notFoundDesc = document.getElementById("author-not-found-desc");
    if (notFoundDesc) notFoundDesc.textContent = "Thành viên không tồn tại trên hệ thống.";
    const breadcrumbAuthor = document.getElementById("breadcrumb-author");
    if (breadcrumbAuthor) breadcrumbAuthor.textContent = "Không tìm thấy";
    return;
  }

  if (container) container.style.display = "block";
  if (notFound) notFound.style.display = "none";

  // Cập nhật tiêu đề trang
  document.title = `${author.full_name || author.username} - Hồ sơ | Mạch Tin`;

  // Helper lấy chuyên mục của 1 bài viết (đã được API nhúng sẵn trong a.category)
  function getCategory(a) {
    return (a && a.category) || { name: "Tin tức", slug: "" };
  }

  // ==============================================================================
  // KHỐI 2: HIỂN THỊ THÔNG TIN HỒ SƠ, VAI TRÒ & THỐNG KÊ HOẠT ĐỘNG
  // ==============================================================================
  // authorArticles đã được backend lọc sẵn status = 'published' và sắp xếp published_at DESC
  const totalViews = authorArticles.reduce((sum, a) => sum + getViews(a), 0);

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

  // 5. Bio tác giả / người dùng
  const bioEl = document.getElementById("author-bio");
  if (bioEl) {
    bioEl.textContent = (author.bio && author.bio.trim()) ? author.bio : "Chưa cập nhật tiểu sử.";
  }

  // 6. Số đếm thống kê (với Độc giả sẽ là 0)
  const statArticlesEl = document.getElementById("author-stat-articles");
  const statViewsEl = document.getElementById("author-stat-views");
  if (statArticlesEl) statArticlesEl.textContent = `${authorArticles.length}`;
  if (statViewsEl) statViewsEl.textContent = typeof formatNumber === "function" ? formatNumber(totalViews) : totalViews.toLocaleString("vi-VN");

  // ==============================================================================
  // KHỐI 3: BỘ LỌC CHUYÊN MỤC CỦA TÁC GIẢ
  // ==============================================================================
  const categoryFilter = document.getElementById("author-cat-filter");
  if (categoryFilter) {
    const authorCatsMap = new Map();
    authorArticles.forEach((a) => {
      if (a.category_id !== null && a.category_id !== undefined && !authorCatsMap.has(a.category_id)) {
        authorCatsMap.set(a.category_id, getCategory(a));
      }
    });
    const authorCats = Array.from(authorCatsMap.values());

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

  // ==============================================================================
  // KHỐI 4: RENDER DANH SÁCH BÀI VIẾT CỦA TÁC GIẢ
  // ==============================================================================
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
        const cat = getCategory(a);
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