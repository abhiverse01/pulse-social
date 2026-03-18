// ============================================================
// PULSE — Settings (settings.js)
// ============================================================

const Settings = (() => {

  let currentUser = null;

  function init(user) {
    currentUser = user;
    renderSettings();
  }

  function renderSettings() {
    renderAccountSettings();
    renderAppearanceSettings();
    renderAccountDanger();
    populateFields();
  }

  function populateFields() {
    const fields = {
      'settings-displayName': currentUser.displayName,
      'settings-username': currentUser.username,
      'settings-email': currentUser.email,
      'settings-bio': currentUser.bio,
      'settings-location': currentUser.location || '',
      'settings-website': currentUser.website || '',
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.checked = currentUser.theme === 'light';
    }

    // Avatar display
    const avatarDisplay = document.getElementById('settings-avatar-display');
    if (avatarDisplay) {
      avatarDisplay.innerHTML = currentUser.avatar
        ? `<img src="${currentUser.avatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
        : `<div style="width:100%;height:100%;border-radius:50%;background:${currentUser.avatarColor};display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;">${Utils.getInitials(currentUser.displayName)}</div>`;
    }
  }

  function renderAccountSettings() {
    // These are already in HTML, just wire up form
    const form = document.getElementById('profile-settings-form');
    if (!form) return;

    let newAvatar = currentUser.avatar;
    const avatarInput = document.getElementById('settings-avatar-input');
    const avatarDisplay = document.getElementById('settings-avatar-display');

    if (avatarInput && avatarDisplay) {
      Media.setupAvatarUpload(avatarInput, avatarDisplay, base64 => { newAvatar = base64; });
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const errEl = document.getElementById('profile-settings-error');
      const updates = {
        displayName: document.getElementById('settings-displayName')?.value.trim(),
        username: document.getElementById('settings-username')?.value.trim().toLowerCase(),
        email: document.getElementById('settings-email')?.value.trim().toLowerCase(),
        bio: document.getElementById('settings-bio')?.value.trim(),
        location: document.getElementById('settings-location')?.value.trim(),
        website: document.getElementById('settings-website')?.value.trim().replace(/^https?:\/\//, ''),
        avatar: newAvatar
      };

      const result = Auth.updateProfile(currentUser.id, updates);
      if (!result.ok) {
        if (errEl) { errEl.textContent = result.error; errEl.style.display = 'block'; }
        return;
      }

      currentUser = result.user;
      if (errEl) errEl.style.display = 'none';
      App.renderSidebar();
      Utils.showToast('Profile settings saved ✦', 'success');
    });
  }

  function renderAppearanceSettings() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('change', () => {
        App.toggleTheme();
        currentUser = DB.users.getById(currentUser.id);
      });
    }
  }

  function renderAccountDanger() {
    // Password change
    const pwForm = document.getElementById('password-form');
    if (pwForm) {
      pwForm.addEventListener('submit', e => {
        e.preventDefault();
        const current = document.getElementById('current-password')?.value;
        const newPw = document.getElementById('new-password')?.value;
        const confirm = document.getElementById('confirm-password')?.value;
        const errEl = document.getElementById('password-error');

        if (newPw !== confirm) {
          if (errEl) { errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; }
          return;
        }

        const result = Auth.changePassword(currentUser.id, current, newPw);
        if (!result.ok) {
          if (errEl) { errEl.textContent = result.error; errEl.style.display = 'block'; }
          return;
        }

        if (errEl) errEl.style.display = 'none';
        pwForm.reset();
        Utils.showToast('Password updated ✦', 'success');
      });
    }

    // Delete account
    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        Utils.showModal(`
          <div class="confirm-modal">
            <h3>Delete Account</h3>
            <p>Are you absolutely sure? This will permanently delete your account and all your posts. This cannot be undone.</p>
            <div class="confirm-input-row">
              <label>Type your username to confirm:</label>
              <input type="text" id="confirm-delete-input" placeholder="${currentUser.username}">
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" onclick="Utils.closeModal()">Cancel</button>
              <button class="btn btn-danger" onclick="Settings.confirmDelete()">Delete forever</button>
            </div>
          </div>
        `);
      });
    }
  }

  function confirmDelete() {
    const input = document.getElementById('confirm-delete-input');
    if (!input || input.value !== currentUser.username) {
      Utils.showToast('Username does not match.', 'error');
      return;
    }
    // Delete posts
    DB.posts.getByUser(currentUser.id).forEach(p => DB.posts.delete(p.id, currentUser.id));
    // Delete user
    DB.users.delete(currentUser.id);
    DB.session.clear();
    Utils.closeModal();
    window.location.href = 'index.html';
  }

  return { init, confirmDelete };
})();
