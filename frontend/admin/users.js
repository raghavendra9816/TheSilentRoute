// ============================================
// ADMIN USERS PAGE JAVASCRIPT
// ============================================

if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
  window.location.href = '/login.html';
}

document.getElementById('adminName').textContent = Auth.getUser()?.username || 'Admin';

let currentPage = 1;
let searchTimer = null;

document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('adminSidebar').classList.toggle('open');
});
document.getElementById('sidebarClose')?.addEventListener('click', () => {
  document.getElementById('adminSidebar').classList.remove('open');
});

// ===== LOAD USERS =====
async function loadUsers(page = 1) {
  currentPage = page;
  const search = document.getElementById('userSearch').value.trim();

  let url = `/admin/users?page=${page}&limit=20`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  document.getElementById('usersTableWrap').innerHTML =
    '<div class="spinner" style="margin:40px auto;"></div>';

  try {
    const response = await API.get(url);
    renderUsersTable(response.data);
    renderPagination(response.totalPages || 1, page);
    document.getElementById('resultInfo').textContent =
      `${response.total} users found`;
  } catch (error) {
    document.getElementById('usersTableWrap').innerHTML =
      '<p style="padding:30px;color:var(--gray);text-align:center;">Failed to load users.</p>';
  }
}

// ===== RENDER TABLE =====
function renderUsersTable(users) {
  if (!users || users.length === 0) {
    document.getElementById('usersTableWrap').innerHTML =
      '<p style="padding:40px;text-align:center;color:var(--gray);">No users found.</p>';
    return;
  }

  document.getElementById('usersTableWrap').innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Avatar</th>
          <th>Username</th>
          <th>Email</th>
          <th>Downloads</th>
          <th>Status</th>
          <th>Joined</th>
          <th>Last Login</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(user => `
          <tr>
            <td>
              <div style="
                width:36px;height:36px;border-radius:50%;
                background:rgba(245,166,35,0.15);
                display:flex;align-items:center;justify-content:center;
                color:#f5a623;font-size:0.9rem;
              ">
                <i class="fas fa-user"></i>
              </div>
            </td>
            <td>
              <strong>${user.username}</strong>
            </td>
            <td style="color:var(--gray);">${user.email}</td>
            <td style="text-align:center;">${user.downloadCount || 0}</td>
            <td>
              <span style="
                padding:3px 10px; border-radius:20px;
                font-size:0.75rem; font-weight:600;
                background:${user.isActive ? 'rgba(72,187,120,0.15)' : 'rgba(233,69,96,0.15)'};
                color:${user.isActive ? '#48bb78' : '#e94560'};
              ">
                ${user.isActive ? 'Active' : 'Banned'}
              </span>
            </td>
            <td style="color:var(--gray);white-space:nowrap;">
              ${new Date(user.createdAt).toLocaleDateString()}
            </td>
            <td style="color:var(--gray);white-space:nowrap;">
              ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
            </td>
            <td>
              <button
                class="btn-table ${user.isActive ? 'delete' : 'edit'}"
                onclick="toggleUserStatus('${user._id}', ${user.isActive})"
              >
                <i class="fas fa-${user.isActive ? 'ban' : 'check'}"></i>
                ${user.isActive ? 'Ban' : 'Activate'}
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ===== TOGGLE USER STATUS =====
async function toggleUserStatus(userId, currentStatus) {
  const action = currentStatus ? 'ban' : 'activate';
  if (!confirm(`Are you sure you want to ${action} this user?`)) return;

  try {
    const response = await API.put(`/admin/users/${userId}/toggle`);
    showToast(response.message, 'success');
    loadUsers(currentPage);
  } catch (error) {
    showToast(error.message || 'Action failed.', 'error');
  }
}

// ===== PAGINATION =====
function renderPagination(total, current) {
  const container = document.getElementById('pagination');
  if (!container || total <= 1) { container.innerHTML = ''; return; }

  let html = `
    <button class="page-btn" onclick="loadUsers(${current - 1})" ${current === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i>
    </button>
  `;
  for (let i = 1; i <= total; i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="loadUsers(${i})">${i}</button>`;
  }
  html += `
    <button class="page-btn" onclick="loadUsers(${current + 1})" ${current === total ? 'disabled' : ''}>
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
  container.innerHTML = html;
}

// ===== SEARCH =====
document.getElementById('userSearch').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadUsers(1), 500);
});

loadUsers();