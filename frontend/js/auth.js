// ============================================
// AUTH FUNCTIONS
// ============================================

const Auth = {
  // Save user data after login
  saveUser(token, user) {
    localStorage.setItem('tsr_token', token);
    localStorage.setItem('tsr_user', JSON.stringify(user));
  },

  // Get current logged in user
  getUser() {
    const user = localStorage.getItem('tsr_user');
    return user ? JSON.parse(user) : null;
  },

  // Get auth token
  getToken() {
    return localStorage.getItem('tsr_token');
  },

  // Check if user is logged in
  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },

  // Check if user is admin
  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  // Logout
  logout() {
    localStorage.removeItem('tsr_token');
    localStorage.removeItem('tsr_user');
    window.location.href = '/index.html';
  },

  // Update navbar based on auth state
  updateNavbar() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;

    if (this.isLoggedIn()) {
      const user = this.getUser();
      navAuth.innerHTML = `
        <div class="nav-user">
          ${user.role === 'admin' ? `
            <a href="/admin/index.html" class="nav-admin-btn">
              <i class="fas fa-cog"></i> Admin
            </a>
          ` : ''}
          <span class="nav-username">
            <i class="fas fa-user-circle"></i> ${user.username}
          </span>
          <button class="nav-logout-btn" onclick="Auth.logout()">
            Logout
          </button>
        </div>
      `;
    } else {
      navAuth.innerHTML = `
        <a href="/login.html" class="nav-login-btn">Login</a>
        <a href="/register.html" class="nav-register-btn">Sign Up</a>
      `;
    }
  }
};

// Toast notification system
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="${icons[type] || icons.info}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Modal functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
});

// Hamburger menu
document.addEventListener('DOMContentLoaded', () => {
  Auth.updateNavbar();

  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('mobile-open');
    });
  }

  // Close mobile nav when link is clicked
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks?.classList.remove('mobile-open');
      hamburger?.classList.remove('active');
    });
  });
});