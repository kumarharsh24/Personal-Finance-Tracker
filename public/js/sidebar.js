// Sidebar HTML generator
function renderSidebar(activePage) {
  const pages = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', href: '/dashboard.html' },
    { id: 'transactions', icon: '💳', label: 'Transactions', href: '/transactions.html' },
    { id: 'budgets', icon: '🎯', label: 'Budgets', href: '/budgets.html' },
    { id: 'reports', icon: '📈', label: 'Reports', href: '/reports.html' },
    { id: 'import', icon: '📥', label: 'Import', href: '/import.html' },
    { id: 'settings', icon: '⚙️', label: 'Settings', href: '/settings.html' },
  ];
  return `
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">💰</div>
        <span class="logo-text">Finance</span>
      </div>
      <nav>
        ${pages.map(p => `<a href="${p.href}" class="${p.id === activePage ? 'active' : ''}"><span class="nav-icon">${p.icon}</span><span>${p.label}</span></a>`).join('')}
      </nav>
      <div class="user-info">
        <div class="avatar" id="sidebar-avatar">?</div>
        <span id="sidebar-name">Loading...</span>
      </div>
    </aside>`;
}

// Initialize sidebar
async function initPage(activePage) {
  const user = await checkAuth();
  if (!user) { window.location.href = '/'; return null; }
  // Insert sidebar
  const app = document.querySelector('.app');
  if (app && !app.querySelector('.sidebar')) {
    app.insertAdjacentHTML('afterbegin', renderSidebar(activePage));
  }
  // Update user info
  const name = user.name || user.email.split('@')[0];
  const el = document.getElementById('sidebar-name');
  if (el) el.textContent = name;
  const av = document.getElementById('sidebar-avatar');
  if (av) av.textContent = name.charAt(0).toUpperCase();
  loadNotificationCount();
  return user;
}

async function logout() {
  await api('/auth/logout', { method: 'POST' });
  window.location.href = '/';
}
