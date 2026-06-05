// =============================================
// AUTH - COMPLETE REWRITE
// =============================================

const Auth = {

  // Save user after login/register
  saveUser(token, user) {
    localStorage.setItem('tsr_token', token);
    localStorage.setItem('tsr_user', JSON.stringify(user));
  },

  // Get logged in user object
  getUser() {
    try {
      const user = localStorage.getItem('tsr_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  // Get auth token
  getToken() {
    return localStorage.getItem('tsr_token') || null;
  },

  // Check if logged in
  isLoggedIn() {
    const token = this.getToken();
    const user  = this.getUser();
    return !!(token && user);
  },

  // Check if admin
  isAdmin() {
    const user = this.getUser();
    return !!(user && user.role === 'admin');
  },

  // Logout and redirect
  logout() {
    localStorage.removeItem('tsr_token');
    localStorage.removeItem('tsr_user');
    window.location.href = '/index.html';
  },

  // Update navbar based on login state
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
        <a href="login.html"    class="nav-login-btn">Login</a>
        <a href="register.html" class="nav-register-btn">Sign Up</a>
      `;
    }
  }
};

// =============================================
// TOAST NOTIFICATIONS
// =============================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: 'fas fa-check-circle',
    error:   'fas fa-exclamation-circle',
    info:    'fas fa-info-circle',
    warning: 'fas fa-exclamation-triangle'
  };

  const colors = {
    success: '#48bb78',
    error:   '#e94560',
    info:    '#f5a623',
    warning: '#f5a623'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.style.cssText = `
    background: #16213e;
    border-left: 4px solid ${colors[type] || colors.info};
    color: #e2e8f0;
    padding: 14px 20px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    max-width: 350px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.9rem;
    font-family: 'Montserrat', sans-serif;
    animation: slideInRight 0.3s ease;
  `;

  toast.innerHTML = `
    <i class="${icons[type] || icons.info}"
       style="color:${colors[type]};font-size:1.1rem;flex-shrink:0;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease forwards';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 4000);
}

// =============================================
// MODAL FUNCTIONS
// =============================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

// =============================================
// NAVBAR SCROLL EFFECT
// =============================================
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// =============================================
// INIT ON PAGE LOAD
// =============================================
document.addEventListener('DOMContentLoaded', () => {

  // Update navbar auth state
  Auth.updateNavbar();

  // Mobile hamburger menu
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('mobile-open');
    });
  }

  // Close mobile menu when link clicked
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('active');
      navLinks?.classList.remove('mobile-open');
    });
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.open').forEach(modal => {
        modal.classList.remove('open');
      });
    }
  });
});

// =============================================
// CSS ANIMATIONS FOR TOAST
// =============================================
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0);    opacity: 1; }
    to   { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(toastStyle);