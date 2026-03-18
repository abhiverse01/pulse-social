// ============================================================
// PULSE — Utilities (utils.js)
// ============================================================

const Utils = (() => {

  // ── ID Generation ────────────────────────────────────────

  function generateId(prefix = 'id') {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 7);
    return `${prefix}_${ts}${rand}`;
  }

  // ── Simple password hash (NOT cryptographically secure - demo only) ──

  function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = ((hash << 5) - hash) + password.charCodeAt(i);
      hash |= 0;
    }
    // Combine with a simple salt approach
    let h = 5381;
    for (let i = 0; i < password.length; i++) {
      h = (h << 5) + h + password.charCodeAt(i);
      h = h & h;
    }
    return Math.abs(h).toString(16).padStart(32, '0');
  }

  // ── Time Formatting ──────────────────────────────────────

  function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    if (diff < 2592000) return `${Math.floor(diff / 604800)}w`;

    const options = { month: 'short', day: 'numeric' };
    if (date.getFullYear() !== now.getFullYear()) options.year = 'numeric';
    return date.toLocaleDateString(undefined, options);
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: '2-digit', minute: '2-digit'
    });
  }

  function formatDateTime(dateStr) {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  // ── Number Formatting ────────────────────────────────────

  function formatNumber(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  // ── Text Processing ──────────────────────────────────────

  function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function linkifyContent(content) {
    // Sanitize first
    let safe = sanitizeHTML(content);
    // Link hashtags
    safe = safe.replace(/#([\w]+)/g, `<a href="explore.html?tag=$1" class="hashtag">#$1</a>`);
    // Link @mentions
    safe = safe.replace(/@([\w]+)/g, `<a href="profile.html?u=$1" class="mention">@$1</a>`);
    // Link URLs
    safe = safe.replace(/(https?:\/\/[^\s<]+)/g, `<a href="$1" target="_blank" rel="noopener" class="link">$1</a>`);
    // Line breaks
    safe = safe.replace(/\n/g, '<br>');
    return safe;
  }

  function truncate(str, maxLen = 100) {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen).trim() + '…';
  }

  function extractHashtags(content) {
    return (content.match(/#[\w]+/g) || []).map(t => t.slice(1));
  }

  // ── Validation ──────────────────────────────────────────

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateUsername(username) {
    return /^[a-z0-9_]{3,30}$/.test(username);
  }

  function validatePassword(password) {
    return password.length >= 6;
  }

  // ── Colors ──────────────────────────────────────────────

  const ACCENT_COLORS = [
    '#6366f1', '#ec4899', '#f59e0b', '#10b981',
    '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16'
  ];

  function randomColor() {
    return ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
  }

  function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function avatarHTML(user, size = 40) {
    if (user.avatar) {
      return `<img src="${user.avatar}" alt="${user.displayName}" 
              style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
    }
    const initials = getInitials(user.displayName);
    const color = user.avatarColor || '#6366f1';
    const fontSize = Math.floor(size * 0.38);
    return `<div class="avatar-placeholder" style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:${fontSize}px;font-weight:600;font-family:'Poppins',sans-serif;
      flex-shrink:0;
    ">${initials}</div>`;
  }

  // ── DOM Helpers ──────────────────────────────────────────

  function $(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function $$(selector, scope = document) {
    return [...scope.querySelectorAll(selector)];
  }

  function el(tag, attrs = {}, children = []) {
    const elem = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') elem.className = v;
      else if (k === 'html') elem.innerHTML = v;
      else if (k === 'text') elem.textContent = v;
      else if (k.startsWith('on')) elem.addEventListener(k.slice(2), v);
      else elem.setAttribute(k, v);
    });
    children.forEach(child => {
      if (typeof child === 'string') elem.insertAdjacentHTML('beforeend', child);
      else if (child) elem.appendChild(child);
    });
    return elem;
  }

  function showToast(message, type = 'default', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span>
      <span class="toast-msg">${message}</span>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast-show'));

    setTimeout(() => {
      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  function showModal(html, onClose) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal';
    overlay.innerHTML = `<div class="modal-content">${html}</div>`;
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(onClose);
    });
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-show'));
    document.body.style.overflow = 'hidden';
    return overlay;
  }

  function closeModal(callback) {
    const modal = document.getElementById('active-modal');
    if (!modal) return;
    modal.classList.add('modal-hide');
    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = '';
      if (callback) callback();
    }, 300);
  }

  // ── Debounce / Throttle ──────────────────────────────────

  function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function throttle(fn, limit = 100) {
    let lastCall = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        return fn.apply(this, args);
      }
    };
  }

  // ── URL Params ──────────────────────────────────────────

  function getParam(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  function setParam(key, value) {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
  }

  // ── Copy to clipboard ────────────────────────────────────

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard', 'success', 2000);
    } catch {
      showToast('Could not copy', 'error', 2000);
    }
  }

  // ── Scroll helpers ────────────────────────────────────────

  function scrollToTop(element) {
    (element || window).scrollTo({ top: 0, behavior: 'smooth' });
  }

  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  return {
    generateId, hashPassword, timeAgo, formatDate, formatTime, formatDateTime,
    formatNumber, sanitizeHTML, linkifyContent, truncate, extractHashtags,
    validateEmail, validateUsername, validatePassword, randomColor,
    getInitials, avatarHTML, $, $$, el, showToast, showModal, closeModal,
    debounce, throttle, getParam, setParam, copyToClipboard, scrollToTop, isInViewport,
    ACCENT_COLORS
  };
})();
