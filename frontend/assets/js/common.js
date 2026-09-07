/**
 * ==============================================================================
 * MẠCH TIN - COMMON.JS (Tiện ích & Hàm dùng chung toàn hệ thống)
 * ==============================================================================
 * 1. Auth & Session Helper (getCurrentUser, logout, checkAuth - kết nối PHP / MySQL)
 * 2. Formatting & Security Utilities (formatDate, timeAgo, escapeHtml, getInitials)
 * 3. Toast Notification (Toastify JS wrapper)
 * 4. Public Chrome Renderers (Header & Footer dùng chung)
 * ==============================================================================
 */

/**
 * Lấy mốc thời gian hệ thống dùng chung
 */
function getSystemTime() {
  return new Date();
}

// ==============================================================================
// 1. AUTH & SESSION HELPER (Kết nối PHP Session + MySQL Backend)
// ==============================================================================

/**
 * Chuẩn hóa đường dẫn gọi API backend PHP dựa trên thư mục hiện tại của trang.
 * Toàn bộ trang frontend nằm ở độ sâu frontend/{public|user|admin|reporter|editor}/*.html
 * nên đường dẫn tới backend/api/ luôn là "../../backend/api/" từ các trang đó.
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
 * Phân tích chuỗi JSON an toàn: nếu phản hồi là mã PHP thô (khi chạy không có server PHP)
 * hoặc trang lỗi HTML thì trả về null thay vì ném ngoại lệ làm crash ứng dụng.
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
 * Gọi API trả về JSON an toàn: tự động phân tích và xử lý khi backend trả về JSON hoặc rỗng.
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

// Cache trong bộ nhớ (chỉ tồn tại trong 1 lần tải trang) để tránh gọi lại me.php
// nhiều lần khi nhiều đoạn code trên cùng 1 trang đều gọi getCurrentUser().
let __machtinCurrentUserCache = undefined;

/**
 * Lấy người dùng hiện tại đang đăng nhập (hoặc null nếu là Guest).
 * Nguồn dữ liệu duy nhất: PHP Session, thông qua backend/api/auth/me.php.
 *
 * LƯU Ý: hàm này được giữ NGUYÊN chữ ký đồng bộ (không phải Promise) vì rất nhiều
 * trang/màn hình trong toàn bộ dự án (kể cả các trang ngoài phạm vi Cặp 1) đang gọi
 * getCurrentUser() và dùng kết quả ngay lập tức, không await. Để không phải sửa
 * hàng loạt file ngoài phạm vi Cặp 1, hàm dùng XMLHttpRequest đồng bộ gọi me.php.
 */
function getCurrentUser() {
  if (__machtinCurrentUserCache !== undefined) {
    return __machtinCurrentUserCache;
  }
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", resolveApiUrl("auth/me.php"), false); // false = đồng bộ
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
 * Theo yêu cầu Cặp 1: phiên đăng nhập giờ hoàn toàn do PHP Session quản lý
 * (xem auth/login.php), KHÔNG còn cơ chế lưu user vào localStorage để giả lập
 * đăng nhập ở phía frontend nữa.
 *
 * Hàm này được GIỮ LẠI dưới dạng no-op (thay vì xóa hẳn) chỉ vì một số màn hình
 * thuộc phạm vi Cặp 2/Cặp 3 (vd: admin-layout.js, profile.js) hiện vẫn gọi trực
 * tiếp setCurrentUser(...) ngoài luồng auth thật — xóa hẳn sẽ làm crash các trang
 * đó. Cặp 1 không tự ý sửa các file đó nên giữ hàm rỗng để đảm bảo tương thích.
 */
function setCurrentUser(user) {
  // Không làm gì cả — session thật nằm ở PHP, không còn ở localStorage.
}
window.setCurrentUser = setCurrentUser;

/**
 * Đăng xuất tài khoản: gọi API hủy PHP Session, sau đó mới điều hướng.
 */
function logout(redirectUrl) {
  fetch(resolveApiUrl("auth/logout.php"), { method: "POST", credentials: "include" })
    .catch((error) => {
      console.error("Lỗi khi gọi API đăng xuất", error);
    })
    .then(() => {
      // Buộc lần gọi getCurrentUser() kế tiếp (ở trang sau khi điều hướng) phải
      // hỏi lại backend thay vì dùng cache của phiên cũ.
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
 * @param {Array<string>} allowedRoles - Danh sách vai trò được phép vào (vd: ['admin'], ['editor'])
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

// 3. FORMATTING & SECURITY UTILITIES
// ==============================================================================

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
 * Định dạng ngày đăng bài chuẩn toàn hệ thống Mạch Tin:
 * - Nếu < 48 giờ: 'Vừa xong' / 'X phút trước' / 'X giờ trước' / '1 ngày trước'
 * - Nếu > 48 giờ: 'HH:mm, DD/MM/YYYY' (ví dụ: '09:30, 13/08/2026')
 */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(String(dateStr).replace(" ", "T"));
  if (isNaN(d.getTime())) return dateStr;

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
  const d = new Date(String(dateStr).replace(" ", "T"));
  if (isNaN(d.getTime())) return dateStr;
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
  // Loại bỏ dấu / ở đầu nếu có
  const cleanPath = trimmed.startsWith("/") ? trimmed.substring(1) : trimmed;

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
  const resolvedUrl = resolveAssetPath(imagePath);

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

// ==============================================================================
// 4. TOAST NOTIFICATION (PASTEL CARDS THEME - CHUẨN MẪU HÌNH ẢNH)
// ==============================================================================

/**
 * Hiển thị thông báo Toast dạng thẻ mềm Pastel theo phong cách chuẩn mực:
 * - 4 Trạng thái: Success (Xanh lá), Info (Xanh lam), Warning (Vàng ấm), Error (Đỏ hồng)
 * - Có Icon tròn, Tiêu đề in đậm, Nội dung mô tả và Nút đóng ✕
 * - Tự động biến mất sau 3.5 giây
 * 
 * @param {string} message - Nội dung thông báo
 * @param {'success'|'info'|'warning'|'error'} type - Loại trạng thái
 * @param {string} [title] - Tiêu đề tùy chỉnh (nếu không truyền sẽ dùng mặc định theo type)
 * @param {number} [duration=3500] - Thời gian hiển thị (ms)
 */
function showToast(message, type = "info", title = null, duration = 3500) {
  // Đảm bảo container đã tồn tại trong DOM
  let container = document.getElementById("mach-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "mach-toast-container";
    container.className = "mach-toast-container";
    document.body.appendChild(container);
  }

  // Chuẩn hóa loại trạng thái
  const validTypes = ["success", "info", "warning", "error"];
  const finalType = validTypes.includes(type) ? type : "info";

  // Tiêu đề mặc định theo ảnh mẫu
  const defaultTitles = {
    success: "Success",
    info: "Info",
    warning: "Warning",
    error: "Error"
  };

  const finalTitle = title || defaultTitles[finalType];

  // SVG Icon tròn chuẩn mực theo từng loại
  const icons = {
    success: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="m9 12 2 2 4-4"></path>
      </svg>
    `,
    info: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `,
    warning: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `,
    error: `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    `
  };

  // Tạo phần tử Toast
  const toast = document.createElement("div");
  toast.className = `mach-toast mach-toast--${finalType}`;
  toast.setAttribute("role", "alert");
  toast.innerHTML = `
    <div class="mach-toast__icon">
      ${icons[finalType]}
    </div>
    <div class="mach-toast__body">
      <div class="mach-toast__title">${escapeHtml(finalTitle)}</div>
      <div class="mach-toast__desc">${escapeHtml(message)}</div>
    </div>
    <button type="button" class="mach-toast__close" aria-label="Đóng thông báo">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  // Hàm ẩn và xóa Toast với hiệu ứng mượt
  let hideTimeout = null;
  const dismissToast = () => {
    if (hideTimeout) clearTimeout(hideTimeout);
    toast.classList.remove("is-show");
    toast.classList.add("is-hiding");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 350);
  };

  // Gắn sự kiện nút Đóng
  const closeBtn = toast.querySelector(".mach-toast__close");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dismissToast();
    });
  }

  // Thêm vào Container và kích hoạt hiệu ứng hiển thị
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add("is-show");
  });

  // Tự động tắt sau thời gian duration
  hideTimeout = setTimeout(dismissToast, duration);
}

// ==============================================================================
// 5. PUBLIC CHROME RENDERERS (HEADER & FOOTER)
// ==============================================================================

/**
 * SVG Icon nhịp đập thương hiệu Mạch Tin
 */
const PULSE_SVG_ICON = `
  <svg class="pulse-mark" width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden="true">
    <path d="M1 13H7L9.5 6L13.5 20L16 13H25" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

/**
 * Tự động render Header & Thanh Ticker cho các trang Public & User
 */
function getVietnameseDateLabel(date) {
  const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dayName = days[date.getDay()];
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dayName}, ${dd}/${mm}/${yyyy}`;
}

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

  // Đổi từ mốc ngày giả định sang thời gian thật
  const now = new Date();
  const hotArticles = allArticles
    .filter((a) => a.status === "published")
    .map((a) => {
      const pubDate = new Date(String(a.published_at || a.created_at).replace(" ", "T"));
      const hoursDiff = Math.max(0, (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60));
      const views = Number(a.view_count || a.views || 0);
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
          <nav class="main-nav" aria-label="Điều hướng chuyên mục">
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
          </div>
        </div>
      </div>
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
}

/**
 * Chuẩn hóa URL điều hướng dựa trên thư mục hiện tại của trang
 */
function resolveAppRelativeUrl(rawLink) {
  if (!rawLink) return "";
  const currentPath = window.location.pathname;
  // Kiểm tra nếu đang ở thư mục gốc (index.html hoặc /)
  const isRoot =
    !currentPath.includes("/public/") &&
    !currentPath.includes("/user/") &&
    !currentPath.includes("/reporter/") &&
    !currentPath.includes("/editor/") &&
    !currentPath.includes("/admin/");

  if (isRoot) {
    // Chuyển "../folder/page.html" thành "./folder/page.html"
    return rawLink.replace(/^\.\.\//, "./");
  }

  // Nếu đang ở thư mục con (/public/ hay /user/), link bắt đầu bằng "../" hoạt động tự nhiên
  if (!rawLink.startsWith("../") && !rawLink.startsWith("http") && !rawLink.startsWith("/")) {
    return "../" + rawLink;
  }
  return rawLink;
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
