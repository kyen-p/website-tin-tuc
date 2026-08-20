// =====================================================
// MẠCH TIN — common.js (CẶP 1 · khu vực public/)
// - Đọc/ghi dữ liệu dựa trên mock-data.js (mock-data.js phải
//   được nhúng TRƯỚC file này).
// - Các bảng có thể thay đổi khi thao tác (favorites, comments,
//   comment_reports, reading_history, notifications) được lưu
//   tạm vào localStorage để demo có "nhớ" trạng thái khi F5,
//   dữ liệu gốc trong mock-data.js không bị sửa.
// - Đăng nhập giả lập: vì trang login.html thuộc phần việc của
//   Cặp 2, ở đây hỗ trợ chuyển trạng thái Guest/User bằng cách
//   thêm ?as=<username> vào URL (?as=guest để đăng xuất) —
//   dùng để xem trước 2 trạng thái header theo đúng UC-GU06.
// =====================================================
(function () {
  'use strict';

  var LS_SESSION = 'mt_session_user_id';
  var LS_PREFIX = 'mt_tbl_';

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function table(name) {
    var raw = localStorage.getItem(LS_PREFIX + name);
    if (raw) {
      try { return JSON.parse(raw); } catch (e) { /* rơi xuống seed lại */ }
    }
    var seed = deepClone(MOCK_DATA[name] || []);
    localStorage.setItem(LS_PREFIX + name, JSON.stringify(seed));
    return seed;
  }
  function saveTable(name, data) {
    localStorage.setItem(LS_PREFIX + name, JSON.stringify(data));
  }
  function resetDemoData() {
    Object.keys(MOCK_DATA).forEach(function (k) { localStorage.removeItem(LS_PREFIX + k); });
    localStorage.removeItem(LS_SESSION);
    location.reload();
  }
  function nowStr() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  function nextId(rows) {
    return rows.reduce(function (m, r) { return Math.max(m, r.id || 0); }, 0) + 1;
  }

  // ---------- demo đăng nhập qua ?as=username ----------
  (function handleDemoLogin() {
    var params = new URLSearchParams(location.search);
    if (params.has('as')) {
      var uname = params.get('as');
      if (uname === 'guest') {
        localStorage.removeItem(LS_SESSION);
      } else {
        var u = MOCK_DATA.users.find(function (x) { return x.username === uname; });
        if (u) localStorage.setItem(LS_SESSION, String(u.id));
      }
      params.delete('as');
      var qs = params.toString();
      history.replaceState({}, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    }
  })();

  function getCurrentUser() {
    var id = localStorage.getItem(LS_SESSION);
    if (!id) return null;
    var u = MOCK_DATA.users.find(function (x) { return x.id === Number(id); });
    if (!u || u.status === 'locked') return null;
    return u;
  }
  function logout() { localStorage.removeItem(LS_SESSION); }

  // ---------- helper dữ liệu ----------
  function getCategoryBySlug(slug) { return MOCK_DATA.categories.find(function (c) { return c.slug === slug; }); }
  function getCategoryById(id) { return MOCK_DATA.categories.find(function (c) { return c.id === id; }); }
  function getTagById(id) { return MOCK_DATA.tags.find(function (t) { return t.id === id; }); }
  function getTagBySlug(slug) { return MOCK_DATA.tags.find(function (t) { return t.slug === slug; }); }
  function getUserById(id) { return MOCK_DATA.users.find(function (u) { return u.id === id; }); }

  function getArticleTags(articleId) {
    return MOCK_DATA.article_tags
      .filter(function (x) { return x.article_id === articleId; })
      .map(function (x) { return getTagById(x.tag_id); })
      .filter(Boolean);
  }
  function getPublishedArticles() {
    return MOCK_DATA.articles
      .filter(function (a) { return a.status === 'published'; })
      .slice()
      .sort(function (a, b) { return new Date(b.published_at) - new Date(a.published_at); });
  }
  function getArticleById(id) {
    return MOCK_DATA.articles.find(function (a) { return a.id === Number(id) && a.status === 'published'; });
  }
  function getArticleBySlug(slug) {
    return MOCK_DATA.articles.find(function (a) { return a.slug === slug && a.status === 'published'; });
  }
  function getPublishedArticlesByAuthor(authorId) {
    return getPublishedArticles().filter(function (a) { return a.author_id === authorId; });
  }
  function getPublishedArticlesByCategory(categoryId) {
    return getPublishedArticles().filter(function (a) { return a.category_id === categoryId; });
  }
  function getPublishedArticlesByTag(tagId) {
    var ids = MOCK_DATA.article_tags.filter(function (x) { return x.tag_id === tagId; }).map(function (x) { return x.article_id; });
    return getPublishedArticles().filter(function (a) { return ids.indexOf(a.id) !== -1; });
  }
  function getRelatedArticles(article, limit) {
    limit = limit || 3;
    return getPublishedArticles()
      .filter(function (a) { return a.id !== article.id && a.category_id === article.category_id; })
      .slice(0, limit);
  }
  function initials(fullName) {
    if (!fullName) return '?';
    var parts = fullName.trim().split(/\s+/);
    var last = parts[parts.length - 1] || '';
    var first = parts.length > 1 ? parts[0] : '';
    return ((first[0] || '') + (last[0] || '')).toUpperCase() || last.slice(0, 2).toUpperCase();
  }

  // ---------- ảnh thật (nếu có file) với fallback về khung placeholder ----------
  // mock-data.js lưu đường dẫn dạng "/assets/images/xxx.jpg" (gốc từ project root).
  // Các trang trong public/ nằm ở cấp con nên cần đổi "/assets/..." -> "../assets/..."
  function assetPath(p) {
    if (!p) return '';
    return p.replace(/^\//, '../');
  }
  // Dùng bên trong khối .ph (ảnh bìa bài viết): nếu file ảnh không tồn tại,
  // thẻ <img> tự ẩn và khung placeholder có sẵn (chữ "Ảnh minh họa") sẽ hiển thị lại.
  function coverImgTag(path, alt) {
    if (!path) return '';
    return '<img src="' + assetPath(path) + '" alt="' + escapeHtml(alt || '') + '" loading="lazy" ' +
      'onload="this.parentElement.classList.add(\'ph--has-photo\')" ' +
      'onerror="this.remove()">';
  }
  // Dùng bên trong .avatar-badge: ảnh phủ lên trên, nếu lỗi thì tự gỡ,
  // để lại đúng 2 chữ cái viết tắt (initials) đã render sẵn phía dưới.
  function avatarInner(user) {
    var name = user ? user.full_name : '';
    var img = user && user.avatar ? coverImgTag(user.avatar, name) : '';
    return img + escapeHtml(initials(name));
  }

  function pad(n) { return String(n).padStart(2, '0'); }
  function formatDateTime(str) {
    if (!str) return '';
    var d = new Date(str.replace(' ', 'T'));
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ', ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function formatDate(str) {
    if (!str) return '';
    var d = new Date(str.replace(' ', 'T'));
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  var TODAY = new Date('2026-08-13T12:00:00'); // "hôm nay" theo mô tả mock-data.js
  function timeAgo(str) {
    if (!str) return '';
    var d = new Date(str.replace(' ', 'T'));
    var diffH = Math.floor((TODAY - d) / 3600000);
    if (diffH < 1) return 'Vừa xong';
    if (diffH < 24) return diffH + ' giờ trước';
    var diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Hôm qua';
    if (diffD < 7) return diffD + ' ngày trước';
    return formatDate(str);
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- bình luận / báo cáo / yêu thích / lịch sử ----------
  function getComments(articleId) {
    return table('comments')
      .filter(function (c) { return c.article_id === articleId && !c.is_deleted; })
      .sort(function (a, b) { return new Date(a.created_at) - new Date(b.created_at); });
  }
  function countComments(articleId) { return getComments(articleId).length; }
  function addComment(articleId, userId, content) {
    var comments = table('comments');
    comments.push({
      id: nextId(comments), article_id: articleId, user_id: userId, content: content,
      is_deleted: false, created_at: nowStr(), updated_at: nowStr()
    });
    saveTable('comments', comments);
  }
  function reportComment(commentId, reporterId, reasonType, reasonDetail) {
    var reports = table('comment_reports');
    reports.push({
      id: nextId(reports), comment_id: commentId, reporter_id: reporterId,
      reason_type: reasonType, reason_detail: reasonDetail || '',
      status: 'pending', resolved_by: null, resolved_at: null, created_at: nowStr()
    });
    saveTable('comment_reports', reports);
  }
  function isFavorited(userId, articleId) {
    return table('favorites').some(function (f) { return f.user_id === userId && f.article_id === articleId; });
  }
  function toggleFavorite(userId, articleId) {
    var favs = table('favorites');
    var idx = favs.findIndex(function (f) { return f.user_id === userId && f.article_id === articleId; });
    if (idx >= 0) { favs.splice(idx, 1); saveTable('favorites', favs); return false; }
    favs.push({ user_id: userId, article_id: articleId, created_at: nowStr() });
    saveTable('favorites', favs);
    return true;
  }
  function addReadingHistory(userId, articleId) {
    var hist = table('reading_history').filter(function (h) { return !(h.user_id === userId && h.article_id === articleId); });
    hist.push({ id: nextId(hist), user_id: userId, article_id: articleId, viewed_at: nowStr() });
    saveTable('reading_history', hist);
  }
  function unreadNotificationCount(userId) {
    return table('notifications').filter(function (n) { return n.user_id === userId && !n.is_read; }).length;
  }
  function isCommentLocked(userId) {
    var u = getUserById(userId);
    return !!(u && u.comment_locked);
  }

  // ---------- HEADER / FOOTER ----------
  var CATEGORIES = MOCK_DATA.categories;

  var PULSE_SVG = '<svg class="pulse-mark" width="{{S}}" height="{{S}}" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1 13H7L9.5 6L13.5 20L16 13H25" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function logoHtml(size, homeHref) {
    return '<a href="' + homeHref + '" class="logo" aria-label="Mạch Tin — trang chủ">' +
      PULSE_SVG.replace('{{S}}', size) +
      '<span class="logo__word">MẠCH&nbsp;<em>TIN</em></span></a>';
  }

  function weekdayVN(d) {
    var names = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return names[d.getDay()] + ', ' + formatDate(d.toISOString().slice(0, 10));
  }

  // opts: { active: 'index'|'category'|'search'|'article'|'author', activeCategorySlug, homePrefix }
  function renderHeader(opts) {
    opts = opts || {};
    var home = 'index.html';
    var user = getCurrentUser();

    var navLinks = ['<a href="index.html"' + (opts.active === 'index' ? ' class="is-active"' : '') + '>Trang chủ</a>'];
    CATEGORIES.forEach(function (c) {
      var isActive = opts.activeCategorySlug === c.slug;
      navLinks.push('<a href="category.html?slug=' + c.slug + '"' + (isActive ? ' class="is-active"' : '') + '>' + escapeHtml(c.name) + '</a>');
    });

    var barLinks = CATEGORIES.map(function (c) {
      var isActive = opts.activeCategorySlug === c.slug;
      return '<a href="category.html?slug=' + c.slug + '"' + (isActive ? ' class="is-active"' : '') + '>' + escapeHtml(c.name) + '</a>';
    }).join('');

    var utilityRight, actionsRight;
    if (user) {
      var unread = unreadNotificationCount(user.id);
      var roleLink = '';
      if (user.role === 'reporter') roleLink = '<a href="../reporter/dashboard.html" class="dropdown-menu__item dropdown-menu__item--role">Vào khu vực Reporter</a>';
      else if (user.role === 'editor') roleLink = '<a href="../editor/dashboard.html" class="dropdown-menu__item dropdown-menu__item--role">Vào khu vực Editor</a>';
      else if (user.role === 'admin') roleLink = '<a href="../admin/dashboard.html" class="dropdown-menu__item dropdown-menu__item--role">Vào khu vực Admin</a>';

      utilityRight =
        '<div class="header-user">' +
          '<a href="../user/notifications.html" class="notif-bell" aria-label="Thông báo">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
            (unread > 0 ? '<span class="notif-badge">' + (unread > 9 ? '9+' : unread) + '</span>' : '') +
          '</a>' +
          '<div class="user-menu">' +
            '<button class="user-menu__trigger" aria-haspopup="true" aria-expanded="false">' +
              '<span class="avatar-badge avatar-badge--sm">' + avatarInner(user) + '</span>' +
              '<span class="user-menu__name">' + escapeHtml(user.full_name) + '</span>' +
              '<svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</button>' +
            '<div class="dropdown-menu" role="menu">' +
              '<div class="dropdown-menu__hello">Xin chào, ' + escapeHtml(user.full_name) + '</div>' +
              roleLink +
              '<a href="../user/profile.html" class="dropdown-menu__item">Thông tin tài khoản</a>' +
              '<a href="../user/profile.html#password" class="dropdown-menu__item">Đổi mật khẩu</a>' +
              '<a href="../user/favorites.html" class="dropdown-menu__item">Bài viết yêu thích</a>' +
              '<a href="../user/history.html" class="dropdown-menu__item">Lịch sử đọc bài</a>' +
              '<a href="../user/my-comments.html" class="dropdown-menu__item">Bình luận của tôi</a>' +
              '<a href="../user/notifications.html" class="dropdown-menu__item">Thông báo</a>' +
              '<button type="button" class="dropdown-menu__item dropdown-menu__item--logout" data-mt-logout>Đăng xuất</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      actionsRight = '';
    } else {
      utilityRight =
        '<div class="header-utility__links">' +
          '<a href="../user/login.html">Đăng nhập</a>' +
          '<a href="../user/register.html">Tạo tài khoản</a>' +
        '</div>';
      actionsRight = '<a href="../user/login.html" class="btn btn-ghost btn-sm">Đăng nhập</a>';
    }

    return (
      '<header class="site-header">' +
        '<div class="header-utility"><div class="wrap">' +
          '<span>' + weekdayVN(TODAY) + '</span>' +
          utilityRight +
        '</div></div>' +
        '<div class="header-main"><div class="wrap">' +
          logoHtml(26, home) +
          '<nav class="main-nav" aria-label="Điều hướng chính">' + navLinks.join('') + '</nav>' +
          '<div class="header-actions">' +
            '<a href="search.html" class="icon-btn' + (opts.active === 'search' ? ' icon-btn--active' : '') + '" aria-label="Tìm kiếm">' +
              '<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
            '</a>' +
            actionsRight +
            '<button class="nav-toggle" aria-label="Mở menu" aria-expanded="false">' +
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
            '</button>' +
          '</div>' +
        '</div></div>' +
        '<div class="category-bar"><div class="wrap">' + barLinks + '</div></div>' +
      '</header>'
    );
  }

  function renderFooter() {
    var site = MOCK_DATA.site;
    return (
      '<footer class="site-footer">' +
        '<div class="wrap footer-top footer-top--simple">' +
          '<div class="footer-brand">' +
            logoHtml(24, 'index.html') +
            '<p>' + escapeHtml(site.short_description) + '</p>' +
            '<div class="footer-social">' +
              '<a href="' + escapeHtml(site.social_links.facebook) + '" aria-label="Facebook" target="_blank" rel="noopener">FB</a>' +
              '<a href="' + escapeHtml(site.social_links.youtube) + '" aria-label="YouTube" target="_blank" rel="noopener">YT</a>' +
              '<a href="' + escapeHtml(site.social_links.tiktok) + '" aria-label="TikTok" target="_blank" rel="noopener">TT</a>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<h4>Về Mạch Tin</h4>' +
            '<ul>' +
              '<li class="footer-contact-item">' + escapeHtml(site.contact_phone) + '</li>' +
              '<li class="footer-contact-item">' + escapeHtml(site.contact_email) + '</li>' +
              '<li class="footer-contact-item">' + escapeHtml(site.address) + '</li>' +
            '</ul>' +
          '</div>' +
        '</div>' +
        '<div class="wrap footer-bottom">' +
          '<span>© 2026 Mạch Tin · Điều khoản sử dụng · Chính sách bảo mật</span>' +
        '</div>' +
      '</footer>'
    );
  }

  function mount(id, html) {
    var el = document.getElementById(id);
    if (el) el.outerHTML = html;
  }

  function initChrome(opts) {
    mount('site-header', renderHeader(opts));
    mount('site-footer', renderFooter());
    initInteractions();
  }

  function initInteractions() {
    // menu mobile
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.main-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    // menu tài khoản (avatar)
    var trigger = document.querySelector('.user-menu__trigger');
    var userMenu = document.querySelector('.user-menu');
    if (trigger && userMenu) {
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = userMenu.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('click', function (e) {
        if (!userMenu.contains(e.target)) userMenu.classList.remove('is-open');
      });
    }
    var logoutBtn = document.querySelector('[data-mt-logout]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        logout();
        location.href = 'index.html';
      });
    }
  }

  window.MT = {
    table: table, saveTable: saveTable, resetDemoData: resetDemoData,
    getCurrentUser: getCurrentUser, logout: logout,
    getCategoryBySlug: getCategoryBySlug, getCategoryById: getCategoryById,
    getTagById: getTagById, getTagBySlug: getTagBySlug, getUserById: getUserById,
    getArticleTags: getArticleTags, getPublishedArticles: getPublishedArticles,
    getArticleById: getArticleById, getArticleBySlug: getArticleBySlug,
    getPublishedArticlesByAuthor: getPublishedArticlesByAuthor,
    getPublishedArticlesByCategory: getPublishedArticlesByCategory,
    getPublishedArticlesByTag: getPublishedArticlesByTag,
    getRelatedArticles: getRelatedArticles, initials: initials,
    assetPath: assetPath, coverImgTag: coverImgTag, avatarInner: avatarInner,
    formatDate: formatDate, formatDateTime: formatDateTime, timeAgo: timeAgo,
    escapeHtml: escapeHtml,
    getComments: getComments, countComments: countComments, addComment: addComment,
    reportComment: reportComment, isFavorited: isFavorited, toggleFavorite: toggleFavorite,
    addReadingHistory: addReadingHistory, unreadNotificationCount: unreadNotificationCount,
    isCommentLocked: isCommentLocked,
    renderHeader: renderHeader, renderFooter: renderFooter,
    initChrome: initChrome, initInteractions: initInteractions
  };
})();
