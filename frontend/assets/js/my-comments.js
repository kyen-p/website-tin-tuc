/**
 * ==============================================================================
 * MẠCH TIN - MY-COMMENTS.JS
 * API theo yêu cầu:
 * POST   ../../backend/api/user/comments.php
 * DELETE ../../backend/api/user/comments.php
 * ==============================================================================
 */

const COMMENTS_API = "../../backend/api/user/my-comments.php";
let activeDeleteCommentId = null;

async function initMyCommentsPage() {
  // Header
  if (typeof initPublicHeader === "function") {
    await initPublicHeader("my-comments");
  }

  // Footer
  if (typeof initPublicFooter === "function") {
    await initPublicFooter();
  }

    try {
    const response = await fetch(COMMENTS_API, { credentials: "include" });
    const result = await response.json();
    if (result.success) {
      renderMyCommentsList(result.data || []);
    } else {
      renderCommentsApiNotAvailable();
    }
  } catch (error) {
    console.error("Lỗi tải danh sách bình luận:", error);
    renderCommentsApiNotAvailable();
  }

  // Đóng dropdown khi click ra ngoài
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".comment-action-menu-wrap")) {
      document
        .querySelectorAll(".comment-action-dropdown")
        .forEach((element) => {
          element.style.display = "none";
        });
    }
  });

  renderCommentsApiNotAvailable();
}

function renderCommentsApiNotAvailable() {
  const mount = document.getElementById("my-comments-mount");

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
        Bạn chưa bình luận bài viết nào.
      </p>
    </div>
  `;
}

function renderMyCommentsList(comments) {
  const mount = document.getElementById("my-comments-mount");

  if (!mount) return;

  if (!Array.isArray(comments) || comments.length === 0) {
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
          Bạn chưa có bình luận nào trên Mạch Tin.
        </p>
      </div>
    `;

    return;
  }

  mount.innerHTML = `
    <div
      class="my-comments-list"
      style="
        display: flex;
        flex-direction: column;
        gap: 0;
      "
    >
      ${comments
        .map((comment) => {
          const articleTitle =
            comment.article_title || "Bài viết không xác định";

          const articleSlug = comment.article_slug || comment.article_id;

          const articleUrl = `../public/article-detail.html?slug=${encodeURIComponent(
            articleSlug,
          )}`;

          const viewCommentUrl = `${articleUrl}&comment_id=${comment.id}#comment-${comment.id}`;

          const safeContent =
            typeof escapeHtml === "function"
              ? escapeHtml(comment.content || "")
              : comment.content || "";

          const safeArticleTitle =
            typeof escapeHtml === "function"
              ? escapeHtml(articleTitle)
              : articleTitle;

          return `
          <div
            class="my-comment-item"
            style="
              display: flex;
              align-items: flex-start;
              gap: 16px;
              padding: 18px 0;
              border-bottom: 1px solid var(--line-soft);
            "
          >

            <!-- Nội dung -->
            <div
              class="my-comment-body"
              style="
                flex: 1;
                min-width: 0;
              "
            >

              <div
                class="my-comment-context"
                style="
                  font-size: 14.5px;
                  line-height: 1.45;
                  color: var(--ink);
                  margin-bottom: 6px;
                "
              >
                <span style="color: var(--ink-soft);">
                  Bạn đã bình luận về bài viết
                </span>

                <a
                  href="${articleUrl}"
                  class="my-comment-article-link"
                  style="
                    font-family: var(--font-serif);
                    font-weight: 600;
                    color: var(--ink);
                    text-decoration: none;
                  "
                >
                  ${safeArticleTitle}
                </a>
              </div>


              <div
                class="my-comment-content"
                style="
                  font-family: var(--f-body);
                  font-size: 14px;
                  line-height: 1.6;
                  color: var(--ink);
                  background: var(--white);
                  border-radius: 4px;
                  padding: 10px 14px;
                  border: 1px solid var(--line-soft);
                  border-left: 3px solid var(--brass);
                  word-break: break-word;
                  margin-top: 6px;
                "
              >
                ${safeContent}
              </div>

            </div>


            <!-- Actions -->
            <div
              class="my-comment-actions-wrap"
              style="
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
                margin-left: 8px;
                margin-top: 2px;
              "
            >

              <a
                href="${viewCommentUrl}"
                class="btn btn-sm btn-ghost my-comment-view-btn"
                style="
                  padding: 5px 12px;
                  font-size: 12.5px;
                  text-decoration: none;
                "
              >
                Xem
              </a>


              <div
                class="comment-action-menu-wrap"
                style="position: relative;"
              >

                <button
                  type="button"
                  class="btn btn-sm btn-ghost my-comment-menu-trigger"
                  onclick="toggleCommentActionMenu(${comment.id}, event)"
                  aria-label="Tùy chọn bình luận"
                  style="
                    width: 30px;
                    height: 30px;
                    padding: 0;
                  "
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="12" r="2"></circle>
                    <circle cx="19" cy="12" r="2"></circle>
                    <circle cx="5" cy="12" r="2"></circle>
                  </svg>
                </button>


                <div
                  id="comment-menu-${comment.id}"
                  class="comment-action-dropdown"
                  style="
                    display: none;
                    position: absolute;
                    right: 0;
                    top: 100%;
                    margin-top: 4px;
                    background: var(--paper);
                    border: 1px solid var(--line-soft);
                    border-radius: 4px;
                    z-index: 10;
                    min-width: 120px;
                    padding: 4px 0;
                  "
                >

                  <button
                    type="button"
                    onclick="openDeleteCommentModal(${comment.id})"
                    style="
                      width: 100%;
                      text-align: left;
                      background: none;
                      border: none;
                      padding: 8px 12px;
                      cursor: pointer;
                    "
                  >
                    Xóa
                  </button>

                </div>

              </div>

            </div>

          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

/**
 * Đóng / mở menu ba chấm
 */
function toggleCommentActionMenu(commentId, event) {
  if (event) {
    event.stopPropagation();
  }

  const targetMenu = document.getElementById(`comment-menu-${commentId}`);

  const isAlreadyOpen = targetMenu && targetMenu.style.display === "block";

  // Đóng các menu khác
  document.querySelectorAll(".comment-action-dropdown").forEach((element) => {
    element.style.display = "none";
  });

  // Mở menu được chọn
  if (!isAlreadyOpen && targetMenu) {
    targetMenu.style.display = "block";
  }
}

/**
 * Mở modal xóa
 */
function openDeleteCommentModal(commentId) {
  document.querySelectorAll(".comment-action-dropdown").forEach((element) => {
    element.style.display = "none";
  });

  activeDeleteCommentId = commentId;

  const modal = document.getElementById("deleteCommentModal");

  if (modal) {
    modal.classList.add("is-open");
  }
}

/**
 * Đóng modal
 */
function closeDeleteCommentModal() {
  activeDeleteCommentId = null;

  const modal = document.getElementById("deleteCommentModal");

  if (modal) {
    modal.classList.remove("is-open");
  }
}

/**
 * DELETE bình luận bằng PHP API
 */
async function confirmDeleteComment() {
  if (!activeDeleteCommentId) return;

  try {
    const response = await fetch(COMMENTS_API, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment_id: activeDeleteCommentId,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Xóa bình luận thất bại");
    }

    closeDeleteCommentModal();

    if (typeof showToast === "function") {
      showToast(result.message || "Xóa bình luận thành công!", "success");
    }

    initMyCommentsPage();
  } catch (error) {
    console.error("Lỗi xóa bình luận:", error);

    closeDeleteCommentModal();

    if (typeof showToast === "function") {
      showToast(error.message || "Xóa bình luận thất bại", "error");
    }
  }
}

// Khởi chạy
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMyCommentsPage);
} else {
  initMyCommentsPage();
}
