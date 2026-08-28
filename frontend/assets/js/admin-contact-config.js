/**
 * ==============================================================================
 * ADMIN CONTACT CONFIG - CẤU HÌNH THÔNG TIN LIÊN HỆ TÒA SOẠN
 * ==============================================================================
 * Phạm vi dữ liệu chính xác:
 * 1. Email liên hệ (contact_email)
 * 2. Số điện thoại hotline (contact_phone)
 * 3. Địa chỉ tòa soạn / văn phòng (address)
 * 4. Đường dẫn mạng xã hội:
 *    - Facebook URL (social_links.facebook)
 *    - YouTube URL (social_links.youtube)
 *    - TikTok URL (social_links.tiktok)
 * 
 * Có chức năng Xem trước trực tiếp (Live Preview) & Khôi phục mặc định (Reset).
 * ==============================================================================
 */

(function () {
  "use strict";

  // Dữ liệu mặc định gốc của tòa soạn
  const DEFAULT_SETTINGS = {
    contact_email: "lienhe@machtin.vn",
    contact_phone: "028 1234 5678",
    address: "02 Võ Oanh, phường Thạnh Mỹ Tây, TP. Hồ Chí Minh",
    social_links: {
      facebook: "https://facebook.com/machtin",
      youtube: "https://youtube.com/machtin",
      tiktok: "https://tiktok.com/machtin"
    }
  };

  let currentSettings = {};

  document.addEventListener("DOMContentLoaded", () => {
    initContactConfigPage();
  });

  function initContactConfigPage() {
    loadSettings();
    renderPageStructure();
    bindEvents();
  }

  /**
   * Tải cấu hình từ LocalStorage (key: 'site_settings')
   */
  function loadSettings() {
    const rawSettings = getTable("site_settings");
    if (rawSettings && typeof rawSettings === "object") {
      currentSettings = {
        contact_email: rawSettings.contact_email || DEFAULT_SETTINGS.contact_email,
        contact_phone: rawSettings.contact_phone || DEFAULT_SETTINGS.contact_phone,
        address: rawSettings.address || DEFAULT_SETTINGS.address,
        social_links: {
          facebook: (rawSettings.social_links && rawSettings.social_links.facebook) || DEFAULT_SETTINGS.social_links.facebook,
          youtube: (rawSettings.social_links && rawSettings.social_links.youtube) || DEFAULT_SETTINGS.social_links.youtube,
          tiktok: (rawSettings.social_links && rawSettings.social_links.tiktok) || DEFAULT_SETTINGS.social_links.tiktok
        }
      };
    } else {
      currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  /**
   * Render giao diện Form cấu hình liên hệ tinh gọn, chuẩn hệ thống Admin
   */
  function renderPageStructure() {
    const container = document.getElementById("workspace-content");
    if (!container) return;

    container.innerHTML = `
      <div class="admin-card" style="max-width: 860px;">
        <div class="admin-card__header">
          <div class="admin-card__title-group">
            <h2 class="admin-card__title">Thông tin liên hệ & Kênh truyền thông</h2>
            <span class="admin-badge" style="background: rgba(184, 147, 79, 0.12); color: #8F7239; border: 1px solid rgba(184, 147, 79, 0.3); font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 600;">Admin</span>
          </div>
          <p style="font-size: 12.5px; color: var(--muted); margin: 0;">Thông tin sẽ được cập nhật hiển thị tức thì trên toàn bộ hệ thống độc giả.</p>
        </div>

        <div style="padding: 24px;">
          <form id="contactConfigForm">
            
            <!-- PHẦN 1: THÔNG TIN LIÊN LẠC TRỰC TIẾP -->
            <div style="margin-bottom: 28px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--line-soft);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 17px; height: 17px; color: #1B2A4A;">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <h3 style="font-size: 14px; font-weight: 700; color: var(--ink); margin: 0; font-family: var(--f-sans);">1. Thông tin liên lạc trực tiếp</h3>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px;">
                <!-- Email liên hệ -->
                <div class="admin-form-group" style="margin-bottom: 0;">
                  <label class="admin-form-label" for="cfgEmail">
                    Email liên hệ <span class="required-mark">*</span>
                  </label>
                  <input 
                    type="email" 
                    id="cfgEmail" 
                    class="admin-form-input" 
                    placeholder="lienhe@machtin.vn" 
                    value="${escapeHtml(currentSettings.contact_email)}" 
                    required
                  >
                  <span style="font-size: 11px; color: var(--muted); margin-top: 4px; display: block;">Hòm thư nhận thư bạn đọc & phản hồi</span>
                </div>

                <!-- Số điện thoại hotline -->
                <div class="admin-form-group" style="margin-bottom: 0;">
                  <label class="admin-form-label" for="cfgPhone">
                    Số điện thoại hotline <span class="required-mark">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="cfgPhone" 
                    class="admin-form-input" 
                    placeholder="028 1234 5678" 
                    value="${escapeHtml(currentSettings.contact_phone)}" 
                    required
                  >
                  <span style="font-size: 11px; color: var(--muted); margin-top: 4px; display: block;">Đường dây nóng tiếp nhận tin tức 24/7</span>
                </div>
              </div>

              <!-- Địa chỉ tòa soạn -->
              <div class="admin-form-group" style="margin-bottom: 0;">
                <label class="admin-form-label" for="cfgAddress">
                  Địa chỉ tòa soạn / văn phòng <span class="required-mark">*</span>
                </label>
                <textarea 
                  id="cfgAddress" 
                  class="admin-form-textarea" 
                  rows="2" 
                  placeholder="Địa chỉ trụ sở chính..." 
                  required
                >${escapeHtml(currentSettings.address)}</textarea>
                <span style="font-size: 11px; color: var(--muted); margin-top: 4px; display: block;">Địa chỉ vật lý của trụ sở tòa soạn Mạch Tin</span>
              </div>
            </div>

            <!-- PHẦN 2: ĐƯỜNG DẪN MẠNG XÃ HỘI -->
            <div style="margin-bottom: 28px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--line-soft);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 17px; height: 17px; color: #1B2A4A;">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                <h3 style="font-size: 14px; font-weight: 700; color: var(--ink); margin: 0; font-family: var(--f-sans);">2. Đường dẫn mạng xã hội chính thức</h3>
              </div>

              <!-- Facebook URL -->
              <div class="admin-form-group">
                <label class="admin-form-label" for="cfgFacebook">
                  Facebook URL
                </label>
                <input 
                  type="url" 
                  id="cfgFacebook" 
                  class="admin-form-input" 
                  placeholder="https://facebook.com/machtin" 
                  value="${escapeHtml(currentSettings.social_links.facebook)}"
                >
                <span style="font-size: 11px; color: var(--muted); margin-top: 4px; display: block;">Liên kết Fanpage Facebook chính thức</span>
              </div>

              <!-- YouTube URL -->
              <div class="admin-form-group">
                <label class="admin-form-label" for="cfgYoutube">
                  YouTube URL
                </label>
                <input 
                  type="url" 
                  id="cfgYoutube" 
                  class="admin-form-input" 
                  placeholder="https://youtube.com/machtin" 
                  value="${escapeHtml(currentSettings.social_links.youtube)}"
                >
                <span style="font-size: 11px; color: var(--muted); margin-top: 4px; display: block;">Liên kết Kênh Video YouTube chính thức</span>
              </div>

              <!-- TikTok URL -->
              <div class="admin-form-group" style="margin-bottom: 0;">
                <label class="admin-form-label" for="cfgTiktok">
                  TikTok URL
                </label>
                <input 
                  type="url" 
                  id="cfgTiktok" 
                  class="admin-form-input" 
                  placeholder="https://tiktok.com/@machtin" 
                  value="${escapeHtml(currentSettings.social_links.tiktok)}"
                >
                <span style="font-size: 11px; color: var(--muted); margin-top: 4px; display: block;">Liên kết Kênh video ngắn TikTok chính thức</span>
              </div>
            </div>

            <!-- NÚT THAO TÁC -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 18px; border-top: 1px solid var(--line-soft);">
              <button type="button" id="btnResetConfig" class="admin-btn admin-btn--default">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
                Khôi phục mặc định
              </button>

              <button type="submit" id="btnSaveConfig" class="admin-btn admin-btn--primary" style="padding: 9px 24px; font-size: 13.5px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Lưu cấu hình liên hệ
              </button>
            </div>

          </form>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    const form = document.getElementById("contactConfigForm");
    const btnReset = document.getElementById("btnResetConfig");

    // Lưu cấu hình
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        saveSettings();
      });
    }

    // Khôi phục mặc định
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        if (confirm("Bạn có chắc chắn muốn khôi phục lại các thông tin liên hệ mặc định của tòa soạn?")) {
          currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
          renderPageStructure();
          bindEvents();
          saveSettings(true);
        }
      });
    }
  }

  /**
   * Lưu cấu hình vào LocalStorage
   */
  function saveSettings(isReset = false) {
    const email = document.getElementById("cfgEmail")?.value.trim() || currentSettings.contact_email;
    const phone = document.getElementById("cfgPhone")?.value.trim() || currentSettings.contact_phone;
    const address = document.getElementById("cfgAddress")?.value.trim() || currentSettings.address;
    const fb = document.getElementById("cfgFacebook")?.value.trim() || currentSettings.social_links.facebook;
    const yt = document.getElementById("cfgYoutube")?.value.trim() || currentSettings.social_links.youtube;
    const tt = document.getElementById("cfgTiktok")?.value.trim() || currentSettings.social_links.tiktok;

    // Lấy site_settings hiện tại để giữ các trường khác nếu có
    const rawSettings = getTable("site_settings") || {};
    rawSettings.contact_email = email;
    rawSettings.contact_phone = phone;
    rawSettings.address = address;
    rawSettings.social_links = {
      facebook: fb,
      youtube: yt,
      tiktok: tt
    };

    saveTable("site_settings", rawSettings);

    currentSettings = {
      contact_email: email,
      contact_phone: phone,
      address: address,
      social_links: {
        facebook: fb,
        youtube: yt,
        tiktok: tt
      }
    };

    if (typeof Toastify !== "undefined") {
      Toastify({
        text: isReset ? "Đã khôi phục thông tin liên hệ mặc định!" : "Đã lưu cấu hình thông tin liên hệ thành công!",
        duration: 3000,
        gravity: "top",
        position: "right",
        style: { background: "#131B2E" }
      }).showToast();
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

})();
