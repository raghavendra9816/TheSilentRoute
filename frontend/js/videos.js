// ============================================
// VIDEOS PAGE - COMPLETE JAVASCRIPT
// ============================================

let currentPage = 1;
let totalPages = 1;
let currentCategory = 'all';
let currentSort = 'newest';
let searchQuery = '';
let allVideos = [];
let searchTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  loadVideos();
  setupFilters();
  setupSearch();
  setupSort();
});

// ===== LOAD VIDEOS =====
async function loadVideos(page = 1) {
  const grid = document.getElementById('videoGrid');
  currentPage = page;

  grid.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('');

  try {
    let url = `/media?type=video&page=${page}&limit=9&sort=${currentSort}`;
    if (currentCategory !== 'all') url += `&category=${currentCategory}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    const response = await API.get(url);
    allVideos = response.data;
    totalPages = response.totalPages;

    updateResultCount(response.total, response.count);
    renderVideos(allVideos);
    renderPagination(response.totalPages, page);

    // Show featured video (first video)
    if (allVideos.length > 0 && page === 1) {
      showFeaturedVideo(allVideos[0]);
    }

  } catch (error) {
    grid.innerHTML = `
      <div class="no-media">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Failed to load videos</h3>
        <p>Please check your connection and refresh.</p>
        <button class="btn-primary" onclick="loadVideos(1)" style="margin-top:16px;">
          <i class="fas fa-redo"></i> Try Again
        </button>
      </div>
    `;
  }
}

// ===== SHOW FEATURED VIDEO =====
function showFeaturedVideo(video) {
  const section = document.getElementById('featuredSection');
  const player = document.getElementById('featuredPlayer');
  const info = document.getElementById('featuredInfo');

  if (!section || !video) return;

  player.poster = video.thumbnailUrl || '';
  player.querySelector('source').src = video.url;
  player.load();

  info.innerHTML = `
    <div class="featured-label">
      <i class="fas fa-star"></i> Featured Video
    </div>
    <h2 class="featured-video-title">${video.title}</h2>
    ${video.description ? `<p class="featured-video-desc">${video.description}</p>` : ''}
    <div class="featured-video-meta">
      ${video.location ? `<span><i class="fas fa-map-marker-alt"></i> ${video.location}</span>` : ''}
      <span><i class="fas fa-eye"></i> ${video.views || 0} views</span>
      <span><i class="fas fa-download"></i> ${video.downloads || 0} downloads</span>
      <span><i class="fas fa-tag"></i> ${video.category}</span>
    </div>
    <div style="display:flex; gap:12px; flex-wrap:wrap;">
      <button class="btn-primary" onclick="handleVideoDownload('${video._id}', '${video.title}')">
        <i class="fas fa-download"></i> Download
      </button>
    </div>
  `;

  section.style.display = 'block';
}

// ===== RENDER VIDEOS =====
function renderVideos(videos) {
  const grid = document.getElementById('videoGrid');
  grid.innerHTML = '';

  if (!videos || videos.length === 0) {
    grid.innerHTML = `
      <div class="no-media">
        <i class="fas fa-video-slash"></i>
        <h3>No videos found</h3>
        <p>Try a different category or search term.</p>
      </div>
    `;
    return;
  }

  videos.forEach((video, index) => {
    const card = document.createElement('div');
    card.className = 'media-card';

    const thumb = video.thumbnailUrl ||
      'https://via.placeholder.com/600x400/1a1a2e/ffffff?text=Video';

    card.innerHTML = `
      <div class="media-thumbnail" onclick="openVideoModal('${video._id}', '${video.url}', '${video.title}', '${video.description || ''}', '${video.location || ''}', ${video.views || 0}, ${video.downloads || 0})">
        <img
          src="${thumb}"
          alt="${video.title}"
          loading="lazy"
          onerror="this.src='https://via.placeholder.com/600x400/1a1a2e/ffffff?text=Video'"
        />
        <div class="video-play-btn">
          <div class="play-circle"><i class="fas fa-play"></i></div>
        </div>
        ${video.isFeatured ? '<div class="featured-badge">⭐ Featured</div>' : ''}
        <div class="type-badge video">▶ Video</div>
        <div class="media-hover-overlay">
          <div class="media-actions">
            <button class="media-action-btn view"
              onclick="event.stopPropagation(); openVideoModal('${video._id}', '${video.url}', '${video.title}', '', '${video.location || ''}', ${video.views || 0}, ${video.downloads || 0})">
              <i class="fas fa-play"></i> Play
            </button>
            <button class="media-action-btn download"
              onclick="event.stopPropagation(); handleVideoDownload('${video._id}', '${video.title}')">
              <i class="fas fa-download"></i> Download
            </button>
          </div>
        </div>
      </div>
      <div class="media-info">
        <h3 class="media-title" title="${video.title}">${video.title}</h3>
        ${video.location ? `
          <p class="media-location">
            <i class="fas fa-map-marker-alt"></i> ${video.location}
          </p>
        ` : ''}
        <div class="media-meta">
          <span class="media-category">
            <i class="fas fa-tag"></i> ${video.category}
          </span>
          <div class="media-stats">
            <span><i class="fas fa-eye"></i> ${video.views || 0}</span>
            <span><i class="fas fa-download"></i> ${video.downloads || 0}</span>
          </div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ===== OPEN VIDEO MODAL =====
function openVideoModal(id, url, title, desc, location, views, downloads) {
  const modal = document.getElementById('videoModal');
  const player = document.getElementById('modalPlayer');
  const src = document.getElementById('modalVideoSrc');
  const info = document.getElementById('videoModalInfo');

  src.src = url;
  player.load();
  player.play().catch(() => {});

  info.innerHTML = `
    <h3 class="video-modal-title">${title}</h3>
    <div class="video-modal-meta">
      ${location ? `<span><i class="fas fa-map-marker-alt"></i> ${location}</span>` : ''}
      <span><i class="fas fa-eye"></i> ${views} views</span>
      <span><i class="fas fa-download"></i> ${downloads} downloads</span>
    </div>
    ${desc ? `<p style="color:var(--gray);font-size:0.9rem;margin-bottom:14px;">${desc}</p>` : ''}
    <div class="video-modal-actions">
      <button class="btn-primary" onclick="handleVideoDownload('${id}', '${title}')">
        <i class="fas fa-download"></i> Download with Watermark
      </button>
    </div>
  `;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  const modal = document.getElementById('videoModal');
  const player = document.getElementById('modalPlayer');
  player.pause();
  player.src = '';
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

// ===== DOWNLOAD =====
async function handleVideoDownload(mediaId, title) {
  if (!Auth.isLoggedIn()) {
    openModal('loginModal');
    return;
  }

  showToast('Preparing your download...', 'info');

  try {
    const response = await API.get(`/media/${mediaId}/download`);
    const link = document.createElement('a');
    link.href = response.downloadUrl;
    link.download = `${response.filename || title}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download started! Watermark added ✓', 'success');
  } catch (error) {
    showToast(error.message || 'Download failed.', 'error');
  }
}

// ===== FILTERS, SEARCH, SORT =====
function setupFilters() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      loadVideos(1);
    });
  });
}

function setupSearch() {
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      loadVideos(1);
    }, 500);
  });
}

function setupSort() {
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    currentSort = e.target.value;
    loadVideos(1);
  });
}

function updateResultCount(total, shown) {
  const el = document.getElementById('resultCount');
  if (el) {
    el.innerHTML = `
      <i class="fas fa-video"></i>
      Showing <strong>${shown}</strong> of <strong>${total}</strong> videos
    `;
  }
}

function renderPagination(total, current) {
  const container = document.getElementById('pagination');
  if (!container || total <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = `
    <button class="page-btn" onclick="loadVideos(${current - 1})"
      ${current === 1 ? 'disabled' : ''}>
      <i class="fas fa-chevron-left"></i>
    </button>
  `;

  for (let i = 1; i <= total; i++) {
    html += `
      <button class="page-btn ${i === current ? 'active' : ''}"
        onclick="loadVideos(${i})">${i}</button>
    `;
  }

  html += `
    <button class="page-btn" onclick="loadVideos(${current + 1})"
      ${current === total ? 'disabled' : ''}>
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeVideoModal();
});