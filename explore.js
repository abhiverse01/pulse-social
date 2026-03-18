// ============================================================
// PULSE — Explore (explore.js)
// Search, trending hashtags, discovery grid
// ============================================================

const Explore = (() => {

  let currentUser = null;
  let currentTab = 'all';

  function init(user) {
    currentUser = user;

    setupSearch();
    renderTrending();
    renderSuggestedUsers();
    renderDiscoveryGrid();

    // Handle query param
    const q = Utils.getParam('q');
    const tag = Utils.getParam('tag');

    if (q) {
      const searchInput = document.getElementById('explore-search');
      if (searchInput) {
        searchInput.value = q;
        runSearch(q);
      }
    } else if (tag) {
      const searchInput = document.getElementById('explore-search');
      if (searchInput) {
        searchInput.value = '#' + tag;
        runHashtagSearch(tag);
      }
    }
  }

  // ── Search setup ──────────────────────────────────────────

  function setupSearch() {
    const input = document.getElementById('explore-search');
    if (!input) return;

    input.addEventListener('input', Utils.debounce(e => {
      const q = e.target.value.trim();
      if (!q) {
        renderDiscoveryGrid();
        renderTrending();
        renderSuggestedUsers();
        document.getElementById('explore-results')?.classList.add('hidden');
        document.getElementById('explore-discovery')?.classList.remove('hidden');
        return;
      }
      if (q.startsWith('#')) {
        runHashtagSearch(q.slice(1));
      } else {
        runSearch(q);
      }
    }, 300));

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = input.value.trim();
        if (q) {
          Utils.setParam('q', q);
          q.startsWith('#') ? runHashtagSearch(q.slice(1)) : runSearch(q);
        }
      }
    });
  }

  function runSearch(query) {
    const resultsEl = document.getElementById('explore-results');
    const discoveryEl = document.getElementById('explore-discovery');
    if (resultsEl) resultsEl.classList.remove('hidden');
    if (discoveryEl) discoveryEl.classList.add('hidden');

    const users = DB.users.search(query).filter(u => u.id !== currentUser.id);
    const posts = DB.posts.search(query);

    renderSearchResults(query, users, posts);
  }

  function runHashtagSearch(tag) {
    const resultsEl = document.getElementById('explore-results');
    const discoveryEl = document.getElementById('explore-discovery');
    if (resultsEl) resultsEl.classList.remove('hidden');
    if (discoveryEl) discoveryEl.classList.add('hidden');

    const posts = DB.posts.getByHashtag(tag);
    const container = document.getElementById('explore-results');
    if (!container) return;

    container.innerHTML = `
      <div class="search-header">
        <h3 class="search-title">#${Utils.sanitizeHTML(tag)}</h3>
        <span class="search-count">${posts.length} posts</span>
      </div>
      ${posts.length
        ? `<div class="posts-grid search-grid">${posts.map(p => renderGridPost(p)).join('')}</div>`
        : `<div class="search-empty">No posts with #${Utils.sanitizeHTML(tag)}</div>`
      }
    `;
  }

  function renderSearchResults(query, users, posts) {
    const container = document.getElementById('explore-results');
    if (!container) return;

    const tabsHTML = `
      <div class="search-tabs">
        <button class="tab ${currentTab === 'all' ? 'active' : ''}" onclick="Explore.setTab('all', this)">All</button>
        <button class="tab ${currentTab === 'people' ? 'active' : ''}" onclick="Explore.setTab('people', this)">People (${users.length})</button>
        <button class="tab ${currentTab === 'posts' ? 'active' : ''}" onclick="Explore.setTab('posts', this)">Posts (${posts.length})</button>
      </div>
    `;

    let resultsHTML = '';

    if (currentTab === 'all' || currentTab === 'people') {
      resultsHTML += users.length ? `
        <div class="search-section">
          <h4 class="search-section-title">People</h4>
          <div class="search-people-grid">
            ${users.slice(0, currentTab === 'all' ? 4 : 20).map(u => renderUserCard(u)).join('')}
          </div>
        </div>
      ` : (currentTab === 'people' ? `<div class="search-empty">No people found for "${Utils.sanitizeHTML(query)}"</div>` : '');
    }

    if (currentTab === 'all' || currentTab === 'posts') {
      resultsHTML += posts.length ? `
        <div class="search-section">
          <h4 class="search-section-title">Posts</h4>
          <div class="${currentTab === 'all' ? 'posts-grid search-grid' : 'search-posts-list'}">
            ${currentTab === 'all'
              ? posts.slice(0, 9).map(p => renderGridPost(p)).join('')
              : posts.map(p => `<div class="search-post-item">${Feed.renderPostCard(p).outerHTML}</div>`).join('')
            }
          </div>
        </div>
      ` : (currentTab === 'posts' ? `<div class="search-empty">No posts found for "${Utils.sanitizeHTML(query)}"</div>` : '');
    }

    if (!users.length && !posts.length) {
      resultsHTML = `<div class="search-empty">
        <span class="search-empty-icon">◈</span>
        <p>No results for "${Utils.sanitizeHTML(query)}"</p>
      </div>`;
    }

    container.innerHTML = tabsHTML + resultsHTML;
  }

  function setTab(tab, btn) {
    currentTab = tab;
    Utils.$$('.search-tabs .tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const q = document.getElementById('explore-search')?.value.trim();
    if (q) runSearch(q);
  }

  // ── Trending ──────────────────────────────────────────────

  function renderTrending() {
    const container = document.getElementById('explore-trending-section');
    if (!container) return;

    const trending = DB.posts.getTrending();
    if (!trending.length) return;

    container.innerHTML = `
      <div style="padding:1rem 1.4rem 0.5rem;">
        <h3 style="font-size:0.9rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:0.75rem;">Trending</h3>
        ${trending.map(({ tag, count }, i) => `
          <a href="explore.html?tag=${encodeURIComponent(tag)}" class="trend-row">
            <div class="trend-rank">${i + 1}</div>
            <div class="trend-info">
              <span class="trend-name">#${tag}</span>
              <span class="trend-count">${Utils.formatNumber(count)} posts</span>
            </div>
          </a>
        `).join('')}
      </div>
    `;
  }

  // ── Suggested users ───────────────────────────────────────

  function renderSuggestedUsers() {
    const container = document.getElementById('explore-suggested-section');
    if (!container) return;

    const suggested = DB.users.getSuggested(currentUser.id);
    if (!suggested.length) return;

    container.innerHTML = `
      <div style="padding:1rem 1.4rem 0.5rem;">
        <h3 style="font-size:0.9rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:0.75rem;">Who to follow</h3>
        <div class="user-cards-row">
          ${suggested.map(u => renderUserCard(u)).join('')}
        </div>
      </div>
    `;
  }

  function renderUserCard(user) {
    const isFollowing = DB.users.isFollowing(currentUser.id, user.id);
    return `
      <div class="user-card" id="user-card-${user.id}">
        <a href="profile.html?u=${user.username}" class="user-card-inner">
          <div class="user-card-avatar">${Utils.avatarHTML(user, 48)}</div>
          <div class="user-card-name">
            ${Utils.sanitizeHTML(user.displayName)}
            ${user.verified ? `<span class="verified-icon">✓</span>` : ''}
          </div>
          <div class="user-card-handle">@${user.username}</div>
          <div class="user-card-bio">${Utils.sanitizeHTML(Utils.truncate(user.bio, 60))}</div>
          <div class="user-card-stats">
            <span>${Utils.formatNumber(user.followers.length)} followers</span>
          </div>
        </a>
        <button 
          class="btn ${isFollowing ? 'btn-outline' : 'btn-primary'} btn-sm user-card-follow"
          onclick="Explore.toggleFollow('${user.id}', this)">
          ${isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>
    `;
  }

  function toggleFollow(userId, btn) {
    const isFollowing = DB.users.isFollowing(currentUser.id, userId);
    if (isFollowing) {
      DB.users.unfollow(currentUser.id, userId);
      btn.textContent = 'Follow';
      btn.classList.remove('btn-outline');
      btn.classList.add('btn-primary');
    } else {
      DB.users.follow(currentUser.id, userId);
      btn.textContent = 'Following';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-outline');
    }
    currentUser = DB.users.getById(currentUser.id);
  }

  // ── Discovery grid ────────────────────────────────────────

  function renderDiscoveryGrid() {
    const container = document.getElementById('explore-grid-section');
    if (!container) return;

    const posts = DB.posts.getExplore();

    if (!posts.length) {
      container.innerHTML = '<div style="padding:3rem;text-align:center;color:var(--text-muted);">No posts to explore yet</div>';
      return;
    }

    container.innerHTML = `
      <div style="padding:1rem 1.4rem 0.5rem;">
        <h3 style="font-size:0.9rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:0.75rem;">Discover</h3>
      </div>
      <div class="posts-grid">${posts.map(p => renderGridPost(p)).join('')}</div>
    `;
  }

  function renderGridPost(post) {
    const author = DB.users.getById(post.authorId);
    if (!author) return '';

    return `
      <div class="grid-post" onclick="Feed.openPostModal('${post.id}')">
        ${post.images.length
          ? `<img src="${post.images[0]}" alt="Post" loading="lazy" class="grid-post-img">`
          : `<div class="grid-post-text">
              <span class="grid-post-content">${Utils.sanitizeHTML(Utils.truncate(post.content, 80))}</span>
             </div>`
        }
        <div class="grid-post-overlay">
          <div class="grid-post-author">
            ${Utils.avatarHTML(author, 20)}
            <span>@${author.username}</span>
          </div>
          <div class="grid-post-stats">
            <span>♥ ${Utils.formatNumber(post.likes.length)}</span>
            <span>💬 ${post.comments.length}</span>
          </div>
        </div>
      </div>
    `;
  }

  return { init, runSearch, runHashtagSearch, setTab, renderTrending, renderSuggestedUsers, renderDiscoveryGrid, toggleFollow };
})();
