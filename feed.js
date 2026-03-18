// ============================================================
// PULSE — Feed (feed.js)
// Post rendering, feed, stories, interactions
// ============================================================

const Feed = (() => {

  let currentUser = null;
  let feedPosts = [];
  let page = 0;
  const PAGE_SIZE = 10;
  let loading = false;

  // ── Init ─────────────────────────────────────────────────

  function init(user) {
    currentUser = user;
    renderStories();
    loadFeed();
    setupComposer();
    setupInfiniteScroll();

    // Check for post deep link
    const postId = Utils.getParam('post');
    if (postId) {
      setTimeout(() => openPostModal(postId), 500);
    }
  }

  // ── Stories ──────────────────────────────────────────────

  function renderStories() {
    const container = document.getElementById('stories-track');
    if (!container || !currentUser) return;

    const following = currentUser.following;
    const storyUsers = [currentUser, ...following.map(id => DB.users.getById(id)).filter(Boolean)];

    container.innerHTML = storyUsers.map((user) => {
      const isOwn = user.id === currentUser.id;
      return `
        <div class="story-item" onclick="${isOwn ? 'Feed.createStory()' : `Feed.viewStory('${user.id}')`}">
          <div class="story-ring ${isOwn ? '' : ''}">
            <div class="story-ring-inner">
              <div class="story-avatar">${Utils.avatarHTML(user, 52)}</div>
            </div>
          </div>
          <span class="story-label">${isOwn ? 'Your story' : user.displayName.split(' ')[0]}</span>
        </div>
      `;
    }).join('');
  }

  function createStory() {
    Utils.showToast('Story feature coming soon ✦', 'default', 2000);
  }

  function viewStory(userId) {
    const user = DB.users.getById(userId);
    if (!user) return;
    Utils.showModal(`
      <div class="story-viewer">
        <button class="modal-close story-close" onclick="Utils.closeModal()">✕</button>
        <div class="story-header">
          ${Utils.avatarHTML(user, 36)}
          <span class="story-author-name">${Utils.sanitizeHTML(user.displayName)}</span>
          <span class="story-time">now</span>
        </div>
        <div class="story-content">
          <div class="story-placeholder">
            <span class="story-emoji">✦</span>
            <p>${Utils.sanitizeHTML(user.displayName)} hasn't posted a story yet</p>
          </div>
        </div>
      </div>
    `);
  }

  // ── Feed loading ──────────────────────────────────────────

  function loadFeed(append = false) {
    if (loading) return;
    loading = true;

    if (!append) {
      page = 0;
      feedPosts = DB.posts.getFeed(currentUser.id);
    }

    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const batch = feedPosts.slice(start, end);

    const container = document.getElementById('feed-posts');
    if (!container) { loading = false; return; }

    if (!append) {
      container.innerHTML = '';
      if (!feedPosts.length) {
        container.innerHTML = `
          <div class="feed-empty">
            <div class="feed-empty-icon">✦</div>
            <h3>Your feed is quiet</h3>
            <p>Follow some people to see their posts here.</p>
            <a href="explore.html" class="btn btn-primary">Explore</a>
          </div>
        `;
        loading = false;
        return;
      }
    }

    batch.forEach(post => {
      const card = renderPostCard(post);
      container.appendChild(card);
    });

    // Hide load more if no more posts
    const loader = document.getElementById('feed-loader');
    if (loader) loader.style.display = end >= feedPosts.length ? 'none' : 'flex';

    page++;
    loading = false;
  }

  function refresh() {
    loadFeed(false);
    renderStories();
  }

  // ── Post Card ─────────────────────────────────────────────

  function renderPostCard(post) {
    const author = DB.users.getById(post.authorId);
    if (!author) return document.createElement('div');

    const isLiked = post.likes.includes(currentUser.id);
    const isBookmarked = currentUser.bookmarks?.includes(post.id);
    const isOwn = post.authorId === currentUser.id;

    const card = document.createElement('article');
    card.className = 'post-card';
    card.id = `post-${post.id}`;
    card.dataset.postId = post.id;

    card.innerHTML = `
      <div class="post-card-header">
        <a href="profile.html?u=${author.username}" class="post-card-name" style="display:flex;align-items:center;gap:0.75rem;flex:1;min-width:0;text-decoration:none;">
          ${Utils.avatarHTML(author, 42)}
          <div class="post-card-author">
            <div class="post-card-author-row">
              <span class="post-card-name">${Utils.sanitizeHTML(author.displayName)}</span>
              ${author.verified ? `<span class="verified-badge" style="color:var(--accent);font-size:0.8rem;margin-left:2px;">✓</span>` : ''}
              <span class="post-card-handle">@${author.username}</span>
              <span class="post-card-time">${Utils.timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </a>
        <div class="post-card-menu">
          <button class="post-card-menu-btn" onclick="Feed.togglePostMenu('${post.id}', this)" aria-label="More">
            ${Icons.iconMore()}
          </button>
          <div class="dropdown" id="menu-${post.id}">
            ${isOwn ? `
              <button class="dropdown-item danger" onclick="Feed.deletePost('${post.id}')">Delete post</button>
            ` : ''}
            <button class="dropdown-item" onclick="Feed.copyPostLink('${post.id}')">Copy link</button>
          </div>
        </div>
      </div>

      <div class="post-card-body">
        <div class="post-card-text" id="content-${post.id}">${Utils.linkifyContent(post.content)}</div>
        ${post.images && post.images.length ? `
          <div class="post-images post-images-${Math.min(post.images.length, 4)}">
            ${post.images.slice(0, 4).map((img, i) => `
              <div class="post-img" onclick="Feed.openImage('${post.id}', ${i})">
                <img src="${img}" alt="Post image ${i + 1}" loading="lazy">
                ${i === 3 && post.images.length > 4 ? `<div class="post-img-overlay">+${post.images.length - 4}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <div class="post-card-actions">
        <button class="post-action like-btn ${isLiked ? 'liked' : ''}"
                onclick="Feed.toggleLike('${post.id}', this)"
                aria-label="Like">
          <span class="like-icon">${Icons.iconHeart(isLiked)}</span>
          <span class="like-count">${Utils.formatNumber(post.likes.length)}</span>
        </button>

        <button class="post-action comment-btn"
                onclick="Feed.openPostModal('${post.id}')"
                aria-label="Comment">
          ${Icons.iconComment()}
          <span>${Utils.formatNumber(post.comments.length)}</span>
        </button>

        <button class="post-action share-btn"
                onclick="Feed.sharePost('${post.id}', this)"
                aria-label="Share">
          ${Icons.iconShare()}
          <span>${Utils.formatNumber(post.shares || 0)}</span>
        </button>

        <button class="post-action bookmark-btn ${isBookmarked ? 'bookmarked' : ''}"
                onclick="Feed.toggleBookmark('${post.id}', this)"
                aria-label="Bookmark">
          ${Icons.iconBookmark(isBookmarked)}
        </button>
      </div>
    `;

    return card;
  }

  // ── Post interactions ─────────────────────────────────────

  function toggleLike(postId, btn) {
    const post = DB.posts.getById(postId);
    if (!post) return;

    const isLiked = post.likes.includes(currentUser.id);
    const updated = isLiked
      ? DB.posts.unlike(postId, currentUser.id)
      : DB.posts.like(postId, currentUser.id);

    if (!updated) return;

    const nowLiked = updated.likes.includes(currentUser.id);
    btn.classList.toggle('liked', nowLiked);
    btn.querySelector('.like-count').textContent = Utils.formatNumber(updated.likes.length);
    btn.querySelector('.like-icon').innerHTML = Icons.iconHeart(nowLiked);

    // Heart burst animation
    if (nowLiked) {
      btn.classList.add('like-burst');
      setTimeout(() => btn.classList.remove('like-burst'), 600);
    }
  }

  function toggleBookmark(postId, btn) {
    const isBookmarked = currentUser.bookmarks?.includes(postId);
    if (isBookmarked) {
      DB.users.removeBookmark(currentUser.id, postId);
      currentUser = DB.users.getById(currentUser.id);
      btn.classList.remove('bookmarked');
      btn.innerHTML = Icons.iconBookmark(false);
      Utils.showToast('Removed from bookmarks', 'default', 2000);
    } else {
      DB.users.addBookmark(currentUser.id, postId);
      currentUser = DB.users.getById(currentUser.id);
      btn.classList.add('bookmarked');
      btn.innerHTML = Icons.iconBookmark(true);
      Utils.showToast('Saved to bookmarks ✦', 'success', 2000);
    }
  }

  function sharePost(postId, btn) {
    DB.posts.share(postId);
    const countEl = btn.querySelector('span');
    if (countEl) {
      const post = DB.posts.getById(postId);
      countEl.textContent = Utils.formatNumber(post.shares);
    }
    Utils.copyToClipboard(`${window.location.origin}/feed.html?post=${postId}`);
    btn.classList.add('shared');
    setTimeout(() => btn.classList.remove('shared'), 1000);
  }

  function deletePost(postId) {
    if (!confirm('Delete this post?')) return;
    const ok = DB.posts.delete(postId, currentUser.id);
    if (ok) {
      const card = document.getElementById(`post-${postId}`);
      if (card) {
        card.classList.add('removing');
        setTimeout(() => card.remove(), 400);
      }
      Utils.showToast('Post deleted', 'default', 2000);
    }
  }

  function copyPostLink(postId) {
    Utils.copyToClipboard(`${window.location.origin}/feed.html?post=${postId}`);
    closePostMenu(postId);
  }

  function togglePostMenu(postId, btn) {
    const menu = document.getElementById(`menu-${postId}`);
    if (!menu) return;
    const isOpen = menu.classList.contains('open');
    Utils.$$('.dropdown.open').forEach(d => d.classList.remove('open'));
    if (!isOpen) menu.classList.add('open');
  }

  function closePostMenu(postId) {
    const menu = document.getElementById(`menu-${postId}`);
    if (menu) menu.classList.remove('open');
  }

  // ── Post Modal (expanded view + comments) ────────────────

  function openPostModal(postId) {
    const post = DB.posts.getById(postId);
    if (!post) return;
    const author = DB.users.getById(post.authorId);
    if (!author) return;

    const isLiked = post.likes.includes(currentUser.id);
    const isBookmarked = currentUser.bookmarks?.includes(post.id);

    const html = `
      <div class="post-modal">
        <button class="modal-close" onclick="Utils.closeModal()">✕</button>
        <div class="post-modal-inner">
          ${post.images.length ? `
            <div class="post-modal-images">
              ${post.images.map(img => `<img src="${img}" alt="Post image">`).join('')}
            </div>
          ` : ''}
          <div class="post-modal-sidebar">
            <div class="post-modal-header">
              <a href="profile.html?u=${author.username}" class="post-author-link">
                ${Utils.avatarHTML(author, 40)}
                <div class="post-author-info">
                  <span class="post-author-name">
                    ${Utils.sanitizeHTML(author.displayName)}
                    ${author.verified ? `<span class="verified-icon">✓</span>` : ''}
                  </span>
                  <span class="post-meta">@${author.username}</span>
                </div>
              </a>
            </div>
            <div class="post-modal-content">${Utils.linkifyContent(post.content)}</div>
            <div class="post-modal-time">${Utils.formatDateTime(post.createdAt)}</div>
            <div class="post-modal-stats">
              <span>${Utils.formatNumber(post.likes.length)} likes</span>
              <span>${Utils.formatNumber(post.shares || 0)} shares</span>
            </div>
            <div class="post-modal-actions">
              <button class="post-action like-btn ${isLiked ? 'liked' : ''}" 
                      onclick="Feed.toggleLike('${post.id}', this)" id="modal-like-${post.id}">
                ${Icons.iconHeart(isLiked)}
                <span class="like-count">${Utils.formatNumber(post.likes.length)}</span>
              </button>
              <button class="post-action" onclick="Feed.sharePost('${post.id}', this)">
                ${Icons.iconShare()}
                <span>${Utils.formatNumber(post.shares || 0)}</span>
              </button>
              <button class="post-action bookmark-btn ${isBookmarked ? 'bookmarked' : ''}"
                      onclick="Feed.toggleBookmark('${post.id}', this)">
                ${Icons.iconBookmark(isBookmarked)}
              </button>
            </div>
            <div class="post-modal-comments" id="modal-comments-${post.id}">
              ${renderComments(post)}
            </div>
            <div class="post-modal-reply">
              <div class="reply-avatar">${Utils.avatarHTML(currentUser, 32)}</div>
              <div class="reply-input-wrap">
                <textarea id="reply-input-${post.id}" placeholder="Add a comment…" rows="1" maxlength="500"></textarea>
                <button class="btn-send" id="reply-send-${post.id}" onclick="Feed.submitComment('${post.id}')">
                  ${Icons.iconSend()}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    Utils.showModal(html);

    // Auto-resize textarea
    const textarea = document.getElementById(`reply-input-${post.id}`);
    if (textarea) {
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      });
      textarea.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitComment(post.id);
        }
      });
    }
  }

  function renderComments(post) {
    if (!post.comments.length) {
      return `<div class="comments-empty">No comments yet. Be the first!</div>`;
    }
    return post.comments.map(comment => {
      const author = DB.users.getById(comment.authorId);
      if (!author) return '';
      const isCommentLiked = comment.likes?.includes(currentUser.id);
      const isOwn = comment.authorId === currentUser.id || post.authorId === currentUser.id;
      return `
        <div class="comment-item" id="comment-${comment.id}">
          <a href="profile.html?u=${author.username}">${Utils.avatarHTML(author, 28)}</a>
          <div class="comment-body">
            <div class="comment-header">
              <a href="profile.html?u=${author.username}" class="comment-author">
                ${Utils.sanitizeHTML(author.displayName)}
              </a>
              <span class="comment-time">${Utils.timeAgo(comment.createdAt)}</span>
              ${isOwn ? `
                <button class="btn-delete-comment" onclick="Feed.deleteComment('${post.id}', '${comment.id}')">✕</button>
              ` : ''}
            </div>
            <div class="comment-content">${Utils.linkifyContent(comment.content)}</div>
            <button class="comment-like ${isCommentLiked ? 'active' : ''}" 
                    onclick="Feed.likeComment('${post.id}', '${comment.id}', this)">
              ♥ ${comment.likes?.length || 0}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function submitComment(postId) {
    const textarea = document.getElementById(`reply-input-${postId}`);
    if (!textarea) return;
    const content = textarea.value.trim();
    if (!content) return;

    const result = DB.posts.comment(postId, currentUser.id, content);
    if (!result) return;

    textarea.value = '';
    textarea.style.height = 'auto';

    // Refresh comments
    const commentsEl = document.getElementById(`modal-comments-${postId}`);
    if (commentsEl) {
      commentsEl.innerHTML = renderComments(result.post);
    }

    // Update comment count on feed card
    const feedCard = document.getElementById(`post-${postId}`);
    if (feedCard) {
      const commentBtn = feedCard.querySelector('.comment-btn span');
      if (commentBtn) commentBtn.textContent = Utils.formatNumber(result.post.comments.length);
    }
  }

  function deleteComment(postId, commentId) {
    const ok = DB.posts.deleteComment(postId, commentId, currentUser.id);
    if (ok) {
      const commentEl = document.getElementById(`comment-${commentId}`);
      if (commentEl) {
        commentEl.classList.add('removing');
        setTimeout(() => commentEl.remove(), 300);
      }
    }
  }

  function likeComment(postId, commentId, btn) {
    DB.posts.likeComment(postId, commentId, currentUser.id);
    const post = DB.posts.getById(postId);
    const comment = post?.comments.find(c => c.id === commentId);
    if (comment) {
      const isLiked = comment.likes.includes(currentUser.id);
      btn.classList.toggle('active', isLiked);
      btn.textContent = `♥ ${comment.likes.length}`;
    }
  }

  // ── Image lightbox ────────────────────────────────────────

  function openImage(postId, idx) {
    const post = DB.posts.getById(postId);
    if (!post || !post.images[idx]) return;

    Utils.showModal(`
      <div class="image-lightbox">
        <button class="modal-close lightbox-close" onclick="Utils.closeModal()">✕</button>
        <img src="${post.images[idx]}" alt="Post image" class="lightbox-img">
        ${post.images.length > 1 ? `
          <div class="lightbox-nav">
            ${post.images.map((_, i) => `
              <button class="lightbox-dot ${i === idx ? 'active' : ''}" 
                      onclick="Utils.closeModal(); setTimeout(() => Feed.openImage('${postId}', ${i}), 50)">
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `);
  }

  // ── Composer ──────────────────────────────────────────────

  function setupComposer() {
    const form = document.getElementById('post-composer');
    if (!form) return;

    // Inject current user's avatar into inline composer
    const avatarSlot = document.getElementById('composer-avatar-inline');
    if (avatarSlot) avatarSlot.innerHTML = Utils.avatarHTML(currentUser, 40);

    const textarea = form.querySelector('#compose-text');
    const charCount = form.querySelector('#compose-char');
    const submitBtn = form.querySelector('#compose-submit');
    const fileInput = form.querySelector('#compose-file');
    const previews = form.querySelector('#compose-previews');

    if (!textarea) return;

    // Auto-expand
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
      if (charCount) charCount.textContent = textarea.value.length;
      if (submitBtn) submitBtn.disabled = textarea.value.trim().length === 0 && !previews?.children.length;
    });

    let images = [];
    if (fileInput && previews) {
      const handler = Media.setupImageInput(fileInput, previews, 4, imgs => {
        images = imgs;
        if (submitBtn) submitBtn.disabled = textarea.value.trim().length === 0 && !imgs.length;
      });
      images = handler.getImages ? handler.getImages() : [];
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const content = textarea.value.trim();
      const imgs = images.slice();
      if (!content && !imgs.length) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting…';

      DB.posts.create(currentUser.id, { content, images: imgs });

      textarea.value = '';
      textarea.style.height = 'auto';
      if (charCount) charCount.textContent = '0';
      if (previews) previews.innerHTML = '';
      images = [];

      submitBtn.disabled = true; // stays disabled until user types again
      submitBtn.textContent = 'Post';

      loadFeed(false);
      Utils.showToast('Post published ✦', 'success');
    });
  }

  // ── Infinite scroll ───────────────────────────────────────

  function setupInfiniteScroll() {
    const loader = document.getElementById('feed-loader');
    if (!loader) return;

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading) {
        const start = page * PAGE_SIZE;
        if (start < feedPosts.length) loadFeed(true);
      }
    }, { threshold: 0.1 });

    observer.observe(loader);
  }

  return {
    init, refresh, loadFeed, renderPostCard, renderComments,
    toggleLike, toggleBookmark, sharePost, deletePost, copyPostLink,
    togglePostMenu, openPostModal, submitComment, deleteComment, likeComment,
    openImage, createStory, viewStory
  };
})();
