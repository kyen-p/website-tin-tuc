/*
==============================================================================
TÊN FILE: frontend/assets/js/favorites.js
PHÂN HỆ: Danh sách bài viết yêu thích
MÔ TẢ: Quản lý danh sách bài báo độc giả đã đánh dấu lưu trữ/yêu thích:
       - Tải danh sách bài viết yêu thích qua backend/api/user/favorites.php
       - Hiển thị danh sách thẻ bài viết đã lưu (ảnh bìa, tóm tắt, ngày lưu)
       - Thêm mới hoặc bỏ lưu bài viết trực tiếp khỏi danh sách
PHẠM VI SỬ DỤNG:
       - frontend/user/favorites.html
PHỤ THUỘC:
       - frontend/assets/js/common.js
       - backend/api/user/favorites.php
==============================================================================
*/

const FAVORITES_API = "../../backend/api/user/favorites.php";

// 1. Khởi tạo khung trang và tải danh sách yêu thích từ backend
async function initFavoritesPage() {
  // Khởi tạo thanh điều hướng đầu trang (Header) và chân trang (Footer)
  if (typeof initPublicHeader === "function") {
    await initPublicHeader("favorites");
  }

  if (typeof initPublicFooter === "function") {
    await initPublicFooter();
  }

  // Tải danh sách bài viết yêu thích từ máy chủ backend PHP
  await loadFavorites();
}

/**
 * GET: Lấy danh sách bài viết yêu thích
 */
async function loadFavorites() {
  const mount = document.getElementById("favorites-mount");

  if (!mount) return;

  mount.innerHTML = `
    <div
      class="empty-state"
      style="
        text-align: center;
        padding: 48px 16px;
        color: var(--ink-soft);
        font-size: 15px;
      "
    >
      <p
        style="
          margin: 0;
          font-family: var(--font-serif);
          font-size: 17px;
          color: var(--ink-muted);
        "
      >
        Đang tải bài viết yêu thích...
      </p>
    </div>
  `;

  try {
    const response = await fetch(FAVORITES_API, {
      method: "GET",
      credentials: "include",
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Không thể tải danh sách yêu thích");
    }

    renderFavoritesList(result.data || []);
  } catch (error) {
    console.error("Lỗi tải favorites:", error);

    mount.innerHTML = `
      <div
        class="empty-state"
        style="
          text-align: center;
          padding: 48px 16px;
          color: var(--ink-soft);
          font-size: 15px;
        "
      >
        <p
          style="
            margin: 0;
            font-family: var(--font-serif);
            font-size: 17px;
            color: var(--ink-muted);
          "
        >
          Không thể tải danh sách bài viết yêu thích.
        </p>
      </div>
    `;

    if (typeof showToast === "function") {
      showToast(error.message || "Không thể kết nối đến máy chủ", "error");
    }
  }
}

// 2. Hiển thị danh sách bài viết đã lưu
/**
 * Render danh sách từ dữ liệu PHP
 */
function renderFavoritesList(favoriteArticles) {
  const mount = document.getElementById("favorites-mount");

  if (!mount) return;

  // Không có bài yêu thích
  if (!Array.isArray(favoriteArticles) || favoriteArticles.length === 0) {
    mount.innerHTML = `
      <div
        class="empty-state"
        style="
          text-align: center;
          padding: 48px 16px;
          color: var(--ink-soft);
          font-size: 15px;
        "
      >
        <p
          style="
            margin: 0;
            font-family: var(--font-serif);
            font-size: 17px;
            color: var(--ink-muted);
          "
        >
          Bạn chưa thích bài viết nào
        </p>
      </div>
    `;

    return;
  }

  mount.innerHTML = `
    <div class="favorites-articles-list">
      ${favoriteArticles
        .map((article) => {
          const detailUrl = `../public/article-detail.html?slug=${encodeURIComponent(
            article.slug || article.id,
          )}`;

          const safeTitle =
            typeof escapeHtml === "function"
              ? escapeHtml(article.title || "")
              : article.title || "";

          const safeDescription =
            typeof escapeHtml === "function"
              ? escapeHtml(article.short_description || "")
              : article.short_description || "";

          const safeDate =
            typeof formatDate === "function"
              ? formatDate(article.created_at)
              : article.created_at || "";

          const coverHtml =
            typeof renderCoverImage === "function"
              ? renderCoverImage(article.cover_image, article.title, "ph--16x9")
              : `
              <div class="ph ph--16x9">
                ${
                  article.cover_image
                    ? `
                      <img
                        src="${article.cover_image}"
                        alt="${safeTitle}"
                      >
                    `
                    : ""
                }
              </div>
            `;

          return `
          <article
            class="search-article-card"
            style="cursor: pointer;"
            onclick="window.location.href='${detailUrl}'"
          >

            <!-- Thumbnail -->
            <a
              href="${detailUrl}"
              class="search-article-card__thumb"
              aria-label="${safeTitle}"
              onclick="event.stopPropagation();"
            >
              ${coverHtml}
            </a>


            <!-- Nội dung -->
            <div class="search-article-card__body">

              <div>

                <!-- Tiêu đề -->
                <h3
                  class="search-article-card__title"
                  style="margin: 4px 0 8px;"
                >
                  <a
                    href="${detailUrl}"
                    onclick="event.stopPropagation();"
                  >
                    ${safeTitle}
                  </a>
                </h3>


                <!-- Mô tả -->
                <p
                  class="search-article-card__dek"
                  style="margin: 0 0 8px;"
                >
                  ${safeDescription}
                </p>

              </div>


              <!-- Thời gian yêu thích & nút Bỏ lưu -->
              <div class="search-article-card__meta" style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span>
                  Đã lưu: ${safeDate}
                </span>
                <button
                  type="button"
                  class="btn-remove-favorite"
                  title="Bỏ lưu bài viết khỏi danh sách yêu thích"
                  style="background: transparent; border: 1px solid #fca5a5; color: #dc2626; border-radius: 4px; padding: 4px 10px; font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s;"
                  onmouseover="this.style.background='#fee2e2'"
                  onmouseout="this.style.background='transparent'"
                  onclick="event.stopPropagation(); removeFavorite(${article.id});"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Bỏ lưu
                </button>
              </div>

            </div>

          </article>
        `;
        })
        .join("")}
    </div>
  `;
}

// 3. Các thao tác API (thêm / xóa bài viết yêu thích)
/**
 * POST: Thêm bài viết yêu thích
 * Có thể được gọi từ các trang bài viết khác.
 */
async function addFavorite(articleId) {
  try {
    const response = await fetch(FAVORITES_API, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        article_id: articleId,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Thêm yêu thích thất bại");
    }

    if (typeof showToast === "function") {
      showToast(result.message || "Thêm yêu thích thành công", "success");
    }

    return true;
  } catch (error) {
    console.error("Lỗi thêm yêu thích:", error);

    if (typeof showToast === "function") {
      showToast(error.message || "Thêm yêu thích thất bại", "error");
    }

    return false;
  }
}

/**
 * DELETE: Xóa bài viết khỏi yêu thích
 * Có thể được gọi từ các trang khác.
 */
async function removeFavorite(articleId) {
  try {
    const response = await fetch(FAVORITES_API, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        article_id: articleId,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Xóa yêu thích thất bại");
    }

    if (typeof showToast === "function") {
      showToast(result.message || "Xóa yêu thích thành công", "success");
    }

    // Nếu người dùng đang đứng tại trang Quản lý yêu thích thì tự động tải lại danh sách
    const mount = document.getElementById("favorites-mount");

    if (mount) {
      await loadFavorites();
    }

    return true;
  } catch (error) {
    console.error("Lỗi xóa yêu thích:", error);

    if (typeof showToast === "function") {
      showToast(error.message || "Xóa yêu thích thất bại", "error");
    }

    return false;
  }
}

// Khởi chạy module khi cây cấu trúc tài liệu DOM đã sẵn sàng
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFavoritesPage);
} else {
  initFavoritesPage();
}

// Đăng ký các hàm thao tác yêu thích vào phạm vi toàn cục window để gọi từ các module khác
window.addFavorite = addFavorite;
window.removeFavorite = removeFavorite;
