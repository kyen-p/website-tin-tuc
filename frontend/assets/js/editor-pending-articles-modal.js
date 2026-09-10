/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/editor-pending-articles-modal.js
 * PHÂN HỆ: Hộp thoại Thẩm định & Duyệt Bài viết Biên tập viên (Editor Pending Articles Modal)
 * MÔ TẢ: Cung cấp giao diện cửa sổ Modal tương tác thẩm định bài viết:
 *        1. Tự động sinh cấu trúc HTML Modal vào DOM (Modal đọc nội dung, Modal xác nhận xuất bản, Modal nhập lý do từ chối).
 *        2. Hiển thị chế độ Read-only toàn bộ nội dung bài viết, tóm tắt sapo, tác giả, thời gian nộp, chuyên mục và thẻ tag.
 *        3. Cho phép đánh dấu cờ "Sự kiện đáng chú ý" (is_notable_event) khi xuất bản.
 *        4. Duyệt & Xuất bản ngay qua PUT backend/api/editor/pending-articles.php (action: 'approve').
 *        5. Từ chối bài viết kèm lý do phản hồi qua PUT backend/api/editor/pending-articles.php (action: 'reject').
 *        6. Tự động gọi window.EditorPendingArticles.reloadAndRender() để cập nhật lại danh sách và huy hiệu thanh bên.
 * PHẠM VI SỬ DỤNG:
 *   - frontend/editor/pending-articles.html
 * PHỤ THUỘC:
 *   - frontend/assets/js/editor-pending-articles.js (window.EditorPendingArticles)
 *   - frontend/assets/js/common.js (resolveApiUrl, showToast, escapeHtml, formatDateTime, etc.)
 *   - backend/api/editor/pending-articles.php
 * ==============================================================================
 */

(function () {
  "use strict";

  // ==============================================================================
  // KHỐI 1: TRẠNG THÁI BÀI VIẾT ĐANG THẨM ĐỊNH
  // ==============================================================================
  let reviewingArticle = null;
  let modalSelectedTags = [];

  // ==============================================================================
  // KHỐI 2: KHỞI TẠO CẤU TRÚC DOM CHO CÁC MODAL THẨM ĐỊNH VÀ HỘP THOẠI XÁC NHẬN
  // ==============================================================================
  /**
   * Tạo cấu trúc HTML các modal thẩm định và chèn vào DOM nếu chưa tồn tại
   */
  function ensureModalsExist() {
    if (document.getElementById("modal-review-article")) return;

    const modalHtml = `
      <!-- MODAL TOÀN DIỆN: XEM NỘI DUNG & THẨM ĐỊNH DUYỆT BÀI -->
      <div id="modal-review-article" style="display: none; position: fixed; inset: 0; z-index: 1050; background: rgba(19, 27, 46, 0.65); backdrop-filter: blur(3px); align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
        <div class="admin-modal-container" style="max-width: 980px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; background: #FFF; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid var(--line-soft);">
          
          <!-- Modal Header -->
          <div class="admin-modal-header" style="padding: 16px 24px; border-bottom: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <div>
              <h3 id="modal-review-heading" style="margin: 0; font-size: 16px; font-weight: 700; color: var(--ink);">Thẩm định bài viết</h3>
              <p id="modal-review-subheading" style="margin: 2px 0 0; font-size: 12px; color: var(--muted);">Đọc duyệt nguyên bản bài viết của phóng viên. Biên tập viên thẩm định, duyệt xuất bản hoặc từ chối kèm lý do.</p>
            </div>
            <button type="button" class="btn-close-review-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--muted); line-height: 1; padding: 4px;">&times;</button>
          </div>

          <!-- Modal Body (2 Cột) -->
          <div class="admin-modal-body" style="padding: 24px; overflow-y: auto; flex: 1; box-sizing: border-box;">
            <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 24px; min-width: 0;">
              
              <!-- CỘT TRÁI: ĐỌC NỘI DUNG BÀI VIẾT NGUYÊN BẢN (READ-ONLY) -->
              <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0;">
                
                <!-- Lý do từ chối nếu có -->
                <div id="modal-rejection-banner" style="display: none; background: #FFEBEE; border-left: 3px solid #DC2626; border-radius: 4px; padding: 10px 14px;">
                  <div style="font-size: 11px; font-weight: 700; color: #C62828; text-transform: uppercase;">Lý do yêu cầu sửa đổi từ Ban Biên tập:</div>
                  <div id="modal-rejection-reason" style="font-size: 13px; color: #B71C1C; margin-top: 2px;"></div>
                </div>

                <!-- Tiêu đề bài viết -->
                <div class="admin-form-group">
                  <label class="admin-form-label" style="font-weight: 700; font-size: 12.5px; color: var(--muted); text-transform: uppercase;">Tiêu đề bài viết:</label>
                  <div id="modal-article-title-display" style="font-weight: 700; font-size: 16px; font-family: var(--f-serif, serif); color: var(--ink); line-height: 1.45; padding: 8px 12px; background: #FAF9F6; border: 1px solid var(--line-soft); border-radius: 6px;"></div>
                </div>

                <!-- Tóm tắt Sapo -->
                <div class="admin-form-group">
                  <label class="admin-form-label" style="font-weight: 700; font-size: 12.5px; color: var(--muted); text-transform: uppercase;">Tóm tắt (Sapo):</label>
                  <div id="modal-article-sapo-display" style="font-size: 13.5px; line-height: 1.6; color: var(--ink-soft); padding: 10px 12px; background: #FAF9F6; border: 1px solid var(--line-soft); border-radius: 6px; font-style: italic;"></div>
                </div>

                <!-- Nội dung chi tiết -->
                <div class="admin-form-group">
                  <label class="admin-form-label" style="font-weight: 700; font-size: 12.5px; color: var(--muted); text-transform: uppercase;">Nội dung bài viết:</label>
                  <div id="modal-article-content" style="border: 1px solid var(--line-soft); border-radius: 6px; padding: 16px; background: #FFF; max-height: 320px; overflow-y: auto; font-size: 13.5px; line-height: 1.65; color: var(--ink); word-break: break-word;"></div>
                </div>

              </div>

              <!-- CỘT PHẢI: THÔNG TIN PHÂN LOẠI & THẺ DO PHÓNG VIÊN GẮN (READ-ONLY) -->
              <div style="background: #FCFAF6; border: 1px solid var(--line-soft); border-radius: 8px; padding: 18px; display: flex; flex-direction: column; gap: 14px; min-width: 0;">
                
                <div style="font-size: 13px; font-weight: 700; color: var(--ink); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--line-soft); padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span>Thông tin xuất bản</span>
                  <span style="font-size: 11px; background: rgba(30, 41, 59, 0.08); color: var(--ink); padding: 2px 6px; border-radius: 4px; font-weight: 600;">Chế độ thẩm định</span>
                </div>

                <!-- Thông tin tác giả phóng viên -->
                <div style="font-size: 12.5px;">
                  <div style="color: var(--muted); margin-bottom: 3px;">Phóng viên thực hiện:</div>
                  <div id="modal-reporter-name" style="font-weight: 700; color: var(--ink);"></div>
                </div>

                <!-- Thời gian nộp / gửi -->
                <div style="font-size: 12.5px;">
                  <div style="color: var(--muted); margin-bottom: 3px;">Thời gian nộp bài:</div>
                  <div id="modal-submitted-time" style="font-family: var(--f-mono); color: var(--ink);"></div>
                </div>

                <!-- Chuyên mục bài viết do phóng viên chọn -->
                <div class="admin-form-group">
                  <label class="admin-form-label" style="font-weight: 700; font-size: 12.5px;">
                    Chuyên mục:
                  </label>
                  <div id="modal-category-display" style="padding: 7px 12px; background: #FFF; border: 1px solid var(--line-soft); border-radius: 6px; font-weight: 600; color: var(--ink); font-size: 13px;"></div>
                </div>

                <!-- Thẻ Tag do phóng viên gán -->
                <div class="admin-form-group">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <label class="admin-form-label" style="font-weight: 700; font-size: 12.5px; margin: 0;">Thẻ Tag bài viết:</label>
                    <span id="modal-tag-count-hint" style="font-size: 11px; font-family: var(--f-mono); color: var(--muted); font-weight: 600;">0 thẻ</span>
                  </div>

                  <!-- Container các tag của bài viết -->
                  <div id="modal-selected-tags-mount" style="min-height: 42px; padding: 8px 10px; background: #FFF; border: 1px solid var(--line-soft); border-radius: 6px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center;"></div>
                  <div style="font-size: 11px; color: var(--muted); margin-top: 5px;">
                     <em>Khi duyệt bài, nếu có tag mới do phóng viên gắn, hệ thống sẽ tự động khởi tạo vào danh mục thẻ của tòa soạn. Nếu tag không phù hợp, BTV từ chối bài và yêu cầu PV sửa.</em>
                  </div>
                </div>

                <!-- TÙY CHỌN BAN BIÊN TẬP: ĐƯA VÀO SỰ KIỆN ĐÁNG CHÚ Ý -->
                <div class="admin-form-group" style="background: #FFFDF9; border: 1.5px solid #F3DFC1; border-radius: 6px; padding: 12px; margin-top: 2px;">
                  <label class="admin-form-label" style="font-weight: 700; font-size: 12px; color: #8F7239; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 14px;">📌</span> Luồng sự kiện:
                  </label>
                  <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; user-select: none; margin: 0;">
                    <input 
                      type="checkbox" 
                      id="modal-is-notable-checkbox" 
                      style="width: 18px; height: 18px; margin-top: 2px; accent-color: #B8934F; cursor: pointer;"
                    >
                    <div>
                      <span style="font-weight: 700; font-size: 13px; color: var(--ink);">Đưa vào "Sự kiện đáng chú ý"</span>
                      <p style="font-size: 11.5px; color: var(--muted); margin: 2px 0 0; line-height: 1.45;">
                        Khi duyệt xuất bản, bài viết sẽ được đưa vào cột dòng sự kiện nổi bật do Ban Biên tập tuyển chọn ở vị trí trung tâm Trang chủ.
                      </p>
                    </div>
                  </label>
                </div>

                <!-- Ghi chú thẩm định biên tập viên -->
                <div style="background: rgba(184, 147, 79, 0.08); border: 1px solid rgba(184, 147, 79, 0.25); border-radius: 6px; padding: 10px 12px; font-size: 11.5px; color: #78350F; line-height: 1.5;">
                  <strong>Quy chuẩn tòa soạn:</strong> Biên tập viên không tự ý sửa đổi văn bản hay tag của tác giả. Nếu bài chưa đạt yêu cầu, vui lòng chọn <strong>"Từ chối bài viết"</strong> và ghi rõ lý do để phóng viên tự hoàn thiện.
                </div>

              </div>

            </div>
          </div>

          <!-- Modal Footer: Hành động -->
          <div class="admin-modal-footer" style="padding: 14px 24px; border-top: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <div>
              <button type="button" class="admin-btn admin-btn--secondary btn-close-review-modal" style="padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                ✕ Đóng
              </button>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
              <!-- Nút Từ chối nếu bài đang ở trạng thái pending -->
              <button type="button" id="btn-trigger-reject" class="admin-btn admin-btn--danger" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FECACA; font-weight: 600; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                Từ chối bài viết
              </button>
              <button type="button" id="btn-save-publish" class="admin-btn admin-btn--primary" style="background: #1B2A4A; color: #FFF; font-weight: 700; padding: 8px 22px; border-radius: 6px; cursor: pointer;">
                Duyệt & Xuất bản ngay
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- MODAL XÁC NHẬN DUYỆT & XUẤT BẢN NGAY -->
      <div id="modal-confirm-publish" style="display: none; position: fixed; inset: 0; z-index: 1150; background: rgba(19, 27, 46, 0.7); backdrop-filter: blur(3px); align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
        <div class="admin-modal-container" style="max-width: 490px; width: 100%; background: #FFF; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.35); border: 1px solid var(--line-soft);">
          <div class="admin-modal-header" style="padding: 16px 20px; border-bottom: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(27, 42, 74, 0.1); color: #1B2A4A; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px;">
                ✓
              </div>
              <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: #1B2A4A;">Xác nhận duyệt & xuất bản</h3>
            </div>
            <button type="button" style="background: none; border: none; font-size: 22px; cursor: pointer; color: var(--muted); line-height: 1;" onclick="document.getElementById('modal-confirm-publish').style.display='none'">&times;</button>
          </div>
          <div class="admin-modal-body" style="padding: 20px;">
            <p style="font-size: 13.5px; color: var(--ink); margin: 0 0 10px; line-height: 1.5;">
              Bạn có chắc chắn muốn duyệt và <strong>xuất bản ngay</strong> bài viết này lên trang chủ của báo không?
            </p>
            <div id="confirm-publish-article-title" style="font-size: 13.5px; font-weight: 700; color: #1B2A4A; padding: 10px 12px; background: #FAF8F5; border: 1px solid var(--line-soft); border-radius: 6px; font-family: var(--f-serif, serif);">
            </div>

            <!-- TÙY CHỌN SỰ KIỆN ĐÁNG CHÚ Ý TẠI POPUP XÁC NHẬN -->
            <div style="margin-top: 14px; padding: 10px 12px; background: #FFFDF9; border: 1.5px solid #F3DFC1; border-radius: 6px;">
              <label style="display: flex; align-items: center; gap: 9px; cursor: pointer; user-select: none; font-size: 13px; font-weight: 700; color: #8F7239; margin: 0;">
                <input type="checkbox" id="confirm-is-notable-checkbox" style="width: 17px; height: 17px; accent-color: #B8934F; cursor: pointer;">
                <span>Đưa vào <strong>"Sự kiện đáng chú ý"</strong> trên Trang chủ</span>
              </label>
            </div>

            <p style="font-size: 12px; color: var(--muted); margin: 10px 0 0; line-height: 1.4;">
              * Độc giả sẽ có thể đọc bài viết này ngay lập tức trên trang công khai.
            </p>
          </div>
          <div class="admin-modal-footer" style="padding: 12px 20px; border-top: 1px solid var(--line-soft); display: flex; justify-content: space-between; align-items: center; background: #FAF8F5;">
            <button type="button" class="admin-btn admin-btn--secondary" id="btn-cancel-publish-prompt" style="padding: 7px 16px; border-radius: 6px; cursor: pointer;">
              ✕ Hủy
            </button>
            <button type="button" class="admin-btn admin-btn--primary" id="btn-confirm-publish-prompt" style="background: #1B2A4A; color: #FFF; font-weight: 700; padding: 7px 20px; border-radius: 6px; cursor: pointer;">
              Đồng ý Xuất bản
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL NHẬP LÝ DO TỪ CHỐI -->
      <div id="modal-reject-reason" style="display: none; position: fixed; inset: 0; z-index: 1150; background: rgba(19, 27, 46, 0.7); backdrop-filter: blur(3px); align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
        <div class="admin-modal-container" style="max-width: 520px; width: 100%; background: #FFF; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.35); border: 1px solid var(--line-soft);">
          <div class="admin-modal-header" style="padding: 16px 20px; border-bottom: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: #DC2626;">Yêu cầu chỉnh sửa bài viết</h3>
            <button type="button" style="background: none; border: none; font-size: 22px; cursor: pointer; color: var(--muted); line-height: 1;" onclick="document.getElementById('modal-reject-reason').style.display='none'">&times;</button>
          </div>
          <div class="admin-modal-body" style="padding: 20px;">
            <p style="font-size: 13px; color: var(--ink); margin: 0 0 10px;">
              Vui lòng nhập lý do hoặc các điểm cần hoàn thiện để phóng viên tiến hành sửa đổi:
            </p>
            <textarea id="reject-reason-textarea" class="admin-form-textarea" rows="4" placeholder="Ví dụ: Cần bổ sung nguồn số liệu trích dẫn, ảnh minh họa chưa đạt yêu cầu..." style="width: 100%; font-size: 13px; padding: 10px; box-sizing: border-box;"></textarea>
          </div>
          <div class="admin-modal-footer" style="padding: 12px 20px; border-top: 1px solid var(--line-soft); display: flex; justify-content: flex-end; gap: 10px; background: #FAF8F5;">
            <button type="button" class="admin-btn admin-btn--secondary" id="btn-cancel-reject-prompt">Hủy</button>
            <button type="button" class="admin-btn" id="btn-confirm-reject-prompt" style="background: #DC2626; color: #FFF; border: none; font-weight: 700; padding: 7px 18px; border-radius: 6px; cursor: pointer;">
              Xác nhận Từ chối
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    bindModalInternalEvents();
  }

  // ==============================================================================
  // KHỐI 3: MỞ / ĐÓNG MODAL THẨM ĐỊNH & HIỂN THỊ DỮ LIỆU BÀI VIẾT READ-ONLY
  // ==============================================================================
  /**
   * Mở Modal Xem & Thẩm định bài viết
   */
  function openReviewModal(articleId) {
    ensureModalsExist();

    const allArticles = window.EditorPendingArticles ? window.EditorPendingArticles.getAllArticles() : [];
    const allCategories = window.EditorPendingArticles ? window.EditorPendingArticles.getAllCategories() : [];

    const article = allArticles.find((a) => String(a.id) === String(articleId));
    if (!article) return;

    reviewingArticle = article;

    const category = allCategories.find((c) => String(c.id) === String(article.category_id)) || {
      id: 1,
      name: "Thời sự",
    };
    const author = {
      full_name: article.author_name || article.author || "Phóng viên",
      username: article.author_username || "reporter",
      avatar: article.author_avatar || "",
    };

    // Điền dữ liệu vào Modal (Read-only view)
    const titleDisplay = document.getElementById("modal-article-title-display");
    if (titleDisplay) titleDisplay.textContent = article.title || "Chưa có tiêu đề";

    const sapoDisplay = document.getElementById("modal-article-sapo-display");
    if (sapoDisplay) sapoDisplay.textContent = article.short_description || article.sapo || "Chưa có tóm tắt Sapo";

    const contentEl = document.getElementById("modal-article-content");
    if (contentEl) contentEl.innerHTML = article.content || "<p>Chưa có nội dung chi tiết.</p>";

    // Thiết lập Checkbox Đưa vào Sự kiện đáng chú ý
    const isNotableCheckbox = document.getElementById("modal-is-notable-checkbox");
    if (isNotableCheckbox) {
      isNotableCheckbox.checked = Boolean(article.is_notable_event);
    }

    // Banner Từ chối
    const rejectBanner = document.getElementById("modal-rejection-banner");
    const rejectReasonEl = document.getElementById("modal-rejection-reason");
    if (article.status === "rejected" && article.rejection_reason) {
      if (rejectBanner) rejectBanner.style.display = "block";
      if (rejectReasonEl) rejectReasonEl.textContent = article.rejection_reason;
    } else {
      if (rejectBanner) rejectBanner.style.display = "none";
    }

    // Metadata cột phải
    const repNameEl = document.getElementById("modal-reporter-name");
    if (repNameEl) repNameEl.textContent = `${author.full_name || author.username} (@${author.username})`;

    const subTimeEl = document.getElementById("modal-submitted-time");
    if (subTimeEl) {
      subTimeEl.textContent = typeof formatDateTime === "function" ? formatDateTime(article.created_at) : (article.created_at || "");
    }

    const catDisplay = document.getElementById("modal-category-display");
    if (catDisplay) {
      catDisplay.textContent = category.name || "Thời sự";
    }

    // Nạp Tags của bài viết do phóng viên gán
    let assignedTagNames = [];
    if (article.tags && Array.isArray(article.tags)) {
      assignedTagNames = article.tags.map(t => (typeof t === "string" ? t : (t.name || ""))).filter(Boolean);
    } else if (article.tags_text && Array.isArray(article.tags_text) && article.tags_text.length > 0) {
      assignedTagNames = [...article.tags_text];
    }

    modalSelectedTags = assignedTagNames;
    renderModalTags();

    // Nút hành động ở chân Modal tùy theo status
    const rejectBtn = document.getElementById("btn-trigger-reject");
    const saveBtn = document.getElementById("btn-save-publish");

    if (article.status === "pending") {
      if (rejectBtn) rejectBtn.style.display = "inline-block";
      if (saveBtn) {
        saveBtn.textContent = "Duyệt & Xuất bản ngay";
        saveBtn.style.background = "#1B2A4A";
        saveBtn.disabled = false;
      }
    } else if (article.status === "rejected") {
      if (rejectBtn) rejectBtn.style.display = "none";
      if (saveBtn) {
        saveBtn.textContent = "Duyệt & Xuất bản ngay";
        saveBtn.style.background = "#1B2A4A";
        saveBtn.disabled = false;
      }
    } else if (article.status === "published") {
      if (rejectBtn) rejectBtn.style.display = "none";
      if (saveBtn) {
        saveBtn.textContent = "Đã xuất bản";
        saveBtn.style.background = "#2E7D32";
        saveBtn.disabled = true;
      }
    }

    const reviewModal = document.getElementById("modal-review-article");
    if (reviewModal) reviewModal.style.display = "flex";
  }

  function closeReviewModal() {
    const reviewModal = document.getElementById("modal-review-article");
    if (reviewModal) reviewModal.style.display = "none";
    reviewingArticle = null;
    modalSelectedTags = [];
  }

  /**
   * Hiển thị danh sách Thẻ Tag của bài viết (Read-only tags)
   */
  function renderModalTags() {
    const selectedMount = document.getElementById("modal-selected-tags-mount");
    const countHint = document.getElementById("modal-tag-count-hint");

    if (countHint) {
      countHint.textContent = `${modalSelectedTags.length} thẻ`;
    }

    if (selectedMount) {
      if (modalSelectedTags.length === 0) {
        selectedMount.innerHTML = `<span style="font-size: 12px; color: var(--muted); font-style: italic;">Bài viết không gắn thẻ tag nào.</span>`;
        return;
      }

      selectedMount.innerHTML = modalSelectedTags
        .map(
          (tag) => `
          <span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(184, 147, 79, 0.12); border: 1px solid rgba(184, 147, 79, 0.35); color: #8F7239; font-weight: 600; font-size: 12px; padding: 4px 10px; border-radius: 14px;">
            #${typeof escapeHtml === "function" ? escapeHtml(tag) : tag}
          </span>
        `
        )
        .join("");
    }
  }

  // ==============================================================================
  // KHỐI 4: XỬ LÝ DUYỆT XUẤT BẢN HOẶC TỪ CHỐI BÀI VIẾT QUA BACKEND API
  // ==============================================================================
  /**
   * XỬ LÝ: DUYỆT & XUẤT BẢN BÀI VIẾT QUA BACKEND API
   */
  async function handleSaveOrPublish() {
    if (!reviewingArticle) return;

    const isNotableModal = document.getElementById("modal-is-notable-checkbox");
    const isNotableConfirm = document.getElementById("confirm-is-notable-checkbox");
    const isNotableChecked = Boolean(isNotableConfirm ? isNotableConfirm.checked : (isNotableModal ? isNotableModal.checked : false));

    try {
      const res = await fetch(resolveApiUrl("editor/pending-articles.php"), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: reviewingArticle.id,
          action: "approve",
          is_notable_event: isNotableChecked
        })
      });
      const result = await res.json();
      if (!result.success) {
        if (typeof showToast === "function") showToast(result.message || "Lỗi khi duyệt bài viết", "error");
        return;
      }

      const notableMsg = isNotableChecked ? " (Đã đưa vào Sự kiện đáng chú ý)" : "";
      if (typeof showToast === "function") {
        showToast(`Đã duyệt và xuất bản bài viết "${reviewingArticle.title}" thành công${notableMsg}!`, "success");
      }

      closeReviewModal();
      if (window.EditorPendingArticles && typeof window.EditorPendingArticles.reloadAndRender === "function") {
        await window.EditorPendingArticles.reloadAndRender();
      }
    } catch (err) {
      console.error("Lỗi duyệt bài viết:", err);
      if (typeof showToast === "function") showToast("Lỗi kết nối khi duyệt bài viết", "error");
    }
  }

  /**
   * XỬ LÝ: TỪ CHỐI BÀI VIẾT QUA BACKEND API
   */
  async function handleConfirmReject() {
    if (!reviewingArticle) return;

    const reasonEl = document.getElementById("reject-reason-textarea");
    const reason = reasonEl ? reasonEl.value.trim() : "";
    if (!reason) {
      if (typeof showToast === "function") showToast("Vui lòng nhập lý do từ chối để phóng viên chỉnh sửa lại!", "warning");
      return;
    }

    try {
      const res = await fetch(resolveApiUrl("editor/pending-articles.php"), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: reviewingArticle.id,
          action: "reject",
          rejection_reason: reason
        })
      });
      const result = await res.json();
      if (!result.success) {
        if (typeof showToast === "function") showToast(result.message || "Lỗi khi từ chối bài viết", "error");
        return;
      }

      const rejectModal = document.getElementById("modal-reject-reason");
      if (rejectModal) rejectModal.style.display = "none";
      closeReviewModal();

      if (typeof showToast === "function") {
        showToast("Đã từ chối bài viết và gửi lý do cho phóng viên!", "info");
      }

      if (window.EditorPendingArticles && typeof window.EditorPendingArticles.reloadAndRender === "function") {
        await window.EditorPendingArticles.reloadAndRender();
      }
    } catch (err) {
      console.error("Lỗi từ chối bài viết:", err);
      if (typeof showToast === "function") showToast("Lỗi kết nối khi từ chối bài viết", "error");
    }
  }

  function triggerRejectModal() {
    ensureModalsExist();
    const textarea = document.getElementById("reject-reason-textarea");
    if (textarea) textarea.value = "";
    const rejectModal = document.getElementById("modal-reject-reason");
    if (rejectModal) rejectModal.style.display = "flex";
  }

  function closeRejectModal() {
    const rejectModal = document.getElementById("modal-reject-reason");
    if (rejectModal) rejectModal.style.display = "none";
  }

  // ==============================================================================
  // KHỐI 5: GẮN SỰ KIỆN NỘI BỘ CHO CÁC MODAL & XUẤT HÀM TOÀN CỤC
  // ==============================================================================
  /**
   * Gắn sự kiện nội bộ cho các nút bấm trong Modal
   */
  function bindModalInternalEvents() {
    // 1. Đóng Modal khi click nút có class .btn-close-review-modal
    document.addEventListener("click", (e) => {
      const closeBtn = e.target.closest(".btn-close-review-modal");
      if (closeBtn) {
        closeReviewModal();
      }
    });

    // 2. Nút Duyệt / Xuất bản (Mở popup xác nhận)
    const btnSave = document.getElementById("btn-save-publish");
    if (btnSave) {
      btnSave.addEventListener("click", () => {
        if (!reviewingArticle) return;
        const titleEl = document.getElementById("confirm-publish-article-title");
        if (titleEl) {
          titleEl.textContent = reviewingArticle.title || "Bài viết không tiêu đề";
        }

        const isNotableModal = document.getElementById("modal-is-notable-checkbox");
        const isNotableConfirm = document.getElementById("confirm-is-notable-checkbox");
        if (isNotableModal && isNotableConfirm) {
          isNotableConfirm.checked = isNotableModal.checked;
        }

        const confirmModal = document.getElementById("modal-confirm-publish");
        if (confirmModal) confirmModal.style.display = "flex";
      });
    }

    // 3. Đồng bộ checkbox sự kiện đáng chú ý
    const isNotableConfirm = document.getElementById("confirm-is-notable-checkbox");
    if (isNotableConfirm) {
      isNotableConfirm.addEventListener("change", (e) => {
        const isNotableModal = document.getElementById("modal-is-notable-checkbox");
        if (isNotableModal) isNotableModal.checked = e.target.checked;
      });
    }

    const isNotableModal = document.getElementById("modal-is-notable-checkbox");
    if (isNotableModal) {
      isNotableModal.addEventListener("change", (e) => {
        const isNotableConfirm = document.getElementById("confirm-is-notable-checkbox");
        if (isNotableConfirm) isNotableConfirm.checked = e.target.checked;
      });
    }

    // 4. Hủy & Xác nhận Xuất bản trong Popup
    const btnCancelPublish = document.getElementById("btn-cancel-publish-prompt");
    if (btnCancelPublish) {
      btnCancelPublish.addEventListener("click", () => {
        const confirmModal = document.getElementById("modal-confirm-publish");
        if (confirmModal) confirmModal.style.display = "none";
      });
    }

    const btnConfirmPublish = document.getElementById("btn-confirm-publish-prompt");
    if (btnConfirmPublish) {
      btnConfirmPublish.addEventListener("click", () => {
        const confirmModal = document.getElementById("modal-confirm-publish");
        if (confirmModal) confirmModal.style.display = "none";
        handleSaveOrPublish();
      });
    }

    // 5. Nút Mở Popup Từ chối
    const btnTriggerReject = document.getElementById("btn-trigger-reject");
    if (btnTriggerReject) {
      btnTriggerReject.addEventListener("click", triggerRejectModal);
    }

    // 6. Hủy & Xác nhận Từ chối
    const btnCancelReject = document.getElementById("btn-cancel-reject-prompt");
    if (btnCancelReject) {
      btnCancelReject.addEventListener("click", closeRejectModal);
    }

    const btnConfirmReject = document.getElementById("btn-confirm-reject-prompt");
    if (btnConfirmReject) {
      btnConfirmReject.addEventListener("click", handleConfirmReject);
    }

    // 7. Đóng modal khi bấm ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const confirmModal = document.getElementById("modal-confirm-publish");
        const rejectModal = document.getElementById("modal-reject-reason");
        const reviewModal = document.getElementById("modal-review-article");

        if (confirmModal && confirmModal.style.display === "flex") {
          confirmModal.style.display = "none";
        } else if (rejectModal && rejectModal.style.display === "flex") {
          rejectModal.style.display = "none";
        } else if (reviewModal && reviewModal.style.display === "flex") {
          closeReviewModal();
        }
      }
    });

    // 8. Đóng modal khi click vào vùng nền mờ
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "modal-review-article") {
        closeReviewModal();
      }
      if (e.target && e.target.id === "modal-confirm-publish") {
        e.target.style.display = "none";
      }
      if (e.target && e.target.id === "modal-reject-reason") {
        e.target.style.display = "none";
      }
    });
  }

  // Khởi tạo DOM modal khi tải trang
  document.addEventListener("DOMContentLoaded", ensureModalsExist);

  // Xuất các hàm ra phạm vi toàn cục để HTML event handlers tương thích
  window.openReviewModal = openReviewModal;
  window.closeReviewModal = closeReviewModal;
  window.triggerRejectModal = triggerRejectModal;
  window.closeRejectModal = closeRejectModal;
  window.handleSaveOrPublish = handleSaveOrPublish;
  window.handleConfirmReject = handleConfirmReject;
  window.ensureReviewModalsExist = ensureModalsExist;

})();
