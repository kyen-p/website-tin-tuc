/**
 * ==============================================================================
 * MẠCH TIN - FAVORITES.JS
 *
 * API:
 * GET    ../../backend/api/user/favorites.php
 * POST   ../../backend/api/user/favorites.php
 * DELETE ../../backend/api/user/favorites.php
 * ==============================================================================
 */

const FAVORITES_API = "../../backend/api/user/favorites.php";

async function initFavoritesPage() {
  // Khởi tạo Header / Footer
  if (typeof initPublicHeader === "function") {
    await initPublicHeader("favorites");
  }

  if (typeof initPublicFooter === "function") {
    await initPublicFooter();
  }

  // Lấy danh sách yêu thích từ PHP
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


              <!-- Thời gian yêu thích -->
              <div class="search-article-card__meta">
                <span>
                  Đã lưu: ${safeDate}
                </span>
              </div>

            </div>

          </article>
        `;
        })
        .join("")}
    </div>
  `;
}

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

    // Nếu đang ở trang favorites thì tải lại danh sách
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

// Khởi chạy
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFavoritesPage);
} else {
  initFavoritesPage();
}
