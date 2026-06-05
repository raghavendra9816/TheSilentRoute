// ============================================
// GALLERY PAGE - COMPLETE JAVASCRIPT
// ============================================

let currentPage = 1;
let totalPages = 1;
let currentCategory = 'all';
let currentSort = 'newest';
let searchQuery = '';
let allPhotos = [];
let currentLightboxIndex = 0;
let searchTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  loadGallery();
  setupFilters();
  setupSearch();
  setupSort();
  setupLightbox();
});

// ===== LOAD GALLERY =====
async function loadGallery(page = 1) {
  const grid = document.getElementById('galleryGrid');
  currentPage = page;

  // Show skeletons
  grid.innerHTML = Array(12).fill('<div class="skeleton-card"></div>').join('');

  try {
    let url = `/media?type=image&page=${page}&limit=12&sort=${currentSort}`;
    if (currentCategory !== 'all') url += `&category=${currentCategory}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    const response = await API.get(url);
    allPhotos = response.data;
    totalPages = response.totalPages;

    updateResultCount(response.total, response.count);
    renderGallery(allPhotos);
    renderPagination(response.totalPages, page);

  } catch (error) {
    grid.innerHTML = `
      <div class="no-media">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Failed to load photos</h3>
        <p>Please check your connection and try again.</p>
        <button class="btn-primary" onclick="loadGallery(1)" style="margin-top:16px;">
          <i class="fas fa-redo"></i> Try Again
        </button>
      </div>
    `;
  }
}

// ===== RENDER GALLERY =====
function renderGallery(photos) {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';

  if (!photos || photos.length === 0) {
    grid.innerHTML = `
      <div class="no-media">
        <i class="fas fa-images"></i>
        <h3>No photos found</h3>
        <p>Try a different category or search term.</p>
      </div>
    `;
    return;
  }

  photos.forEach((photo, index) => {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.style.animationDelay = `${index * 0.05}s`;

    const imgSrc = photo.thumbnailUrl || photo.url ||
      'https://via.placeholder.com/600x400/1a1a2e/ffffff?text=TSR';

    card.innerHTML = `
      <div class="media-thumbnail" onclick="openLightbox(${index})">
        <img
          src="${imgSrc}"
          alt="${photo.title}"
          loading="lazy"
          onerror="this.src='https://via.placeholder.com/600x400/1a1a2e/ffffff?text=TSR'"
        />
        ${photo.isFeatured ? '<div class="featured-badge">⭐ Featured</div>' : ''}
        <div class="type-badge image">📷 Photo</div>
        <div class="media-hover-overlay">
          <div class="media-actions">
            <button class="media-action-btn view" onclick="event.stopPropagation(); openLightbox(${index})">
              <i class="fas fa-expand"></i> View
            </button>
            <button
              class="media-action-btn download"
              onclick="event.stopPropagation(); handleDownload('${photo._id}', '${photo.title}')"
            >
              <i class="fas fa-download"></i> Download
            </button>
          </div>
        </div>
      </div>
      <div class="media-info">
        <h3 class="media-title" title="${photo.title}">${photo.title}</h3>
        ${photo.location ? `
          <p class="media-location">
            <i class="fas fa-map-marker-alt"></i> ${photo.location}
          </p>
        ` : ''}
        <div class="media-meta">
          <span class="media-category">
            <i class="fas fa-tag"></i> ${photo.category}
          </span>
          <div class="media-stats">
            <span><i class="fas fa-eye"></i> ${photo.views || 0}</span>
            <span><i class="fas fa-download"></i> ${photo.downloads || 0}</span>
          </div>
        </div>
        ${photo.tags && photo.tags.length > 0 ? `
          <div class="media-tags">
            ${photo.tags.slice(0, 3).map(tag => `<span class="tag">#${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `;

    grid.appendChild(card);
  });
}

// ===== LIGHTBOX =====
function openLightbox(index) {
  currentLightboxIndex = index;
  const photo = allPhotos[index];
  if (!photo) return;

  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const info = document.getElementById('lightboxInfo');

  img.src = photo.url || photo.thumbnailUrl;
  img.alt = photo.title;

  info.innerHTML = `
    <h3>${photo.title}</h3>
    ${photo.location ? `<p><i class="fas fa-map-marker-alt"></i> ${photo.location}</p>` : ''}
    <div class="lightbox-meta">
      <span><i class="fas fa-eye"></i> ${photo.views || 0} views</span>
      <span><i class="fas fa-download"></i> ${photo.downloads || 0} downloads</span>
      <span class="lightbox-counter">${index + 1} / ${allPhotos.length}</span>
    </div>
    <button
      class="btn-primary"
      style="margin-top:16px;"
      onclick="handleDownload('${photo._id}', '${photo.title}')"
    >
      <i class="fas fa-download"></i> Download with Watermark
    </button>
  `;

  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Update nav buttons
  document.getElementById('lightboxPrev').style.display =
    index > 0 ? 'flex' : 'none';
  document.getElementById('lightboxNext').style.display =
    index < allPhotos.length - 1 ? 'flex' : 'none';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function setupLightbox() {
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxBackdrop').addEventListener('click', closeLightbox);

  document.getElementById('lightboxPrev').addEventListener('click', () => {
    if (currentLightboxIndex > 0) openLightbox(currentLightboxIndex - 1);
  });

  document.getElementById('lightboxNext').addEventListener('click', () => {
    if (currentLightboxIndex < allPhotos.length - 1)
      openLightbox(currentLightboxIndex + 1);
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' && currentLightboxIndex > 0)
      openLightbox(currentLightboxIndex - 1);
    if (e.key === 'ArrowRight' && currentLightboxIndex < allPhotos.length - 1)
      openLightbox(currentLightboxIndex + 1);
  });
}

// ===== DOWNLOAD HANDLER =====
async function handleDownload(mediaId, title) {
  if (!Auth.isLoggedIn()) {
    openModal('loginModal');
    return;
  }

  showToast('Preparing your download...', 'info');

  try {
    const response = await API.get(`/media/${mediaId}/download`);
    const link = document.createElement('a');
    link.href = response.downloadUrl;
    link.download = `${response.filename || title}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download started! Watermark has been added ✓', 'success');
  } catch (error) {
    showToast(error.message || 'Download failed. Please try again.', 'error');
  }
}

// ===== FILTERS =====
function setupFilters() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t =>
        t.classList.remove('active')
      );
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      currentPage = 1;
      loadGallery(1);
    });
  });
}

// ===== SEARCH =====
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      currentPage = 1;
      loadGallery(1);
    }, 500);
  });
}

// ===== SORT =====
function setupSort() {
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    currentSort = e.target.value;
    currentPage = 1;
    loadGallery(1);
  });
}

// ===== RESULT COUNT =====
function updateResultCount(total, shown) {
  const el = document.getElementById('resultCount');
  if (el) {
    el.innerHTML = `
      <i class="fas fa-images"></i>
      Showing <strong>${shown}</strong> of <strong>${total}</strong> photos
    `;
  }
}

// ===== PAGINATION =====
function renderPagination(total, current) {
  const container = document.getElementById('pagination');
  if (!container || total <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = '';

  // Previous button
  html += `
    <button class="page-btn" onclick="loadGallery(${current - 1})"
      ${current === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i>
    </button>
  `;

  // Page numbers
  const range = getPageRange(current, total);
  range.forEach(page => {
    if (page === '...') {
      html += `<span class="page-dots">...</span>`;
    } else {
      html += `
        <button
          class="page-btn ${page === current ? 'active' : ''}"
          onclick="loadGallery(${page})"
        >${page}</button>
      `;
    }
  });

  // Next button
  html += `
    <button class="page-btn" onclick="loadGallery(${current + 1})"
      ${current === total ? 'disabled' : ''}>
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

function getPageRange(current, total) {
  const range = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) range.push(i);
  } else {
    range.push(1);
    if (current > 3) range.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      range.push(i);
    }
    if (current < total - 2) range.push('...');
    range.push(total);
  }
  return range;
}