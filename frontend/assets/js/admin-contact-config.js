/**
 * ==============================================================================
 * TÊN FILE: frontend/assets/js/admin-contact-config.js
 * PHÂN HỆ: Cấu hình Thông tin Liên hệ Tòa soạn (Admin Contact Config Module)
 * MÔ TẢ: Quản trị và cập nhật các thông tin liên hệ và nhận diện thương hiệu của tòa soạn:
 *        1. Quản lý email tòa soạn (contact_email), hotline (contact_phone), địa chỉ trụ sở (address),
 *           đoạn giới thiệu ngắn (short_description), và các liên kết mạng xã hội (Facebook, YouTube, TikTok).
 *        2. Tải cấu hình hiện tại từ backend qua admin/contact-config.php.
 *        3. Cho phép cập nhật lưu dữ liệu thông qua API PUT admin/contact-config.php.
 *        4. Hỗ trợ khôi phục về cấu hình mặc định ban đầu (Reset to Default).
 * PHẠM VI SỬ DỤNG:
 *   - frontend/admin/contact-config.html
 * PHỤ THUỘC:
 *   - frontend/assets/js/common.js (resolveApiUrl, showToast, escapeHtml)
 *   - backend/api/admin/contact-config.php
 * ==============================================================================
 */

(function () {
  "use strict";

  // ==============================================================================
  // KHỐI 1: KHỞI TẠO CẤU HÌNH MẶC ĐỊNH & TRẠNG THÁI HIỆN TẠI
  // ==============================================================================
  // Dữ liệu mặc định gốc của tòa soạn
  const DEFAULT_SETTINGS = {
    contact_email: "lienhe@machtin.vn",
    contact_phone: "028 1234 5678",
    address: "02 Võ Oanh, phường Thạnh Mỹ Tây, TP. Hồ Chí Minh",
    short_description: "Bắt mạch dòng chảy tin tức Việt Nam - cập nhật liên tục, xác thực trước khi đăng tải.",
    social_links: {
      facebook: "https://www.facebook.com/profile.php?id=61594146516957",
      youtube: "https://www.youtube.com/channel/UCkywEeJ0k_g-jMWnBp-qhqQ",
      tiktok: "https://www.tiktok.com/@machtin.24h"
    }
  };
  let currentSettings = {};

  document.addEventListener("DOMContentLoaded", () => {
    initContactConfigPage();
  });

  async function initContactConfigPage() {
    await loadSettings();
    renderPageStructure();
    bindEvents();
  }

  // ==============================================================================
  // KHỐI 2: TẢI CẤU HÌNH LIÊN HỆ TỪ BACKEND QUA API
  // ==============================================================================
  /**
   * Tải cấu hình từ backend API (admin/contact-config.php)
   */
  async function loadSettings() {
    try {
      const res = await fetch(resolveApiUrl('admin/contact-config.php'), { credentials: "include" });
      const result = await res.json();
      const rawSettings = result.data;

      if (rawSettings) {
        currentSettings = {
          contact_email: rawSettings.contact_email || DEFAULT_SETTINGS.contact_email,
          contact_phone: rawSettings.contact_phone || DEFAULT_SETTINGS.contact_phone,
          address: rawSettings.address || DEFAULT_SETTINGS.address,
          short_description: rawSettings.short_description || DEFAULT_SETTINGS.short_description,
          social_links: {
            facebook: rawSettings.social_links?.facebook || DEFAULT_SETTINGS.social_links.facebook,
            youtube: rawSettings.social_links?.youtube || DEFAULT_SETTINGS.social_links.youtube,
            tiktok: rawSettings.social_links?.tiktok || DEFAULT_SETTINGS.social_links.tiktok,
          }
        };
      } else {
        currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      }
    } catch (err) {
      console.warn("Không thể tải cấu hình từ backend, dùng mặc định:", err);
      currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }
  }

  // ==============================================================================
  // KHỐI 3: RENDER GIAO DIỆN FORM CẤU HÌNH LIÊN HỆ & MẠNG XÃ HỘI
  // ==============================================================================
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
          <form id="contactConfigForm" novalidate>
            <!-- PHẦN 0: GIỚI THIỆU TÒA SOẠN -->
<div style="margin-bottom: 28px;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--line-soft);">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 17px; height: 17px; color: #1B2A4A;">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
    <h3 style="font-size: 14px; font-weight: 700; color: var(--ink); margin: 0; font-family: var(--f-sans);">Giới thiệu tòa soạn</h3>
  </div>

  <div class="admin-form-group" style="margin-bottom: 0;">
    <label class="admin-form-label" for="cfgShortDescription">
      Mô tả ngắn (hiển thị ở chân trang)
    </label>
    <textarea 
      id="cfgShortDescription" 
      class="admin-form-textarea" 
      rows="2" 
      placeholder="Câu mô tả ngắn về tòa soạn..."
    >${escapeHtml(currentSettings.short_description)}</textarea>
    <span style="font-size: 11px; color: var(--muted); margin-top: 4px; display: block;">Mô tả ngắn hiển thị ngay dưới logo ở chân trang</span>
  </div>
</div>

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
                  type="text" 
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
                  type="text" 
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
                  type="text" 
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

  // ==============================================================================
  // KHỐI 4: GẮN SỰ KIỆN LƯU FORM VÀ KHÔI PHỤC MẶC ĐỊNH
  // ==============================================================================
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

  // ==============================================================================
  // KHỐI 5: GỬI DỮ LIỆU CẬP NHẬT CẤU HÌNH LÊN BACKEND (API POST/PUT)
  // ==============================================================================
  /**
   * Lưu cấu hình tòa soạn lên cơ sở dữ liệu
   */
  async function saveSettings(isReset = false) {
    const saveBtn = document.getElementById("btnSaveConfig");
    const originalBtnHtml = saveBtn ? saveBtn.innerHTML : "";

    const email = (document.getElementById("cfgEmail")?.value || "").trim();
    const phone = (document.getElementById("cfgPhone")?.value || "").trim();
    const address = (document.getElementById("cfgAddress")?.value || "").trim();
    const shortDesc = (document.getElementById("cfgShortDescription")?.value || "").trim();
    const fb = (document.getElementById("cfgFacebook")?.value || "").trim();
    const yt = (document.getElementById("cfgYoutube")?.value || "").trim();
    const tt = (document.getElementById("cfgTiktok")?.value || "").trim();

    // Kiểm tra dữ liệu hợp lệ phía client
    if (!email || !phone || !address) {
      showToast("Vui lòng điền đầy đủ Email, Hotline và Địa chỉ tòa soạn!", "warning");
      return;
    }

    // Hiển thị trạng thái đang lưu
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.style.opacity = "0.75";
      saveBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; animation: spin 0.8s linear infinite; display: inline-block;">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
        </svg>
        Đang lưu cấu hình...
      `;
    }

    try {
      const res = await fetch(resolveApiUrl('admin/contact-config.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          contact_email: email,
          contact_phone: phone,
          address: address,
          short_description: shortDesc,
          facebook: fb,
          youtube: yt,
          tiktok: tt
        })
      });

      const result = await res.json();

      if (result && result.success) {
        currentSettings = {
          contact_email: email,
          contact_phone: phone,
          address: address,
          short_description: shortDesc,
          social_links: { facebook: fb, youtube: yt, tiktok: tt }
        };
        showToast(isReset ? "Khôi phục cấu hình mặc định thành công!" : "Cập nhật thông tin tòa soạn thành công!", "success");
      } else {
        showToast(result?.message || "Không thể cập nhật cấu hình tòa soạn.", "error");
      }
    } catch (err) {
      console.error("Lỗi khi lưu cấu hình:", err);
      showToast("Lỗi kết nối máy chủ: " + (err.message || "Vui lòng thử lại sau"), "error");
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.style.opacity = "";
        saveBtn.innerHTML = originalBtnHtml;
      }
    }
  }
})();