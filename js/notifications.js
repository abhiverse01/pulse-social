// ============================================================
// PULSE — Notifications (notifications.js)
// ============================================================

const Notifications = (() => {

  let currentUser = null;

  function init(user) {
    currentUser = user;
    renderNotifications();
    setupMarkAll();
  }

  function renderNotifications() {
    const container = document.getElementById('notif-list');
    if (!container) return;

    const notifs = DB.notifications.getForUser(currentUser.id);

    if (!notifs.length) {
      container.innerHTML = `
        <div class="notif-empty">
          <div class="notif-empty-icon">🔔</div>
          <h3>All caught up!</h3>
          <p>You have no notifications.</p>
        </div>
      `;
      return;
    }

    // Group by date
    const groups = {};
    notifs.forEach(n => {
      const d = new Date(n.createdAt).toDateString();
      if (!groups[d]) groups[d] = [];
      groups[d].push(n);
    });

    container.innerHTML = Object.entries(groups).map(([date, items]) => `
      <div class="notif-date-group">
        <div class="notif-date-label">${formatGroupDate(date)}</div>
        ${items.map(n => renderNotifItem(n)).join('')}
      </div>
    `).join('');

    // Mark all as read after viewing
    setTimeout(() => {
      DB.notifications.markAllRead(currentUser.id);
      App.updateBadges();
      Utils.$$('.notif-item.unread').forEach(el => el.classList.remove('unread'));
      Utils.$$('.notif-item-unread-dot').forEach(el => el.remove());
    }, 2000);
  }

  function renderNotifItem(notif) {
    const fromUser = DB.users.getById(notif.fromUserId);
    if (!fromUser) return '';

    const { icon, text, href } = getNotifContent(notif, fromUser);

    return `
      <div class="notif-item ${notif.read ? '' : 'unread'}" 
           id="notif-${notif.id}"
           onclick="Notifications.handleClick('${notif.id}', '${href}')">
        ${!notif.read ? '<div class="notif-item-unread-dot"></div>' : ''}
        <div class="notif-icon-wrap">
          <div class="notif-icon ${notif.type}">${icon}</div>
          <div class="notif-icon-avatar">${Utils.avatarHTML(fromUser, 20)}</div>
        </div>
        <div class="notif-item-text">
          <p>${text}</p>
          <div class="notif-item-time">${Utils.timeAgo(notif.createdAt)}</div>
        </div>
      </div>
    `;
  }

  function getNotifContent(notif, fromUser) {
    const name = `<strong>${Utils.sanitizeHTML(fromUser.displayName)}</strong>`;
    switch (notif.type) {
      case 'like': {
        const post = notif.postId ? DB.posts.getById(notif.postId) : null;
        return {
          icon: '♥',
          text: `${name} liked your post${post ? ': ' + Utils.sanitizeHTML(Utils.truncate(post.content, 40)) : ''}`,
          href: notif.postId ? `feed.html?post=${notif.postId}` : 'profile.html?u=' + fromUser.username
        };
      }
      case 'comment': {
        const post = notif.postId ? DB.posts.getById(notif.postId) : null;
        const comment = post?.comments.find(c => c.id === notif.commentId);
        return {
          icon: '💬',
          text: `${name} commented on your post${comment ? ': ' + Utils.sanitizeHTML(Utils.truncate(comment.content, 50)) : ''}`,
          href: notif.postId ? `feed.html?post=${notif.postId}` : '#'
        };
      }
      case 'follow':
        return {
          icon: '◈',
          text: `${name} followed you`,
          href: `profile.html?u=${fromUser.username}`
        };
      case 'mention':
        return {
          icon: '@',
          text: `${name} mentioned you in a post`,
          href: notif.postId ? `feed.html?post=${notif.postId}` : '#'
        };
      default:
        return { icon: '•', text: `${name} interacted with you`, href: '#' };
    }
  }

  function formatGroupDate(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }

  function handleClick(notifId, href) {
    DB.notifications.markRead(notifId);
    const el = document.getElementById(`notif-${notifId}`);
    if (el) el.classList.remove('unread');
    if (href && href !== '#') window.location.href = href;
  }

  function setupMarkAll() {
    // button in notifications.html calls Notifications.markAllRead() directly
  }

  function markAllRead() {
    DB.notifications.markAllRead(currentUser.id);
    App.updateBadges();
    Utils.$$('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    Utils.$$('.notif-item-unread-dot').forEach(el => el.remove());
    Utils.showToast('All marked as read', 'success', 2000);
  }

  return { init, renderNotifications, handleClick, markAllRead };
})();
