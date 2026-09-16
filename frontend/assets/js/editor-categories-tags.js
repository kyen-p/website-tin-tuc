/*
==============================================================================
TÊN FILE: frontend/assets/js/editor-categories-tags.js
PHÂN HỆ: Quản trị chuyên mục và thẻ tag
MÔ TẢ: Cung cấp giao diện quản lý 2 cột cho Ban Biên tập:
       - Quản lý chuyên mục: Xem danh sách, thêm mới, sửa và xóa an toàn (chặn xóa khi còn bài viết)
       - Quản lý thẻ tag: Xem danh sách, thêm tag, sửa/gộp thông minh và xóa tag khỏi bài viết
       - Lọc theo tag có bài, tag rác (0 bài viết)
PHẠM VI SỬ DỤNG:
       - frontend/editor/categories-tags.html
PHỤ THUỘC:
       - frontend/assets/js/common.js
       - backend/api/editor/categories-tags.php
==============================================================================
*/

(function () {
  "use strict";

  // 1. Khởi tạo trang và trạng thái bộ lọc chuyên mục / tag
  let allCategories = [];
  let allTags = [];

  let currentCategorySearch = "";
  let currentTagSearch = "";
  let currentTagFilter = "all"; // 'all', 'has_articles', 'zero_articles'

  document.addEventListener("DOMContentLoaded", () => {
    initCategoriesTagsPage();
  });

  async function initCategoriesTagsPage() {
    await loadData();
    renderWorkspaceLayout();
    renderCategoriesSection();
    renderTagsSection();
    attachEventListeners();
  }

  // 2. Tải danh sách chuyên mục và tag kèm số lượng bài viết qua API
  async function loadData() {
    const [catRes, tagRes] = await Promise.all([
      fetch(resolveApiUrl("editor/categories-tags.php?type=categories"), { credentials: "include" }).then(r => r.json()),
      fetch(resolveApiUrl("editor/categories-tags.php?type=tags"), { credentials: "include" }).then(r => r.json())
    ]);
    allCategories = catRes.data || [];
    allTags = tagRes.data || [];
  }

  // 3. Hiển thị khung giao diện và cột chuyên mục
  /**
   * Render khung 2 cột tinh gọn
   */
  function renderWorkspaceLayout() {
    const container = document.getElementById("workspace-content");
    if (!container) return;

    container.innerHTML = `
      <!-- Khung 2 Cột Đối xứng -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;" id="cat-tag-grid">
        
        <!-- CỘT 1: QUẢN LÝ CHUYÊN MỤC -->
        <div class="admin-card" style="padding: 20px; display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--line-soft);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 style="font-size: 16px; font-weight: 700; color: var(--ink); margin: 0;">Chuyên mục</h2>
              <span id="cat-total-badge" class="admin-badge" style="background: rgba(184, 147, 79, 0.15); color: #8F7239; font-weight: 700; font-family: var(--f-mono); padding: 2px 8px; border-radius: 10px; font-size: 11.5px;">
                ${allCategories.length} mục
              </span>
            </div>
            <button type="button" class="admin-btn admin-btn--primary" id="btn-add-category" style="font-size: 12px; padding: 6px 14px; border-radius: 6px; background: #1B2A4A; color: #FFF;">
              + Thêm chuyên mục
            </button>
          </div>

          <!-- Tìm kiếm chuyên mục -->
          <div style="margin-bottom: 14px;">
            <input type="text" id="input-search-cat" class="admin-form-input" placeholder="Tìm tên chuyên mục..." style="padding: 7px 12px; font-size: 12.5px;">
          </div>

          <!-- Danh sách chuyên mục -->
          <div id="cat-list-mount" style="flex: 1; overflow-y: auto; max-height: 580px; display: flex; flex-direction: column; gap: 10px;">
            <!-- Render dynamically -->
          </div>
        </div>

        <!-- CỘT 2: QUẢN LÝ THẺ TAGS -->
        <div class="admin-card" style="padding: 20px; display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--line-soft);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 style="font-size: 16px; font-weight: 700; color: var(--ink); margin: 0;">Thẻ từ khóa (Tags)</h2>
              <span id="tag-total-badge" class="admin-badge" style="background: rgba(37, 99, 235, 0.1); color: #1D4ED8; font-weight: 700; font-family: var(--f-mono); padding: 2px 8px; border-radius: 10px; font-size: 11.5px;">
                ${allTags.length} tags
              </span>
            </div>
            <button type="button" class="admin-btn admin-btn--primary" id="btn-add-tag" style="font-size: 12px; padding: 6px 14px; border-radius: 6px; background: #1B2A4A; color: #FFF;">
              + Tạo Tag mới
            </button>
          </div>

          <!-- Bộ lọc & Tìm kiếm Tag -->
          <div style="display: flex; gap: 8px; margin-bottom: 14px;">
            <input type="text" id="input-search-tag" class="admin-form-input" placeholder="Tìm kiếm từ khóa tag..." style="padding: 7px 12px; font-size: 12.5px; flex: 1;">
            <select id="select-filter-tag" class="admin-form-select" style="padding: 7px 10px; font-size: 12px; width: 135px;">
              <option value="all">Tất cả Tags</option>
              <option value="has_articles">Đang có bài (≥1)</option>
              <option value="zero_articles">Tag rác (0 bài)</option>
            </select>
          </div>

          <!-- Danh sách Tags -->
          <div id="tag-list-mount" style="flex: 1; overflow-y: auto; max-height: 580px; display: flex; flex-direction: column; gap: 8px;">
            <!-- Render dynamically -->
          </div>
        </div>

      </div>

      <!-- MODAL THÊM / SỬA CHUYÊN MỤC -->
      <div id="modal-category" style="display: none; position: fixed; inset: 0; z-index: 1050; background: rgba(19, 27, 46, 0.65); backdrop-filter: blur(3px); align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
        <div class="admin-modal-container" style="max-width: 500px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; background: #FFF; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid var(--line-soft);">
          <div class="admin-modal-header" style="padding: 16px 22px; border-bottom: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <h3 id="modal-cat-title" style="margin: 0; font-size: 15.5px; font-weight: 700; color: var(--ink);">Thêm Chuyên mục mới</h3>
            <button type="button" class="btn-close-modal" data-target="modal-category" style="background: none; border: none; font-size: 22px; cursor: pointer; color: var(--muted); line-height: 1;">&times;</button>
          </div>
          <div class="admin-modal-body" style="padding: 22px; overflow-y: auto;">
            <input type="hidden" id="modal-cat-id" value="">
            <div class="admin-form-group" style="margin-bottom: 14px;">
              <label class="admin-form-label" style="font-weight: 600; font-size: 13px;">Tên chuyên mục <span style="color:red;">*</span>:</label>
              <input type="text" id="modal-cat-name" class="admin-form-input" placeholder="Ví dụ: Tài chính - Bất động sản" required>
            </div>
            <div class="admin-form-group" style="margin-bottom: 14px;">
              <label class="admin-form-label" style="font-weight: 600; font-size: 13px;">Đường dẫn tĩnh (Slug):</label>
              <input type="text" id="modal-cat-slug" class="admin-form-input" placeholder="tai-chinh-bat-dong-san">
              <div style="font-size: 11.5px; color: var(--muted); margin-top: 3px;">Tự động tạo từ tên nếu để trống.</div>
            </div>
            <div class="admin-form-group">
              <label class="admin-form-label" style="font-weight: 600; font-size: 13px;">Mô tả chuyên mục:</label>
              <textarea id="modal-cat-desc" class="admin-form-textarea" rows="3" placeholder="Tóm tắt nội dung và định hướng của chuyên mục..."></textarea>
            </div>
          </div>
          <div class="admin-modal-footer" style="padding: 14px 22px; border-top: 1px solid var(--line-soft); background: #FAF8F5; display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0;">
            <button type="button" class="admin-btn admin-btn--secondary btn-close-modal" data-target="modal-category">Hủy</button>
            <button type="button" class="admin-btn admin-btn--primary" id="btn-save-category" style="background: #1B2A4A; color: #FFF;">Lưu Chuyên mục</button>
          </div>
        </div>
      </div>

      <!-- MODAL THÊM / SỬA / GỘP TAG -->
      <div id="modal-tag" style="display: none; position: fixed; inset: 0; z-index: 1050; background: rgba(19, 27, 46, 0.65); backdrop-filter: blur(3px); align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
        <div class="admin-modal-container" style="max-width: 480px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; background: #FFF; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); border: 1px solid var(--line-soft);">
          <div class="admin-modal-header" style="padding: 16px 22px; border-bottom: 1px solid var(--line-soft); background: #FAF8F5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
            <h3 id="modal-tag-title" style="margin: 0; font-size: 15.5px; font-weight: 700; color: var(--ink);">Tạo Thẻ Tag mới</h3>
            <button type="button" class="btn-close-modal" data-target="modal-tag" style="background: none; border: none; font-size: 22px; cursor: pointer; color: var(--muted); line-height: 1;">&times;</button>
          </div>
          <div class="admin-modal-body" style="padding: 22px; overflow-y: auto;">
            <input type="hidden" id="modal-tag-id" value="">
            <div class="admin-form-group" style="margin-bottom: 14px;">
              <label class="admin-form-label" style="font-weight: 600; font-size: 13px;">Tên Thẻ Tag <span style="color:red;">*</span>:</label>
              <input type="text" id="modal-tag-name" class="admin-form-input" placeholder="Ví dụ: AI, TP.HCM, SEA Games..." required>
            </div>
            <div id="modal-tag-merge-hint" style="display: none; background: rgba(37, 99, 235, 0.08); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: 6px; padding: 10px 12px; font-size: 12px; color: #1D4ED8; line-height: 1.45;">
              <strong>Gộp thẻ thông minh:</strong> Nếu bạn đổi tên trùng với một thẻ tag đã có sẵn, toàn bộ bài viết sẽ tự động chuyển sang dùng thẻ đó và thẻ cũ được thu hồi sạch sẽ.
            </div>
          </div>
          <div class="admin-modal-footer" style="padding: 14px 22px; border-top: 1px solid var(--line-soft); background: #FAF8F5; display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0;">
            <button type="button" class="admin-btn admin-btn--secondary btn-close-modal" data-target="modal-tag">Hủy</button>
            <button type="button" class="admin-btn admin-btn--primary" id="btn-save-tag" style="background: #1B2A4A; color: #FFF;">Lưu Thẻ Tag</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Cột 1: Danh sách Chuyên mục
   */
  function renderCategoriesSection() {
    const mount = document.getElementById("cat-list-mount");
    const totalBadge = document.getElementById("cat-total-badge");
    if (!mount) return;

    if (totalBadge) totalBadge.textContent = `${allCategories.length} mục`;

    let list = [...allCategories];
    if (currentCategorySearch) {
      const q = currentCategorySearch.toLowerCase();
      list = list.filter((c) => (c.name || "").toLowerCase().includes(q) || (c.slug || "").toLowerCase().includes(q));
    }

    if (list.length === 0) {
      mount.innerHTML = `
        <div style="padding: 30px 16px; text-align: center; color: var(--muted); font-size: 13px; background: #FAF8F5; border-radius: 8px;">
          Không tìm thấy chuyên mục nào phù hợp.
        </div>
      `;
      return;
    }

    mount.innerHTML = list
      .map((cat) => {
        const articleCount = Number(cat.article_count) || 0;
        const canDelete = articleCount === 0;

        return `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; background: #FAF8F5; border: 1px solid var(--line-soft); border-radius: 8px; transition: all 0.15s;" onmouseover="this.style.background='#F6F3ED'" onmouseout="this.style.background='#FAF8F5'">
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
              <span style="font-weight: 700; color: var(--ink); font-size: 13.5px;">${escapeHtml(cat.name)}</span>
              <span style="font-size: 11.5px; font-family: var(--f-mono); color: var(--muted);">/${escapeHtml(cat.slug || "")}</span>
            </div>
            <div style="font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">
              ${escapeHtml(cat.description || "Chưa có mô tả chi tiết.")}
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="admin-badge" style="background: ${articleCount > 0 ? "rgba(46, 125, 50, 0.1)" : "rgba(19, 27, 46, 0.05)"}; color: ${articleCount > 0 ? "#2E7D32" : "var(--muted)"}; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 4px;">
                ${articleCount} bài viết
              </span>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            <!-- Nút Sửa -->
            <button type="button" class="btn-edit-cat" data-id="${cat.id}" style="background: #FFFFFF; border: 1px solid var(--line-soft); color: var(--ink); padding: 5px 10px; border-radius: 4px; font-size: 11.5px; font-weight: 600; cursor: pointer;" title="Sửa tên hoặc mô tả chuyên mục">
              Sửa
            </button>

            <!-- Nút Xóa (Bảo vệ dữ liệu) -->
            ${canDelete
            ? `
              <button type="button" class="btn-delete-cat" data-id="${cat.id}" data-name="${escapeHtml(cat.name)}" style="background: #FEE2E2; border: 1px solid #FECACA; color: #DC2626; padding: 5px 10px; border-radius: 4px; font-size: 11.5px; font-weight: 600; cursor: pointer;" title="Xóa chuyên mục này">
                Xóa
              </button>
            `
            : `
              <button type="button" class="btn-delete-cat-disabled" data-count="${articleCount}" style="background: #F3F4F6; border: 1px solid #E5E7EB; color: #9CA3AF; padding: 5px 10px; border-radius: 4px; font-size: 11.5px; font-weight: 500; cursor: not-allowed;" title="Chuyên mục đang có ${articleCount} bài viết. Không thể xóa để bảo đảm toàn vẹn dữ liệu!">
                Khóa xóa
              </button>
            `
          }
          </div>
        </div>
      `;
      })
      .join("");
  }

  // 4. Hiển thị cột thẻ tag và bộ lọc thông minh
  /**
   * Render Cột 2: Danh sách Thẻ Tags
   */
  function renderTagsSection() {
    const mount = document.getElementById("tag-list-mount");
    const totalBadge = document.getElementById("tag-total-badge");
    if (!mount) return;

    if (totalBadge) totalBadge.textContent = `${allTags.length} tags`;

    let list = [...allTags];

    // 1. Lọc theo trạng thái bài viết
    if (currentTagFilter === "has_articles") {
      list = list.filter((t) => Number(t.article_count) > 0);
    } else if (currentTagFilter === "zero_articles") {
      list = list.filter((t) => Number(t.article_count) === 0);
    }

    // 2. Tìm kiếm
    if (currentTagSearch) {
      const q = currentTagSearch.toLowerCase();
      list = list.filter((t) => (t.name || "").toLowerCase().includes(q) || (t.slug || "").toLowerCase().includes(q));
    }

    // Sắp xếp: Tag có nhiều bài nhất lên đầu
    list.sort((a, b) => Number(b.article_count) - Number(a.article_count));
    if (list.length === 0) {
      mount.innerHTML = `
        <div style="padding: 30px 16px; text-align: center; color: var(--muted); font-size: 13px; background: #FAF8F5; border-radius: 8px;">
          Không có thẻ tag nào phù hợp với bộ lọc.
        </div>
      `;
      return;
    }

    mount.innerHTML = list
      .map((tag) => {
        const articleCount = Number(tag.article_count) || 0; const isZero = articleCount === 0;

        return `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 12px; background: ${isZero ? "#FFFBF0" : "#FAF8F5"}; border: 1px solid ${isZero ? "rgba(184, 147, 79, 0.3)" : "var(--line-soft)"}; border-radius: 6px; transition: all 0.15s;" onmouseover="this.style.background='#F6F3ED'" onmouseout="this.style.background='${isZero ? "#FFFBF0" : "#FAF8F5"}'">
          <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
            <span style="font-weight: 600; color: var(--ink); font-size: 13px;">
              #${escapeHtml(tag.name)}
            </span>
            <span class="admin-badge" style="background: ${isZero ? "rgba(220, 38, 38, 0.1)" : "rgba(37, 99, 235, 0.1)"}; color: ${isZero ? "#DC2626" : "#1D4ED8"}; font-size: 11px; font-weight: 600; padding: 1px 6px; border-radius: 10px; font-family: var(--f-mono);">
              ${articleCount} bài
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 5px; flex-shrink: 0;">
            <!-- Nút Sửa / Gộp -->
            <button type="button" class="btn-edit-tag" data-id="${tag.id}" data-name="${escapeHtml(tag.name)}" style="background: #FFFFFF; border: 1px solid var(--line-soft); color: var(--ink); padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;" title="Đổi tên hoặc gộp thẻ này">
              Sửa / Gộp
            </button>

            <!-- Nút Xóa vĩnh viễn -->
            <button type="button" class="btn-delete-tag" data-id="${tag.id}" data-name="${escapeHtml(tag.name)}" data-count="${articleCount}" style="background: #FEE2E2; border: 1px solid #FECACA; color: #DC2626; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;" title="Xóa thẻ tag này khỏi hệ thống">
              Xóa
            </button>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // 5. Gắn sự kiện tương tác và xử lý thêm/sửa/xóa chuyên mục và tag qua API
  /**
   * Gắn các sự kiện tương tác
   */
  function attachEventListeners() {
    // 1. Tìm kiếm Chuyên mục
    const searchCatInput = document.getElementById("input-search-cat");
    if (searchCatInput) {
      searchCatInput.addEventListener("input", (e) => {
        currentCategorySearch = (e.target.value || "").trim();
        renderCategoriesSection();
      });
    }

    // 2. Tìm kiếm & Lọc Tag
    const searchTagInput = document.getElementById("input-search-tag");
    if (searchTagInput) {
      searchTagInput.addEventListener("input", (e) => {
        currentTagSearch = (e.target.value || "").trim();
        renderTagsSection();
      });
    }

    const filterTagSelect = document.getElementById("select-filter-tag");
    if (filterTagSelect) {
      filterTagSelect.addEventListener("change", (e) => {
        currentTagFilter = e.target.value;
        renderTagsSection();
      });
    }

    // 3. Đóng Modal chung
    document.addEventListener("click", (e) => {
      const closeBtn = e.target.closest(".btn-close-modal");
      if (closeBtn) {
        const targetId = closeBtn.dataset.target;
        if (targetId) {
          document.getElementById(targetId).style.display = "none";
        }
      }
    });

    // 4. Mở Modal Thêm Chuyên mục
    const btnAddCat = document.getElementById("btn-add-category");
    if (btnAddCat) {
      btnAddCat.addEventListener("click", () => {
        document.getElementById("modal-cat-id").value = "";
        document.getElementById("modal-cat-name").value = "";
        document.getElementById("modal-cat-slug").value = "";
        document.getElementById("modal-cat-desc").value = "";
        document.getElementById("modal-cat-title").textContent = "Thêm Chuyên mục mới";
        document.getElementById("modal-category").style.display = "flex";
      });
    }

    // 5. Lưu Chuyên mục (Tạo mới hoặc Sửa)
    const btnSaveCat = document.getElementById("btn-save-category");
    if (btnSaveCat) {
      btnSaveCat.addEventListener("click", handleSaveCategory);
    }

    // 6. Mở Modal Sửa Chuyên mục
    document.addEventListener("click", (e) => {
      const btnEditCat = e.target.closest(".btn-edit-cat");
      if (btnEditCat) {
        const catId = btnEditCat.dataset.id;
        const cat = allCategories.find((c) => String(c.id) === String(catId));
        if (cat) {
          document.getElementById("modal-cat-id").value = cat.id;
          document.getElementById("modal-cat-name").value = cat.name || "";
          document.getElementById("modal-cat-slug").value = cat.slug || "";
          document.getElementById("modal-cat-desc").value = cat.description || "";
          document.getElementById("modal-cat-title").textContent = `Chỉnh sửa Chuyên mục: "${cat.name}"`;
          document.getElementById("modal-category").style.display = "flex";
        }
      }
    });

    // 7. Xóa Chuyên mục (Chỉ khi số bài = 0)
    document.addEventListener("click", (e) => {
      const btnDelCat = e.target.closest(".btn-delete-cat");
      if (btnDelCat) {
        const catId = btnDelCat.dataset.id;
        const catName = btnDelCat.dataset.name;
        handleDeleteCategory(catId, catName);
      }

      const btnDisabled = e.target.closest(".btn-delete-cat-disabled");
      if (btnDisabled) {
        const count = btnDisabled.dataset.count;
        if (typeof showToast === "function") {
          showToast(`Không thể xóa chuyên mục đang có ${count} bài viết! Vui lòng chuyển các bài viết sang mục khác trước.`, "warning");
        } else {
          alert(`Không thể xóa chuyên mục đang có ${count} bài viết!`);
        }
      }
    });

    // 8. Mở Modal Thêm Tag mới
    const btnAddTag = document.getElementById("btn-add-tag");
    if (btnAddTag) {
      btnAddTag.addEventListener("click", () => {
        document.getElementById("modal-tag-id").value = "";
        document.getElementById("modal-tag-name").value = "";
        document.getElementById("modal-tag-title").textContent = "Tạo Thẻ Tag mới";
        document.getElementById("modal-tag-merge-hint").style.display = "none";
        document.getElementById("modal-tag").style.display = "flex";
      });
    }

    // 9. Mở Modal Sửa Tag / Gộp Thẻ
    document.addEventListener("click", (e) => {
      const btnEditTag = e.target.closest(".btn-edit-tag");
      if (btnEditTag) {
        const tagId = btnEditTag.dataset.id;
        const tagName = btnEditTag.dataset.name;
        document.getElementById("modal-tag-id").value = tagId;
        document.getElementById("modal-tag-name").value = tagName || "";
        document.getElementById("modal-tag-title").textContent = `Sửa / Gộp Thẻ Tag: "#${tagName}"`;
        document.getElementById("modal-tag-merge-hint").style.display = "block";
        document.getElementById("modal-tag").style.display = "flex";
      }
    });

    // 10. Lưu Thẻ Tag (Thêm mới hoặc Sửa/Gộp)
    const btnSaveTag = document.getElementById("btn-save-tag");
    if (btnSaveTag) {
      btnSaveTag.addEventListener("click", handleSaveTag);
    }

    // 11. Xóa Thẻ Tag vĩnh viễn
    document.addEventListener("click", (e) => {
      const btnDelTag = e.target.closest(".btn-delete-tag");
      if (btnDelTag) {
        const tagId = btnDelTag.dataset.id;
        const tagName = btnDelTag.dataset.name;
        const count = btnDelTag.dataset.count;
        handleDeleteTag(tagId, tagName, count);
      }
    });
  }

  /**
   * Xử lý Lưu Chuyên mục
   */
  async function handleSaveCategory() {
    const idVal = document.getElementById("modal-cat-id").value;
    const nameVal = document.getElementById("modal-cat-name").value.trim();
    let slugVal = document.getElementById("modal-cat-slug").value.trim();
    const descVal = document.getElementById("modal-cat-desc").value.trim();

    if (!nameVal) {
      if (typeof showToast === "function") showToast("Vui lòng nhập tên chuyên mục!", "warning");
      return;
    }

    const method = idVal ? "PUT" : "POST";
    const body = idVal
      ? { id: idVal, name: nameVal, slug: slugVal, description: descVal }
      : { name: nameVal, slug: slugVal, description: descVal };

    const res = await fetch(resolveApiUrl("editor/categories-tags.php?type=categories"), {
      method: method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await res.json();

    if (!result.success) {
      if (typeof showToast === "function") showToast(result.message || "Có lỗi xảy ra", "error");
      return;
    }

    if (typeof showToast === "function") {
      showToast(idVal ? `Đã cập nhật chuyên mục "${nameVal}" thành công!` : `Đã tạo chuyên mục mới "${nameVal}" thành công!`, "success");
    }

    document.getElementById("modal-category").style.display = "none";
    await loadData();
    renderCategoriesSection();
  }

  /**
   * Xử lý Xóa Chuyên mục
   */
  async function handleDeleteCategory(catId, catName) {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn chuyên mục "${catName}"?`)) {
      return;
    }

    const res = await fetch(resolveApiUrl(`editor/categories-tags.php?type=categories&id=${catId}`), {
      method: "DELETE",
      credentials: "include"
    });
    const result = await res.json();

    if (!result.success) {
      if (typeof showToast === "function") showToast(result.message, "warning");
      return;
    }

    if (typeof showToast === "function") showToast(`Đã xóa chuyên mục "${catName}" thành công!`, "info");
    await loadData();
    renderCategoriesSection();
  } 

 
/**
 * Xử lý Lưu / Sửa / Gộp Thẻ Tag
 */
async function handleSaveTag() {
  const idVal = document.getElementById("modal-tag-id").value;
  const nameVal = document.getElementById("modal-tag-name").value.trim().replace(/^#/, "");

  if (!nameVal) {
    if (typeof showToast === "function") showToast("Vui lòng nhập tên thẻ tag!", "warning");
    return;
  }

  const method = idVal ? "PUT" : "POST";
  const body = idVal ? { id: idVal, name: nameVal } : { name: nameVal };

  const btnSave = document.getElementById("btn-save-tag");
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.textContent = "Đang xử lý...";
  }

  try {
    const res = await fetch(resolveApiUrl("editor/categories-tags.php?type=tags"), {
      method: method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await res.json();

    if (!result.success) {
      if (typeof showToast === "function") showToast(result.message || "Có lỗi xảy ra", "error");
      return;
    }

    if (result.data && result.data.merged) {
      if (typeof showToast === "function") {
        showToast(result.message || `Đã gộp thẻ thành công vào thẻ "#${result.data.target_name}"!`, "success");
      }
    } else {
      if (typeof showToast === "function") {
        showToast(idVal ? `Đã đổi tên thẻ tag thành "#${nameVal}"!` : `Đã tạo mới thẻ tag "#${nameVal}" thành công!`, "success");
      }
    }

    document.getElementById("modal-tag").style.display = "none";
    await loadData();
    renderTagsSection();
  } catch (err) {
    console.error("Lỗi khi lưu thẻ tag:", err);
    if (typeof showToast === "function") showToast("Lỗi kết nối máy chủ", "error");
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.textContent = "Lưu Thẻ Tag";
    }
  }
}

  /**
   * Xử lý Xóa Thẻ Tag (Gỡ sạch khỏi toàn bộ bài viết qua API)
   */
  async function handleDeleteTag(tagId, tagName, articleCount) {
    const msg =
      Number(articleCount) > 0
        ? `Thẻ "#${tagName}" đang được gắn trong ${articleCount} bài viết. Bạn có chắc chắn muốn xóa vĩnh viễn thẻ này? (Thẻ sẽ tự động được gỡ khỏi tất cả bài viết liên quan)`
        : `Xác nhận xóa vĩnh viễn thẻ "#${tagName}"?`;

    if (!confirm(msg)) return;

    try {
      const res = await fetch(resolveApiUrl(`editor/categories-tags.php?type=tags&id=${tagId}`), {
        method: "DELETE",
        credentials: "include"
      });
      const result = await res.json();
      if (result && result.success) {
        if (typeof showToast === "function") {
          showToast(`Đã xóa vĩnh viễn thẻ "#${tagName}" khỏi hệ thống!`, "success");
        }
        await loadData();
        renderTagsSection();
      } else {
        if (typeof showToast === "function") {
          showToast((result && result.message) || "Không thể xóa thẻ!", "error");
        }
      }
    } catch (err) {
      console.error("Lỗi xóa tag:", err);
      if (typeof showToast === "function") {
        showToast("Lỗi kết nối khi xóa thẻ!", "error");
      }
    }
  }
})();
