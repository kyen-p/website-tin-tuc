async function initArticleDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = Number(urlParams.get("id")) || 0;
  const articleSlug = (urlParams.get("slug") || "").trim();

  // Chưa có API riêng cho "tags"/"article_tags"/"comments"/"favorites" (ngoài phạm vi
  // 4 API Cặp 1 được giao) nên các phần này tạm thời vẫn lấy từ getTable() như trước.
  const tags = getTable("tags");
  const articleTags = getTable("article_tags");
  let comments = getTable("comments");
  let favorites = getTable("favorites");

  // 1. Lấy bài viết từ backend (PHP + MySQL). Gọi đúng 1 lần cho mỗi lần tải trang -
  //    khớp với yêu cầu "mỗi lần gọi API phải tăng view_count" của public/article-detail.php.
  let article = null;
  try {
    const params = articleSlug ? `slug=${encodeURIComponent(articleSlug)}` : `id=${encodeURIComponent(articleId)}`;
    const res = await fetch(resolveApiUrl(`public/article-detail.php?${params}`));
    const result = await res.json();
    if (result && result.success && result.data) {
      article = result.data;
    }
  } catch (error) {
    console.error("Lỗi khi tải bài viết từ backend", error);
  }

  const catSlug = article ? (article.category && article.category.slug) || "" : "";
  initPublicHeader(catSlug);
  initPublicFooter();

  const container = document.getElementById("article-detail-container");
  const notFound = document.getElementById("article-not-found");

  if (!article) {
    if (container) container.style.display = "none";
    if (notFound) notFound.style.display = "block";
    return;
  }

  if (container) container.style.display = "block";
  if (notFound) notFound.style.display = "none";

  document.title = `${article.title} - Mạch Tin`;

  const currentUser = getCurrentUser();

  const category = article.category || { name: "Thời sự", slug: "thoi-su" };
  const author = article.author || { full_name: "Ban Biên Tập", bio: "Đội ngũ phóng viên Mạch Tin", id: 1 };

  const currentTagIds = articleTags.filter((at) => at.article_id === article.id).map((at) => at.tag_id);
  const currentTags = tags.filter((t) => currentTagIds.includes(t.id));

  document.getElementById("breadcrumb-category").textContent = category.name;
  document.getElementById("breadcrumb-category").href = `category.html?slug=${category.slug}`;
  document.getElementById("breadcrumb-title").textContent = article.title;

  document.getElementById("article-category-badge").textContent = category.name;
  document.getElementById("article-title").textContent = article.title;
  document.getElementById("article-summary").textContent = article.short_description || article.summary || "";

  const authorProfileUrl = typeof getAuthorProfileUrl === "function" ? getAuthorProfileUrl(author) : `author.html?username=${encodeURIComponent(author.username || author.id)}`;

  document.getElementById("author-name-top").textContent = author.full_name;
  document.getElementById("author-link-top").href = authorProfileUrl;
  if (document.getElementById("author-name-link")) {
    document.getElementById("author-name-link").href = authorProfileUrl;
  }
  document.getElementById("article-time").textContent = formatDateTime(article.published_at || article.created_at);
  document.getElementById("article-views").textContent = `${formatNumber(article.view_count || article.views || 0)} lượt đọc`;

  const authorAvatarTop = document.getElementById("author-avatar-top");
  if (authorAvatarTop) {
    authorAvatarTop.innerHTML = renderUserAvatar(author, "avatar-badge avatar-badge--sm");
  }

  const coverMount = document.getElementById("article-cover-mount");
  if (coverMount) {
    // Ảnh bìa (Cover image / Thumbnail) phục vụ hiển thị ngoài danh sách bài viết (Trang chủ, Chuyên mục, Tìm kiếm).
    // Trong trang chi tiết bài viết, toàn bộ nội dung & hình ảnh hiển thị theo đúng những gì tác giả soạn trong CKEditor.
    // Đối với các bài viết văn bản thuần không có hình ảnh minh họa bên trong, chỉ hiển thị ảnh bìa nếu bài viết chưa từng chứa thẻ ảnh nào.
    const hasImageInContent = article.content && /<img|<figure/i.test(article.content);
    
    if (article.cover_image && !hasImageInContent && !article.content?.includes("<img")) {
      coverMount.innerHTML = renderCoverImage(article.cover_image, article.title, "ph--wide");
      coverMount.style.display = "block";
    } else {
      coverMount.innerHTML = "";
      coverMount.style.display = "none";
    }
  }

  const contentContainer = document.getElementById("article-content-body");
  if (contentContainer) {
    if (article.content && article.content.trim()) {
      const rawContent = article.content.trim();
      // Nếu nội dung chứa bất kỳ thẻ HTML nào (CKEditor sinh ra <p>, <figure>, <img>, <h3>,...)
      const hasHtmlTags = /<[a-z][\s\S]*>/i.test(rawContent);
      if (hasHtmlTags) {
        contentContainer.innerHTML = rawContent;
      } else {
        contentContainer.innerHTML = rawContent
          .split(/\n\n+/)
          .filter(Boolean)
          .map((p) => `<p>${escapeHtml(p)}</p>`)
          .join("");
      }
    } else {
      contentContainer.innerHTML = `<p>${escapeHtml(article.summary || "")}</p>`;
    }
  }

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
    const displayTags = currentTags.length > 0 ? currentTags : tags.slice(0, 6);
    sidebarTagsMount.innerHTML = displayTags
      .map((t) => `<a href="search.html?tag=${t.slug}" class="tag-chip">#${escapeHtml(t.name)}</a>`)
      .join("");
  }

  document.getElementById("author-name-bottom").textContent = author.full_name;
  document.getElementById("author-bio-bottom").textContent = author.bio || "Phóng viên chuyên trách tòa soạn Mạch Tin.";
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

  const favoriteBtn = document.getElementById("btn-favorite");
  function checkFavoriteState() {
    if (!currentUser || !favoriteBtn) return;
    const isFav = favorites.some((f) => f.user_id === currentUser.id && f.article_id === article.id);
    if (isFav) {
      favoriteBtn.classList.add("is-active");
      favoriteBtn.title = "Đã lưu vào danh sách yêu thích";
    } else {
      favoriteBtn.classList.remove("is-active");
      favoriteBtn.title = "Lưu bài viết yêu thích";
    }
  }
  checkFavoriteState();

  if (favoriteBtn) {
    favoriteBtn.addEventListener("click", function () {
      if (!currentUser) {
        showToast("Vui lòng đăng nhập để lưu bài viết yêu thích!", "warning");
        return;
      }

      favorites = getTable("favorites");
      const index = favorites.findIndex((f) => f.user_id === currentUser.id && f.article_id === article.id);
      if (index >= 0) {
        favorites.splice(index, 1);
        saveTable("favorites", favorites);
        checkFavoriteState();
        showToast("Đã bỏ bài viết khỏi danh sách yêu thích.", "info");
      } else {
        favorites.push({
          id: Date.now(),
          user_id: currentUser.id,
          article_id: article.id,
          created_at: new Date().toISOString().replace("T", " ").substring(0, 19)
        });
        saveTable("favorites", favorites);
        checkFavoriteState();
        showToast("Đã lưu bài viết vào mục Yêu thích!", "success");

        // Bắn thông báo cho tác giả bài viết (nếu không phải tự thích bài của mình)
        if (Number(article.author_id) !== Number(currentUser.id)) {
          createNotification({
            user_id: article.author_id,
            type: "article_liked",
            title: "Lượt thích bài viết",
            message: `${currentUser.full_name || "Một độc giả"} đã thêm bài viết '${article.title}' vào danh sách yêu thích.`,
            link: typeof getArticleDetailUrl === "function" ? getArticleDetailUrl(article, "../public/") : `../public/article-detail.html?slug=${encodeURIComponent(article.slug || article.id)}`
          });
        }
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

  const commentCountMount = document.getElementById("comment-count-mount");
  const commentListMount = document.getElementById("comment-list-mount");
  const commentFormMount = document.getElementById("comment-form-mount");
  const commentLoginPrompt = document.getElementById("comment-login-prompt");

  if (currentUser) {
    if (commentFormMount) commentFormMount.style.display = "block";
    if (commentLoginPrompt) commentLoginPrompt.style.display = "none";

    if (currentUser.is_comment_locked || currentUser.comment_locked) {
      if (commentFormMount) {
        const lockReason = currentUser.comment_lock_reason || "Vi phạm tiêu chuẩn cộng đồng bình luận";
        commentFormMount.innerHTML = `
          <div style="background: #FFFBEB; border-left: 3px solid #D97706; padding: 14px 16px; border-radius: 4px; font-size: 13.5px; color: #92400E; margin: 0;">
            <p style="margin: 0 0 4px 0; font-weight: 600;">Tài khoản của bạn đã bị tạm khóa tính năng bình luận.</p>
            <p style="margin: 0; font-size: 12.5px; opacity: 0.95;"><strong>Lý do:</strong> ${escapeHtml(lockReason)}</p>
          </div>
        `;
      }
    }
  } else {
    if (commentFormMount) commentFormMount.style.display = "none";
    if (commentLoginPrompt) commentLoginPrompt.style.display = "block";
  }

  function renderComments() {
    comments = getTable("comments");
    const articleComments = comments
      .filter((c) => c.article_id === article.id && !c.is_deleted)
      .sort((a, b) => new Date(String(b.created_at).replace(" ", "T")) - new Date(String(a.created_at).replace(" ", "T")));

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
        const commentUser = users.find((u) => u.id === c.user_id) || { full_name: "Độc giả", username: "guest" };
        const isMyComment = currentUser && currentUser.id === c.user_id;
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
                  ${c.is_edited ? `<span class="meta" style="font-size: 11px; font-style: italic;">(đã chỉnh sửa)</span>` : ""}
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
    submitCommentBtn.addEventListener("click", function () {
      if (!currentUser) return;
      const content = commentInput.value.trim();
      if (!content) {
        showToast("Vui lòng nhập nội dung bình luận!", "warning");
        commentInput.focus();
        return;
      }

      comments = getTable("comments");
      const newComment = {
        id: Date.now(),
        article_id: article.id,
        user_id: currentUser.id,
        content: content,
        is_deleted: false,
        created_at: new Date().toISOString().replace("T", " ").substring(0, 19)
      };

      comments.push(newComment);
      saveTable("comments", comments);
      commentInput.value = "";
      renderComments();
      showToast("Bình luận của bạn đã được đăng thành công!", "success");

      // Bắn thông báo cho tác giả bài viết (nếu không phải tự bình luận bài của mình)
      if (Number(article.author_id) !== Number(currentUser.id)) {
        const articleSlugVal = article.slug || (typeof slugify === "function" ? slugify(article.title) : "") || article.id;
        createNotification({
          user_id: article.author_id,
          type: "article_commented",
          title: "Bình luận mới trên bài viết",
          message: `${currentUser.full_name || "Một độc giả"} đã bình luận về bài viết '${article.title}' của bạn.`,
          link: `../public/article-detail.html?slug=${encodeURIComponent(articleSlugVal)}&comment_id=${newComment.id}#comment-${newComment.id}`
        });
      }
    });
  }

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

let activeReportCommentId = null;

function openReportCommentModal(commentId) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showToast("Vui lòng đăng nhập để báo cáo vi phạm!", "warning");
    return;
  }
  activeReportCommentId = commentId;
  const modal = document.getElementById("reportModal");
  if (modal) {
    document.getElementById("reportReasonDetail").value = "";
    const defaultRadio = modal.querySelector('input[name="reportReason"][value="spam"]');
    if (defaultRadio) defaultRadio.checked = true;
    modal.classList.add("is-open");
  }
}

function closeReportCommentModal() {
  activeReportCommentId = null;
  const modal = document.getElementById("reportModal");
  if (modal) modal.classList.remove("is-open");
}

function submitReportComment() {
  const currentUser = getCurrentUser();
  if (!currentUser || !activeReportCommentId) return;

  closeReportCommentModal();
  showToast("Đã gửi phản hồi báo cáo vi phạm đến ban biên tập!", "success");
}

/**
 * Tự động cuộn đến bình luận và làm nổi màu (Highlight) trong 2.5s khi có param comment_id
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
 * Lưu nội dung bình luận đã chỉnh sửa
 */
function saveEditComment(commentId) {
  const textarea = document.getElementById(`comment-edit-input-${commentId}`);
  if (!textarea) return;

  const newContent = textarea.value.trim();
  if (!newContent) {
    showToast("Nội dung bình luận không được để trống!", "warning");
    textarea.focus();
    return;
  }

  let comments = getTable("comments");
  const commentIndex = comments.findIndex((c) => String(c.id) === String(commentId));
  if (commentIndex > -1) {
    comments[commentIndex].content = newContent;
    comments[commentIndex].is_edited = true;
    comments[commentIndex].updated_at = new Date().toISOString().replace("T", " ").substring(0, 19);
    saveTable("comments", comments);

    showToast("Đã cập nhật bình luận thành công!", "success");
    
    // Cập nhật lại view
    const viewEl = document.getElementById(`comment-content-view-${commentId}`);
    if (viewEl) {
      viewEl.innerHTML = `<p class="comment-text">${escapeHtml(newContent)}</p>`;
    }
    cancelEditComment(commentId);
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

function confirmDeleteDetailComment() {
  if (!activeDeleteDetailCommentId) return;

  let comments = getTable("comments");
  const commentIndex = comments.findIndex((c) => String(c.id) === String(activeDeleteDetailCommentId));

  if (commentIndex > -1) {
    comments[commentIndex].is_deleted = true;
    saveTable("comments", comments);

    showToast("Đã xóa bình luận thành công!", "success");
    closeDeleteDetailCommentModal();

    // Re-render comments
    const rowEl = document.getElementById(`comment-${activeDeleteDetailCommentId}`);
    if (rowEl) {
      rowEl.remove();
    }
    
    // Cập nhật lại số đếm
    const articleId = comments[commentIndex].article_id;
    const remainingCount = comments.filter((c) => c.article_id === articleId && !c.is_deleted).length;
    const commentCountMount = document.getElementById("comment-count-mount");
    if (commentCountMount) {
      commentCountMount.textContent = `${remainingCount}`;
    }
  }
}
