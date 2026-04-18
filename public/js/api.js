const API_BASE = '/api';

async function api(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
    ...options,
  };
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }
  if (config.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  const res = await fetch(url, config);
  if (res.status === 401) {
    if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
      window.location.href = '/';
    }
    throw new Error('Authentication required');
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) return res;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.details?.join(', ') || 'Request failed');
  return data;
}

function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast`;
  toast.style.borderLeft = `3px solid ${type === 'error' ? 'var(--danger)' : 'var(--success)'}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function checkAuth() {
  try {
    const data = await api('/auth/me');
    return data.user;
  } catch {
    return null;
  }
}

async function loadNotificationCount() {
  try {
    const data = await api('/notifications?unread=true');
    const badge = document.getElementById('notif-count');
    if (badge) {
      badge.textContent = data.unreadCount;
      badge.style.display = data.unreadCount > 0 ? 'inline-flex' : 'none';
    }
  } catch { /* ignore */ }
}
