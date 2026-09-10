/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/admin-comments.js
 * PHÂN HỆ: Quản trị Bình luận Hệ thống (Admin Comments Management Module)
 * MÔ TẢ: Kiểm duyệt và giám sát các phản hồi, bình luận của độc giả trên toàn hệ thống bài viết:
 *        1. Tải danh sách bình luận qua admin/comments.php và danh sách bài viết đã xuất bản qua admin/published-articles.php.
 *        2. Lọc bình luận theo bài viết cụ thể, sắp xếp theo thời gian (mới nhất / cũ nhất).
 *        3. Tìm kiếm theo nội dung bình luận, tên độc giả (@username) hoặc tiêu đề bài viết.
 *        4. Xóa vĩnh viễn các bình luận vi phạm chính sách qua API DELETE admin/comments.php với modal xác nhận an toàn.
 * PHẠM VI SỬ DỤNG:
 *   - frontend/admin/comments.html
 * PHỤ THUỘC:
 *   - frontend/assets/js/common.js (resolveApiUrl, showToast, escapeHtml, renderUserAvatar, timeAgo, getArticleDetailUrl)
 *   - backend/api/admin/comments.php
 *   - backend/api/admin/published-articles.php
 * ==============================================================================
 */

(function () {
  "use strict";

  // ==============================================================================
  // KHỐI 1: KHỞI TẠO TRANG & TRẠNG THÁI BỘ LỌC BÌNH LUẬN
  // ==============================================================================
  let allComments = [];
  let allArticles = [];

  let searchQuery = "";
  let articleFilter = "all";
  let sortOrder = "newest";
  let deleteTargetCommentId = null;

  document.addEventListener("DOMContentLoaded", () => {
    initAdminCommentsPage();
  });

  async function initAdminCommentsPage() {
    await loadData();
    renderPageStructure();
    bindEvents();
    renderCommentsTable();
  }

  // ==============================================================================
  // KHỐI 2: TẢI DỮ LIỆU BÌNH LUẬN & BÀI VIẾT TỪ API
  // ==============================================================================
  async function loadData() {
    try {
      const [commentsRes, articlesRes] = await Promise.all([
        fetch(resolveApiUrl("admin/comments.php"), { credentials: "include" }).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(resolveApiUrl("admin/published-articles.php"), { credentials: "include" }).then((r) => r.json()).catch(() => ({ success: false })),
      ]);
      allComments = (commentsRes && commentsRes.data) || [];
      allArticles = (articlesRes && articlesRes.data) || [];
    } catch (e) {
      console.error("Lỗi tải dữ liệu bình luận quản trị:", e);
      allComments = [];
      allArticles = [];
    }
  }

  // ==============================================================================
  // KHỐI 3: RENDER BỐ CỤC KHUNG THẺ, BẢNG BÌNH LUẬN & MODAL XÓA
  // ==============================================================================
  function renderPageStructure() {
    const container = document.getElementById("workspace-content");
    if (!container) return;

    container.innerHTML = `
      <div class="admin-card">
        <div class="admin-card__header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 class="admin-card__title" style="margin: 0; font-size: 17px; font-weight: 700; color: var(--ink);">
              Danh sách bình luận <span class="tab-badge" id="commentTotalBadge" style="margin-left: 6px;">${allComments.length}</span>
            </h2>
            <p class="admin-card__subtitle" style="margin: 4px 0 0; font-size: 13px; color: var(--muted);">Tất cả bình luận của độc giả trên toàn hệ thống bài viết.</p>
          </div>
        </div>

        <div class="admin-card__toolbar" style="display: flex; gap: 12px; flex-wrap: wrap; padding: 14px 20px; border-bottom: 1px solid var(--line-soft); background: var(--paper-alt);">
          <div style="flex: 1; min-width: 240px; position: relative;">
            <input type="text" id="commentSearchInput" class="form-control" placeholder="Tìm theo nội dung, người bình luận..." value="${escapeHtml(searchQuery)}" style="width: 100%; font-size: 13.5px; padding-left: 36px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted);">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          <div style="min-width: 200px;">
            <select id="commentArticleSelect" class="form-control" style="width: 100%; font-size: 13.5px;">
              <option value="all">-- Tất cả bài viết --</option>
              ${allArticles.map((a) => `<option value="${a.id}" ${String(articleFilter) === String(a.id) ? "selected" : ""}>${escapeHtml(a.title)}</option>`).join("")}
            </select>
          </div>

          <div style="min-width: 150px;">
            <select id="commentSortSelect" class="form-control" style="width: 100%; font-size: 13.5px;">
              <option value="newest" ${sortOrder === "newest" ? "selected" : ""}>Mới nhất trước</option>
              <option value="oldest" ${sortOrder === "oldest" ? "selected" : ""}>Cũ nhất trước</option>
            </select>
          </div>
        </div>

        <div class="admin-card__body" style="padding: 0;">
          <div class="admin-table-responsive">
            <table class="admin-table" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="width: 220px;">Người bình luận</th>
                  <th>Nội dung bình luận</th>
                  <th style="width: 250px;">Bài viết</th>
                  <th style="width: 140px;">Thời gian</th>
                  <th style="width: 100px; text-align: center;">Thao tác</th>
                </tr>
              </thead>
              <tbody id="commentTableBody">
                <!-- Sẽ render bằng JS -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- MODAL XÁC NHẬN XÓA BÌNH LUẬN CHUẨN ADMIN -->
      <div id="deleteCommentModal" class="admin-modal-overlay" style="display:none;">
        <div class="admin-modal" style="max-width: 460px; width: 100%;">
          <div class="admin-modal__header">
            <div class="admin-modal__title" style="color: var(--crimson);">
              Xác nhận xóa bình luận
            </div>
            <button type="button" class="admin-btn-close-modal" onclick="window.closeDeleteCommentModal()" style="background:none; border:none; font-size:22px; color:var(--muted); cursor:pointer; line-height:1;">&times;</button>
          </div>
          <div class="admin-modal__body" style="padding: 18px 20px;">
            <p style="margin: 0; font-size: 14px; color: var(--ink); line-height: 1.5;">
              Bạn có chắc chắn muốn xóa vĩnh viễn bình luận này khỏi hệ thống không? Hành động này không thể hoàn tác.
            </p>
          </div>
          <div class="admin-modal__footer" style="padding: 12px 20px; display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" class="admin-btn admin-btn--default" onclick="window.closeDeleteCommentModal()">Hủy bỏ</button>
            <button type="button" class="admin-btn admin-btn--danger" id="btnConfirmDeleteComment" onclick="window.confirmDeleteComment()">Xóa vĩnh viễn</button>
          </div>
        </div>
      </div>
    `;
  }

  // ==============================================================================
  // KHỐI 4: GẮN SỰ KIỆN TÌM KIẾM, BỘ LỌC & THAO TÁC XÓA BÌNH LUẬN (API DELETE)
  // ==============================================================================
  function bindEvents() {
    const searchInput = document.getElementById("commentSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderCommentsTable();
      });
    }

    const articleSelect = document.getElementById("commentArticleSelect");
    if (articleSelect) {
      articleSelect.addEventListener("change", (e) => {
        articleFilter = e.target.value;
        renderCommentsTable();
      });
    }

    const sortSelect = document.getElementById("commentSortSelect");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        sortOrder = e.target.value;
        renderCommentsTable();
      });
    }

    window.openDeleteCommentModal = function (commentId) {
      deleteTargetCommentId = commentId;
      const modal = document.getElementById("deleteCommentModal");
      if (modal) modal.style.display = "flex";
    };

    window.closeDeleteCommentModal = function () {
      deleteTargetCommentId = null;
      const modal = document.getElementById("deleteCommentModal");
      if (modal) modal.style.display = "none";
    };

    window.confirmDeleteComment = async function () {
      if (!deleteTargetCommentId) return;

      const toDeleteId = deleteTargetCommentId;
      window.closeDeleteCommentModal();

      try {
        const res = await fetch(resolveApiUrl("admin/comments.php"), {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment_id: toDeleteId }),
        });
        const result = await res.json();
        if (result && result.success) {
          showToast(result.message || "Đã xóa bình luận thành công.", "success");
          await loadData();
          renderPageStructure();
          renderCommentsTable();
        } else {
          showToast((result && result.message) || "Xóa bình luận thất bại.", "error");
        }
      } catch (err) {
        console.error("Lỗi xóa bình luận:", err);
        showToast("Lỗi kết nối khi xóa bình luận!", "error");
      }
    };
  }

  // ==============================================================================
  // KHỐI 5: LỌC DỮ LIỆU, SẮP XẾP & RENDER CÁC HÀNG BẢNG BÌNH LUẬN
  // ==============================================================================
  function renderCommentsTable() {
    const tbody = document.getElementById("commentTableBody");
    if (!tbody) return;

    let filtered = [...allComments];

    // Lọc theo bài viết
    if (articleFilter !== "all") {
      filtered = filtered.filter((c) => String(c.article_id) === String(articleFilter));
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery) {
      filtered = filtered.filter((c) => {
        const user = { full_name: c.full_name, username: c.username, avatar: c.avatar };
        const article = { title: c.article_title };
        const contentMatch = (c.content || "").toLowerCase().includes(searchQuery);
        const userMatch = (user.full_name || "").toLowerCase().includes(searchQuery) || (user.username || "").toLowerCase().includes(searchQuery);
        const articleMatch = (article.title || "").toLowerCase().includes(searchQuery);
        return contentMatch || userMatch || articleMatch;
      });
    }

    // Sắp xếp
    filtered.sort((a, b) => {
      const timeA = new Date(String(a.created_at).replace(" ", "T")).getTime();
      const timeB = new Date(String(b.created_at).replace(" ", "T")).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 36px 16px; color: var(--muted); font-size: 13.5px;">
            Không tìm thấy bình luận nào phù hợp.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered
      .map((c) => {
        const user = {
          full_name: c.full_name || "Độc giả",
          username: c.username || "user",
          avatar: c.avatar || ""
        };
        const article = {
          id: c.article_id,
          title: c.article_title || "Bài viết không xác định",
          slug: c.article_slug || c.article_id
        };

        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                ${renderUserAvatar(user, "avatar-badge avatar-badge--sm")}
                <div>
                  <div style="font-weight: 600; color: var(--ink); font-size: 13.5px;">${escapeHtml(user.full_name)}</div>
                  <div style="font-size: 12px; color: var(--muted); font-family: var(--f-mono);">@${escapeHtml(user.username)}</div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-size: 13.5px; color: var(--ink); line-height: 1.45; word-break: break-word;">
                ${escapeHtml(c.content)}
              </div>
            </td>
            <td>
              <a href="${typeof getArticleDetailUrl === 'function' ? getArticleDetailUrl(article, '../public/') : '../public/article-detail.html?slug=' + encodeURIComponent(article.slug)}" target="_blank" class="admin-table__link" style="font-size: 13px; font-weight: 500; color: var(--brass-dark); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${escapeHtml(article.title)}">
                ${escapeHtml(article.title)} ↗
              </a>
            </td>
            <td style="font-size: 12.5px; color: var(--muted); white-space: nowrap;">
              ${timeAgo(c.created_at)}
            </td>
            <td style="text-align: center; white-space: nowrap;">
              <button type="button" class="admin-btn admin-btn--sm admin-btn--danger" onclick="openDeleteCommentModal(${c.id})" style="padding: 5px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Xóa</span>
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  }
})();
