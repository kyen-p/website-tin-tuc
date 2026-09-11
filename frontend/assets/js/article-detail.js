/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/article-detail.js
 * PHÂN HỆ: Chi tiết Bài viết & Tương tác Độc giả (Public Article Detail Module)
 * MÔ TẢ: Khởi tạo và xử lý toàn bộ logic trên trang đọc bài viết chi tiết:
 *        1. Tải dữ liệu bài viết qua ?id= hoặc ?slug= từ backend/api/public/article-detail.php.
 *        2. Phân tích nội dung: Render HTML bài viết, xử lý nhúng video tự động (YouTube/Vimeo oembed).
 *        3. Hiển thị thông tin tác giả, chuyên mục, thẻ tag, ngày xuất bản và lượt đọc.
 *        4. Tương tác Yêu thích (Bookmark / Favorite) có xác thực người dùng.
 *        5. Hệ thống bình luận đa tương tác: Đăng bình luận mới, sửa trực tiếp tại chỗ, xóa bình luận (kèm modal xác nhận), tự động cuộn và highlight bình luận từ Quản lý bình luận cá nhân (User) & Quản trị bình luận (Admin).
 *        6. Tải và hiển thị danh sách bài viết liên quan cùng chuyên mục.
 * PHẠM VI SỬ DỤNG:
 *   - frontend/public/article-detail.html
 * PHỤ THUỘC:
 *   - frontend/assets/js/common.js (initPublicHeader, initPublicFooter, resolveApiUrl, getCurrentUser, showToast, etc.)
 *   - backend/api/public/article-detail.php
 *   - backend/api/public/comments.php
 *   - backend/api/user/favorites.php
 *   - backend/api/user/my-comments.php
 * ==============================================================================
 */

async function initArticleDetailPage() {
  // ==============================================================================
  // KHỐI 1: TẢI CHI TIẾT BÀI VIẾT & KHỞI TẠO KHUNG TRANG (HEADER / FOOTER)
  // ==============================================================================
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = Number(urlParams.get("id")) || 0;
  const articleSlug = (urlParams.get("slug") || "").trim();

  // 1. Lấy bài viết từ backend (PHP + MySQL). Gửi kèm credentials: "include"
  //    để đồng bộ session cookie, giúp backend nhận diện phiên và chống spam lượt xem khi F5 / reload.
  let article = null;
  try {
    const params = articleSlug ? `slug=${encodeURIComponent(articleSlug)}` : `id=${encodeURIComponent(articleId)}`;
    const res = await fetch(resolveApiUrl(`public/article-detail.php?${params}`), {
      credentials: "include",
    });
    const result = await res.json();
    if (result && result.success && result.data) {
      article = result.data;
    }
  } catch (error) {
    console.error("Lỗi khi tải bài viết từ backend", error);
  }

  const catSlug = article ? (article.category && article.category.slug) || "" : "";
  await initPublicHeader(catSlug);
  await initPublicFooter();

  const container = document.getElementById("article-detail-container");
  const notFound = document.getElementById("article-not-found");

  if (!article) {
    if (container) container.style.display = "none";
    if (notFound) notFound.style.display = "block";
    return;
  }

  if (container) container.style.display = "block";
  if (notFound) notFound.style.display = "none";

  // ==============================================================================
  // KHỐI 2: RENDER THÔNG TIN BÀI BÁO (TIÊU ĐỀ, BREADCRUMB, TÁC GIẢ, META)
  // ==============================================================================
  document.title = `${article.title} - Mạch Tin`;

  const currentUser = getCurrentUser();

  const category = article.category || { name: "Thời sự", slug: "thoi-su" };
  const author = article.author || { full_name: "Ban Biên Tập", bio: "", id: 1 };

  const currentTags = Array.isArray(article.tags) ? article.tags : [];

  document.getElementById("breadcrumb-category").textContent = category.name;
  document.getElementById("breadcrumb-category").href = `category.html?slug=${category.slug}`;
  document.getElementById("breadcrumb-title").textContent = article.title;

  document.getElementById("article-category-badge").textContent = category.name;
  document.getElementById("article-title").textContent = article.title;
  document.getElementById("article-summary").textContent = article.short_description || "";

  const authorProfileUrl = typeof getAuthorProfileUrl === "function" ? getAuthorProfileUrl(author) : `author.html?username=${encodeURIComponent(author.username || author.id)}`;

  document.getElementById("author-name-top").textContent = author.full_name;
  document.getElementById("author-link-top").href = authorProfileUrl;
  if (document.getElementById("author-name-link")) {
    document.getElementById("author-name-link").href = authorProfileUrl;
  }
  document.getElementById("article-time").textContent = formatDateTime(article.published_at || article.created_at);
  document.getElementById("article-views").textContent = `${formatNumber(getArticleViews(article))} lượt đọc`;

  const authorAvatarTop = document.getElementById("author-avatar-top");
  if (authorAvatarTop) {
    authorAvatarTop.innerHTML = renderUserAvatar(author, "avatar-badge avatar-badge--sm");
  }

  // Ảnh bìa (Cover image) chỉ phục vụ hiển thị ngoài danh sách bài viết (Trang chủ, Chuyên mục, Tìm kiếm, Đọc nhiều).
  // Trong trang đọc chi tiết, toàn bộ nội dung & hình ảnh chỉ hiển thị đúng những gì tác giả soạn trong bài viết.
  const coverMount = document.getElementById("article-cover-mount");
  if (coverMount) {
    coverMount.innerHTML = "";
    coverMount.style.display = "none";
  }

  // ==============================================================================
  // KHỐI 3: RENDER THÂN BÀI VIẾT & XỬ LÝ NHÚNG VIDEO TỰ ĐỘNG (OEMBED TO IFRAME)
  // ==============================================================================
  const contentContainer = document.getElementById("article-content-body");
  if (contentContainer) {
    if (article.content && article.content.trim()) {
      const rawContent = article.content.trim();
      // Nếu nội dung chứa bất kỳ thẻ HTML nào (CKEditor sinh ra <p>, <figure>, <img>, <h3>,...)
      const hasHtmlTags = /<[a-z][\s\S]*>/i.test(rawContent);
      if (hasHtmlTags) {
        // Tự động chuyển đổi thẻ <oembed url="..."> thành iframe video đáp ứng (YouTube, Vimeo)
        let processedHtml = rawContent.replace(/<oembed\s+url=["']([^"']+)["']\s*><\/oembed>/gi, (match, url) => {
          const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
          if (ytMatch) {
            return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:24px 0;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
          }
          const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/i);
          if (vimeoMatch) {
            return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:24px 0;border-radius:8px;"><iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe></div>`;
          }
          return match;
        });
        contentContainer.innerHTML = processedHtml;
      } else {
        contentContainer.innerHTML = rawContent
          .split(/\n\n+/)
          .filter(Boolean)
          .map((p) => `<p>${escapeHtml(p)}</p>`)
          .join("");
      }
    } else {
      contentContainer.innerHTML = `<p>${escapeHtml(article.short_description || "")}</p>`;
    }
  }

  // ==============================================================================
  // KHỐI 4: RENDER DANH SÁCH THẺ TAG & THÔNG TIN TÁC GIẢ CUỐI BÀI
  // ==============================================================================
  const tagsMount = document.getElementById("article-tags-mount");
  if (tagsMount) {
    if (currentTags.length > 0) {
      tagsMount.innerHTML = currentTags
        .map((t) => `<a href="search.html?tag=${t.slug}" class="tag-chip">#${escapeHtml(t.name)}</a>`)
        .join("");
    } else {
      tagsMount.innerHTML = `<span class="meta" style="font-size: 13px;">Đang cập nhật</span>`;
    }
  }

  const sidebarTagsMount = document.getElementById("article-sidebar-tags");
  if (sidebarTagsMount) {
    let displayTags = currentTags.slice(0, 6);
    if (displayTags.length === 0) {
      try {
        const tagRes = await fetch(resolveApiUrl("public/tags.php")).then(r => r.json());
        if (tagRes.success && Array.isArray(tagRes.data)) {
          displayTags = tagRes.data.slice(0, 6);
        }
      } catch (e) {
        displayTags = [];
      }
    }
    sidebarTagsMount.innerHTML = displayTags
      .map((t) => `<a href="search.html?tag=${t.slug}" class="tag-chip">#${escapeHtml(t.name)}</a>`)
      .join("");
  }

  document.getElementById("author-name-bottom").textContent = author.full_name;
  document.getElementById("author-bio-bottom").textContent = (author.bio && author.bio.trim()) ? author.bio : "Chưa cập nhật tiểu sử.";
  document.getElementById("author-link-bottom").href = authorProfileUrl;
  const authorRoleBottom = document.getElementById("author-role-bottom");
  if (authorRoleBottom) {
    const roleLabels = { admin: "Quản trị viên", editor: "Biên tập viên", reporter: "Phóng viên", user: "Độc giả" };
    authorRoleBottom.textContent = roleLabels[author.role] || "Tác giả";
    authorRoleBottom.className = `badge badge--${author.role || 'user'}`;
  }
  if (document.getElementById("author-view-profile-link")) {
    document.getElementById("author-view-profile-link").href = authorProfileUrl;
  }
  const authorAvatarBottom = document.getElementById("author-avatar-bottom");
  if (authorAvatarBottom) {
    authorAvatarBottom.innerHTML = renderUserAvatar(author, "avatar-badge avatar-badge--md");
  }

  // ==============================================================================
  // KHỐI 5: TƯƠNG TÁC LƯU BÀI VIẾT YÊU THÍCH (FAVORITE BOOKMARK)
  // ==============================================================================
  const favoriteBtn = document.getElementById("btn-favorite");
  let userFavorites = [];

  async function checkFavoriteState() {
    if (!currentUser || !favoriteBtn) return;
    try {
      const res = await fetch(resolveApiUrl("user/favorites.php"), { credentials: "include" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        userFavorites = data.data;
      }
    } catch (e) {
      console.error(e);
    }
    const isFav = userFavorites.some((f) => Number(f.id || f.article_id) === Number(article.id));
    if (isFav) {
      favoriteBtn.classList.add("is-active");
      favoriteBtn.title = "Đã lưu vào danh sách yêu thích";
    } else {
      favoriteBtn.classList.remove("is-active");
      favoriteBtn.title = "Lưu bài viết yêu thích";
    }
  }
  if (currentUser) {
    checkFavoriteState();
  }

  if (favoriteBtn) {
    favoriteBtn.addEventListener("click", async function () {
      if (!currentUser) {
        showToast("Vui lòng đăng nhập để lưu bài viết yêu thích!", "warning");
        return;
      }

      const isFav = userFavorites.some((f) => Number(f.id || f.article_id) === Number(article.id));
      try {
        if (isFav) {
          const res = await fetch(resolveApiUrl("user/favorites.php"), {
            method: "DELETE",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ article_id: article.id })
          });
          const data = await res.json();
          if (data.success) {
            userFavorites = userFavorites.filter((f) => Number(f.id || f.article_id) !== Number(article.id));
            favoriteBtn.classList.remove("is-active");
            favoriteBtn.title = "Lưu bài viết yêu thích";
            showToast("Đã bỏ bài viết khỏi danh sách yêu thích.", "info");
          } else {
            showToast(data.message || "Không thể bỏ yêu thích", "error");
          }
        } else {
          const res = await fetch(resolveApiUrl("user/favorites.php"), {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ article_id: article.id })
          });
          const data = await res.json();
          if (data.success) {
            userFavorites.push({ id: article.id, article_id: article.id });
            favoriteBtn.classList.add("is-active");
            favoriteBtn.title = "Đã lưu vào danh sách yêu thích";
            showToast("Đã lưu bài viết vào mục Yêu thích!", "success");
          } else {
            showToast(data.message || "Không thể lưu yêu thích", "error");
          }
        }
      } catch (err) {
        showToast("Lỗi kết nối máy chủ!", "error");
      }
    });
  }

  const shareBtn = document.getElementById("btn-share");
  if (shareBtn) {
    shareBtn.addEventListener("click", function () {
      navigator.clipboard.writeText(window.location.href);
      showToast("Đã sao chép liên kết bài viết vào bộ nhớ tạm!", "info");
    });
  }

  // ==============================================================================
  // KHỐI 6: KHU VỰC BÌNH LUẬN (HIỂN THỊ, GỬI BÌNH LUẬN, SỬA & XÓA)
  // ==============================================================================
  const commentCountMount = document.getElementById("comment-count-mount");
  const commentListMount = document.getElementById("comment-list-mount");
  const commentFormMount = document.getElementById("comment-form-mount");
  const commentLoginPrompt = document.getElementById("comment-login-prompt");

  if (currentUser) {
    if (commentFormMount) commentFormMount.style.display = "block";
    if (commentLoginPrompt) commentLoginPrompt.style.display = "none";

    if (currentUser.status === "locked") {
      if (commentFormMount) {
        const lockReason = currentUser.lock_reason || "Vi phạm tiêu chuẩn cộng đồng";
        commentFormMount.innerHTML = `
          <div style="background: #FFFBEB; border-left: 3px solid #D97706; padding: 14px 16px; border-radius: 4px; font-size: 13.5px; color: #92400E; margin: 0;">
            <p style="margin: 0 0 4px 0; font-weight: 600;">Tài khoản của bạn hiện đang bị khóa.</p>
            <p style="margin: 0; font-size: 12.5px; opacity: 0.95;"><strong>Lý do:</strong> ${escapeHtml(lockReason)}</p>
          </div>
        `;
      }
    }
  } else {
    if (commentFormMount) commentFormMount.style.display = "none";
    if (commentLoginPrompt) commentLoginPrompt.style.display = "block";
  }

  let articleComments = [];

  async function renderComments() {
    try {
      const res = await fetch(resolveApiUrl(`public/comments.php?article_id=${article.id}`));
      const data = await res.json();
      articleComments = (data.success && Array.isArray(data.data)) ? data.data : [];
    } catch (e) {
      console.error("Lỗi khi tải bình luận:", e);
      articleComments = [];
    }

    if (commentCountMount) {
      commentCountMount.textContent = `${articleComments.length}`;
    }

    if (!commentListMount) return;

    if (articleComments.length === 0) {
      commentListMount.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--muted); font-size: 13.5px;">
          Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ!
        </div>
      `;
      return;
    }

    commentListMount.innerHTML = articleComments
      .map((c) => {
        const commentUser = {
          id: c.user_id,
          full_name: c.full_name || "Độc giả",
          username: c.username || "user",
          avatar: c.avatar,
          role: c.role || "user"
        };
        const isMyComment = currentUser && Number(currentUser.id) === Number(c.user_id);
        const commentUserUrl = typeof getAuthorProfileUrl === "function" ? getAuthorProfileUrl(commentUser) : `author.html?username=${encodeURIComponent(commentUser.username || commentUser.id)}`;

        return `
          <div class="comment-row" id="comment-${c.id}" data-comment-id="${c.id}">
            <a href="${commentUserUrl}" title="Xem hồ sơ ${escapeHtml(commentUser.full_name)}" style="text-decoration: none; display: inline-flex;">
            ${renderUserAvatar(commentUser, "user-avatar")}
            </a>
            <div style="flex: 1; min-width: 0;">
              <div class="comment-meta-row" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <a href="${commentUserUrl}" class="comment-author" style="text-decoration: none; color: inherit; font-weight: 600;">
                    ${escapeHtml(commentUser.full_name)}
                  </a>
                  <span class="meta">${timeAgo(c.created_at)}</span>
                </div>

                <!-- Các nút hành động: Sửa / Xóa (nếu là bình luận của mình) -->
                <div class="comment-actions" style="display: flex; align-items: center; gap: 10px;">
                  ${isMyComment
                    ? `
                      <button type="button" class="comment-btn-link" onclick="startEditComment(${c.id})" style="background: none; border: none; font-size: 12px; color: var(--brass-dark); cursor: pointer; padding: 0; font-family: var(--f-sans); font-weight: 500;">Sửa</button>
                      <button type="button" class="comment-btn-link" onclick="openDeleteDetailCommentModal(${c.id})" style="background: none; border: none; font-size: 12px; color: #e02424; cursor: pointer; padding: 0; font-family: var(--f-sans); font-weight: 500;">Xóa</button>
                    `
                    : ""
                  }
                </div>
              </div>

              <!-- Nội dung bình luận hiển thị -->
              <div id="comment-content-view-${c.id}">
                <p class="comment-text">${escapeHtml(c.content)}</p>
              </div>

              <!-- Form chỉnh sửa bình luận trực tiếp tại chỗ -->
              <div id="comment-edit-form-${c.id}" style="display: none; margin-top: 8px;">
                <textarea id="comment-edit-input-${c.id}" class="form-control" rows="2" style="width: 100%; font-size: 13.5px; margin-bottom: 6px;">${escapeHtml(c.content)}</textarea>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                  <button type="button" class="btn btn-sm btn-ghost" onclick="cancelEditComment(${c.id})" style="padding: 4px 10px; font-size: 12.5px;">Hủy</button>
                  <button type="button" class="btn btn-sm btn-primary" onclick="saveEditComment(${c.id})" style="padding: 4px 12px; font-size: 12.5px;">Lưu</button>
                </div>
              </div>

            </div>
          </div>
        `;
      })
      .join("");

    // Kiểm tra nếu có tham số comment_id trên URL thì cuộn tới và làm nổi bật
    checkAndHighlightComment();
  }

  renderComments();

  const submitCommentBtn = document.getElementById("btn-submit-comment");
  const commentInput = document.getElementById("comment-input");

  if (submitCommentBtn && commentInput) {
    submitCommentBtn.addEventListener("click", async function () {
      if (!currentUser) return;
      const content = commentInput.value.trim();
      if (!content) {
        showToast("Vui lòng nhập nội dung bình luận!", "warning");
        commentInput.focus();
        return;
      }

      try {
        const res = await fetch(resolveApiUrl("user/my-comments.php"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            article_id: article.id,
            content: content
          })
        });
        const data = await res.json();
        if (!data.success) {
          showToast(data.message || "Không thể gửi bình luận", "error");
          return;
        }

        commentInput.value = "";
        await renderComments();
        showToast("Bình luận của bạn đã được đăng thành công!", "success");
      } catch (err) {
        console.error("Lỗi khi gửi bình luận:", err);
        showToast("Lỗi kết nối khi gửi bình luận!", "error");
      }
    });
  }

  // ==============================================================================
  // KHỐI 7: BÀI VIẾT LIÊN QUAN CÙNG CHUYÊN MỤC (RELATED ARTICLES)
  // ==============================================================================
  const relatedMount = document.getElementById("related-articles-mount");
  if (relatedMount) {
    let sameCategoryArticles = [];
    try {
      const relatedRes = await fetch(resolveApiUrl(`public/articles.php?category=${encodeURIComponent(category.slug || "")}`));
      const relatedResult = await relatedRes.json();
      sameCategoryArticles = relatedResult && relatedResult.success && Array.isArray(relatedResult.data) ? relatedResult.data : [];
    } catch (error) {
      console.error("Lỗi khi tải bài viết liên quan từ backend", error);
    }

    const relatedArticles = sameCategoryArticles
      .filter((a) => a.id !== article.id)
      .slice(0, 4);

    if (relatedArticles.length > 0) {
      relatedMount.innerHTML = relatedArticles
        .map((a) => `
          <a href="${getArticleDetailUrl(a)}" class="related-item">
            <div class="thumb--sm">
              ${renderCoverImage(a.cover_image, a.title, "ph--4x3")}
            </div>
            <div style="flex: 1; min-width: 0;">
              <h4 class="related-title">${escapeHtml(a.title)}</h4>
              <div class="meta" style="margin-top: 4px; font-size: 11px;">${formatDate(a.published_at)}</div>
            </div>
          </a>
        `)
        .join("");
    } else {
      relatedMount.innerHTML = `<p class="meta" style="font-size: 13px;">Chưa có bài viết liên quan.</p>`;
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initArticleDetailPage);
} else {
  initArticleDetailPage();
}

// ==============================================================================
// KHỐI 8: CÁC HÀM TIỆN ÍCH TƯƠNG TÁC BÌNH LUẬN (HIGHLIGHT, SỬA & XÓA BÌNH LUẬN)
// ==============================================================================
/**
 * Tự động cuộn đến bình luận và làm nổi màu (Highlight) trong 2.8s khi có param comment_id trên URL
 * (Được kích hoạt khi điều hướng từ trang Quản lý bình luận User 'my-comments.js' hoặc Quản trị Admin 'admin-comments.js')
 */
function checkAndHighlightComment() {
  const urlParams = new URLSearchParams(window.location.search);
  const commentId = urlParams.get("comment_id");
  if (!commentId) return;

  setTimeout(() => {
    const targetElement = document.getElementById(`comment-${commentId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      targetElement.classList.add("comment-highlight-flash");
      setTimeout(() => {
        targetElement.classList.remove("comment-highlight-flash");
      }, 2800);
    }
  }, 300);
}

/**
 * Bắt đầu chỉnh sửa bình luận
 */
function startEditComment(commentId) {
  const viewEl = document.getElementById(`comment-content-view-${commentId}`);
  const editForm = document.getElementById(`comment-edit-form-${commentId}`);
  if (viewEl && editForm) {
    viewEl.style.display = "none";
    editForm.style.display = "block";
    const textarea = document.getElementById(`comment-edit-input-${commentId}`);
    if (textarea) {
      textarea.focus();
    }
  }
}

/**
 * Hủy chỉnh sửa bình luận
 */
function cancelEditComment(commentId) {
  const viewEl = document.getElementById(`comment-content-view-${commentId}`);
  const editForm = document.getElementById(`comment-edit-form-${commentId}`);
  if (viewEl && editForm) {
    viewEl.style.display = "block";
    editForm.style.display = "none";
  }
}

/**
 * Lưu nội dung bình luận đã chỉnh sửa qua API
 */
async function saveEditComment(commentId) {
  const textarea = document.getElementById(`comment-edit-input-${commentId}`);
  if (!textarea) return;

  const newContent = textarea.value.trim();
  if (!newContent) {
    showToast("Nội dung bình luận không được để trống!", "warning");
    textarea.focus();
    return;
  }

  try {
    const res = await fetch(resolveApiUrl("user/my-comments.php"), {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_id: commentId, content: newContent })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || "Không thể cập nhật bình luận", "error");
      return;
    }

    showToast("Đã cập nhật bình luận thành công!", "success");
    
    // Cập nhật lại view
    const viewEl = document.getElementById(`comment-content-view-${commentId}`);
    if (viewEl) {
      viewEl.innerHTML = `<p class="comment-text">${escapeHtml(newContent)}</p>`;
    }
    cancelEditComment(commentId);
  } catch (err) {
    console.error("Lỗi cập nhật bình luận:", err);
    showToast("Lỗi kết nối khi cập nhật bình luận!", "error");
  }
}

let activeDeleteDetailCommentId = null;

function openDeleteDetailCommentModal(commentId) {
  activeDeleteDetailCommentId = commentId;
  const modal = document.getElementById("deleteDetailCommentModal");
  if (modal) {
    modal.classList.add("is-open");
  }
}

function closeDeleteDetailCommentModal() {
  activeDeleteDetailCommentId = null;
  const modal = document.getElementById("deleteDetailCommentModal");
  if (modal) {
    modal.classList.remove("is-open");
  }
}

async function confirmDeleteDetailComment() {
  if (!activeDeleteDetailCommentId) return;

  try {
    const res = await fetch(resolveApiUrl("user/my-comments.php"), {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_id: activeDeleteDetailCommentId })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || "Không thể xóa bình luận", "error");
      return;
    }

    showToast("Đã xóa bình luận thành công!", "success");
    closeDeleteDetailCommentModal();

    // Re-render comments
    const rowEl = document.getElementById(`comment-${activeDeleteDetailCommentId}`);
    if (rowEl) {
      rowEl.remove();
    }
    
    // Cập nhật lại số đếm
    const countMount = document.getElementById("comment-count-mount");
    if (countMount) {
      const current = parseInt(countMount.textContent) || 1;
      countMount.textContent = String(Math.max(0, current - 1));
    }
  } catch (err) {
    console.error("Lỗi xóa bình luận:", err);
    showToast("Lỗi kết nối khi xóa bình luận!", "error");
  }
}
