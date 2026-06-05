// ============================================
// ADMIN MANAGE MEDIA JAVASCRIPT
// ============================================

if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
  window.location.href = '/login.html';
}

document.getElementById('adminName').textContent = Auth.getUser()?.username || 'Admin';

let currentPage = 1;
let searchTimer = null;

// Sidebar
document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('adminSidebar').classList.toggle('open');
});
document.getElementById('sidebarClose')?.addEventListener('click', () => {
  document.getElementById('adminSidebar').classList.remove('open');
});

// ===== LOAD MEDIA =====
async function loadMedia(page = 1) {
  currentPage = page;
  const search = document.getElementById('mediaSearch').value.trim();
  const type = document.getElementById('typeFilter').value;

  let url = `/admin/media?page=${page}&limit=15`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (type !== 'all') url += `&type=${type}`;

  document.getElementById('mediaTableWrap').innerHTML =
    '<div class="spinner" style="margin:40px auto;"></div>';

  try {
    const response = await API.get(url);
    renderMediaTable(response.data);
    renderPagination(response.totalPages, page);
    document.getElementById('resultInfo').textContent =
      `${response.total} items found`;
  } catch (error) {
    document.getElementById('mediaTableWrap').innerHTML =
      '<p style="padding:30px;color:var(--gray);text-align:center;">Failed to load media.</p>';
  }
}

// ===== RENDER TABLE =====
function renderMediaTable(items) {
  if (!items || items.length === 0) {
    document.getElementById('mediaTableWrap').innerHTML =
      '<p style="padding:40px;text-align:center;color:var(--gray);">No media found.</p>';
    return;
  }

  const html = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Preview</th>
          <th>Title</th>
          <th>Type</th>
          <th>Category</th>
          <th>Views</th>
          <th>Downloads</th>
          <th>Status</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td>
              <img
                src="${item.thumbnailUrl || 'https://via.placeholder.com/70x45/1a1a2e/fff?text=TSR'}"
                style="width:70px;height:45px;object-fit:cover;border-radius:6px;display:block;"
                alt="${item.title}"
              />
            </td>
            <td style="max-width:180px;">
              <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${item.title}">
                ${item.title}
              </div>
              ${item.isFeatured ? '<span style="color:var(--gold);font-size:0.75rem;">⭐ Featured</span>' : ''}
            </td>
            <td><span class="badge ${item.type}">${item.type}</span></td>
            <td>${item.category}</td>
            <td>${item.views || 0}</td>
            <td>${item.downloads || 0}</td>
            <td>
              <span style="
                padding: 3px 10px;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
                background: ${item.isActive ? 'rgba(72,187,120,0.15)' : 'rgba(233,69,96,0.15)'};
                color: ${item.isActive ? '#48bb78' : '#e94560'};
              ">
                ${item.isActive ? 'Active' : 'Hidden'}
              </span>
            </td>
            <td style="white-space:nowrap;">${new Date(item.createdAt).toLocaleDateString()}</td>
            <td>
              <div class="table-actions">
                <button class="btn-table edit" onclick="openEditModal('${item._id}', ${JSON.stringify(item).replace(/'/g, "\\'").replace(/"/g, '&quot;')})">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-table delete" onclick="openDeleteModal('${item._id}')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  document.getElementById('mediaTableWrap').innerHTML = html;
}

// ===== EDIT MODAL =====
function openEditModal(id, item) {
  document.getElementById('editId').value = id;
  document.getElementById('editTitle').value = item.title || '';
  document.getElementById('editDescription').value = item.description || '';
  document.getElementById('editLocation').value = item.location || '';
  document.getElementById('editCategory').value = item.category || 'travel';
  document.getElementById('editTags').value = item.tags ? item.tags.join(', ') : '';
  document.getElementById('editFeatured').checked = item.isFeatured || false;
  document.getElementById('editActive').checked = item.isActive !== false;
  openModal('editModal');
}

document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('editId').value;
  const btn = e.submitter;

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  btn.disabled = true;

  try {
    await API.put(`/admin/media/${id}`, {
      title: document.getElementById('editTitle').value,
      description: document.getElementById('editDescription').value,
      location: document.getElementById('editLocation').value,
      category: document.getElementById('editCategory').value,
      tags: document.getElementById('editTags').value,
      isFeatured: document.getElementById('editFeatured').checked,
      isActive: document.getElementById('editActive').checked
    });

    showToast('Media updated successfully!', 'success');
    closeModal('editModal');
    loadMedia(currentPage);
  } catch (error) {
    showToast(error.message || 'Update failed.', 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    btn.disabled = false;
  }
});

// ===== DELETE MODAL =====
function openDeleteModal(id) {
  document.getElementById('deleteId').value = id;
  openModal('deleteModal');
}

async function confirmDelete() {
  const id = document.getElementById('deleteId').value;

  try {
    await API.delete(`/admin/media/${id}`);
    showToast('Media deleted successfully!', 'success');
    closeModal('deleteModal');
    loadMedia(currentPage);
  } catch (error) {
    showToast(error.message || 'Delete failed.', 'error');
  }
}

// ===== PAGINATION =====
function renderPagination(total, current) {
  const container = document.getElementById('pagination');
  if (!container || total <= 1) { container.innerHTML = ''; return; }

  let html = `
    <button class="page-btn" onclick="loadMedia(${current - 1})" ${current === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i>
    </button>
  `;

  for (let i = 1; i <= Math.min(total, 10); i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="loadMedia(${i})">${i}</button>`;
  }

  html += `
    <button class="page-btn" onclick="loadMedia(${current + 1})" ${current === total ? 'disabled' : ''}>
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

// ===== FILTERS =====
document.getElementById('mediaSearch').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadMedia(1), 500);
});

document.getElementById('typeFilter').addEventListener('change', () => loadMedia(1));
document.getElementById('categoryFilter').addEventListener('change', () => loadMedia(1));

// Initial load
loadMedia();