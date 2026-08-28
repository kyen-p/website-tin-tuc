/**
 * ==============================================================================
 * MẠCH TIN - MY-COMMENTS.JS (Quản lý và hiển thị danh sách Bình luận của tôi)
 * ==============================================================================
 */

let activeDeleteCommentId = null;

function initMyCommentsPage() {
  // 1. Kiểm tra đăng nhập (Bảo vệ tuyến đường)
  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  if (!currentUser) {
    if (typeof showToast === "function") {
      showToast("Vui lòng đăng nhập để xem danh sách bình luận của bạn", "warning");
    }
    setTimeout(() => {
      window.location.href = "../public/login.html?redirect=" + encodeURIComponent(window.location.href);
    }, 400);
    return;
  }

  // 2. Khởi tạo Header và Footer chung
  if (typeof initPublicHeader === "function") initPublicHeader("my-comments");
  if (typeof initPublicFooter === "function") initPublicFooter();

  // 3. Đóng dropdown khi click ra ngoài
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".comment-action-menu-wrap")) {
      document.querySelectorAll(".comment-action-dropdown.is-open").forEach((el) => {
        el.classList.remove("is-open");
      });
    }
  });

  // 4. Render danh sách bình luận
  renderMyCommentsList(currentUser);
}

/**
 * Hiển thị danh sách bình luận do chính người dùng hiện tại gửi
 * Sắp xếp từ mới nhất ở trên đầu (không nhóm theo ngày)
 */
function renderMyCommentsList(currentUser) {
  const mount = document.getElementById("my-comments-mount");
  if (!mount) return;

  const allComments = typeof getTable === "function" ? getTable("comments") : [];
  const allArticles = typeof getTable === "function" ? getTable("articles") : (typeof MOCK_ARTICLES !== "undefined" ? MOCK_ARTICLES : []);

  // Lọc các bình luận của user hiện tại chưa bị xóa
  const myComments = allComments
    .filter((c) => String(c.user_id) === String(currentUser.id) && !c.is_deleted)
    .sort((a, b) => {
      const timeA = new Date(String(a.created_at || "").replace(" ", "T")).getTime() || 0;
      const timeB = new Date(String(b.created_at || "").replace(" ", "T")).getTime() || 0;
      return timeB - timeA;
    });

  // Trường hợp chưa có bình luận nào
  if (myComments.length === 0) {
    mount.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 48px 16px; color: var(--ink-soft); font-size: 15px;">
        <p style="margin: 0; font-family: var(--font-serif); font-size: 17px; color: var(--ink-muted);">Bạn chưa có bình luận nào trên Mạch Tin.</p>
      </div>
    `;
    return;
  }

  mount.innerHTML = `
    <div class="my-comments-list" style="display: flex; flex-direction: column; gap: 0;">
      ${myComments.map((comment) => {
        const article = allArticles.find((a) => String(a.id) === String(comment.article_id)) || {
          id: comment.article_id,
          title: "Bài viết không xác định hoặc đã bị ẩn",
          cover_image: "../assets/img/defaults/newspaper-article.webp",
          thumbnail: "../assets/img/defaults/newspaper-article.webp"
        };

        const articleSlug = article.slug || (typeof slugify === "function" ? slugify(article.title) : "") || article.id;
        const articleUrl = `../public/article-detail.html?slug=${encodeURIComponent(articleSlug)}`;
        const viewCommentUrl = `../public/article-detail.html?slug=${encodeURIComponent(articleSlug)}&comment_id=${comment.id}#comment-${comment.id}`;
        
        const rawCover = article.cover_image || article.thumbnail || "";
        const coverHtml = typeof renderCoverImage === "function"
          ? renderCoverImage(rawCover, article.title, "ph--4x3")
          : `<div class="ph ph--4x3"><img src="${rawCover}" alt="${typeof escapeHtml === "function" ? escapeHtml(article.title) : article.title}" onerror="this.remove()"></div>`;
        const userFullName = currentUser.full_name || currentUser.name || "Bạn";

        return `
          <div class="my-comment-item" style="display: flex; align-items: flex-start; gap: 16px; padding: 18px 0; border-bottom: 1px solid var(--line-soft);">
            
            <!-- Ảnh Thumbnail bài viết (Chuẩn phong cách báo in Mạch Tin, vuông góc, nền sọc chéo .ph khi không có ảnh) -->
            <a href="${articleUrl}" class="my-comment-thumb" style="width: 82px; flex-shrink: 0; display: block; overflow: hidden; border: 1px solid var(--line-soft); background: var(--paper-alt);" title="${typeof escapeHtml === "function" ? escapeHtml(article.title) : article.title}">
              ${coverHtml}
            </a>

            <!-- Khối nội dung chính -->
            <div class="my-comment-body" style="flex: 1; min-width: 0;">
              
              <!-- Dòng tiêu đề ngữ cảnh: [Tên bạn] đã bình luận về bài viết [Tiêu đề bài báo] -->
              <div class="my-comment-context" style="font-size: 14.5px; line-height: 1.45; color: var(--ink); margin-bottom: 6px;">
                <span style="font-weight: 600; color: var(--ink);">${typeof escapeHtml === "function" ? escapeHtml(userFullName) : userFullName}</span>
                <span style="color: var(--ink-soft);"> đã bình luận về bài viết </span>
                <a href="${articleUrl}" class="my-comment-article-link" style="font-family: var(--font-serif); font-weight: 600; color: var(--ink); text-decoration: none;" onmouseover="this.style.color='var(--brass-dark)'" onmouseout="this.style.color='var(--ink)'">
                  ${typeof escapeHtml === "function" ? escapeHtml(article.title) : article.title}
                </a>
              </div>

              <!-- Nội dung bình luận của bạn - Khung trích dẫn nền trắng, bo góc nhẹ chuẩn hệ thống -->
              <div class="my-comment-content" style="font-family: var(--f-body); font-size: 14px; line-height: 1.6; color: var(--ink); background: var(--white); border-radius: 4px; padding: 10px 14px; border: 1px solid var(--line-soft); border-left: 3px solid var(--brass); word-break: break-word; margin-top: 6px;">
                ${typeof escapeHtml === "function" ? escapeHtml(comment.content) : comment.content}
              </div>

            </div>

            <!-- Phía bên phải: Nút "Xem" và Nút ba chấm "•••" -->
            <div class="my-comment-actions-wrap" style="display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: 8px; margin-top: 2px;">
              
              <!-- Nút "Xem" dẫn đến đúng bình luận trong bài -->
              <a href="${viewCommentUrl}" class="btn btn-sm btn-ghost my-comment-view-btn" style="font-family: var(--f-sans); padding: 5px 12px; font-size: 12.5px; font-weight: 500; text-decoration: none; border-radius: 4px; border: 1px solid var(--line-soft); background: var(--paper); color: var(--ink); display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s ease;" onmouseover="this.style.background='var(--bg-soft)'" onmouseout="this.style.background='var(--paper)'">
                Xem
              </a>

              <!-- Nút ba chấm ••• và dropdown -->
              <div class="comment-action-menu-wrap" style="position: relative;">
                <button type="button" class="btn btn-sm btn-ghost my-comment-menu-trigger" onclick="toggleCommentActionMenu(${comment.id}, event)" aria-label="Tùy chọn bình luận" style="width: 30px; height: 30px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 4px; border: 1px solid transparent; background: transparent; cursor: pointer; color: var(--ink-soft);" onmouseover="this.style.background='var(--bg-soft)'" onmouseout="this.style.background='transparent'">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle><circle cx="5" cy="12" r="2"></circle></svg>
                </button>

                <!-- Dropdown chỉ có duy nhất lựa chọn "Xóa" -->
                <div id="comment-menu-${comment.id}" class="comment-action-dropdown" style="display: none; position: absolute; right: 0; top: 100%; margin-top: 4px; background: var(--paper); border: 1px solid var(--line-soft); border-radius: 4px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); z-index: 10; min-width: 120px; padding: 4px 0;">
                  <button type="button" onclick="openDeleteCommentModal(${comment.id})" style="width: 100%; text-align: left; background: none; border: none; padding: 8px 12px; font-family: var(--f-sans); font-size: 12.5px; font-weight: 500; color: #e02424; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background 0.15s ease;" onmouseover="this.style.background='rgba(224, 36, 36, 0.08)'" onmouseout="this.style.background='transparent'">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span>Xóa</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        `;
      }).join("")}
    </div>
  `;
}

/**
 * Đóng mở menu 3 chấm
 */
function toggleCommentActionMenu(commentId, event) {
  if (event) event.stopPropagation();
  const targetMenu = document.getElementById(`comment-menu-${commentId}`);
  const isAlreadyOpen = targetMenu && targetMenu.style.display === "block";

  // Đóng toàn bộ các menu khác đang mở
  document.querySelectorAll(".comment-action-dropdown").forEach((el) => {
    el.style.display = "none";
  });

  if (!isAlreadyOpen && targetMenu) {
    targetMenu.style.display = "block";
  }
}

/**
 * Mở modal xác nhận xóa bình luận
 */
function openDeleteCommentModal(commentId) {
  // Đóng dropdown menu
  document.querySelectorAll(".comment-action-dropdown").forEach((el) => {
    el.style.display = "none";
  });

  activeDeleteCommentId = commentId;
  const modal = document.getElementById("deleteCommentModal");
  if (modal) {
    modal.classList.add("is-open");
  }
}

/**
 * Đóng modal xác nhận xóa bình luận
 */
function closeDeleteCommentModal() {
  activeDeleteCommentId = null;
  const modal = document.getElementById("deleteCommentModal");
  if (modal) {
    modal.classList.remove("is-open");
  }
}

/**
 * Thực hiện xóa bình luận khỏi hệ thống
 */
function confirmDeleteComment() {
  if (!activeDeleteCommentId) return;

  let comments = typeof getTable === "function" ? getTable("comments") : [];
  const targetIndex = comments.findIndex((c) => String(c.id) === String(activeDeleteCommentId));

  if (targetIndex > -1) {
    // Đánh dấu is_deleted: true hoặc gỡ bản ghi
    comments[targetIndex].is_deleted = true;
    if (typeof saveTable === "function") {
      saveTable("comments", comments);
    }

    if (typeof showToast === "function") {
      showToast("Đã xóa bình luận thành công!", "success");
    }

    closeDeleteCommentModal();

    const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    if (currentUser) {
      renderMyCommentsList(currentUser);
    }
  } else {
    if (typeof showToast === "function") {
      showToast("Không tìm thấy bình luận cần xóa!", "error");
    }
    closeDeleteCommentModal();
  }
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", initMyCommentsPage);
