// ============================================
// HOME PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Create particles for hero
  createParticles();

  // Start counter animation
  startCounters();

  // Load featured media
  await loadFeaturedMedia();

  // Setup filter tabs
  setupFilterTabs();
});

// ===== CREATE HERO PARTICLES =====
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 6 + 2;
    particle.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 15}s;
      animation-duration: ${Math.random() * 15 + 10}s;
    `;
    container.appendChild(particle);
  }
}

// ===== COUNTER ANIMATION =====
function startCounters() {
  const counters = document.querySelectorAll('.stat-item');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.target);
        const numberEl = entry.target.querySelector('.stat-number');
        animateCounter(numberEl, target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el, target) {
  let current = 0;
  const increment = target / 60;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString() + '+';
  }, 30);
}

// ===== LOAD FEATURED MEDIA =====
let currentFilter = 'all';
let allMedia = [];

async function loadFeaturedMedia(filter = 'all') {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  try {
    const typeParam = filter !== 'all' ? `&type=${filter}` : '';
    const response = await API.get(`/media?limit=6${typeParam}`);
    allMedia = response.data;

    grid.innerHTML = '';

    if (allMedia.length === 0) {
      grid.innerHTML = `
        <div class="no-media" style="grid-column: 1/-1;">
          <i class="fas fa-images"></i>
          <h3>No content yet</h3>
          <p>Check back soon for amazing content!</p>
        </div>
      `;
      return;
    }

    allMedia.forEach((item, index) => {
      const card = createMediaCard(item);
      card.style.animationDelay = `${index * 0.1}s`;
      grid.appendChild(card);
    });
  } catch (error) {
    grid.innerHTML = `
      <div class="no-media" style="grid-column: 1/-1;">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Failed to load content</h3>
        <p>Please refresh the page to try again.</p>
      </div>
    `;
  }
}

// ===== CREATE MEDIA CARD =====
function createMediaCard(media) {
  const card = document.createElement('div');
  card.className = 'media-card';

  const thumbnail = media.thumbnailUrl || media.url ||
    'https://via.placeholder.com/600x400/1a1a2e/ffffff?text=The+Silent+Route';

  card.innerHTML = `
    <div class="media-thumbnail">
      <img src="${thumbnail}" alt="${media.title}" loading="lazy"
           onerror="this.src='https://via.placeholder.com/600x400/1a1a2e/ffffff?text=TSR'">

      ${media.type === 'video' ? `
        <div class="video-play-btn">
          <div class="play-circle"><i class="fas fa-play"></i></div>
        </div>
      ` : ''}

      ${media.isFeatured ? '<div class="featured-badge">⭐ Featured</div>' : ''}

      <div class="type-badge ${media.type}">
        ${media.type === 'video' ? '▶ Video' : '📷 Photo'}
      </div>

      <div class="media-hover-overlay">
        <div class="media-actions">
          <button class="media-action-btn view"
            onclick="viewMedia('${media._id}', '${media.url}', '${media.type}', '${media.title}')">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="media-action-btn download"
            onclick="downloadMedia(event, '${media._id}', '${media.title}')">
            <i class="fas fa-download"></i> Download
          </button>
        </div>
      </div>
    </div>

    <div class="media-info">
      <h3 class="media-title">${media.title}</h3>
      ${media.location ? `
        <p class="media-location">
          <i class="fas fa-map-marker-alt"></i> ${media.location}
        </p>
      ` : ''}
      <div class="media-meta">
        <span class="media-category">
          <i class="fas fa-tag"></i> ${media.category}
        </span>
        <div class="media-stats">
          <span><i class="fas fa-eye"></i> ${media.views || 0}</span>
          <span><i class="fas fa-download"></i> ${media.downloads || 0}</span>
        </div>
      </div>
    </div>
  `;

  return card;
}

// ===== VIEW MEDIA (LIGHTBOX) =====
function viewMedia(id, url, type, title) {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.id = 'lightbox';

  lightbox.innerHTML = `
    <div onclick="closeLightbox()" style="position:absolute;inset:0;"></div>
    <div class="lightbox-content">
      <button class="lightbox-close" onclick="closeLightbox()">
        <i class="fas fa-times"></i>
      </button>
      ${type === 'video' ? `
        <video controls autoplay style="max-width:100%;max-height:80vh;border-radius:10px;">
          <source src="${url}" type="video/mp4">
        </video>
      ` : `
        <img src="${url}" alt="${title}" />
      `}
      <div class="lightbox-info">
        <h3>${title}</h3>
      </div>
    </div>
  `;

  document.body.appendChild(lightbox);
  setTimeout(() => lightbox.classList.add('open'), 10);
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.classList.remove('open');
    setTimeout(() => {
      lightbox.remove();
      document.body.style.overflow = '';
    }, 300);
  }
}

// ===== DOWNLOAD MEDIA =====
async function downloadMedia(event, mediaId, title) {
  event.stopPropagation();

  if (!Auth.isLoggedIn()) {
    openModal('loginModal');
    return;
  }

  const btn = event.currentTarget;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  btn.disabled = true;

  try {
    const response = await API.get(`/media/${mediaId}/download`);

    // Trigger download
    const link = document.createElement('a');
    link.href = response.downloadUrl;
    link.download = `${response.filename || title}.${response.type === 'video' ? 'mp4' : 'jpg'}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Download started! Watermark added ✓', 'success');
  } catch (error) {
    showToast(error.message || 'Download failed. Please try again.', 'error');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// ===== FILTER TABS =====
function setupFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      await loadFeaturedMedia(currentFilter);
    });
  });
}

// Close lightbox on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
    document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
  }
});