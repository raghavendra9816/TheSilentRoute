// ============================================
// ADMIN MESSAGES PAGE JAVASCRIPT
// ============================================

if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
  window.location.href = '/login.html';
}

document.getElementById('adminName').textContent = Auth.getUser()?.username || 'Admin';

let allMessages = [];
let currentFilter = 'all';

document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('adminSidebar').classList.toggle('open');
});
document.getElementById('sidebarClose')?.addEventListener('click', () => {
  document.getElementById('adminSidebar').classList.remove('open');
});

// ===== LOAD MESSAGES =====
async function loadMessages() {
  document.getElementById('messagesList').innerHTML =
    '<div class="spinner" style="margin:60px auto;"></div>';

  try {
    const response = await API.get('/admin/messages');
    allMessages = response.data;

    const unread = allMessages.filter(m => !m.isRead).length;
    const badge = document.getElementById('unreadBadge');
    badge.textContent = unread > 0 ? `${unread} Unread` : 'All Read';

    renderMessages(allMessages);
  } catch (error) {
    document.getElementById('messagesList').innerHTML =
      '<p style="color:var(--gray);text-align:center;padding:40px;">Failed to load messages.</p>';
  }
}

// ===== FILTER MESSAGES =====
function filterMessages(filter, btn) {
  currentFilter = filter;

  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  let filtered = allMessages;
  if (filter === 'unread') filtered = allMessages.filter(m => !m.isRead);
  if (filter === 'read') filtered = allMessages.filter(m => m.isRead);

  renderMessages(filtered);
}

// ===== RENDER MESSAGES =====
function renderMessages(messages) {
  const container = document.getElementById('messagesList');

  if (!messages || messages.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px;color:var(--gray);">
        <i class="fas fa-inbox" style="font-size:3rem;margin-bottom:16px;display:block;opacity:0.3;"></i>
        <h3 style="color:var(--text);margin-bottom:8px;">No messages yet</h3>
        <p>Messages from the contact form will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = messages.map(msg => `
    <div
      class="message-card ${!msg.isRead ? 'unread' : ''}"
      onclick="viewMessage('${msg._id}')"
    >
      <div class="message-avatar">
        ${msg.name.charAt(0).toUpperCase()}
      </div>
      <div class="message-body">
        <div class="message-header-row">
          <strong class="message-name">${msg.name}</strong>
          <span class="message-time">
            ${timeAgo(new Date(msg.createdAt))}
          </span>
        </div>
        <div class="message-subject">${msg.subject}</div>
        <div class="message-preview">${msg.message.substring(0, 100)}${msg.message.length > 100 ? '...' : ''}</div>
      </div>
      <div class="message-status">
        ${!msg.isRead
          ? '<span class="unread-dot"></span>'
          : '<i class="fas fa-envelope-open" style="color:var(--gray);font-size:0.85rem;"></i>'
        }
      </div>
    </div>
  `).join('');
}

// ===== VIEW MESSAGE =====
async function viewMessage(id) {
  const msg = allMessages.find(m => m._id === id);
  if (!msg) return;

  document.getElementById('messageContent').innerHTML = `
    <div style="margin-bottom:20px;">
      <div class="message-avatar" style="width:50px;height:50px;font-size:1.3rem;margin-bottom:14px;">
        ${msg.name.charAt(0).toUpperCase()}
      </div>
      <h3 style="font-size:1.2rem;font-weight:700;color:white;margin-bottom:4px;">${msg.name}</h3>
      <p style="color:var(--gold);font-size:0.9rem;">${msg.email}</p>
    </div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:16px;">
      <div style="color:var(--gray);font-size:0.8rem;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Subject</div>
      <div style="color:white;font-weight:600;">${msg.subject}</div>
    </div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:16px;">
      <div style="color:var(--gray);font-size:0.8rem;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px;">Message</div>
      <div style="color:var(--text);line-height:1.8;">${msg.message}</div>
    </div>
    <div style="color:var(--gray);font-size:0.82rem;margin-bottom:20px;">
      <i class="fas fa-clock"></i> ${new Date(msg.createdAt).toLocaleString()}
    </div>
    <a href="mailto:${msg.email}?subject=Re: ${msg.subject}" class="btn-primary" style="width:100%;justify-content:center;">
      <i class="fas fa-reply"></i> Reply via Email
    </a>
  `;

  openModal('viewMessageModal');

  // Mark as read
  if (!msg.isRead) {
    try {
      await API.put(`/admin/messages/${id}/read`);
      msg.isRead = true;
      renderMessages(currentFilter === 'all' ? allMessages :
        allMessages.filter(m => currentFilter === 'unread' ? !m.isRead : m.isRead));
      const unread = allMessages.filter(m => !m.isRead).length;
      document.getElementById('unreadBadge').textContent =
        unread > 0 ? `${unread} Unread` : 'All Read';
    } catch (err) {
      console.log('Mark read failed:', err.message);
    }
  }
}

// ===== TIME AGO HELPER =====
function timeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

loadMessages();