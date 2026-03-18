// ============================================================
// PULSE — Auth (auth.js)
// Login, register, session, page guards
// ============================================================

const Auth = (() => {

  // ── Guard (call on every protected page) ─────────────────

  function guard() {
    if (!DB.session.isLoggedIn()) {
      window.location.href = 'index.html';
      return null;
    }
    return DB.session.getCurrentUser();
  }

  // ── Auth-page redirect (if already logged in) ────────────

  function redirectIfLoggedIn() {
    if (DB.session.isLoggedIn()) {
      window.location.href = 'feed.html';
    }
  }

  // ── Register ─────────────────────────────────────────────

  function register({ username, email, password, displayName, name, avatar }) {
    // accept either 'name' or 'displayName'
    const dname = displayName || name || username;
    // Validate
    if (!Utils.validateUsername(username)) {
      return { ok: false, error: 'Username must be 3-30 characters: letters, numbers, underscores only.' };
    }
    if (!Utils.validateEmail(email)) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    if (!Utils.validatePassword(password)) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }
    // Check uniqueness
    if (DB.users.getByUsername(username)) {
      return { ok: false, error: 'That username is already taken.' };
    }
    if (DB.users.getByEmail(email)) {
      return { ok: false, error: 'An account with that email already exists.' };
    }
    // Create user
    const user = DB.users.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: Utils.hashPassword(password),
      displayName: dname,
      avatar: avatar || null,
      avatarColor: Utils.randomColor()
    });
    // Start session
    DB.session.set(user.id);
    return { ok: true, user };
  }

  // ── Login ─────────────────────────────────────────────────

  function login(identifier, password) {
    // identifier can be username or email (accepts separate args OR { identifier, password } object)
    if (typeof identifier === 'object' && identifier !== null) {
      password = identifier.password;
      identifier = identifier.identifier;
    }
    if (!identifier || !password) {
      return { ok: false, error: 'Please fill in all fields.' };
    }
    let user = DB.users.getByEmail(identifier.toLowerCase());
    if (!user) user = DB.users.getByUsername(identifier.toLowerCase());
    if (!user) {
      return { ok: false, error: 'No account found with that username or email.' };
    }
    const hashed = Utils.hashPassword(password);
    // Support both hashed and original seed passwords
    if (user.password !== hashed && user.password !== password) {
      return { ok: false, error: 'Incorrect password.' };
    }
    DB.session.set(user.id);
    return { ok: true, user };
  }

  // ── Logout ───────────────────────────────────────────────

  function logout() {
    DB.session.clear();
    window.location.href = 'index.html';
  }

  // ── Update profile ────────────────────────────────────────

  function updateProfile(userId, updates) {
    const user = DB.users.getById(userId);
    if (!user) return { ok: false, error: 'User not found.' };

    // Validate username if changed
    if (updates.username && updates.username !== user.username) {
      if (!Utils.validateUsername(updates.username)) {
        return { ok: false, error: 'Invalid username format.' };
      }
      const existing = DB.users.getByUsername(updates.username);
      if (existing && existing.id !== userId) {
        return { ok: false, error: 'That username is already taken.' };
      }
    }

    const updated = DB.users.update(userId, updates);
    return { ok: true, user: updated };
  }

  // ── Change password ───────────────────────────────────────

  function changePassword(userId, currentPassword, newPassword) {
    const user = DB.users.getById(userId);
    if (!user) return { ok: false, error: 'User not found.' };
    const hashed = Utils.hashPassword(currentPassword);
    if (user.password !== hashed && user.password !== currentPassword) {
      return { ok: false, error: 'Current password is incorrect.' };
    }
    if (!Utils.validatePassword(newPassword)) {
      return { ok: false, error: 'New password must be at least 6 characters.' };
    }
    DB.users.update(userId, { password: Utils.hashPassword(newPassword) });
    return { ok: true };
  }

  return { guard, redirectIfLoggedIn, register, login, logout, updateProfile, changePassword };
})();
