// ============================================================
// PULSE — Profile (profile.js)
// Profile rendering, follow system, post grid, edit
// ============================================================

const Profile = (() => {

  let currentUser = null;
  let profileUser = null;

  function init(user) {
    currentUser = user;
    const username = Utils.getParam('u');

    if (!username) {
      window.location.href = `profile.html?u=${user.username}`;
      return;
    }

    profileUser = DB.users.getByUsername(username);
    if (!profileUser) {
      const hero = document.getElementById('profile-hero');
      if (hero) hero.innerHTML = `
        <div style="padding:4rem 2rem;text-align:center;color:var(--text-muted);">
          <h2 style="margin-bottom:0.5rem;">User not found</h2>
          <p>@${Utils.sanitizeHTML(username)} doesn't exist.</p>
          <a href="feed.html" class="btn btn-primary" style="margin-top:1rem;display:inline-block;">Go home</a>
        </div>
      `;
      return;
    }

    renderProfile();
    renderPostsGrid();
  }

  // ── Render profile hero ───────────────────────────────────

  function renderProfile() {
    const isOwn = profileUser.id === currentUser.id;
    const isFollowing = DB.users.isFollowing(currentUser.id, profileUser.id);
    const posts = DB.posts.getByUser(profileUser.id);
    const container = document.getElementById('profile-hero');
    if (!container) return;

    container.innerHTML = `
      <div class="profile-banner">
        <div class="profile-banner-bg" style="background: linear-gradient(135deg, ${profileUser.avatarColor}22, ${profileUser.avatarColor}44);"></div>
      </div>
      <div class="profile-info">
        <div class="profile-top-row">
          <div class="profile-avatar-wrap">
            <div class="profile-avatar" id="profile-avatar-display" ${isOwn ? 'onclick="Profile.openAvatarEdit()"' : ''}>
              ${profileUser.avatar
                ? `<img src="${profileUser.avatar}" alt="${profileUser.displayName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
                : `<div style="width:100%;height:100%;border-radius:50%;background:${profileUser.avatarColor};display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#fff;">${Utils.getInitials(profileUser.displayName)}</div>`
              }
              ${isOwn ? `<div class="avatar-edit-overlay">✎</div>` : ''}
            </div>
          </div>
          <div class="profile-actions">
            ${isOwn ? `
              <button class="btn btn-outline" onclick="Profile.openEditModal()">Edit profile</button>
            ` : `
              <button class="btn btn-icon-outline" onclick="Profile.openDM('${profileUser.id}')" title="Message">
                ${Icons.iconMessage()}
              </button>
              <button class="btn ${isFollowing ? 'btn-outline following' : 'btn-primary'}" 
                      id="follow-btn"
                      onclick="Profile.toggleFollow()">
                ${isFollowing ? 'Following' : 'Follow'}
              </button>
            `}
          </div>
        </div>
        <div class="profile-details">
          <h1 class="profile-display-name">
            ${Utils.sanitizeHTML(profileUser.displayName)}
            ${profileUser.verified ? `<span class="verified-badge-lg">✓</span>` : ''}
          </h1>
          <p class="profile-username">@${profileUser.username}</p>
          ${profileUser.bio ? `<p class="profile-bio">${Utils.linkifyContent(profileUser.bio)}</p>` : ''}
          <div class="profile-meta-row">
            ${profileUser.location ? `<span class="profile-meta-item">📍 ${Utils.sanitizeHTML(profileUser.location)}</span>` : ''}
            ${profileUser.website ? `<a href="https://${profileUser.website}" target="_blank" rel="noopener" class="profile-meta-item profile-link">🔗 ${Utils.sanitizeHTML(profileUser.website)}</a>` : ''}
            <span class="profile-meta-item">📅 Joined ${Utils.formatDate(profileUser.createdAt)}</span>
          </div>
          <div class="profile-stats">
            <button class="profile-stat" onclick="Profile.openFollowersModal()">
              <span class="stat-number">${Utils.formatNumber(profileUser.followers.length)}</span>
              <span class="stat-label">followers</span>
            </button>
            <button class="profile-stat" onclick="Profile.openFollowingModal()">
              <span class="stat-number">${Utils.formatNumber(profileUser.following.length)}</span>
              <span class="stat-label">following</span>
            </button>
            <div class="profile-stat">
              <span class="stat-number">${Utils.formatNumber(posts.length)}</span>
              <span class="stat-label">posts</span>
            </div>
          </div>
        </div>
      </div>
      <div class="profile-tabs">
        <button class="tab active" onclick="Profile.setTab('posts', this)">Posts</button>
        ${isOwn ? `<button class="tab" onclick="Profile.setTab('bookmarks', this)">Bookmarks</button>` : ''}
        <button class="tab" onclick="Profile.setTab('likes', this)">Likes</button>
      </div>
    `;
  }

  // ── Posts Grid ────────────────────────────────────────────

  function renderPostsGrid(tab = 'posts') {
    const container = document.getElementById('profile-posts');
    if (!container) return;

    let posts = [];
    if (tab === 'posts') {
      posts = DB.posts.getByUser(profileUser.id);
    } else if (tab === 'bookmarks') {
      posts = (currentUser.bookmarks || [])
        .map(id => DB.posts.getById(id))
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (tab === 'likes') {
      posts = DB.posts.getAll()
        .filter(p => p.likes.includes(profileUser.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (!posts.length) {
      container.innerHTML = `
        <div class="profile-empty">
          <span class="profile-empty-icon">✦</span>
          <p>${tab === 'posts' ? 'No posts yet' : tab === 'bookmarks' ? 'No bookmarks' : 'No likes yet'}</p>
        </div>
      `;
      return;
    }

    if (tab === 'posts') {
      // Grid view for own posts
      container.innerHTML = `
        <div class="posts-grid">
          ${posts.map(post => `
            <div class="post-grid-item" onclick="Feed.openPostModal('${post.id}')">
              ${post.images.length
                ? `<img src="${post.images[0]}" alt="Post" loading="lazy">`
                : `<div class="post-grid-text">${Utils.sanitizeHTML(Utils.truncate(post.content, 80))}</div>`
              }
              <div class="post-grid-overlay">
                <span>♥ ${Utils.formatNumber(post.likes.length)}</span>
                <span>💬 ${post.comments.length}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      // List view for bookmarks/likes
      container.innerHTML = '';
      posts.forEach(post => {
        const card = Feed.renderPostCard(post);
        container.appendChild(card);
      });
    }
  }

  function setTab(tab, btn) {
    Utils.$$('.profile-tabs .tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    renderPostsGrid(tab);
  }

  // ── Follow / Unfollow ─────────────────────────────────────

  function toggleFollow() {
    const btn = document.getElementById('follow-btn');
    if (!btn || !profileUser) return;

    const isFollowing = DB.users.isFollowing(currentUser.id, profileUser.id);
    if (isFollowing) {
      DB.users.unfollow(currentUser.id, profileUser.id);
      btn.textContent = 'Follow';
      btn.classList.remove('btn-outline', 'following');
      btn.classList.add('btn-primary');
      Utils.showToast(`Unfollowed @${profileUser.username}`, 'default', 2000);
    } else {
      DB.users.follow(currentUser.id, profileUser.id);
      btn.textContent = 'Following';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-outline', 'following');
      Utils.showToast(`Following @${profileUser.username} ✦`, 'success', 2000);
    }

    // Refresh counts
    currentUser = DB.users.getById(currentUser.id);
    profileUser = DB.users.getById(profileUser.id);
    renderProfile();
    renderPostsGrid();
  }

  // ── Followers / Following modals ──────────────────────────

  function openFollowersModal() {
    const followers = profileUser.followers
      .map(id => DB.users.getById(id))
      .filter(Boolean);

    Utils.showModal(`
      <div class="users-list-modal">
        <div class="modal-header">
          <h3>Followers</h3>
          <button class="modal-close" onclick="Utils.closeModal()">✕</button>
        </div>
        <div class="users-list">
          ${followers.length
            ? followers.map(u => renderUserRow(u)).join('')
            : '<div class="users-list-empty">No followers yet</div>'
          }
        </div>
      </div>
    `);
  }

  function openFollowingModal() {
    const following = profileUser.following
      .map(id => DB.users.getById(id))
      .filter(Boolean);

    Utils.showModal(`
      <div class="users-list-modal">
        <div class="modal-header">
          <h3>Following</h3>
          <button class="modal-close" onclick="Utils.closeModal()">✕</button>
        </div>
        <div class="users-list">
          ${following.length
            ? following.map(u => renderUserRow(u)).join('')
            : '<div class="users-list-empty">Not following anyone yet</div>'
          }
        </div>
      </div>
    `);
  }

  function renderUserRow(user) {
    const isFollowing = DB.users.isFollowing(currentUser.id, user.id);
    const isOwn = user.id === currentUser.id;
    return `
      <div class="user-row">
        <a href="profile.html?u=${user.username}" class="user-row-info" onclick="Utils.closeModal()">
          ${Utils.avatarHTML(user, 40)}
          <div class="user-row-text">
            <span class="user-row-name">${Utils.sanitizeHTML(user.displayName)}</span>
            <span class="user-row-handle">@${user.username}</span>
          </div>
        </a>
        ${!isOwn ? `
          <button class="btn ${isFollowing ? 'btn-outline' : 'btn-primary'} btn-sm"
                  onclick="Profile.quickFollow('${user.id}', this)">
            ${isFollowing ? 'Following' : 'Follow'}
          </button>
        ` : ''}
      </div>
    `;
  }

  function quickFollow(userId, btn) {
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

  // ── Edit Profile Modal ────────────────────────────────────

  function openEditModal() {
    const user = profileUser;
    const html = `
      <div class="edit-profile-modal">
        <div class="modal-header">
          <h3>Edit Profile</h3>
          <button class="modal-close" onclick="Utils.closeModal()">✕</button>
        </div>
        <form id="edit-profile-form" onsubmit="Profile.saveProfile(event)">
          <div class="form-group">
            <label>Profile photo</label>
            <div class="avatar-upload-row">
              <div id="edit-avatar-display" class="avatar-upload-preview">
                ${user.avatar
                  ? `<img src="${user.avatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
                  : `<div style="width:100%;height:100%;border-radius:50%;background:${user.avatarColor};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#fff;">${Utils.getInitials(user.displayName)}</div>`
                }
              </div>
              <label class="btn btn-outline btn-sm">
                Change photo
                <input type="file" id="edit-avatar-input" accept="image/*" style="display:none">
              </label>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label>Display name</label>
              <input type="text" id="edit-displayName" value="${Utils.sanitizeHTML(user.displayName)}" maxlength="50" placeholder="Display name">
            </div>
            <div class="form-group">
              <label>Username</label>
              <div class="input-with-prefix">
                <span class="input-prefix">@</span>
                <input type="text" id="edit-username" value="${user.username}" maxlength="30" placeholder="username">
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Bio</label>
            <textarea id="edit-bio" maxlength="200" placeholder="Tell the world who you are" rows="3">${Utils.sanitizeHTML(user.bio)}</textarea>
            <span class="form-hint" id="bio-count">${user.bio.length}/200</span>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label>Location</label>
              <input type="text" id="edit-location" value="${Utils.sanitizeHTML(user.location || '')}" maxlength="60" placeholder="Where are you?">
            </div>
            <div class="form-group">
              <label>Website</label>
              <input type="text" id="edit-website" value="${Utils.sanitizeHTML(user.website || '')}" maxlength="100" placeholder="yoursite.com">
            </div>
          </div>
          <div id="edit-error" class="form-error" style="display:none"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="Utils.closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save changes</button>
          </div>
        </form>
      </div>
    `;

    Utils.showModal(html);

    // Avatar upload
    let newAvatar = user.avatar;
    Media.setupAvatarUpload(
      document.getElementById('edit-avatar-input'),
      document.getElementById('edit-avatar-display'),
      base64 => { newAvatar = base64; }
    );

    // Bio char count
    const bioInput = document.getElementById('edit-bio');
    const bioCount = document.getElementById('bio-count');
    bioInput?.addEventListener('input', () => {
      bioCount.textContent = `${bioInput.value.length}/200`;
    });

    // Store avatar reference
    document.getElementById('edit-profile-form').dataset.avatar = '';
    document.getElementById('edit-profile-form').addEventListener('submit', e => {
      e.preventDefault();
      saveProfile(e, newAvatar);
    });
  }

  function openAvatarEdit() {
    if (profileUser.id !== currentUser.id) return;
    openEditModal();
  }

  function saveProfile(e, avatar) {
    e && e.preventDefault();
    const errEl = document.getElementById('edit-error');
    const updates = {
      displayName: document.getElementById('edit-displayName')?.value.trim(),
      username: document.getElementById('edit-username')?.value.trim().toLowerCase(),
      bio: document.getElementById('edit-bio')?.value.trim(),
      location: document.getElementById('edit-location')?.value.trim(),
      website: document.getElementById('edit-website')?.value.trim().replace(/^https?:\/\//, ''),
    };
    if (avatar !== undefined) updates.avatar = avatar;

    const result = Auth.updateProfile(currentUser.id, updates);
    if (!result.ok) {
      if (errEl) { errEl.textContent = result.error; errEl.style.display = 'block'; }
      return;
    }

    currentUser = result.user;
    profileUser = result.user;
    Utils.closeModal();
    renderProfile();
    renderPostsGrid();
    App.renderSidebar();
    Utils.showToast('Profile updated ✦', 'success');
  }

  // ── Open DM ───────────────────────────────────────────────

  function openDM(userId) {
    const conv = DB.conversations.getBetween(currentUser.id, userId);
    if (conv) {
      window.location.href = `messages.html?conv=${conv.id}`;
    } else {
      const newConv = DB.conversations.create([currentUser.id, userId]);
      window.location.href = `messages.html?conv=${newConv.id}`;
    }
  }

  return {
    init, renderProfile, renderPostsGrid, setTab, toggleFollow,
    openFollowersModal, openFollowingModal, quickFollow,
    openEditModal, openAvatarEdit, saveProfile, openDM
  };
})();
