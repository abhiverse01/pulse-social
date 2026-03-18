// ============================================================
// PULSE — Messages (messages.js)
// DM conversations, chat UI, polling for "real-time" feel
// ============================================================

const Messages = (() => {

  let currentUser = null;
  let activeConvId = null;
  let pollInterval = null;
  let lastMessageCount = 0;

  // ── Init ─────────────────────────────────────────────────

  function init(user) {
    currentUser = user;
    renderConversationList();

    const convId = Utils.getParam('conv');
    if (convId) openConversation(convId);
    else {
      // Show empty state on desktop
      const chatArea = document.getElementById('chat-area');
      if (chatArea) renderChatEmpty(chatArea);
    }

    setupNewMessageBtn();

    // Start polling for new messages
    pollInterval = setInterval(poll, 2000);
    window.addEventListener('beforeunload', () => clearInterval(pollInterval));
  }

  // ── Conversation list ─────────────────────────────────────

  function renderConversationList() {
    const container = document.getElementById('conv-list');
    if (!container) return;

    const convs = DB.conversations.getForUser(currentUser.id);

    if (!convs.length) {
      container.innerHTML = `
        <div class="conv-empty">
          <span class="conv-empty-icon">💬</span>
          <p>No messages yet</p>
          <button class="btn btn-primary btn-sm" onclick="Messages.openNewDM()">Start a conversation</button>
        </div>
      `;
      return;
    }

    container.innerHTML = convs.map(conv => {
      const otherId = conv.participants.find(id => id !== currentUser.id);
      const other = DB.users.getById(otherId);
      if (!other) return '';

      const lastMsg = DB.conversations.getLastMessage(conv.id);
      const unread = conv.messages.filter(m => m.senderId !== currentUser.id && !m.readBy.includes(currentUser.id)).length;
      const isActive = conv.id === activeConvId;

      return `
        <div class="conv-item ${isActive ? 'active' : ''}"
             id="conv-item-${conv.id}"
             onclick="Messages.openConversation('${conv.id}')">
          ${Utils.avatarHTML(other, 44)}
          <div class="conv-item-info">
            <div class="conv-item-top">
              <span class="conv-item-name">${Utils.sanitizeHTML(other.displayName)}</span>
              ${lastMsg ? `<span class="conv-item-time">${Utils.timeAgo(lastMsg.createdAt)}</span>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:0.4rem;">
              <span class="conv-item-preview">
                ${lastMsg
                  ? (lastMsg.senderId === currentUser.id ? 'You: ' : '') + Utils.truncate(lastMsg.content, 40)
                  : 'Start the conversation'
                }
              </span>
              ${unread ? `<span class="conv-item-unread"></span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ── Open conversation ─────────────────────────────────────

  function openConversation(convId) {
    activeConvId = convId;
    Utils.setParam('conv', convId);

    // Mark all items inactive, set this active
    Utils.$$('.conv-item').forEach(el => el.classList.remove('active'));
    const item = document.getElementById(`conv-item-${convId}`);
    if (item) item.classList.add('active');

    // Mark messages as read
    DB.conversations.markRead(convId, currentUser.id);
    App.updateBadges();
    renderConversationList();

    // Render chat
    const chatArea = document.getElementById('chat-area');
    if (chatArea) renderChat(convId, chatArea);
  }

  // ── Render chat ───────────────────────────────────────────

  function renderChat(convId, container) {
    const conv = DB.conversations.getById(convId);
    if (!conv) { renderChatEmpty(container); return; }

    const otherId = conv.participants.find(id => id !== currentUser.id);
    const other = DB.users.getById(otherId);
    if (!other) return;

    container.innerHTML = `
      <div class="chat-window" id="chat-window-${convId}">
        <div class="chat-header">
          <button class="chat-back" onclick="Messages.closeChat()" title="Back">‹</button>
          <a href="profile.html?u=${other.username}" class="chat-header-user">
            ${Utils.avatarHTML(other, 36)}
            <div class="chat-header-info">
              <span class="chat-header-name">${Utils.sanitizeHTML(other.displayName)}</span>
              <span class="chat-header-handle">@${other.username}</span>
            </div>
          </a>
          <a href="profile.html?u=${other.username}" class="btn btn-icon chat-profile-btn" title="View profile">
            ${Icons.iconUser()}
          </a>
        </div>
        <div class="chat-messages" id="chat-messages">
          ${renderMessageBubbles(conv)}
        </div>
        <div class="chat-input-area">
          <div class="chat-input-row">
            <label class="chat-media-btn" title="Send image">
              ${Icons.iconImage()}
              <input type="file" id="chat-file-input" accept="image/*" style="display:none">
            </label>
            <textarea 
              id="chat-input" 
              placeholder="Message ${other.displayName}…"
              rows="1"
              maxlength="1000"
            ></textarea>
            <button class="btn-send-msg" id="chat-send-btn" onclick="Messages.sendMessage()" title="Send">
              ${Icons.iconSend()}
            </button>
          </div>
        </div>
      </div>
    `;

    setupChatInput(convId);
    scrollToBottom();
    lastMessageCount = conv.messages.length;
  }

  function renderChatEmpty(container) {
    container.innerHTML = `
      <div class="chat-empty">
        <div class="chat-empty-icon">◈</div>
        <h3>Your Messages</h3>
        <p>Send private messages to people you follow.</p>
        <button class="btn btn-primary" onclick="Messages.openNewDM()">New message</button>
      </div>
    `;
  }

  // ── Message bubbles ───────────────────────────────────────

  function renderMessageBubbles(conv) {
    if (!conv.messages.length) {
      return `<div class="chat-no-messages">
        <p>No messages yet. Say hello! 👋</p>
      </div>`;
    }

    let html = '';
    let prevDate = '';
    let prevSender = '';

    conv.messages.forEach((msg, i) => {
      const isOwn = msg.senderId === currentUser.id;
      const sender = DB.users.getById(msg.senderId);
      const msgDate = new Date(msg.createdAt).toDateString();

      // Date divider
      if (msgDate !== prevDate) {
        html += `<div class="date-divider"><span>${formatMessageDate(msg.createdAt)}</span></div>`;
        prevDate = msgDate;
        prevSender = '';
      }

      const showAvatar = !isOwn && msg.senderId !== prevSender;
      prevSender = msg.senderId;

      const otherId = conv.participants.find(id => id !== msg.senderId);
      const isRead = msg.readBy.includes(otherId);

      html += `
        <div class="message-group ${isOwn ? 'mine' : 'theirs'}">
          <div class="message-group-row">
            ${showAvatar && !isOwn ? `<div>${Utils.avatarHTML(sender, 28)}</div>` : (!isOwn ? `<div style="width:28px;flex-shrink:0;"></div>` : '')}
            <div>
              <div class="message-bubble ${isOwn ? 'mine' : 'theirs'}">
                ${msg.type === 'image'
                  ? `<img src="${msg.content}" alt="Image" style="max-width:200px;border-radius:var(--r-md);display:block;">`
                  : Utils.linkifyContent(msg.content)
                }
              </div>
              ${isOwn ? `
                <div class="message-read ${isRead ? 'seen' : ''}">
                  ${isRead ? '✓✓ Seen' : '✓ Sent'}
                </div>
              ` : ''}
            </div>
          </div>
          ${i === conv.messages.length - 1 || new Date(conv.messages[i+1]?.createdAt).getTime() - new Date(msg.createdAt).getTime() > 300000
            ? `<div class="message-time">${Utils.formatTime(msg.createdAt)}</div>`
            : ''}
        </div>
      `;
    });

    return html;
  }

  function formatMessageDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return date.toLocaleDateString(undefined, { weekday: 'long' });
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // ── Chat input setup ──────────────────────────────────────

  function setupChatInput(convId) {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const fileInput = document.getElementById('chat-file-input');

    if (!input) return;

    // Auto-resize
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // Send on Enter (not Shift+Enter)
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Image upload
    if (fileInput) {
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        try {
          const base64 = await Media.compressImage(file, 800, 0.8);
          DB.conversations.sendMessage(convId, currentUser.id, base64, 'image');
          refreshMessages(convId);
          fileInput.value = '';
        } catch (e) {
          Utils.showToast(e.message, 'error');
        }
      });
    }
  }

  // ── Send message ──────────────────────────────────────────

  function sendMessage() {
    if (!activeConvId) return;
    const input = document.getElementById('chat-input');
    if (!input) return;

    const content = input.value.trim();
    if (!content) return;

    DB.conversations.sendMessage(activeConvId, currentUser.id, content, 'text');

    input.value = '';
    input.style.height = 'auto';

    refreshMessages(activeConvId);
    renderConversationList();
  }

  // ── Refresh messages (append new) ────────────────────────

  function refreshMessages(convId) {
    const conv = DB.conversations.getById(convId);
    if (!conv) return;

    const container = document.getElementById('chat-messages');
    if (!container) return;

    DB.conversations.markRead(convId, currentUser.id);
    container.innerHTML = renderMessageBubbles(conv);
    scrollToBottom();
    lastMessageCount = conv.messages.length;
    App.updateBadges();
  }

  function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // ── Polling for "real-time" ───────────────────────────────

  function poll() {
    if (!activeConvId) return;
    const conv = DB.conversations.getById(activeConvId);
    if (!conv) return;

    if (conv.messages.length !== lastMessageCount) {
      refreshMessages(activeConvId);
      renderConversationList();
    }

    App.updateBadges();
  }

  // ── New DM ────────────────────────────────────────────────

  function openNewDM() {
    const allUsers = DB.users.getAll()
      .filter(u => u.id !== currentUser.id)
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    Utils.showModal(`
      <div class="new-dm-modal">
        <div class="modal-header">
          <h3>New Message</h3>
          <button class="modal-close" onclick="Utils.closeModal()">✕</button>
        </div>
        <div class="new-dm-search">
          <input type="text" id="dm-search-input" placeholder="Search people…" autofocus>
        </div>
        <div class="users-list" id="dm-users-list">
          ${allUsers.map(u => `
            <div class="user-row clickable" onclick="Messages.startDM('${u.id}')">
              ${Utils.avatarHTML(u, 40)}
              <div class="user-row-text">
                <span class="user-row-name">${Utils.sanitizeHTML(u.displayName)}</span>
                <span class="user-row-handle">@${u.username}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `);

    const searchInput = document.getElementById('dm-search-input');
    const listEl = document.getElementById('dm-users-list');

    searchInput?.addEventListener('input', Utils.debounce(e => {
      const q = e.target.value.toLowerCase();
      const filtered = allUsers.filter(u =>
        u.displayName.toLowerCase().includes(q) || u.username.includes(q)
      );
      listEl.innerHTML = filtered.map(u => `
        <div class="user-row clickable" onclick="Messages.startDM('${u.id}')">
          ${Utils.avatarHTML(u, 40)}
          <div class="user-row-text">
            <span class="user-row-name">${Utils.sanitizeHTML(u.displayName)}</span>
            <span class="user-row-handle">@${u.username}</span>
          </div>
        </div>
      `).join('') || '<div class="users-list-empty">No users found</div>';
    }, 200));
  }

  function startDM(userId) {
    Utils.closeModal();
    const conv = DB.conversations.getBetween(currentUser.id, userId)
      || DB.conversations.create([currentUser.id, userId]);
    renderConversationList();
    openConversation(conv.id);
  }

  function closeChat() {
    activeConvId = null;
    const chatArea = document.getElementById('chat-area');
    if (chatArea) renderChatEmpty(chatArea);
    Utils.$$('.conv-item').forEach(el => el.classList.remove('active'));
  }

  function setupNewMessageBtn() {
    const btn = document.getElementById('new-dm-btn');
    if (btn) btn.addEventListener('click', openNewDM);
  }

  return { init, renderConversationList, openConversation, sendMessage, openNewDM, startDM, closeChat };
})();
