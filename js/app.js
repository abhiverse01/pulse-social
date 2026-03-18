// ============================================================
// PULSE — App (app.js)
// Global initialization, navigation, theme, common UI
// ============================================================

const App = (() => {

  let currentUser = null;

  // ── Bootstrap ────────────────────────────────────────────

  function init(requireAuth = true) {
    // Initialize DB from seed on first run
    DB.init();

    if (requireAuth) {
      currentUser = Auth.guard();
      if (!currentUser) return null;
    }

    // Apply saved theme
    applyTheme(currentUser?.theme || 'dark');

    // Render sidebar if present
    if (document.getElementById('sidebar')) {
      renderSidebar();
    }

    // Update notification badge
    if (currentUser) updateBadges();

    // Mobile nav
    setupMobileNav();

    // Global search
    setupGlobalSearch();

    // Render right panel if present
    if (document.getElementById('right-panel') && currentUser) {
      renderRightPanel('right-panel');
    }

    // Close dropdowns on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.dropdown')) {
        Utils.$$('.dropdown.open').forEach(d => d.classList.remove('open'));
      }
    });

    return currentUser;
  }

  // ── Sidebar rendering ─────────────────────────────────────

  function renderSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || !currentUser) return;

    const page = window.location.pathname.split('/').pop() || 'feed.html';

    const navItems = [
      { href: 'feed.html',          icon: iconHome(),         label: 'Home',          id: 'feed' },
      { href: 'explore.html',       icon: iconExplore(),      label: 'Explore',       id: 'explore' },
      { href: 'notifications.html', icon: iconBell(),         label: 'Notifications', id: 'notifications', badge: true },
      { href: 'messages.html',      icon: iconMessage(),      label: 'Messages',      id: 'messages', badge: true },
      { href: `profile.html?u=${currentUser.username}`, icon: iconUser(), label: 'Profile', id: 'profile' },
      { href: 'settings.html',      icon: iconSettings(),     label: 'Settings',      id: 'settings' },
    ];

    const navHTML = navItems.map(item => {
      const isActive = page.includes(item.id) || (page === '' && item.id === 'feed');
      return `
        <a href="${item.href}" class="nav-item ${isActive ? 'active' : ''}" data-nav="${item.id}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
          ${item.badge ? `<span class="nav-badge" id="badge-${item.id}" style="display:none">0</span>` : ''}
        </a>
      `;
    }).join('');

    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <span class="sidebar-logo-mark">◈</span>
        <span>PULSE</span>
      </div>
      <nav class="sidebar-nav">${navHTML}</nav>
      <button class="sidebar-post-btn" onclick="App.openPostComposer()">
        ${iconImage()}
        <span>New Post</span>
      </button>
      <a href="profile.html?u=${currentUser.username}" class="sidebar-user">
        <div>${Utils.avatarHTML(currentUser, 36)}</div>
        <div class="sidebar-user-info">
          <span class="sidebar-user-name">${Utils.sanitizeHTML(currentUser.displayName)}</span>
          <span class="sidebar-user-handle">@${currentUser.username}</span>
        </div>
        <button class="sidebar-logout" onclick="event.preventDefault();Auth.logout()" title="Sign out">
          ${iconLogout()}
        </button>
      </a>
    `;
  }

  // ── Badges ───────────────────────────────────────────────

  function updateBadges() {
    if (!currentUser) return;

    const notifCount = DB.notifications.getUnreadCount(currentUser.id);
    const msgCount = DB.conversations.getUnreadCount(currentUser.id);

    const notifBadge = document.getElementById('badge-notifications');
    const msgBadge = document.getElementById('badge-messages');

    if (notifBadge) {
      notifBadge.textContent = notifCount > 99 ? '99+' : notifCount;
      notifBadge.style.display = notifCount > 0 ? 'flex' : 'none';
    }
    if (msgBadge) {
      msgBadge.textContent = msgCount > 99 ? '99+' : msgCount;
      msgBadge.style.display = msgCount > 0 ? 'flex' : 'none';
    }

    // Update tab title
    const total = notifCount + msgCount;
    if (total > 0) {
      document.title = `(${total}) PULSE`;
    }
  }

  // ── Theme ─────────────────────────────────────────────────

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }

  function toggleTheme() {
    if (!currentUser) return;
    const newTheme = currentUser.theme === 'dark' ? 'light' : 'dark';
    DB.users.update(currentUser.id, { theme: newTheme });
    currentUser.theme = newTheme;
    applyTheme(newTheme);
    Utils.showToast(`Switched to ${newTheme} mode`, 'default', 2000);
  }

  // ── Mobile nav ────────────────────────────────────────────

  function setupMobileNav() {
    const mobileNav = document.getElementById('mobile-nav');
    if (!mobileNav || !currentUser) return;

    const page = window.location.pathname.split('/').pop() || 'feed.html';
    const items = [
      { href: 'feed.html',          icon: iconHome(),    id: 'feed' },
      { href: 'explore.html',       icon: iconExplore(), id: 'explore' },
      { href: `profile.html?u=${currentUser.username}`, icon: iconUser(), id: 'profile' },
      { href: 'notifications.html', icon: iconBell(),    id: 'notifications' },
      { href: 'messages.html',      icon: iconMessage(), id: 'messages' },
    ];

    mobileNav.innerHTML = items.map(item => `
      <a href="${item.href}" class="mobile-nav-item ${page.includes(item.id) ? 'active' : ''}">
        ${item.icon}
      </a>
    `).join('');
  }

  // ── Global search ─────────────────────────────────────────

  function setupGlobalSearch() {
    const input = document.getElementById('global-search');
    if (!input) return;

    const results = document.createElement('div');
    results.className = 'search-dropdown';
    results.id = 'search-dropdown';
    input.parentElement.appendChild(results);

    input.addEventListener('focus', () => {
      if (input.value.trim().length > 0) results.classList.add('open');
    });

    input.addEventListener('input', Utils.debounce(e => {
      const q = e.target.value.trim();
      if (q.length < 2) { results.classList.remove('open'); return; }

      const users = DB.users.search(q).slice(0, 4);
      const posts = DB.posts.search(q).slice(0, 3);

      if (!users.length && !posts.length) {
        results.innerHTML = `<div class="search-empty">No results for "${Utils.sanitizeHTML(q)}"</div>`;
      } else {
        results.innerHTML = `
          ${users.length ? `<div class="search-section-label">People</div>` : ''}
          ${users.map(u => `
            <a href="profile.html?u=${u.username}" class="search-result-user">
              ${Utils.avatarHTML(u, 32)}
              <div class="search-result-info">
                <span class="search-result-name">${Utils.sanitizeHTML(u.displayName)}</span>
                <span class="search-result-handle">@${u.username}</span>
              </div>
              ${u.verified ? '<span class="verified-badge">✓</span>' : ''}
            </a>
          `).join('')}
          ${posts.length ? `<div class="search-section-label">Posts</div>` : ''}
          ${posts.map(p => {
            const author = DB.users.getById(p.authorId);
            return `
              <a href="feed.html?post=${p.id}" class="search-result-post">
                <span class="search-result-handle">@${author?.username}</span>
                <span class="search-result-snippet">${Utils.sanitizeHTML(Utils.truncate(p.content, 60))}</span>
              </a>
            `;
          }).join('')}
          <a href="explore.html?q=${encodeURIComponent(q)}" class="search-view-all">
            View all results for "${Utils.sanitizeHTML(q)}"
          </a>
        `;
      }

      results.classList.add('open');
    }, 250));

    document.addEventListener('click', e => {
      if (!e.target.closest('.search-wrapper')) {
        results.classList.remove('open');
      }
    });
  }

  // ── Post Composer (global quick-post) ─────────────────────

  function openPostComposer() {
    if (!currentUser) return;

    const html = `
      <div class="composer-modal">
        <div class="composer-modal-header">
          <h3>Create Post</h3>
          <button class="modal-close" onclick="Utils.closeModal()">✕</button>
        </div>
        <div class="composer-modal-body">
          <div class="composer-row">
            <div class="composer-avatar">${Utils.avatarHTML(currentUser, 40)}</div>
            <div class="composer-right">
              <textarea id="composer-text" placeholder="What's on your mind?" rows="4" maxlength="2000"></textarea>
              <div class="media-preview" id="composer-previews"></div>
            </div>
          </div>
        </div>
        <div class="composer-modal-footer">
          <div class="composer-actions">
            <label class="composer-media-btn" title="Add images">
              ${iconImage()}
              <input type="file" id="composer-file" accept="image/*" multiple style="display:none">
            </label>
          </div>
          <div class="composer-char-count">
            <span id="char-count">0</span>/2000
          </div>
          <button class="btn btn-primary" id="composer-submit">Post</button>
        </div>
      </div>
    `;

    const modal = Utils.showModal(html);

    const textarea = modal.querySelector('#composer-text');
    const charCount = modal.querySelector('#char-count');
    const submit = modal.querySelector('#composer-submit');
    const fileInput = modal.querySelector('#composer-file');
    const previews = modal.querySelector('#composer-previews');

    textarea.focus();

    textarea.addEventListener('input', () => {
      charCount.textContent = textarea.value.length;
      submit.disabled = textarea.value.trim().length === 0 && !previews.children.length;
    });

    const imageHandler = Media.setupImageInput(fileInput, previews, 4, () => {
      submit.disabled = textarea.value.trim().length === 0 && !previews.children.length;
    });

    submit.addEventListener('click', () => {
      const content = textarea.value.trim();
      const images = imageHandler.getImages();
      if (!content && !images.length) return;

      const post = DB.posts.create(currentUser.id, { content, images });
      Utils.closeModal();
      Utils.showToast('Post published ✦', 'success');

      // Refresh feed if on feed page
      if (window.location.pathname.includes('feed') && typeof Feed !== 'undefined') {
        Feed.refresh();
      }
    });
  }

  // ── Right panel helpers ───────────────────────────────────

  function renderRightPanel(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !currentUser) return;

    const suggested = DB.users.getSuggested(currentUser.id);
    const trending = DB.posts.getTrending();

    container.innerHTML = `
      ${suggested.length ? `
        <div class="right-panel-section">
          <div class="right-panel-section-header">Who to follow</div>
          ${suggested.map(u => `
            <div class="suggestion-item" id="suggest-${u.id}" style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1.2rem;">
              <a href="profile.html?u=${u.username}" style="display:flex;align-items:center;gap:0.65rem;flex:1;min-width:0;text-decoration:none;color:inherit;">
                ${Utils.avatarHTML(u, 36)}
                <div style="min-width:0;">
                  <div style="font-weight:600;font-size:0.875rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.sanitizeHTML(u.displayName)}</div>
                  <div style="font-size:0.78rem;color:var(--text-muted);">@${u.username}</div>
                </div>
              </a>
              <button class="btn btn-primary btn-sm" onclick="App.followFromSuggestion('${u.id}', this)">Follow</button>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${trending.length ? `
        <div class="right-panel-section">
          <div class="right-panel-section-header">Trending</div>
          ${trending.slice(0, 8).map(({ tag, count }) => `
            <a href="explore.html?tag=${encodeURIComponent(tag)}" style="display:flex;justify-content:space-between;align-items:center;padding:0.65rem 1.2rem;color:inherit;text-decoration:none;transition:background var(--t-fast);" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''">
              <span style="font-weight:600;font-size:0.875rem;">#${tag}</span>
              <span style="font-size:0.78rem;color:var(--text-muted);">${Utils.formatNumber(count)} posts</span>
            </a>
          `).join('')}
        </div>
      ` : ''}

      <div class="right-panel-section" style="padding:1rem 1.2rem;">
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;font-size:0.78rem;color:var(--text-muted);">
          <a href="settings.html" style="color:var(--text-muted);">Settings</a>·
          <a href="#" onclick="Auth.logout()" style="color:var(--text-muted);">Sign out</a>·
          <a href="#" onclick="App.toggleTheme();return false;" style="color:var(--text-muted);">Toggle theme</a>
        </div>
        <p style="font-size:0.72rem;color:var(--text-muted);margin-top:0.5rem;">PULSE © 2025</p>
      </div>
    `;
  }

  function followFromSuggestion(targetId, btn) {
    if (!currentUser) return;
    DB.users.follow(currentUser.id, targetId);
    btn.closest('.suggestion-item').classList.add('fade-out');
    setTimeout(() => btn.closest('.suggestion-item').remove(), 400);
    currentUser = DB.users.getById(currentUser.id);
    Utils.showToast('Followed ✦', 'success', 2000);
  }

  // ── SVG Icons ─────────────────────────────────────────────

  function iconHome() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  }
  function iconExplore() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
  }
  function iconBell() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`;
  }
  function iconMessage() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`;
  }
  function iconUser() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  }
  function iconSettings() {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`;
  }
  function iconLogout() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
  }
  function iconImage() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  }
  function iconHeart(filled = false) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`;
  }
  function iconComment() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`;
  }
  function iconShare() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;
  }
  function iconBookmark(filled = false) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>`;
  }
  function iconMore() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>`;
  }
  function iconSend() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  }
  function iconCheck() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  }

  return {
    init, renderSidebar, renderRightPanel, updateBadges, applyTheme, toggleTheme,
    openPostComposer, followFromSuggestion, getCurrentUser: () => currentUser,
    icons: { iconHome, iconExplore, iconBell, iconMessage, iconUser, iconSettings,
             iconLogout, iconImage, iconHeart, iconComment, iconShare, iconBookmark,
             iconMore, iconSend, iconCheck }
  };
})();

// Expose icons globally
const Icons = App.icons;
