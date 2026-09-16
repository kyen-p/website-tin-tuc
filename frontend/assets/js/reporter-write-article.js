/*
==============================================================================
TÊN FILE: frontend/assets/js/reporter-write-article.js
PHÂN HỆ: Soạn thảo và gửi duyệt bài viết phóng viên
MÔ TẢ: Cung cấp môi trường soạn thảo bài viết cho phóng viên:
       - Tích hợp CKEditor 5 hỗ trợ định dạng phong phú, nhúng media, căn lề
       - Quản lý tải lên ảnh bìa và ảnh chèn trong nội dung qua API upload.php
       - Quản lý chuyên mục và gắn thẻ tag thông minh (gợi ý, tìm kiếm không dấu)
       - Chỉnh sửa bài viết cũ (bản nháp hoặc bài bị từ chối kèm phản hồi)
       - Lưu bản nháp hoặc gửi duyệt xuất bản qua backend/api/reporter/write-article.php
PHẠM VI SỬ DỤNG:
       - frontend/reporter/write-article.html
PHỤ THUỘC:
       - CKEditor 5
       - frontend/assets/js/admin-layout.js
       - frontend/assets/js/common.js
       - backend/api/upload.php
       - backend/api/public/categories.php
       - backend/api/public/tags.php
       - backend/api/reporter/write-article.php
==============================================================================
*/

// 1. Khởi tạo khung soạn thảo và trạng thái form
// Trạng thái Form
let editorInstance = null;
    let currentArticleId = null;
    let selectedTags = [];
    let currentCoverDataUrl = "";
    let systemTags = [];

    document.addEventListener("DOMContentLoaded", async () => {
      const currentUser = initAdminLayout("reporter", "write-article");
      if (!currentUser) return;

      // 1. Khởi tạo CKEditor 5
      await initCKEditor();

      // 2. Tải danh mục & thẻ gợi ý & khởi tạo tìm kiếm tag
      loadCategories();
      loadSystemTags();
      initTagSearchInput();

      // 3. Kiểm tra URL Params
      const params = new URLSearchParams(window.location.search);
      const articleIdParam = params.get("id");

      if (articleIdParam) {
        currentArticleId = Number(articleIdParam);
        loadExistingArticle(currentArticleId);
      }
    });

    // 2. Quản lý ảnh bìa bài viết (tải lên, xem trước và gỡ bỏ)
    /**
     * Xử lý tải ảnh bìa lên
     */
    async function handleCoverFileChange(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedMimes.includes(file.type)) {
        showToast("Chỉ hỗ trợ ảnh định dạng JPG, JPEG, PNG hoặc WebP!", "warning");
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast("Dung lượng ảnh bìa tối đa là 5MB!", "warning");
        e.target.value = "";
        return;
      }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", "article");

      const oldCoverUrl = currentCoverDataUrl;

      try {
        const uploadUrl = typeof resolveApiUrl === "function" ? resolveApiUrl("upload.php") : "../../backend/api/upload.php";
        const response = await fetch(uploadUrl, {
          method: "POST",
          credentials: "include",
          body: formData
        });

        const result = await response.json();

        if (!result.success) {
          showToast(result.message || "Tải ảnh bìa thất bại!", "error");
          return;
        }

        const imageUrl = result.data.url;

        // Nếu trước đó đã upload 1 ảnh khác trong phiên viết bài này, xóa file cũ đi
        if (oldCoverUrl && oldCoverUrl.includes("backend/api/upload/") && oldCoverUrl !== imageUrl) {
          fetch(uploadUrl, {
            method: "DELETE",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: oldCoverUrl })
          }).catch(console.error);
        }

        setCoverPreview(imageUrl, true);
        showToast("Đã tải ảnh bìa thành công!", "success");

      } catch (error) {
        console.error(error);
        showToast("Không thể tải ảnh lên máy chủ!", "error");
      }
    }

    function setCoverPreview(src) {
      if (!src || src.includes("placeholder")) {
        removeCoverImage();
        return;
      }

      currentCoverDataUrl = src;

      const previewImg = document.getElementById("cover-image-preview");
      const placeholder = document.getElementById("cover-empty-placeholder");
      const btnRemove = document.getElementById("btn-remove-cover");
      const labelUpload = document.getElementById("label-upload-cover");
      const hint = document.getElementById("cover-auto-hint");

      if (previewImg && placeholder) {
        const displaySrc = typeof resolveAssetPath === "function" ? resolveAssetPath(src) : src;
        previewImg.src = displaySrc;
        previewImg.style.display = "block";
        placeholder.style.display = "none";
        if (btnRemove) btnRemove.style.display = "inline-flex";
        if (labelUpload) labelUpload.textContent = "Thay đổi ảnh";
        if (hint) {
          hint.innerHTML = `<span style="color: #16A34A; font-weight: 600;">✓ Đã chọn ảnh bìa đại diện cho bài viết</span>`;
        }
      }
    }

    async function removeCoverImage() {
      const oldUrl = currentCoverDataUrl;
      currentCoverDataUrl = "";
      const fileInput = document.getElementById("cover-file-input");
      if (fileInput) fileInput.value = "";

      const previewImg = document.getElementById("cover-image-preview");
      const placeholder = document.getElementById("cover-empty-placeholder");
      const btnRemove = document.getElementById("btn-remove-cover");
      const labelUpload = document.getElementById("label-upload-cover");
      const hint = document.getElementById("cover-auto-hint");

      if (previewImg && placeholder) {
        previewImg.src = "";
        previewImg.style.display = "none";
        placeholder.style.display = "block";
        if (btnRemove) btnRemove.style.display = "none";
        if (labelUpload) labelUpload.textContent = "Tải ảnh bìa";
        if (hint) {
          hint.innerHTML = `* <strong>Quy định:</strong> Bắt buộc tải ảnh bìa đại diện khi <strong>Gửi duyệt xuất bản</strong>. Bạn có thể tạm để trống khi lưu bản nháp.`;
        }
      }

      // Xóa file vật lý trên server nếu là ảnh đã upload riêng và không nằm trong nội dung bài viết
      const content = editorInstance ? editorInstance.getData() : "";
      if (oldUrl && oldUrl.includes("backend/api/upload/") && !content.includes(oldUrl)) {
        try {
          const uploadUrl = typeof resolveApiUrl === "function" ? resolveApiUrl("upload.php") : "../../backend/api/upload.php";
          await fetch(uploadUrl, {
            method: "DELETE",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: oldUrl })
          });
          showToast("Đã xóa ảnh bìa thành công!", "info");
        } catch (err) {
          console.error("Lỗi khi xóa file ảnh bìa:", err);
        }
      }
    }

    // 3. Tích hợp trình soạn thảo CKEditor 5
    /**
     * Khởi tạo CKEditor 5 sử dụng Module dùng chung window.initArticleEditor
     * Đảm bảo nhất quán 100% tính năng định dạng, căn lề, chèn bảng biểu, nhúng video
     * và upload ảnh lên máy chủ cục bộ giữa Phóng viên và Quản trị viên.
     */
    async function initCKEditor() {
      try {
        if (typeof window.initArticleEditor === "function") {
          editorInstance = await window.initArticleEditor("#editor", {
            placeholder: "Bắt đầu viết nội dung bài báo tại đây (hỗ trợ kéo thả ảnh, dán link YouTube/video)..."
          });
        } else {
          console.warn("initCKEditor: Chưa tải được module ckeditor-helper.js");
        }
      } catch (error) {
        console.error("Lỗi khởi tạo CKEditor 5 cho Phóng viên:", error);
      }
    }

    // 4. Quản lý chuyên mục và hệ thống gắn thẻ tag thông minh
    /**
     * Đổ danh sách chuyên mục vào dropdown từ API Backend
     */
    async function loadCategories() {
      try {
        const res = await fetch(resolveApiUrl("public/categories.php")).then(r => r.json());
        const categories = res.success && Array.isArray(res.data) ? res.data : [];
        const select = document.getElementById("article-category");
        if (!select) return;

        categories.forEach(cat => {
          const opt = document.createElement("option");
          opt.value = cat.id;
          opt.textContent = cat.name;
          select.appendChild(opt);
        });
      } catch (err) {
        console.error("Lỗi tải chuyên mục:", err);
      }
    }

    /**
     * Tải thẻ hệ thống & hiển thị gợi ý từ API Backend
     */
    async function loadSystemTags() {
      try {
        const res = await fetch(resolveApiUrl("public/tags.php")).then(r => r.json());
        systemTags = res.success && Array.isArray(res.data) ? res.data : [];
        const mount = document.getElementById("tags-suggestion-mount");
        if (!mount) return;

        mount.innerHTML = systemTags.slice(0, 8).map(t => {
          return `<span class="admin-tag-suggest-item" onclick="addTag('${escapeHtml(t.name)}')">+ ${escapeHtml(t.name)}</span>`;
        }).join("");
      } catch (err) {
        console.error("Lỗi tải tags hệ thống:", err);
      }
    }

    // 5. Tải bài viết cũ để sửa và hiển thị phản hồi ban biên tập
    /**
     * Tải thông tin bài viết cũ khi Sửa từ Backend API
     */
    async function loadExistingArticle(id) {
      try {
        const response = await fetch(resolveApiUrl(`reporter/write-article.php?id=${id}`), {
          credentials: "include"
        });
        const res = await response.json();
        if (!res.success || !res.data) {
          showToast(res.message || "Không tìm thấy bài viết yêu cầu", "error");
          return;
        }

        const art = res.data;

        document.getElementById("page-main-title").textContent = "Chỉnh sửa bài viết";
        document.getElementById("page-main-subtitle").textContent = `Đang cập nhật bài viết: "${art.title || ''}"`;
        document.getElementById("save-status-hint").innerHTML = `Trạng thái hiện tại: <strong>${art.status === 'rejected' ? 'Bị từ chối (Cần sửa)' : 'Bản nháp'}</strong>`;

        // Hiển thị phản hồi từ Ban Biên tập nếu bài bị từ chối
        const oldBanner = document.getElementById("rejection-alert-banner");
        if (oldBanner) oldBanner.remove();

        if (art.status === "rejected" && (art.rejection_reason || "").trim()) {
          const banner = document.createElement("div");
          banner.id = "rejection-alert-banner";
          banner.style.cssText = "margin-bottom: 20px; padding: 14px 18px; background: #FEF2F2; border: 1px solid #FCA5A5; border-left: 4px solid #EF4444; border-radius: 6px; display: flex; align-items: flex-start; gap: 12px; font-size: 13.5px; color: #991B1B; box-shadow: 0 1px 3px rgba(0,0,0,0.05);";
          banner.innerHTML = `
            <svg style="width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px; color: #EF4444;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div style="flex: 1;">
              <div style="font-weight: 700; margin-bottom: 3px; font-size: 14px;">Ban Biên tập yêu cầu chỉnh sửa:</div>
              <div style="color: #7F1D1D; line-height: 1.5;">${escapeHtml(art.rejection_reason)}</div>
            </div>
          `;
          const formEl = document.getElementById("article-form");
          if (formEl && formEl.parentNode) formEl.parentNode.insertBefore(banner, formEl);
        }

        // Điền thông tin
        document.getElementById("article-title").value = art.title || "";
        document.getElementById("article-sapo").value = art.short_description || "";
        document.getElementById("article-category").value = art.category_id || "";

        // Đặt nội dung CKEditor trước để sẵn sàng kiểm tra ảnh
        if (editorInstance) {
          editorInstance.setData(art.content || "");
        }

        // Hiển thị ảnh bìa nếu có
        const rawCover = art.cover_image || "";
        const cleanCover = (rawCover && !rawCover.includes("placeholder")) ? rawCover.trim() : "";

        if (cleanCover) {
          setCoverPreview(cleanCover);
        } else {
          removeCoverImage();
        }

        selectedTags = [];
        if (art.tags && Array.isArray(art.tags)) {
          selectedTags = art.tags.map(t => (typeof t === "string" ? t : (t.name || ""))).filter(Boolean);
        } else if (art.tags_text && Array.isArray(art.tags_text)) {
          selectedTags = [...art.tags_text];
        }
        renderSelectedTags();
      } catch (err) {
        console.error("Lỗi khi tải bài viết cũ:", err);
        showToast("Không thể tải thông tin bài viết cũ!", "error");
      }
    }

    /**
     * Chuẩn hóa chuỗi tiếng Việt không dấu để tìm kiếm tag mờ (Fuzzy / Non-accent search)
     * congnghe, CÔNG NGHỆ, công nghệ -> congnghe
     */
    function normalizeTagSearch(str) {
      if (!str) return "";
      return String(str)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]/g, "");
    }

    /**
     * Xử lý Thẻ bài viết & Tìm kiếm Tag thông minh
     */
    function initTagSearchInput() {
      const tagInput = document.getElementById("tag-input");
      const dropdown = document.getElementById("tag-search-dropdown");
      const dropdownList = document.getElementById("tag-search-dropdown-list");
      if (!tagInput || !dropdown || !dropdownList) return;

      tagInput.addEventListener("input", () => {
        const query = tagInput.value.trim().replace(/^#/, "");
        if (!query) {
          dropdown.style.display = "none";
          return;
        }

        const normQuery = normalizeTagSearch(query);
        const allTags = systemTags;

        // Lọc các tag hệ thống khớp chuỗi (bất kể dấu/hoa thường)
        const matchedTags = allTags.filter(t => {
          const normName = normalizeTagSearch(t.name);
          const normSlug = normalizeTagSearch(t.slug || "");
          return normName.includes(normQuery) || normSlug.includes(normQuery);
        });

        // Kiểm tra xem query có trùng khớp chính xác 100% với tag có sẵn không
        const exactMatch = allTags.some(t => normalizeTagSearch(t.name) === normQuery);

        let html = "";

        if (matchedTags.length > 0) {
          html += matchedTags.map(t => {
            const isSelected = selectedTags.some(st => normalizeTagSearch(st) === normalizeTagSearch(t.name));
            return `
              <div 
                class="tag-dropdown-item" 
                onclick="selectTagFromDropdown('${escapeHtml(t.name)}')"
                style="padding: 8px 12px; font-size: 13px; color: var(--ink); display: flex; align-items: center; justify-content: space-between; cursor: pointer; border-bottom: 1px solid var(--line-soft); ${isSelected ? 'background: #F3F4F6; color: var(--muted); cursor: not-allowed;' : 'hover:background: #F9FAFB;'}"
                onmouseover="if(!${isSelected}) this.style.background='#F0F9FF'"
                onmouseout="if(!${isSelected}) this.style.background='#FFF'"
              >
                <div>
                  <strong style="color: var(--brass-dark);">#${escapeHtml(t.name)}</strong>
                  <span style="font-size: 11px; color: var(--muted); margin-left: 6px;">(Đã có trong hệ thống)</span>
                </div>
                ${isSelected ? '<span style="font-size: 11px; color: var(--muted); font-weight: 600;">Đã chọn</span>' : '<span style="font-size: 11.5px; color: #2563EB; font-weight: 600;">+ Chọn</span>'}
              </div>
            `;
          }).join("");
        }

        // Nếu chưa có tag trùng khớp hoàn toàn -> Hiện tùy chọn tạo tag mới
        if (!exactMatch) {
          html += `
            <div 
              class="tag-dropdown-item" 
              onclick="selectTagFromDropdown('${escapeHtml(query)}')"
              style="padding: 10px 12px; font-size: 13px; color: #15803D; background: #F0FDF4; display: flex; align-items: center; gap: 8px; cursor: pointer;"
              onmouseover="this.style.background='#DCFCE7'"
              onmouseout="this.style.background='#F0FDF4'"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Tạo thẻ mới: <strong>#${escapeHtml(query)}</strong></span>
            </div>
          `;
        }

        dropdownList.innerHTML = html;
        dropdown.style.display = "block";
      });

      tagInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          const query = tagInput.value.trim().replace(/^#/, "").replace(/,/g, "");
          if (query) {
            // Kiểm tra xem có tag nào trong hệ thống khớp không
            const normQuery = normalizeTagSearch(query);
            const allTags = systemTags;
            const found = allTags.find(t => normalizeTagSearch(t.name) === normQuery);
            if (found) {
              addTag(found.name);
            } else {
              addTag(query);
            }
            tagInput.value = "";
            dropdown.style.display = "none";
          }
        } else if (e.key === "Escape") {
          dropdown.style.display = "none";
        }
      });

      // Ẩn dropdown khi click ra ngoài
      document.addEventListener("click", (e) => {
        const container = document.getElementById("tags-container");
        if (container && !container.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.style.display = "none";
        }
      });
    }

    function selectTagFromDropdown(tagName) {
      addTag(tagName);
      const tagInput = document.getElementById("tag-input");
      if (tagInput) tagInput.value = "";
      const dropdown = document.getElementById("tag-search-dropdown");
      if (dropdown) dropdown.style.display = "none";
      if (tagInput) tagInput.focus();
    }

    function addTag(tagName) {
      const trimmed = tagName.trim().replace(/^#/, "");
      if (!trimmed) return;

      const normTrimmed = normalizeTagSearch(trimmed);
      if (selectedTags.some(t => normalizeTagSearch(t) === normTrimmed)) {
        showToast(`Thẻ #${trimmed} đã được chọn!`, "info");
        return;
      }
      if (selectedTags.length >= 5) {
        showToast("Mỗi bài viết chỉ được gắn tối đa 5 thẻ Tag!", "warning");
        return;
      }

      selectedTags.push(trimmed);
      renderSelectedTags();
    }

    function removeTag(tagName) {
      selectedTags = selectedTags.filter(t => t !== tagName);
      renderSelectedTags();
    }

    function renderSelectedTags() {
      const mount = document.getElementById("selected-tags-mount");
      const countBadge = document.getElementById("tags-count-badge");
      if (countBadge) {
        countBadge.textContent = `${selectedTags.length}/5 thẻ`;
        countBadge.style.color = selectedTags.length === 5 ? "#E65100" : "var(--muted)";
      }
      if (!mount) return;

      mount.innerHTML = selectedTags.map(t => {
        return `
          <span class="admin-tag-chip">
            #${escapeHtml(t)}
            <span class="admin-tag-chip__del" onclick="removeTag('${escapeHtml(t)}')" title="Gỡ thẻ">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </span>
          </span>
        `;
      }).join("");
    }

    // 6. Kiểm tra hợp lệ và gửi yêu cầu lưu bài / gửi duyệt qua API
    /**
     * Lưu bài viết: 'draft' (Lưu nháp) hoặc 'pending' (Gửi duyệt)
     */
    async function saveArticle(targetStatus) {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        showToast("Vui lòng đăng nhập trước khi thực hiện!", "error");
        return;
      }

      const title = document.getElementById("article-title").value.trim();
      const sapo = document.getElementById("article-sapo").value.trim();
      const categoryId = document.getElementById("article-category").value;
      const content = editorInstance ? editorInstance.getData().trim() : "";

      // Kiểm tra tính hợp lệ tùy theo trạng thái lưu nháp hay gửi duyệt
      if (!title) {
        showToast(targetStatus === "draft" ? "Vui lòng nhập tiêu đề bài viết để lưu bản nháp!" : "Vui lòng nhập tiêu đề bài viết!", "warning");
        document.getElementById("article-title").focus();
        return;
      }

      if (targetStatus === "pending") {
        if (!sapo) {
          showToast("Vui lòng nhập đoạn mở đầu / Sapo bài viết trước khi gửi duyệt!", "warning");
          document.getElementById("article-sapo").focus();
          return;
        }
        if (!categoryId) {
          showToast("Vui lòng chọn chuyên mục cho bài viết trước khi gửi duyệt!", "warning");
          document.getElementById("article-category").focus();
          return;
        }
        // Bắt buộc ảnh bìa đại diện khi gửi duyệt
        if (!currentCoverDataUrl) {
          showToast("Bài viết gửi duyệt bắt buộc phải có ảnh bìa đại diện. Vui lòng tải ảnh bìa lên!", "warning");
          const coverContainer = document.getElementById("cover-preview-container");
          if (coverContainer) {
            coverContainer.scrollIntoView({ behavior: "smooth", block: "center" });
            coverContainer.style.borderColor = "#DC2626";
            coverContainer.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.15)";
            setTimeout(() => {
              coverContainer.style.borderColor = "";
              coverContainer.style.boxShadow = "";
            }, 2500);
          }
          return;
        }
        if (!content || content === "<p></p>" || content === "<p><br data-cke-filler=\"true\"></p>") {
          showToast("Vui lòng nhập nội dung chi tiết bài viết trong trình soạn thảo!", "warning");
          return;
        }
      }

      // Xác định và chuẩn hóa ảnh bìa
      let finalCover = currentCoverDataUrl ? currentCoverDataUrl.trim() : "";
      if (finalCover && finalCover.includes("placeholder")) {
        finalCover = "";
      }
      if (finalCover) {
        const uploadIdx = finalCover.indexOf("backend/api/upload/");
        if (uploadIdx !== -1) {
          finalCover = finalCover.substring(uploadIdx);
        }
      }

      const payload = {
        title: title,
        short_description: sapo,
        content: content,
        cover_image: finalCover,
        category_id: categoryId,
        status: targetStatus,
        tags: selectedTags
      };

      if (currentArticleId) {
        payload.id = currentArticleId;
      }
      
      try {
        const response = await fetch(resolveApiUrl("reporter/write-article.php"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!result.success) {
          showToast(result.message || "Không thể lưu bài viết!", "error");
          return;
        }

        const successMsg = targetStatus === "draft"
          ? "Đã lưu bản nháp bài viết thành công!"
          : "Đã gửi bài viết lên Ban Biên tập để kiểm duyệt thành công!";
        showToast(successMsg, "success");

        setTimeout(() => {
          window.location.href = "my-articles.html";
        }, 600);

      } catch (error) {
        console.error("Lỗi gửi bài viết:", error);
        showToast("Không thể kết nối đến máy chủ!", "error");
      }
    }

    window.selectTagFromDropdown = selectTagFromDropdown;
    window.addTag = addTag;
    window.removeTag = removeTag;
    window.saveArticle = saveArticle;
