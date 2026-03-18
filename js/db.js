// ============================================================
// PULSE — Database Engine (db.js)
// localStorage-backed JSON store mimicking a real database
// All data persists across sessions
// ============================================================

const DB = (() => {
  const KEYS = {
    USERS: 'pulse_users',
    POSTS: 'pulse_posts',
    CONVERSATIONS: 'pulse_conversations',
    NOTIFICATIONS: 'pulse_notifications',
    SESSION: 'pulse_session',
    INITIALIZED: 'pulse_initialized'
  };

  // ── Core read/write ──────────────────────────────────────

  function _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error(`DB read error [${key}]:`, e);
      return null;
    }
  }

  function _write(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`DB write error [${key}]:`, e);
      return false;
    }
  }

  // ── Initialization ──────────────────────────────────────

  function init() {
    if (_read(KEYS.INITIALIZED)) return;
    if (typeof SEED_DATA === 'undefined') {
      console.warn('DB: No seed data found, initializing empty.');
      _write(KEYS.USERS, []);
      _write(KEYS.POSTS, []);
      _write(KEYS.CONVERSATIONS, []);
      _write(KEYS.NOTIFICATIONS, []);
    } else {
      _write(KEYS.USERS, SEED_DATA.users);
      _write(KEYS.POSTS, SEED_DATA.posts);
      _write(KEYS.CONVERSATIONS, SEED_DATA.conversations);
      _write(KEYS.NOTIFICATIONS, SEED_DATA.notifications);
    }
    _write(KEYS.INITIALIZED, true);
    console.log('DB: Initialized from seed data.');
  }

  function reset() {
    localStorage.removeItem(KEYS.INITIALIZED);
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    init();
  }

  // ── Users ───────────────────────────────────────────────

  const users = {
    getAll() {
      return _read(KEYS.USERS) || [];
    },
    getById(id) {
      return users.getAll().find(u => u.id === id) || null;
    },
    getByUsername(username) {
      return users.getAll().find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    },
    getByEmail(email) {
      return users.getAll().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    create(data) {
      const all = users.getAll();
      const newUser = {
        id: Utils.generateId('uid'),
        username: data.username,
        email: data.email,
        password: data.password,
        displayName: data.displayName || data.username,
        bio: data.bio || '',
        website: '',
        location: '',
        avatar: data.avatar || null,
        avatarColor: data.avatarColor || Utils.randomColor(),
        followers: [],
        following: [],
        bookmarks: [],
        theme: 'dark',
        verified: false,
        createdAt: new Date().toISOString()
      };
      all.push(newUser);
      _write(KEYS.USERS, all);
      return newUser;
    },
    update(id, updates) {
      const all = users.getAll();
      const idx = all.findIndex(u => u.id === id);
      if (idx === -1) return null;
      all[idx] = { ...all[idx], ...updates };
      _write(KEYS.USERS, all);
      return all[idx];
    },
    delete(id) {
      const all = users.getAll().filter(u => u.id !== id);
      _write(KEYS.USERS, all);
    },
    follow(followerId, targetId) {
      const all = users.getAll();
      const follower = all.find(u => u.id === followerId);
      const target = all.find(u => u.id === targetId);
      if (!follower || !target) return false;
      if (!follower.following.includes(targetId)) follower.following.push(targetId);
      if (!target.followers.includes(followerId)) target.followers.push(followerId);
      _write(KEYS.USERS, all);
      // Create notification
      notifications.create({
        userId: targetId,
        fromUserId: followerId,
        type: 'follow',
        postId: null
      });
      return true;
    },
    unfollow(followerId, targetId) {
      const all = users.getAll();
      const follower = all.find(u => u.id === followerId);
      const target = all.find(u => u.id === targetId);
      if (!follower || !target) return false;
      follower.following = follower.following.filter(id => id !== targetId);
      target.followers = target.followers.filter(id => id !== followerId);
      _write(KEYS.USERS, all);
      return true;
    },
    isFollowing(followerId, targetId) {
      const user = users.getById(followerId);
      return user ? user.following.includes(targetId) : false;
    },
    search(query) {
      const q = query.toLowerCase();
      return users.getAll().filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.bio.toLowerCase().includes(q)
      );
    },
    addBookmark(userId, postId) {
      const all = users.getAll();
      const user = all.find(u => u.id === userId);
      if (!user) return;
      if (!user.bookmarks.includes(postId)) user.bookmarks.push(postId);
      _write(KEYS.USERS, all);
    },
    removeBookmark(userId, postId) {
      const all = users.getAll();
      const user = all.find(u => u.id === userId);
      if (!user) return;
      user.bookmarks = user.bookmarks.filter(id => id !== postId);
      _write(KEYS.USERS, all);
    },
    getSuggested(currentUserId) {
      const current = users.getById(currentUserId);
      if (!current) return [];
      return users.getAll().filter(u =>
        u.id !== currentUserId &&
        !current.following.includes(u.id)
      ).slice(0, 5);
    }
  };

  // ── Posts ────────────────────────────────────────────────

  const posts = {
    getAll() {
      return _read(KEYS.POSTS) || [];
    },
    getById(id) {
      return posts.getAll().find(p => p.id === id) || null;
    },
    getByUser(userId) {
      return posts.getAll()
        .filter(p => p.authorId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    getFeed(userId) {
      const user = users.getById(userId);
      if (!user) return [];
      const ids = [...user.following, userId];
      return posts.getAll()
        .filter(p => ids.includes(p.authorId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    getByHashtag(tag) {
      const t = tag.toLowerCase().replace('#', '');
      return posts.getAll()
        .filter(p => p.hashtags.map(h => h.toLowerCase()).includes(t))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    getTrending() {
      // Count hashtag frequency
      const counts = {};
      posts.getAll().forEach(p => {
        p.hashtags.forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));
    },
    create(authorId, data) {
      const all = posts.getAll();
      const hashtags = (data.content.match(/#[\w]+/g) || []).map(t => t.slice(1));
      const newPost = {
        id: Utils.generateId('pid'),
        authorId,
        content: data.content,
        images: data.images || [],
        likes: [],
        comments: [],
        hashtags,
        shares: 0,
        createdAt: new Date().toISOString()
      };
      all.unshift(newPost);
      _write(KEYS.POSTS, all);
      return newPost;
    },
    delete(postId, userId) {
      const all = posts.getAll();
      const post = all.find(p => p.id === postId);
      if (!post || post.authorId !== userId) return false;
      _write(KEYS.POSTS, all.filter(p => p.id !== postId));
      return true;
    },
    like(postId, userId) {
      const all = posts.getAll();
      const post = all.find(p => p.id === postId);
      if (!post) return null;
      if (!post.likes.includes(userId)) {
        post.likes.push(userId);
        // Create notification (not for own posts)
        if (post.authorId !== userId) {
          notifications.create({
            userId: post.authorId,
            fromUserId: userId,
            type: 'like',
            postId
          });
        }
      }
      _write(KEYS.POSTS, all);
      return post;
    },
    unlike(postId, userId) {
      const all = posts.getAll();
      const post = all.find(p => p.id === postId);
      if (!post) return null;
      post.likes = post.likes.filter(id => id !== userId);
      _write(KEYS.POSTS, all);
      return post;
    },
    comment(postId, userId, content) {
      const all = posts.getAll();
      const post = all.find(p => p.id === postId);
      if (!post) return null;
      const comment = {
        id: Utils.generateId('cid'),
        authorId: userId,
        content,
        likes: [],
        createdAt: new Date().toISOString()
      };
      post.comments.push(comment);
      if (post.authorId !== userId) {
        notifications.create({
          userId: post.authorId,
          fromUserId: userId,
          type: 'comment',
          postId,
          commentId: comment.id
        });
      }
      _write(KEYS.POSTS, all);
      return { post, comment };
    },
    deleteComment(postId, commentId, userId) {
      const all = posts.getAll();
      const post = all.find(p => p.id === postId);
      if (!post) return false;
      const comment = post.comments.find(c => c.id === commentId);
      if (!comment || (comment.authorId !== userId && post.authorId !== userId)) return false;
      post.comments = post.comments.filter(c => c.id !== commentId);
      _write(KEYS.POSTS, all);
      return true;
    },
    likeComment(postId, commentId, userId) {
      const all = posts.getAll();
      const post = all.find(p => p.id === postId);
      if (!post) return null;
      const comment = post.comments.find(c => c.id === commentId);
      if (!comment) return null;
      if (!comment.likes.includes(userId)) comment.likes.push(userId);
      else comment.likes = comment.likes.filter(id => id !== userId);
      _write(KEYS.POSTS, all);
      return comment;
    },
    share(postId) {
      const all = posts.getAll();
      const post = all.find(p => p.id === postId);
      if (!post) return null;
      post.shares = (post.shares || 0) + 1;
      _write(KEYS.POSTS, all);
      return post;
    },
    search(query) {
      const q = query.toLowerCase();
      return posts.getAll().filter(p =>
        p.content.toLowerCase().includes(q) ||
        p.hashtags.some(h => h.toLowerCase().includes(q))
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    getExplore() {
      return [...posts.getAll()]
        .sort((a, b) => (b.likes.length + b.shares) - (a.likes.length + a.shares))
        .slice(0, 30);
    }
  };

  // ── Conversations / Messages ──────────────────────────────

  const conversations = {
    getAll() {
      return _read(KEYS.CONVERSATIONS) || [];
    },
    getById(id) {
      return conversations.getAll().find(c => c.id === id) || null;
    },
    getForUser(userId) {
      return conversations.getAll()
        .filter(c => c.participants.includes(userId))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },
    getBetween(userId1, userId2) {
      return conversations.getAll().find(c =>
        c.participants.includes(userId1) && c.participants.includes(userId2)
      ) || null;
    },
    create(participants) {
      const all = conversations.getAll();
      const existing = all.find(c =>
        participants.every(p => c.participants.includes(p)) &&
        c.participants.length === participants.length
      );
      if (existing) return existing;
      const newConv = {
        id: Utils.generateId('conv'),
        participants,
        messages: [],
        updatedAt: new Date().toISOString()
      };
      all.push(newConv);
      _write(KEYS.CONVERSATIONS, all);
      return newConv;
    },
    sendMessage(convId, senderId, content, type = 'text') {
      const all = conversations.getAll();
      const conv = all.find(c => c.id === convId);
      if (!conv) return null;
      if (!conv.participants.includes(senderId)) return null;
      const msg = {
        id: Utils.generateId('msg'),
        senderId,
        content,
        type,
        readBy: [senderId],
        createdAt: new Date().toISOString()
      };
      conv.messages.push(msg);
      conv.updatedAt = new Date().toISOString();
      _write(KEYS.CONVERSATIONS, all);
      return msg;
    },
    markRead(convId, userId) {
      const all = conversations.getAll();
      const conv = all.find(c => c.id === convId);
      if (!conv) return;
      conv.messages.forEach(m => {
        if (!m.readBy.includes(userId)) m.readBy.push(userId);
      });
      _write(KEYS.CONVERSATIONS, all);
    },
    getUnreadCount(userId) {
      return conversations.getForUser(userId).reduce((total, conv) => {
        const unread = conv.messages.filter(m =>
          m.senderId !== userId && !m.readBy.includes(userId)
        ).length;
        return total + unread;
      }, 0);
    },
    getLastMessage(convId) {
      const conv = conversations.getById(convId);
      if (!conv || !conv.messages.length) return null;
      return conv.messages[conv.messages.length - 1];
    }
  };

  // ── Notifications ─────────────────────────────────────────

  const notifications = {
    getAll() {
      return _read(KEYS.NOTIFICATIONS) || [];
    },
    getForUser(userId) {
      return notifications.getAll()
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    create(data) {
      const all = notifications.getAll();
      // Avoid duplicate notifications (same type, from, to, post within 1 hour)
      const recent = all.find(n =>
        n.userId === data.userId &&
        n.fromUserId === data.fromUserId &&
        n.type === data.type &&
        n.postId === data.postId &&
        (new Date() - new Date(n.createdAt)) < 3600000
      );
      if (recent) return recent;
      const notif = {
        id: Utils.generateId('notif'),
        userId: data.userId,
        fromUserId: data.fromUserId,
        type: data.type,
        postId: data.postId || null,
        commentId: data.commentId || null,
        read: false,
        createdAt: new Date().toISOString()
      };
      all.unshift(notif);
      _write(KEYS.NOTIFICATIONS, all);
      return notif;
    },
    markRead(notifId) {
      const all = notifications.getAll();
      const n = all.find(n => n.id === notifId);
      if (n) n.read = true;
      _write(KEYS.NOTIFICATIONS, all);
    },
    markAllRead(userId) {
      const all = notifications.getAll();
      all.filter(n => n.userId === userId).forEach(n => n.read = true);
      _write(KEYS.NOTIFICATIONS, all);
    },
    getUnreadCount(userId) {
      return notifications.getForUser(userId).filter(n => !n.read).length;
    }
  };

  // ── Session ───────────────────────────────────────────────

  const session = {
    get() {
      return _read(KEYS.SESSION);
    },
    set(userId) {
      _write(KEYS.SESSION, { userId, loginAt: new Date().toISOString() });
    },
    clear() {
      localStorage.removeItem(KEYS.SESSION);
    },
    getCurrentUser() {
      const s = session.get();
      if (!s) return null;
      return users.getById(s.userId);
    },
    isLoggedIn() {
      return !!session.get();
    }
  };

  return { init, reset, users, posts, conversations, notifications, session, KEYS };
})();
