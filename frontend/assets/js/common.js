/*
==============================================================================
TÊN FILE: frontend/assets/js/common.js
PHÂN HỆ: Thư viện Tiện ích dùng chung (Frontend Utilities)
MÔ TẢ: Cung cấp các hàm bổ trợ dùng chung cho toàn bộ giao diện website:
       1. Quản lý phiên đăng nhập: Lấy thông tin user hiện tại từ PHP Session, đăng xuất, kiểm tra quyền truy cập.
       2. Xử lý API: Tự động điều chỉnh đường dẫn tương đối (resolveApiUrl) và gửi request an toàn (safeFetchJson).
       3. Tiện ích chuỗi & Bảo mật: Tạo slug SEO, chống tấn công XSS, định dạng ngày tháng tiếng Việt.
       4. Xử lý hình ảnh: Chuẩn hóa đường dẫn upload, hiển thị ảnh bìa (kèm khung placeholder dự phòng), avatar người dùng.
       5. Thông báo nhanh: Hàm showToast hiển thị thông báo với 4 trạng thái (thành công, cảnh báo, lỗi, thông tin).
       6. Khung giao diện tự động: Render Header, Ticker tin nóng, Footer và Sidebar đọc nhiều / thẻ tag.
       7. Phân trang: Hỗ trợ phân trang danh sách tin công khai và phân trang bảng dữ liệu Admin.
PHẠM VI SỬ DỤNG:
       - Được nhúng trong tất cả các file HTML (Public, User, Reporter, Editor, Admin).
PHỤ THUỘC:
       - Thư viện Toastify JS (hiển thị thông báo)
       - Các API: auth/me.php, auth/logout.php, public/categories.php, public/articles.php, admin/contact-config.php
==============================================================================
*/

/**
 * Lấy mốc thời gian hệ thống
 */
function getSystemTime() {
  return new Date();
}

// 1. Quản lý phiên đăng nhập và phân quyền

/**
 * Tự động chuẩn hóa đường dẫn gọi API backend PHP dựa theo vị trí thư mục của trang web
 * (VD: từ /frontend/public/ gọi về ../../backend/api/...)
 */
function resolveApiUrl(apiPath) {
  const cleanPath = String(apiPath).replace(/^\/+/, "");
  const currentPath = window.location.pathname;
  const isSubfolder =
    /\/(public|admin|reporter|editor|user)\//.test(currentPath) ||
    window.location.href.includes("/public/") ||
    window.location.href.includes("/admin/") ||
    window.location.href.includes("/user/") ||
    window.location.href.includes("/reporter/") ||
    window.location.href.includes("/editor/");
  const prefix = isSubfolder ? "../../backend/api/" : "backend/api/";
  return prefix + cleanPath;
}
window.resolveApiUrl = resolveApiUrl;

/**
 * Chuyển chuỗi thành JSON an toàn, tránh lỗi crash trang khi backend trả về lỗi máy chủ hoặc chuỗi rỗng
 */
function safeJsonParse(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    return null;
  }
}
window.safeJsonParse = safeJsonParse;

/**
 * Gửi fetch request và nhận dữ liệu JSON an toàn
 */
async function safeFetchJson(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return { success: false, data: null };
    const text = await res.text();
    const parsed = safeJsonParse(text);
    if (parsed) return parsed;
    return { success: false, data: null };
  } catch (err) {
    return { success: false, data: null };
  }
}
window.safeFetchJson = safeFetchJson;

// Biến lưu tạm thông tin user trong một phiên tải trang để tránh gửi lặp lại nhiều request me.php
let __machtinCurrentUserCache = undefined;

/**
 * Lấy thông tin tài khoản đang đăng nhập (hoặc null nếu là khách vãng lai).
 * Dữ liệu được xác thực trực tiếp từ PHP Session thông qua API backend/api/auth/me.php.
 * Sử dụng XMLHttpRequest đồng bộ để các file JS khác có thể lấy user ngay lập tức mà không cần chuyển sang hàm bất đồng bộ (async/await).
 */
function getCurrentUser() {
  if (__machtinCurrentUserCache !== undefined) {
    return __machtinCurrentUserCache;
  }
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", resolveApiUrl("auth/me.php"), false); // Gửi đồng bộ
    xhr.send(null);
    if (xhr.status >= 200 && xhr.status < 300) {
      const res = safeJsonParse(xhr.responseText);
      __machtinCurrentUserCache = res && res.success && res.data ? res.data : null;
    } else {
      __machtinCurrentUserCache = null;
    }
  } catch (error) {
    __machtinCurrentUserCache = null;
  }
  return __machtinCurrentUserCache;
}
window.getCurrentUser = getCurrentUser;

/**
 * Cập nhật cache người dùng khi có thay đổi thông tin (như cập nhật họ tên, avatar)
 */
function setCurrentUser(user) {
  __machtinCurrentUserCache = user !== undefined ? user : undefined;
}
window.setCurrentUser = setCurrentUser;

/**
 * Đăng xuất: gọi API hủy Session PHP trên máy chủ, xóa cache và chuyển hướng trang
 */
function logout(redirectUrl) {
  fetch(resolveApiUrl("auth/logout.php"), { method: "POST", credentials: "include" })
    .catch((error) => {
      console.error("Lỗi khi gọi API đăng xuất:", error);
    })
    .then(() => {
      // Xóa cache user hiện tại
      __machtinCurrentUserCache = undefined;

      showToast("Đăng xuất thành công!", "success");
      setTimeout(() => {
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
        const currentPath = window.location.pathname;
        if (currentPath.includes("/user/") || currentPath.includes("/admin/") || currentPath.includes("/reporter/") || currentPath.includes("/editor/")) {
          window.location.href = "../public/index.html";
        } else if (currentPath.includes("/public/")) {
          window.location.href = "index.html";
        } else {
          window.location.href = "public/index.html";
        }
      }, 500);
    });
}

/**
 * Kiểm tra phân quyền truy cập trang
 * @param {Array<string>} allowedRoles - Danh sách vai trò được phép (ví dụ: ['admin'], ['editor'])
 */
function checkAuth(allowedRoles) {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "../public/login.html";
    return null;
  }
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    showToast("Bạn không có quyền truy cập trang này!", "error");
    setTimeout(() => {
      window.location.href = "../public/index.html";
    }, 1000);
    return null;
  }
  return user;
}

// 2. Tiện ích chuỗi, bảo mật và định dạng

/**
 * Hàm chuyển đổi chuỗi tiếng Việt thành Slug chuẩn SEO & URL an toàn
 * Ví dụ: "Thời sự & Chính trị: Giá vàng 28/08 tăng!" -> "thoi-su-chinh-tri-gia-vang-2808-tang"
 */
function slugify(text) {
  if (text === null || text === undefined) return "";
  let str = String(text).trim().toLowerCase();

  // 1. Chuyển đổi các ký tự tiếng Việt có dấu sang không dấu
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");

  // 2. Chuẩn hóa NFD để lọc sạch các dấu thanh phụ tổ hợp
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 3. Loại bỏ ký tự đặc biệt, chỉ giữ lại chữ cái a-z, số 0-9 và khoảng trắng / gạch ngang
  str = str.replace(/[^a-z0-9\s-]/g, "");

  // 4. Thay thế khoảng trắng và nhiều dấu gạch ngang liên tiếp thành 1 dấu gạch ngang duy nhất
  str = str.replace(/[\s_-]+/g, "-");

  // 5. Cắt bỏ dấu gạch ngang thừa ở đầu và cuối chuỗi
  str = str.replace(/^-+|-+$/g, "");

  return str;
}
window.slugify = slugify;

/**
 * Trả về URL chi tiết bài viết chuẩn SEO sử dụng ?slug=...
 */
function getArticleDetailUrl(article, prefix = "") {
  if (!article) return `${prefix}article-detail.html`;
  const slug = article.slug || (typeof slugify === "function" ? slugify(article.title) : "") || article.id;
  return `${prefix}article-detail.html?slug=${encodeURIComponent(slug)}`;
}
window.getArticleDetailUrl = getArticleDetailUrl;

/**
 * Trả về URL trang tác giả chuẩn SEO sử dụng ?username=... hoặc ?slug=...
 */
function getAuthorProfileUrl(userOrAuthor, prefix = "") {
  if (!userOrAuthor) return `${prefix}author.html`;
  const username = userOrAuthor.username || (typeof slugify === "function" ? slugify(userOrAuthor.full_name) : "") || userOrAuthor.id;
  return `${prefix}author.html?username=${encodeURIComponent(username)}`;
}
window.getAuthorProfileUrl = getAuthorProfileUrl;

/**
 * Chống tấn công XSS và lỗi ký tự đặc biệt
 */
function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text).replace(/[&<>"']/g, function (match) {
    const escapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return escapeMap[match];
  });
}

/**
 * Chuyển chuỗi ngày giờ từ Backend (hoặc chuẩn ISO) thành đối tượng Date chuẩn múi giờ hệ thống
 */
function parseSystemDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  
  const s = String(dateStr).trim();
  // Nếu là dạng MySQL 'YYYY-MM-DD HH:mm:ss'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    // Thêm định danh múi giờ Việt Nam +07:00 nếu chưa có
    return new Date(s.replace(" ", "T") + "+07:00");
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s + "T00:00:00+07:00");
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
window.parseSystemDate = parseSystemDate;

/**
 * Helper lấy số lượt xem bài viết chuẩn hóa (ưu tiên view_count từ database)
 */
function getArticleViews(article) {
  if (!article) return 0;
  return Number(article.view_count || 0);
}
window.getArticleViews = getArticleViews;

/**
 * Định dạng ngày đăng bài chuẩn toàn hệ thống Mạch Tin:
 * - Nếu < 48 giờ: 'Vừa xong' / 'X phút trước' / 'X giờ trước' / '1 ngày trước'
 * - Nếu > 48 giờ: 'HH:mm, DD/MM/YYYY' (ví dụ: '09:30, 13/08/2026')
 */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = parseSystemDate(dateStr);
  if (!d) return String(dateStr);

  const now = getSystemTime();
  const diffMs = now.getTime() - d.getTime();

  // Nếu trong vòng 48 giờ (2 ngày)
  if (diffMs >= 0 && diffMs < 48 * 60 * 60 * 1000) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  }

  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${hours}:${minutes}, ${day}/${month}/${year}`;
}

/**
 * Định dạng ngày giờ tuyệt đối: HH:mm, DD/MM/YYYY
 */
function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const d = parseSystemDate(dateStr);
  if (!d) return String(dateStr);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${hours}:${minutes}, ${day}/${month}/${year}`;
}

/**
 * Tính thời gian tương đối đồng bộ với formatDate
 */
function timeAgo(dateStr) {
  return formatDate(dateStr);
}

/**
 * Định dạng số có dấu chấm phân cách hàng nghìn (12500 -> 12.500)
 */
function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return Number(num).toLocaleString("vi-VN");
}

/**
 * Lấy 2 chữ cái đầu làm avatar fallback nếu không có ảnh
 */
function getInitials(fullName) {
  if (!fullName) return "U";
  const parts = String(fullName).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Tự động chuyển đổi đường dẫn ảnh phù hợp với vị trí trang hiện tại
 * Hỗ trợ các trang trong thư mục con (/public, /admin, /reporter, /user)
 */
function resolveAssetPath(path) {
  if (!path) return "";
  const trimmed = String(path).trim();
  // Nếu là link tuyệt đối hoặc data URL thì giữ nguyên
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:") || trimmed.startsWith("//")) {
    return trimmed;
  }
  // Loại bỏ các đường dẫn placeholder không có thực trên máy chủ
  if (trimmed.includes("placeholder")) {
    return "";
  }

  // Chuẩn hóa đường dẫn: nếu trỏ tới backend/api/upload/, loại bỏ các tiền tố relative thừa
  let cleanPath = trimmed;
  const backendIndex = cleanPath.indexOf("backend/api/upload/");
  if (backendIndex !== -1) {
    cleanPath = cleanPath.substring(backendIndex);
  } else {
    while (cleanPath.startsWith("../") || cleanPath.startsWith("./") || cleanPath.startsWith("/")) {
      cleanPath = cleanPath.replace(/^(\.\.\/|\.\/|\/)/, "");
    }
  }

  // Kiểm tra nếu trang hiện tại nằm trong thư mục con (ví dụ /public/, /admin/, /user/, /reporter/, /editor/)
  const currentPath = window.location.pathname;
  const isSubfolder = /\/(public|admin|reporter|editor|user)\//.test(currentPath) || 
                      currentPath.includes("/public") || 
                      window.location.href.includes("/public/") ||
                      window.location.href.includes("/admin/") ||
                      window.location.href.includes("/user/") ||
                      window.location.href.includes("/reporter/") ||
                      window.location.href.includes("/editor/");

  // Nếu đường dẫn trỏ tới backend (ví dụ backend/api/upload/...): cần lùi 2 cấp từ frontend/subfolder/
  if (cleanPath.startsWith("backend/")) {
    return isSubfolder ? "../../" + cleanPath : cleanPath;
  }

  if (isSubfolder && !cleanPath.startsWith("../")) {
    return "../" + cleanPath;
  }
  return cleanPath;
}

/**
 * Tạo thẻ ảnh bìa bài viết với fallback placeholder tự động
 */
function renderCoverImage(imagePath, altText, aspectRatioClass) {
  const aspectClass = aspectRatioClass || "ph--16x9";
  const safeAlt = escapeHtml(altText || "Ảnh bài viết");
  const raw = imagePath ? String(imagePath).trim() : "";
  if (!raw || raw.includes("placeholder")) {
    return `<div class="ph ${aspectClass}"><span class="ph__label">${safeAlt}</span></div>`;
  }
  const resolvedUrl = resolveAssetPath(raw);

  if (!resolvedUrl) {
    return `<div class="ph ${aspectClass}"><span class="ph__label">${safeAlt}</span></div>`;
  }
  return `
    <div class="ph ${aspectClass}">
      <img src="${resolvedUrl}" alt="${safeAlt}" loading="lazy" 
           onload="this.parentElement.classList.add('ph--has-photo')" 
           onerror="this.remove()">
      <span class="ph__label">${safeAlt}</span>
    </div>
  `;
}

/**
 * Tạo HTML avatar người dùng (hiển thị ảnh nếu có, fallback về chữ cái)
 */
function renderUserAvatar(user, customClass) {
  const className = customClass || "avatar-badge";
  if (!user) return `<div class="${className}">?</div>`;
  const initials = getInitials(user.full_name || user.username);
  const resolvedAvatar = resolveAssetPath(user.avatar);

  if (resolvedAvatar) {
    return `
      <div class="${className}">
        <img src="${resolvedAvatar}" alt="${escapeHtml(user.full_name)}" onerror="this.remove()">
        <span>${initials}</span>
      </div>
    `;
  }
  return `<div class="${className}">${initials}</div>`;
}

// 3. Thông báo nhanh (Toast notification)

/**
 * Hiển thị thông báo nhanh (Toast notification):
 * - Hỗ trợ 4 trạng thái: success (thành công), info (thông tin), warning (cảnh báo), error (lỗi)
 * - Tự động ẩn sau 3.5 giây
 * 
 * @param {string} message - Nội dung thông báo
 * @param {'success'|'info'|'warning'|'error'} type - Loại thông báo
 * @param {string} [title] - Tiêu đề (nếu không truyền sẽ lấy mặc định)
 * @param {number} [duration=3500] - Thời gian hiển thị tính bằng mili-giây
 */
function showToast(message, type = "info", title = null, duration = 3500) {
  // Chuẩn hóa loại trạng thái
  const validTypes = ["success", "info", "warning", "error"];
  const finalType = validTypes.includes(type) ? type : "info";

  // Tiêu đề mặc định tiếng Việt
  const defaultTitles = {
    success: "Thành công",
    info: "Thông báo",
    warning: "Cảnh báo",
    error: "Lỗi"
  };

  const finalTitle = title || defaultTitles[finalType];

  // Bảng màu Pastel chuẩn Mạch Tin
  const bgColors = {
    success: "#C3ECD0",
    info: "#BAE2F8",
    warning: "#F8E5BD",
    error: "#F6BCB8"
  };
  const textColors = {
    success: "#142814",
    info: "#0E2435",
    warning: "#32250E",
    error: "#351313"
  };

  // SVG Icon tròn chuẩn mực theo từng loại
  const icons = {
    success: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="m9 12 2 2 4-4"></path>
      </svg>
    `,
    info: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `,
    warning: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `,
    error: `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    `
  };

  const toastHtml = `
    <div class="mach-toast__icon">
      ${icons[finalType]}
    </div>
    <div class="mach-toast__body">
      <div class="mach-toast__title">${escapeHtml(finalTitle)}</div>
      <div class="mach-toast__desc">${escapeHtml(message)}</div>
    </div>
  `;

  // Sử dụng thư viện Toastify JS chính thức
  if (typeof Toastify === "function") {
    Toastify({
      text: toastHtml,
      escapeMarkup: false,
      duration: duration,
      gravity: "top",
      position: "right",
      close: true,
      stopOnFocus: true,
      className: `mach-toast mach-toast--${finalType}`,
      style: {
        background: bgColors[finalType],
        color: textColors[finalType]
      },
      offset: {
        x: 20,
        y: 15
      }
    }).showToast();
  } else {
    // Fallback an toàn nếu script CDN chưa tải xong
    console.warn(`[Toast ${finalType}] ${finalTitle}: ${message}`);
  }
}
window.showToast = showToast;

// 4. Tự động tạo Header, tin nóng và Footer

/**
 * Biểu tượng nhịp đập thương hiệu Báo Mạch Tin (SVG)
 */
const PULSE_SVG_ICON = `
  <svg class="pulse-mark" width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden="true">
    <path d="M1 13H7L9.5 6L13.5 20L16 13H25" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

/**
 * Hiển thị thứ ngày tháng tiếng Việt cho thanh tiện ích Header (VD: "Thứ Tư, 16/09/2026")
 */
function getVietnameseDateLabel(date) {
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dayName = days[date.getDay()];
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dayName}, ${dd}/${mm}/${yyyy}`;
}

/**
 * Tự động tạo thanh Header, Ticker tin nóng và Menu điều hướng cho các trang công khai và người dùng
 * @param {string} activeCategorySlug - Slug của chuyên mục đang xem (để active menu)
 */
async function initPublicHeader(activeCategorySlug = "") {
  const headerMount = document.getElementById("site-header");
  if (!headerMount) return;

  const user = getCurrentUser();

  // Lấy dữ liệu an toàn từ API PHP backend
  const [categoriesRes, articlesRes] = await Promise.all([
    safeFetchJson(resolveApiUrl("public/categories.php")),
    safeFetchJson(resolveApiUrl("public/articles.php"))
  ]);
  const categories = (categoriesRes && categoriesRes.data) || [];
  const allArticles = (articlesRes && articlesRes.data) || [];

  const currentPath = window.location.pathname;
  const isInUserDir = currentPath.includes("/user/");
  const publicPrefix = isInUserDir ? "../public/" : "";
  const userPrefix = isInUserDir ? "" : "../user/";
  const workspacePrefix = isInUserDir ? "../" : "../";

  const now = getSystemTime();
  const hotArticles = allArticles
    .filter((a) => a.status === "published")
    .map((a) => {
      const pubDate = parseSystemDate(a.published_at || a.created_at);
      const hoursDiff = Math.max(0, (now.getTime() - (pubDate ? pubDate.getTime() : now.getTime())) / (1000 * 60 * 60));
      const views = getArticleViews(a);
      return { ...a, hotScore: views / (hoursDiff + 1) };
    })
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, 5);

  let tickerHtml = "";
  if (hotArticles.length > 0) {
    const singleTicker = hotArticles
      .map((a) => `
        <span>
          <strong class="ticker__tag">NÓNG -</strong>
          <a href="${getArticleDetailUrl(a, publicPrefix)}" class="ticker__link">${escapeHtml(a.title)}</a>
        </span>
      `)
      .join("");
    // Nhân đôi danh sách để tạo hiệu ứng cuộn mượt mà vô tận
    tickerHtml = singleTicker + singleTicker;
  } else {
    tickerHtml = `<span><strong class="ticker__tag">NÓNG -</strong> Bắt mạch dòng chảy tin tức 24/7 từ Mạch Tin</span>`;
  }

  // Link chuyên mục ở Main Nav & Category Bar
  const navLinksHtml = categories
    .map((c) => {
      const isActive = activeCategorySlug === c.slug ? "is-active" : "";
      return `<a href="${publicPrefix}category.html?slug=${c.slug}" class="${isActive}">${escapeHtml(c.name)}</a>`;
    })
    .join("");

  // Nút khu vực quản trị theo vai trò (chỉ hiển thị cho reporter, editor, admin; ẩn hoàn toàn với user)
  let dashboardRoleLink = "";
  if (user && user.role && user.role !== "user") {
    if (user.role === "reporter") {
      dashboardRoleLink = `<a href="${workspacePrefix}reporter/dashboard.html" class="dropdown-menu__item dropdown-menu__item--role" target="_blank" rel="noopener noreferrer">Vào khu vực Phóng viên</a>`;
    } else if (user.role === "editor") {
      dashboardRoleLink = `<a href="${workspacePrefix}editor/dashboard.html" class="dropdown-menu__item dropdown-menu__item--role" target="_blank" rel="noopener noreferrer">Vào khu vực Biên tập</a>`;
    } else if (user.role === "admin") {
      dashboardRoleLink = `<a href="${workspacePrefix}admin/dashboard.html" class="dropdown-menu__item dropdown-menu__item--role" target="_blank" rel="noopener noreferrer">Vào khu vực Quản trị</a>`;
    }
  }

  // Góc phải của Utility Bar
  let userUtilityHtml = "";
  let headerActionsHtml = "";

  if (user) {
    userUtilityHtml = `
      <div class="header-user">
        <!-- Khối Menu Avatar -->
        <div class="user-menu" id="userMenuDropdown">
          <button class="user-menu__trigger" id="userMenuBtn" type="button">
            ${renderUserAvatar(user, "avatar-badge avatar-badge--sm")}
            <span class="user-menu__name">${escapeHtml(user.full_name || user.username)}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="dropdown-menu">
            <div class="dropdown-menu__hello">Xin chào, <strong>${escapeHtml(user.full_name)}</strong></div>
            <a href="${userPrefix}profile.html" class="dropdown-menu__item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>Thông tin tài khoản</span>
            </a>
            <a href="${userPrefix}change-password.html" class="dropdown-menu__item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <span>Đổi mật khẩu</span>
            </a>
            <a href="${userPrefix}favorites.html" class="dropdown-menu__item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <span>Bài viết yêu thích</span>
            </a>
            <a href="${userPrefix}my-comments.html" class="dropdown-menu__item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span>Bình luận của tôi</span>
            </a>
            ${dashboardRoleLink}
            <button type="button" class="dropdown-menu__item dropdown-menu__item--logout" onclick="logout('${publicPrefix}index.html')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    `;
    headerActionsHtml = "";
  } else {
    const isPublicFolder = /\/public\//.test(currentPath) || currentPath.endsWith("/public") || currentPath.endsWith("/public/index.html") || (!currentPath.includes("/user/") && !currentPath.includes("/admin/") && !currentPath.includes("/reporter/") && !currentPath.includes("/editor/"));
    const loginLink = isPublicFolder ? "login.html" : "../public/login.html";
    const registerLink = isPublicFolder ? "register.html" : "../public/register.html";

    userUtilityHtml = `
      <div class="header-utility__links">
        <a href="${loginLink}">Đăng nhập</a>
        <a href="${registerLink}">Tạo tài khoản</a>
      </div>
    `;
    headerActionsHtml = `
      <a href="${loginLink}" class="btn btn-ghost btn-sm">Đăng nhập</a>
    `;
  }

  const isIndexPage = window.location.pathname.endsWith("index.html") || window.location.pathname === "/" || window.location.pathname.endsWith("/public/");
  const isCategoryAll = (window.location.pathname.endsWith("category.html") && !activeCategorySlug);

  headerMount.innerHTML = `
    <!-- THANH TIN NÓNG (TICKER TỰ ĐỘNG CHẠY TỪ 5 BÀI MỚI NHẤT) -->
    <div class="ticker" role="marquee" aria-label="Tin tức nóng">
      <div class="ticker__inner" id="ticker-mount">
        ${tickerHtml}
      </div>
    </div>

    <!-- HEADER CHÍNH -->
    <header class="site-header">
      <div class="header-utility">
        <div class="wrap">
        <span>${getVietnameseDateLabel(now)}</span>          ${userUtilityHtml}
        </div>
      </div>
      <div class="header-main">
        <div class="wrap">
          <a href="${publicPrefix}index.html" class="logo" aria-label="Mạch Tin - Trang chủ">
            ${PULSE_SVG_ICON}
            <span class="logo__word">MẠCH <em>TIN</em></span>
          </a>
          <nav class="main-nav" id="mainNavMenu" aria-label="Điều hướng chuyên mục">
            <div class="mobile-drawer-header">
              <span class="mobile-drawer-title">DANH MỤC TIN</span>
              <button type="button" class="mobile-drawer-close" id="mobileMenuCloseBtn" aria-label="Đóng menu">✕</button>
            </div>
            <a href="${publicPrefix}index.html" class="${isIndexPage ? 'is-active' : ''}">Trang chủ</a>
            ${navLinksHtml}
          </nav>
          <div class="header-actions">
            <a href="${publicPrefix}search.html" class="icon-btn" aria-label="Tìm kiếm">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7"/>
                <path d="M21 21L16.65 16.65"/>
              </svg>
            </a>
            ${headerActionsHtml}
            <button type="button" class="nav-toggle" id="mobileMenuBtn" aria-label="Mở menu danh mục">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="mobile-nav-overlay" id="mobileMenuOverlay"></div>
      <div class="category-bar">
        <div class="wrap">
          <a href="${publicPrefix}category.html" class="${isCategoryAll ? 'is-active' : ''}">Tất cả</a>
          ${navLinksHtml}
        </div>
      </div>
    </header>
  `;

  // Gắn sự kiện click mở menu avatar
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userMenuDropdown = document.getElementById("userMenuDropdown");
  if (userMenuBtn && userMenuDropdown) {
    userMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenuDropdown.classList.toggle("is-open");
    });
    document.addEventListener("click", (e) => {
      if (!userMenuDropdown.contains(e.target)) {
        userMenuDropdown.classList.remove("is-open");
      }
    });
  }

  // Gắn sự kiện điều khiển Menu di động (Mobile Drawer & Hamburger)
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mainNavMenu = document.getElementById("mainNavMenu");
  const mobileMenuOverlay = document.getElementById("mobileMenuOverlay");
  const mobileMenuCloseBtn = document.getElementById("mobileMenuCloseBtn");

  const openMobileMenu = () => {
    if (mainNavMenu) mainNavMenu.classList.add("is-active");
    if (mobileMenuOverlay) mobileMenuOverlay.classList.add("is-active");
    document.body.classList.add("mobile-menu-locked");
  };

  const closeMobileMenu = () => {
    if (mainNavMenu) mainNavMenu.classList.remove("is-active");
    if (mobileMenuOverlay) mobileMenuOverlay.classList.remove("is-active");
    document.body.classList.remove("mobile-menu-locked");
  };

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openMobileMenu();
    });
  }

  if (mobileMenuCloseBtn) {
    mobileMenuCloseBtn.addEventListener("click", closeMobileMenu);
  }

  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener("click", closeMobileMenu);
  }

  // Tự động đóng drawer khi người dùng bấm vào một link chuyển trang
  if (mainNavMenu) {
    const navAnchors = mainNavMenu.querySelectorAll("a");
    navAnchors.forEach((a) => {
      a.addEventListener("click", closeMobileMenu);
    });
  }
}

/**
 * Tự động render Footer 3 cột thông tin tòa soạn
 */
async function initPublicFooter() {
  const footerMount = document.getElementById("site-footer");
  if (!footerMount) return;

  const currentPath = window.location.pathname;
  const isInUserDir = currentPath.includes("/user/");
  const publicPrefix = isInUserDir ? "../public/" : "";

  // Lấy dữ liệu cấu hình liên hệ từ API
  const result = await safeFetchJson(resolveApiUrl("admin/contact-config.php"));
  const site = (result && result.data) || {};

  footerMount.innerHTML = `
    <footer class="site-footer">
      <div class="wrap footer-top">
        <div class="footer-brand">
          <a href="${publicPrefix}index.html" class="logo">
            ${PULSE_SVG_ICON}
            <span class="logo__word">MẠCH <em>TIN</em></span>
          </a>
          <p>${escapeHtml(site.short_description || "Bắt mạch dòng chảy tin tức Việt Nam - cập nhật liên tục, xác thực trước khi đăng.")}</p>
          <div class="footer-social">
            <a href="${site.social_links?.facebook || '#'}" aria-label="Facebook" target="_blank" rel="noopener">FB</a>
            <a href="${site.social_links?.youtube || '#'}" aria-label="YouTube" target="_blank" rel="noopener">YT</a>
            <a href="${site.social_links?.tiktok || '#'}" aria-label="TikTok" target="_blank" rel="noopener">TT</a>
          </div>
        </div>
        <div class="footer-contact">
          <h4>Về Mạch Tin</h4>
          <ul>
            <li>Điện thoại: ${escapeHtml(site.contact_phone || "028 1234 5678")}</li>
            <li>Email: ${escapeHtml(site.contact_email || "lienhe@machtin.vn")}</li>
            <li>Địa chỉ: ${escapeHtml(site.address || "02 Võ Oanh, phường Thạnh Mỹ Tây, TP.HCM")}</li>
          </ul>
        </div>
      </div>
      <div class="wrap footer-bottom">
        <span>© 2026 Mạch Tin · Điều khoản sử dụng · Chính sách bảo mật</span>
      </div>
    </footer>
  `;
}

// 5. Hiển thị Sidebar (bài đọc nhiều và thẻ tag nổi bật)

/**
 * Hiển thị khối Sidebar bên phải (dùng chung cho trang chủ, chuyên mục và tìm kiếm)
 * - Lấy danh sách 5 bài đọc nhiều nhất trong tuần (view_count cao nhất)
 * - Lấy danh sách 15 thẻ tag nổi bật kèm liên kết tìm kiếm theo thẻ
 * @param {Object} options Tùy chọn ID các phần tử mount
 */
async function initPublicSidebar(options = {}) {
  const rankMountId = options.rankMountId || "rank-mount";
  const tagMountId = options.tagMountId || "tag-mount";

  const rankMount = document.getElementById(rankMountId);
  const tagMount = document.getElementById(tagMountId);

  if (!rankMount && !tagMount) return;

  const currentPath = window.location.pathname;
  const isInUserDir = currentPath.includes("/user/");
  const publicPrefix = isInUserDir ? "../public/" : "";

  // 1. Tải dữ liệu song song từ API Backend
  const [topWeeklyRes, tagsRes] = await Promise.all([
    safeFetchJson(resolveApiUrl("public/articles.php?top_weekly=1")),
    safeFetchJson(resolveApiUrl("public/tags.php?featured=1"))
  ]);

  const topArticles = (topWeeklyRes && topWeeklyRes.data) || [];
  const featuredTags = (tagsRes && tagsRes.data) || [];

  // 2. Render Khối "Đọc nhiều nhất trong tuần"
  if (rankMount) {
    if (!topArticles || topArticles.length === 0) {
      rankMount.innerHTML = "";
    } else {
      rankMount.innerHTML = topArticles
        .slice(0, 5)
        .map((a, index) => {
          const isLast = index === Math.min(topArticles.length, 5) - 1 ? "no-border" : "";
          const views = getArticleViews(a);
          const detailUrl = getArticleDetailUrl(a, publicPrefix);

          return `
            <div class="rank-item ${isLast}">
              <div>
                <h4 class="rank-item__title">
                  <a href="${detailUrl}">${escapeHtml(a.title)}</a>
                </h4>
                <div class="meta">${views.toLocaleString("vi-VN")} lượt đọc</div>
              </div>
            </div>
          `;
        })
        .join("");
    }
  }

  // 3. Render Khối "Tag nổi bật" - Luôn dẫn đến search.html?tag=...
  if (tagMount) {
    if (!featuredTags || featuredTags.length === 0) {
      tagMount.innerHTML = "";
    } else {
      const activeTagParam = new URLSearchParams(window.location.search).get("tag") || "";

      tagMount.innerHTML = featuredTags
        .slice(0, 15)
        .map((t) => {
          const tagSlug = t.slug || t.id;
          const isActive = activeTagParam && (t.slug === activeTagParam || t.name.toLowerCase() === activeTagParam.toLowerCase());
          const targetUrl = `${publicPrefix}search.html?tag=${encodeURIComponent(tagSlug)}`;

          return `
            <a href="${targetUrl}" class="tag-chip ${isActive ? 'tag-chip--active' : ''}" data-slug="${escapeHtml(t.slug || '')}">
              #${escapeHtml(t.name)}
            </a>
          `;
        })
        .join("");
    }
  }
}

// 6. Thành phần phân trang dùng chung (Pagination)

/**
 * Hiển thị thanh phân trang đánh số cho người dùng (trang chuyên mục, tìm kiếm...)
 * - Tự động hiển thị dấu ba chấm (...) khi số lượng trang lớn
 * - Hỗ trợ nút Trang trước, Trang sau và tự động cuộn lên đầu danh sách
 * 
 * @param {string|HTMLElement} container - ID hoặc phần tử DOM chứa thanh phân trang
 * @param {Object} options - Các thông số cấu hình
 * @param {number} options.currentPage - Trang hiện tại
 * @param {number} options.totalPages - Tổng số trang
 * @param {Function} options.onPageChange - Hàm callback khi người dùng bấm đổi trang
 * @param {string|HTMLElement} [options.scrollTarget] - Vị trí cuộn trang lên
 */
function renderPublicPagination(container, options) {
  const mount = typeof container === "string" ? document.getElementById(container) : container;
  if (!mount) return;

  const { currentPage = 1, totalPages = 1, onPageChange, scrollTarget } = options;

  // Nếu chỉ có 1 trang hoặc không có dữ liệu, ẩn thanh phân trang
  if (totalPages <= 1) {
    mount.innerHTML = "";
    mount.style.display = "none";
    return;
  }

  mount.style.display = "";

  // Thuật toán tính danh sách các nút hiển thị có dấu ba chấm
  const pages = [];
  const delta = 2; // Số trang hiển thị hai bên trang hiện tại

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    const left = currentPage - delta;
    const right = currentPage + delta;

    if (left > 2) {
      pages.push("...");
    }

    const rangeStart = Math.max(2, left);
    const rangeEnd = Math.min(totalPages - 1, right);

    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    if (right < totalPages - 1) {
      pages.push("...");
    }

    pages.push(totalPages);
  }

  let html = `<nav class="pagination-wrap" aria-label="Điều hướng phân trang tin tức">`;

  // Nút Trang trước (Prev)
  const isPrevDisabled = currentPage <= 1;
  html += `
    <button type="button" class="pagination-btn ${isPrevDisabled ? 'is-disabled' : ''}" 
            data-page="${currentPage - 1}" ${isPrevDisabled ? 'disabled' : ''} 
            title="Trang trước" aria-label="Trang trước">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      <span>Trước</span>
    </button>
  `;

  // Các nút số trang & dấu ba chấm
  pages.forEach((p) => {
    if (p === "...") {
      html += `<span class="pagination-ellipsis" aria-hidden="true">&hellip;</span>`;
    } else {
      const isActive = p === currentPage;
      html += `
        <button type="button" class="pagination-btn ${isActive ? 'is-active' : ''}" 
                data-page="${p}" ${isActive ? 'aria-current="page"' : ''}
                title="Trang ${p}">
          ${p}
        </button>
      `;
    }
  });

  // Nút Trang sau (Next)
  const isNextDisabled = currentPage >= totalPages;
  html += `
    <button type="button" class="pagination-btn ${isNextDisabled ? 'is-disabled' : ''}" 
            data-page="${currentPage + 1}" ${isNextDisabled ? 'disabled' : ''} 
            title="Trang sau" aria-label="Trang sau">
      <span>Sau</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  `;

  html += `</nav>`;
  mount.innerHTML = html;

  // Gắn sự kiện click
  mount.querySelectorAll(".pagination-btn:not(:disabled):not(.is-active)").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetPage = parseInt(btn.getAttribute("data-page"), 10);
      if (targetPage && targetPage !== currentPage && typeof onPageChange === "function") {
        onPageChange(targetPage);

        // Cuộn mượt lên vị trí nội dung danh sách
        const targetEl = scrollTarget
          ? (typeof scrollTarget === "string" ? document.querySelector(scrollTarget) : scrollTarget)
          : mount;
        if (targetEl && typeof targetEl.scrollIntoView === "function") {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });
}
window.renderPublicPagination = renderPublicPagination;

/**
 * Hiển thị thanh phân trang cho các bảng dữ liệu quản trị (Admin/Editor/Reporter):
 * - Hỗ trợ chọn số lượng bản ghi mỗi trang (10, 25, 50 dòng)
 * - Hiển thị vị trí bản ghi hiện tại và tổng số dòng
 * - Nút chuyển trang trước/sau và danh sách số trang
 * 
 * @param {string|HTMLElement} container - ID hoặc phần tử DOM
 * @param {Object} options - Các thông số cấu hình
 * @param {number} options.currentPage - Trang hiện tại
 * @param {number} options.perPage - Số dòng trên mỗi trang
 * @param {number} options.totalRecords - Tổng số dòng dữ liệu
 * @param {Function} options.onPageChange - Hàm gọi lại khi chuyển trang
 * @param {Function} [options.onLimitChange] - Hàm gọi lại khi thay đổi số dòng mỗi trang
 */
function renderTablePagination(container, options) {
  const mount = typeof container === "string" ? document.getElementById(container) : container;
  if (!mount) return;

  const {
    currentPage = 1,
    perPage = 10,
    totalRecords = 0,
    perPageOptions = [10, 25, 50],
    onPageChange,
    onLimitChange
  } = options;

  const totalPages = options.totalPages || Math.max(1, Math.ceil(totalRecords / perPage));

  const fromRecord = totalRecords === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const toRecord = Math.min(totalRecords, currentPage * perPage);

  // Thuật toán hiển thị các trang lân cận cho Admin
  const pages = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  mount.className = "admin-table-pagination";
  mount.innerHTML = `
    <div class="admin-pagination-left">
      <span>Hiển thị:</span>
      <select class="admin-pagination-select" id="table-limit-select" aria-label="Số bản ghi mỗi trang">
        ${perPageOptions.map((opt) => `<option value="${opt}" ${opt === perPage ? 'selected' : ''}>${opt} dòng/trang</option>`).join("")}
      </select>
      <span class="admin-pagination-info">
        Hiển thị <strong>${fromRecord}</strong> - <strong>${toRecord}</strong> trong <strong>${totalRecords.toLocaleString("vi-VN")}</strong> bản ghi
      </span>
    </div>

    <div class="admin-pagination-controls">
      <button type="button" class="admin-page-btn admin-btn-prev" data-page="${currentPage - 1}" 
              ${currentPage <= 1 ? 'disabled' : ''} title="Trang trước" aria-label="Trang trước">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>Trước</span>
      </button>

      ${pages.map((p) => {
        if (p === "...") {
          return `<span style="padding: 0 4px; color: var(--muted); font-weight: bold;">&hellip;</span>`;
        }
        const isActive = p === currentPage;
        return `
          <button type="button" class="admin-page-btn ${isActive ? 'is-active' : ''}" 
                  data-page="${p}" ${isActive ? 'aria-current="page"' : ''}>
            ${p}
          </button>
        `;
      }).join("")}

      <button type="button" class="admin-page-btn admin-btn-next" data-page="${currentPage + 1}" 
              ${currentPage >= totalPages ? 'disabled' : ''} title="Trang sau" aria-label="Trang sau">
        <span>Sau</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  `;

  // Bắt sự kiện đổi số lượng dòng
  const selectEl = mount.querySelector("#table-limit-select");
  if (selectEl && typeof onLimitChange === "function") {
    selectEl.addEventListener("change", (e) => {
      const newLimit = parseInt(e.target.value, 10);
      onLimitChange(newLimit);
    });
  }

  // Bắt sự kiện đổi trang
  mount.querySelectorAll(".admin-page-btn:not(:disabled):not(.is-active)").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetPage = parseInt(btn.getAttribute("data-page"), 10);
      if (targetPage && targetPage !== currentPage && typeof onPageChange === "function") {
        onPageChange(targetPage);
      }
    });
  });
}
window.renderTablePagination = renderTablePagination;


