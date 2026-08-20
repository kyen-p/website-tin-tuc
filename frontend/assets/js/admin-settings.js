const $ = (id) => document.getElementById(id);
const siteData = (typeof MOCK_DATA !== 'undefined' && MOCK_DATA.site) ? MOCK_DATA.site : {};

const populateForm = () => {
  if ($('site-name'))        $('site-name').value        = siteData.name || '';
  if ($('site-description')) $('site-description').value = siteData.short_description || '';
  if ($('site-logo'))        $('site-logo').value        = siteData.logo || '';
  if ($('contact-email'))    $('contact-email').value    = siteData.contact_email || '';
  if ($('contact-phone'))    $('contact-phone').value    = siteData.contact_phone || '';
  if ($('site-address'))     $('site-address').value     = siteData.address || '';
  if ($('social-facebook'))  $('social-facebook').value  = (siteData.social_links || {}).facebook || '';
  if ($('social-youtube'))   $('social-youtube').value   = (siteData.social_links || {}).youtube || '';
  if ($('social-tiktok'))    $('social-tiktok').value    = (siteData.social_links || {}).tiktok || '';
};

const resetForm = () => {
  if (confirm('Đặt lại tất cả giá trị về mặc định?')) populateForm();
};

const handleSubmit = (e) => {
  e.preventDefault();
  alert('Đã lưu cấu hình thành công!\n\n[Giai đoạn PHP] Sẽ UPDATE bảng site_settings');
};

document.addEventListener('DOMContentLoaded', () => {
  populateForm();
  const form = $('settings-form');
  if (form) form.addEventListener('submit', handleSubmit);
});