const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const nowISO = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:00`;
};

const ROLE_LABELS   = { user: 'Độc giả', reporter: 'Phóng viên', editor: 'Biên tập viên', admin: 'Quản trị viên' };
const STATUS_LABELS = { active: 'Đang hoạt động', locked: 'Đã khóa' };

const allUsers = (typeof MOCK_DATA !== 'undefined' && Array.isArray(MOCK_DATA.users))
                 ? MOCK_DATA.users : [];
let usersState     = allUsers.map(u => ({ ...u }));   /* state chính */
let filteredUsers  = [];                              /* kết quả lọc */
let currentPage    = 1;
const PAGE_SIZE    = 5;

const renderUsers = (list) => {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--muted);font-family:var(--f-mono);font-size:13px;">Không tìm thấy người dùng nào</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(u => {
    const initials = getInitials(u.full_name);
    const isAdmin  = u.role === 'admin';
    const isLocked = u.status === 'locked';

    let actions;
    if (isAdmin)      actions = '<span class="data-table__meta">Không thể chỉnh sửa</span>';
    else if (isLocked) actions = `
      <button class="btn-chip" onclick="openRoleModal(${u.id})">Đổi vai trò</button>
      <button class="btn-chip btn-chip--success" onclick="unlockUser(${u.id})">Mở khóa</button>`;
    else               actions = `
      <button class="btn-chip" onclick="openRoleModal(${u.id})">Đổi vai trò</button>
      <button class="btn-chip btn-chip--danger" onclick="openLockModal(${u.id})">Khóa</button>`;

    const lockInfo = (isLocked && u.lock_reason) ? `
      <div class="data-table__meta data-table__meta--lock">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        ${u.lock_reason} · ${formatDate(u.locked_at)}
      </div>` : '';

    return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="user-avatar">${initials}</div>
            <div>
              <div class="data-table__title">${u.full_name}</div>
              <div class="data-table__meta">${u.email}</div>
              ${lockInfo}
            </div>
          </div>
        </td>
        <td><span class="badge badge--${u.role}">${ROLE_LABELS[u.role]}</span></td>
        <td><span class="badge badge--${u.status}">${STATUS_LABELS[u.status]}</span></td>
        <td class="data-table__meta">${formatDate(u.created_at)}</td>
        <td><div class="row-actions">${actions}</div></td>
      </tr>`;
  }).join('');
};

const renderPagination = () => {
  const info = document.getElementById('page-info');
  const btns = document.getElementById('page-buttons');
  if (!info || !btns) return;

  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  info.textContent = total === 0
    ? 'Không có người dùng'
    : `Hiển thị ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, total)} trong tổng ${total}`;

  let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goPage(${currentPage - 1})">←</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'is-active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goPage(${currentPage + 1})">→</button>`;
  btns.innerHTML = html;
};

const renderPage = () => {
  const start = (currentPage - 1) * PAGE_SIZE;
  renderUsers(filteredUsers.slice(start, start + PAGE_SIZE));
  renderPagination();
};

const applyFilters = () => {
  const q     = (document.getElementById('search-input').value || '').toLowerCase().trim();
  const role  = document.getElementById('filter-role').value;
  const status = document.getElementById('filter-status').value;

  filteredUsers = usersState.filter(u => {
    const matchQ      = !q || (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    const matchRole   = role   === 'all' || u.role   === role;
    const matchStatus = status === 'all' || u.status === status;
    return matchQ && matchRole && matchStatus;
  });

  currentPage = 1;
  renderPage();
};

const goPage = (p) => {
  const total = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  if (p >= 1 && p <= total) { currentPage = p; renderPage(); }
};

let currentUserId = null;
let pendingRole   = null;
const findUser    = (id) => usersState.find(u => u.id === id);

const openLockModal = (id) => {
  currentUserId = id;
  const u = findUser(id); if (!u) return;

  document.getElementById('lockModalAvatar').textContent = getInitials(u.full_name);
  document.getElementById('lockModalName').textContent   = u.full_name;
  document.getElementById('lockModalEmail').textContent  = u.email;

  document.getElementById('lockReason').value = '';
  document.getElementById('otherReasonField').style.display = 'none';
  document.getElementById('otherReasonText').value = '';
  document.getElementById('lockModal').classList.add('is-open');
};

const closeLockModal = () => {
  document.getElementById('lockModal').classList.remove('is-open');
  currentUserId = null;
};

const toggleOtherReason = () => {
  document.getElementById('otherReasonField').style.display =
    document.getElementById('lockReason').value === 'other' ? 'block' : 'none';
};

const confirmLock = () => {
  const reason = document.getElementById('lockReason').value;
  const other  = document.getElementById('otherReasonText').value.trim();
  if (!reason) { alert('Vui lòng chọn lý do khóa.'); return; }
  if (reason === 'other' && !other) { alert('Vui lòng nhập lý do cụ thể.'); return; }

  const finalReason = reason === 'other' ? other : reason;
  const u = findUser(currentUserId);
  if (u) {
    u.status      = 'locked';
    u.lock_reason = finalReason;
    u.locked_at   = nowISO();
  }
  alert(`Đã khóa "${u ? u.full_name : ''}".\nLý do: ${finalReason}`);
  closeLockModal();
  applyFilters();   
};

const unlockUser = (id) => {
  const u = findUser(id); if (!u) return;
  if (!confirm(`Mở khóa cho "${u.full_name}"?`)) return;
  u.status = 'active';
  u.lock_reason = null;
  u.locked_at   = null;
  applyFilters();
};

const openRoleModal = (id) => {
  currentUserId = id;
  const u = findUser(id); if (!u) return;

  document.getElementById('roleModalAvatar').textContent  = getInitials(u.full_name);
  document.getElementById('roleModalName').textContent    = u.full_name;
  document.getElementById('roleModalCurrent').textContent = ROLE_LABELS[u.role];
  document.getElementById('newRoleSelect').value          = u.role;

  document.getElementById('roleStep1').style.display = 'block';
  document.getElementById('roleStep2').style.display = 'none';
  document.getElementById('roleModal').classList.add('is-open');
};

const closeRoleModal = () => {
  document.getElementById('roleModal').classList.remove('is-open');
  currentUserId = null;
  pendingRole   = null;
};

const proceedRoleChange = () => {
  const u = findUser(currentUserId);
  const newRole = document.getElementById('newRoleSelect').value;

  if (u && newRole === u.role) { alert('Vai trò mới trùng với vai trò hiện tại.'); return; }

  pendingRole = newRole;
  if (newRole === 'editor' || newRole === 'admin') {
    /* Nâng quyền → cảnh báo bước 2 */
    document.getElementById('roleWarningTarget').textContent = ROLE_LABELS[newRole];
    document.getElementById('roleWarningName').textContent   = u ? u.full_name : '';
    document.getElementById('roleStep1').style.display = 'none';
    document.getElementById('roleStep2').style.display = 'block';
  } else {
    confirmRoleChange();
  }
};

const backToRoleStep1 = () => {
  document.getElementById('roleStep1').style.display = 'block';
  document.getElementById('roleStep2').style.display = 'none';
};

const confirmRoleChange = () => {
  const u = findUser(currentUserId);
  if (u && pendingRole) u.role = pendingRole;
  alert(`Đã đổi vai trò "${u ? u.full_name : ''}" sang ${ROLE_LABELS[pendingRole]}.`);
  closeRoleModal();
  applyFilters();  
};

document.addEventListener('DOMContentLoaded', () => {
  applyFilters();

  document.getElementById('search-input').addEventListener('input', applyFilters);
  document.getElementById('filter-role').addEventListener('change', applyFilters);
  document.getElementById('filter-status').addEventListener('change', applyFilters);

  document.getElementById('lockModal').addEventListener('click', (e) => {
    if (e.target.id === 'lockModal') closeLockModal();
  });
  document.getElementById('roleModal').addEventListener('click', (e) => {
    if (e.target.id === 'roleModal') closeRoleModal();
  });
});