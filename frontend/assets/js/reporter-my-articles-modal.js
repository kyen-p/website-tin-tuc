/**
 * reporter-my-articles-modal.js
 * Quản lý Modal Chi tiết bài viết và Modal Xác nhận xóa bản nháp cho Phóng viên
 */

(function () {
  "use strict";

  let articleIdToDelete = null;

  /**
   * Hiển thị Modal Chi tiết Bài viết của Phóng viên
   * Nội dung, Hình ảnh, Lý do từ chối (nếu có) và các nút hành động trực tiếp
   */
  function openArticleDetailModal(articleId) {
    const articles = window.ReporterMyArticles ? window.ReporterMyArticles.getAllArticles() : [];
    const categoriesMap = window.ReporterMyArticles ? window.ReporterMyArticles.getCategoriesMap() : {};

    const article = articles.find(a => Number(a.id) === Number(articleId));
    if (!article) {
      if (typeof showToast === "function") showToast("Không tìm thấy bài viết này", "warning");
      return;
    }

    const catName = categoriesMap[article.category_id] || "Thời sự";

    // Trích xuất tags
    let tagNames = [];
    if (article.tags_text && Array.isArray(article.tags_text) && article.tags_text.length > 0) {
      tagNames = article.tags_text;
    } else if (Array.isArray(article.tags)) {
      tagNames = article.tags.map(t => typeof t === "object" ? t.name : t);
    }

    const rejectionText = article.reject_reason || article.rejection_reason || "";
    const modalMount = document.getElementById("article-detail-modal-container");
    if (!modalMount) return;

    // Nút hành động dưới Modal tùy theo trạng thái bài viết
    let modalActionBtns = "";
    if (article.status === "rejected") {
      modalActionBtns = `
        <a href="write-article.html?id=${article.id}" class="admin-btn admin-btn--primary" style="background: var(--ink); color: #fff; font-weight: 700; padding: 9px 20px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Sửa bài viết ngay
        </a>
        <button type="button" class="admin-btn admin-btn--resubmit" onclick="handleResubmitFromModal(${article.id})" style="font-weight: 700; padding: 9px 20px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
          </svg>
          Gửi duyệt lại lên BTV
        </button>
      `;
    } else if (article.status === "pending") {
      modalActionBtns = `
        <button type="button" class="admin-btn admin-btn--edit" onclick="handleEditPending(${article.id})" style="font-weight: 700; padding: 9px 20px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Thu hồi về bản nháp để sửa
        </button>
      `;
    } else if (article.status === "draft") {
      modalActionBtns = `
        <button type="button" class="admin-btn admin-btn--danger" onclick="closeArticleDetailModal(); confirmDeleteDraft(${article.id}, '${typeof escapeHtml === "function" ? escapeHtml(article.title || "") : article.title}');" style="padding: 9px 16px; border-radius: 6px;">
          Xóa bản nháp
        </button>
        <a href="write-article.html?id=${article.id}" class="admin-btn admin-btn--primary" style="background: var(--ink); color: #fff; font-weight: 700; padding: 9px 20px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Tiếp tục viết bài
        </a>
      `;
    } else if (article.status === "published") {
      const articleSlug = article.slug || (typeof slugify === "function" ? slugify(article.title) : "") || article.id;
      const detailUrl = `../public/article-detail.html?slug=${encodeURIComponent(articleSlug)}`;
      modalActionBtns = `
        <a href="${detailUrl}" target="_blank" class="admin-btn admin-btn--primary" style="background: #2E7D32; color: #fff; font-weight: 700; padding: 9px 20px; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Xem bài viết đã xuất bản
        </a>
      `;
    }

    const safeTitle = typeof escapeHtml === "function" ? escapeHtml(article.title || "Chưa đặt tiêu đề") : (article.title || "");
    const safeSapo = typeof escapeHtml === "function" ? escapeHtml(article.sapo || article.short_description || article.summary || "Chưa có tóm tắt Sapo.") : (article.sapo || "");
    const timeFormatted = typeof formatDateTime === "function" ? formatDateTime(article.updated_at || article.created_at) : (article.updated_at || article.created_at || "--");

    let statusBadgeHtml = "";
    if (window.ReporterMyArticles && typeof window.ReporterMyArticles.renderStatusBadge === "function") {
      statusBadgeHtml = window.ReporterMyArticles.renderStatusBadge(article.status);
    }

    modalMount.innerHTML = `
      <div id="article-detail-modal" style="display: flex; position: fixed; inset: 0; z-index: 1050; background: rgba(19, 27, 46, 0.65); backdrop-filter: blur(3px); align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
        <div class="admin-modal-container" style="max-width: 980px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; background: #FFF; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid var(--line-soft);">
          
          <!-- Modal Header -->
          <div class="admin-modal-header" style="padding: 16px 24px; border-bottom: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--ink);">Chi tiết bài viết</h3>
                ${statusBadgeHtml}
              </div>
              <p style="margin: 0; font-size: 12px; color: var(--muted);">Xem toàn bộ nội dung, phản hồi từ Ban Biên tập và thực hiện các hành động tiếp theo.</p>
            </div>
            <button type="button" onclick="closeArticleDetailModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--muted); line-height: 1; padding: 4px;">&times;</button>
          </div>

          <!-- Modal Body (2 Cột) -->
          <div class="admin-modal-body" style="padding: 24px; overflow-y: auto; flex: 1; box-sizing: border-box;">
            <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 24px; min-width: 0;">
              
              <!-- CỘT TRÁI: NỘI DUNG BÀI VIẾT & LÝ DO TỪ CHỐI -->
              <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0;">
                
                <!-- Banner LÝ DO TỪ CHỐI NỔI BẬT NẾU BÀI BỊ TRẢ VỀ -->
                ${article.status === "rejected" && rejectionText ? `
                  <div style="background: #FFEBEE; border: 1.5px solid #FFCDD2; border-left: 4px solid #DC2626; border-radius: 6px; padding: 14px 16px; box-shadow: 0 2px 8px rgba(220, 38, 38, 0.08);">
                    <div style="display: flex; align-items: center; gap: 7px; color: #C62828; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.03em; margin-bottom: 4px;">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      Lý do yêu cầu sửa đổi từ Ban Biên tập:
                    </div>
                    <div style="font-size: 13.5px; color: #B71C1C; line-height: 1.6; font-weight: 500;">
                      ${typeof escapeHtml === "function" ? escapeHtml(rejectionText) : rejectionText}
                    </div>
                    <div style="font-size: 11.5px; color: #8F7239; margin-top: 8px; border-top: 1px dashed rgba(220, 38, 38, 0.2); padding-top: 6px;">
                       Bạn có thể bấm <strong>"Sửa bài viết ngay"</strong> ở dưới để cập nhật nội dung theo yêu cầu, sau đó gửi duyệt lại.
                    </div>
                  </div>
                ` : ""}

                <!-- Tiêu đề bài viết -->
                <div class="admin-form-group">
                  <label class="admin-form-label" style="font-weight: 700; font-size: 12px; color: var(--muted); text-transform: uppercase;">Tiêu đề bài viết:</label>
                  <div style="font-weight: 700; font-size: 16px; font-family: var(--f-serif, serif); color: var(--ink); line-height: 1.45; padding: 10px 14px; background: #FAF9F6; border: 1px solid var(--line-soft); border-radius: 6px;">
                    ${safeTitle}
                  </div>
                </div>

                <!-- Tóm tắt Sapo -->
                <div class="admin-form-group">
                  <label class="admin-form-label" style="font-weight: 700; font-size: 12px; color: var(--muted); text-transform: uppercase;">Tóm tắt (Sapo):</label>
                  <div style="font-size: 13.5px; line-height: 1.6; color: var(--ink-soft); padding: 10px 14px; background: #FAF9F6; border: 1px solid var(--line-soft); border-radius: 6px; font-style: italic;">
                    ${safeSapo}
                  </div>
                </div>

                <!-- Nội dung chi tiết -->
                <div class="admin-form-group">
                  <label class="admin-form-label" style="font-weight: 700; font-size: 12px; color: var(--muted); text-transform: uppercase;">Nội dung bài viết:</label>
                  <div style="border: 1px solid var(--line-soft); border-radius: 6px; padding: 16px; background: #FFF; max-height: 320px; overflow-y: auto; font-size: 13.5px; line-height: 1.65; color: var(--ink); word-break: break-word;">
                    ${article.content || "<p style='color: var(--muted); font-style: italic;'>Chưa có nội dung chi tiết.</p>"}
                  </div>
                </div>

              </div>

              <!-- CỘT PHẢI: THÔNG TIN XUẤT BẢN & PHÂN LOẠI -->
              <div style="background: #FCFAF6; border: 1px solid var(--line-soft); border-radius: 8px; padding: 18px; display: flex; flex-direction: column; gap: 14px; min-width: 0;">
                
                <div style="font-size: 13px; font-weight: 700; color: var(--ink); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--line-soft); padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span>Thông tin phân loại</span>
                  <span style="font-size: 11px; background: rgba(30, 41, 59, 0.08); color: var(--ink); padding: 2px 6px; border-radius: 4px; font-weight: 600;">Phóng viên</span>
                </div>

                <!-- Chuyên mục -->
                <div class="admin-form-group">
                  <div style="color: var(--muted); font-size: 12px; margin-bottom: 3px; font-weight: 600;">Chuyên mục:</div>
                  <div style="padding: 7px 12px; background: #FFF; border: 1px solid var(--line-soft); border-radius: 6px; font-weight: 600; color: var(--ink); font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">
                    <svg style="width: 14px; height: 14px; color: var(--brass);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>${typeof escapeHtml === "function" ? escapeHtml(catName) : catName}</span>
                  </div>
                </div>

                <!-- Thẻ Tag -->
                <div class="admin-form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-weight: 600; font-size: 12px; color: var(--muted);">Thẻ Tag bài viết:</span>
                    <span style="font-size: 11px; font-family: var(--f-mono); color: var(--muted); font-weight: 600;">${tagNames.length} thẻ</span>
                  </div>

                  <div style="min-height: 42px; padding: 8px 10px; background: #FFF; border: 1px solid var(--line-soft); border-radius: 6px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                    ${tagNames.length > 0 ? tagNames.map(t => `
                      <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(184, 147, 79, 0.12); border: 1px solid rgba(184, 147, 79, 0.35); color: #8F7239; font-weight: 600; font-size: 12px; padding: 3px 9px; border-radius: 12px;">
                        #${typeof escapeHtml === "function" ? escapeHtml(t) : t}
                      </span>
                    `).join("") : `<span style="font-size: 12px; color: var(--muted); font-style: italic;">Chưa có thẻ tag nào</span>`}
                  </div>
                </div>

                <!-- Thời gian cập nhật / nộp -->
                <div style="font-size: 12.5px; border-top: 1px dashed var(--line-soft); padding-top: 10px;">
                  <div style="color: var(--muted); margin-bottom: 3px;">Thời gian cập nhật:</div>
                  <div style="font-family: var(--f-mono); color: var(--ink); font-weight: 600;">
                    ${timeFormatted}
                  </div>
                </div>

                <!-- Trạng thái quy trình -->
                <div style="background: rgba(184, 147, 79, 0.08); border: 1px solid rgba(184, 147, 79, 0.25); border-radius: 6px; padding: 12px; font-size: 12px; color: #78350F; line-height: 1.55;">
                  ${article.status === "rejected" ? `
                    <strong>Lưu ý:</strong> Bài viết đang bị trả về từ Ban Biên tập. Hãy đọc kỹ lý do, chỉnh sửa và bấm <em>"Gửi duyệt lại"</em> để BTV thẩm định lần tiếp theo.
                  ` : article.status === "pending" ? `
                    <strong>Trạng thái:</strong> Bài viết đang nằm trong hàng đợi thẩm định của Ban Biên tập. Bạn có thể thu hồi về bản nháp nếu muốn chỉnh sửa trước khi BTV duyệt.
                  ` : article.status === "published" ? `
                    <strong>Chúc mừng!</strong> Bài viết đã được Ban Biên tập phê duyệt và xuất bản chính thức trên Mạch Tin.
                  ` : `
                    <strong>Bản nháp:</strong> Bài viết chỉ lưu trên hệ thống của bạn, chưa được gửi tới Ban Biên tập.
                  `}
                </div>

              </div>

            </div>
          </div>

          <!-- Modal Footer: Các Nút Hành Động Ở Dưới -->
          <div class="admin-modal-footer" style="padding: 14px 24px; border-top: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <div>
              <button type="button" class="admin-btn admin-btn--secondary" onclick="closeArticleDetailModal()" style="padding: 8px 18px; border-radius: 6px; cursor: pointer;">
                ✕ Đóng
              </button>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
              ${modalActionBtns}
            </div>
          </div>

        </div>
      </div>
    `;
  }

  /**
   * Đóng Modal Chi tiết Bài viết
   */
  function closeArticleDetailModal() {
    const modalMount = document.getElementById("article-detail-modal-container");
    if (modalMount) modalMount.innerHTML = "";
  }

  /**
   * Gửi duyệt lại trực tiếp từ Modal
   */
  function handleResubmitFromModal(id) {
    if (window.ReporterMyArticles && typeof window.ReporterMyArticles.handleResubmit === "function") {
      window.ReporterMyArticles.handleResubmit(id);
    }
    closeArticleDetailModal();
  }

  /**
   * Bật Modal xác nhận xóa bài nháp
   */
  function confirmDeleteDraft(id, title) {
    articleIdToDelete = id;
    const container = document.getElementById("delete-modal-container");
    if (!container) return;

    const safeTitle = typeof escapeHtml === "function" ? escapeHtml(title || "Bài viết này") : (title || "Bài viết này");

    container.innerHTML = `
      <div class="modal-overlay is-open" id="delete-modal" onclick="if(event.target === this) closeDeleteModal()">
        <div class="modal-box" style="max-width: 480px;">
          <div class="modal-box__head">
            <h3 class="modal-box__title" style="color: var(--crimson); display: flex; align-items: center; gap: 8px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 20px; height: 20px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Xác nhận xóa bản nháp
            </h3>
            <button type="button" class="modal-box__close" onclick="closeDeleteModal()" aria-label="Đóng">✕</button>
          </div>
          <div class="modal-box__body">
            <p style="font-size: 14px; color: var(--ink-soft); margin: 0; line-height: 1.6; font-family: var(--f-sans);">
              Bạn có chắc chắn muốn xóa vĩnh viễn bài nháp <strong>"${safeTitle}"</strong>? Hành động này không thể hoàn tác.
            </p>
          </div>
          <div class="modal-box__foot">
            <button type="button" class="btn btn-ghost btn-sm" onclick="closeDeleteModal()">Hủy bỏ</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="executeDeleteDraft()">Xác nhận xóa</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Đóng Modal xóa
   */
  function closeDeleteModal() {
    articleIdToDelete = null;
    const container = document.getElementById("delete-modal-container");
    if (container) container.innerHTML = "";
  }

  /**
   * Thực hiện xóa bài nháp qua Backend API
   */
  async function executeDeleteDraft() {
    if (!articleIdToDelete) return;

    try {
      const res = await fetch(resolveApiUrl("reporter/my-articles.php"), {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_id: articleIdToDelete })
      });
      const data = await res.json();
      
      closeDeleteModal();
      if (!data.success) {
        if (typeof showToast === "function") showToast(data.message || "Không thể xóa bài nháp", "error");
        return;
      }

      if (typeof showToast === "function") showToast("Đã xóa bản nháp thành công", "success");

      if (window.ReporterMyArticles && typeof window.ReporterMyArticles.reloadArticles === "function") {
        window.ReporterMyArticles.reloadArticles();
      }
    } catch (err) {
      console.error("Lỗi khi xóa bài nháp:", err);
      if (typeof showToast === "function") showToast("Lỗi kết nối khi xóa bài nháp!", "error");
    }
  }

  // Đóng modal khi bấm ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeArticleDetailModal();
      closeDeleteModal();
    }
  });

  // Đóng modal khi click ra ngoài overlay
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "article-detail-modal") {
      closeArticleDetailModal();
    }
  });

  // Xuất ra window
  window.openArticleDetailModal = openArticleDetailModal;
  window.closeArticleDetailModal = closeArticleDetailModal;
  window.handleResubmitFromModal = handleResubmitFromModal;
  window.confirmDeleteDraft = confirmDeleteDraft;
  window.closeDeleteModal = closeDeleteModal;
  window.executeDeleteDraft = executeDeleteDraft;

})();
