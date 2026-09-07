/**
 * COMMENTS DRAWER & MANAGER
 * Выдвижная шторка комментариев, добавление, удаление и модерация.
 */

class CommentsDrawer {
  constructor() {
    this.drawer = document.getElementById('comments-drawer');
    this.listContainer = document.getElementById('comments-list');
    this.countHeader = document.getElementById('comments-header-count');
    this.input = document.getElementById('comment-input');
    this.sendBtn = document.getElementById('btn-comment-send');
    this.closeBtn = document.getElementById('btn-close-comments');
    this.currentVideoId = null;

    this.init();
  }

  init() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.sendBtn && this.input) {
      this.sendBtn.addEventListener('click', () => this.postComment());
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.postComment();
      });
    }

    // Закрытие шторки при клике за её пределами
    document.addEventListener('click', (e) => {
      if (this.drawer.classList.contains('open')) {
        if (!this.drawer.contains(e.target) && !e.target.closest('.action-item')) {
          this.close();
        }
      }
    });
  }

  async open(videoId) {
    this.currentVideoId = videoId;
    this.drawer.classList.add('open');
    await this.loadComments();
  }

  close() {
    this.drawer.classList.remove('open');
    this.currentVideoId = null;
  }

  async loadComments() {
    if (!this.currentVideoId || !this.listContainer) return;
    this.listContainer.innerHTML = '<div style="color:var(--text-dim);text-align:center;padding:20px;">⏳ Загрузка комментариев...</div>';

    const comments = await window.dbService.getComments(this.currentVideoId);
    if (this.countHeader) {
      this.countHeader.textContent = `${comments.length} комментариев`;
    }

    if (comments.length === 0) {
      this.listContainer.innerHTML = '<div style="color:var(--text-dim);text-align:center;padding:30px;">Будьте первым, кто оставит комментарий! 💬</div>';
      return;
    }

    this.listContainer.innerHTML = '';
    const currentUser = window.authService.currentUser;
    const isAdmin = window.authService.isAdmin();

    comments.forEach(c => {
      const item = document.createElement('div');
      item.className = 'comment-item';
      
      const isMyComment = currentUser && currentUser.id === c.user_id;
      const canDelete = isMyComment || isAdmin;

      item.innerHTML = `
        <img class="comment-avatar" src="${c.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" alt="${c.username}">
        <div class="comment-body">
          <div class="comment-username">
            @${c.username}
            ${c.username.toLowerCase() === 'puffahaka' ? '<span class="badge-admin">👑 ADMIN</span>' : ''}
          </div>
          <div class="comment-text">${this.escapeHtml(c.text)}</div>
          <div class="comment-footer">
            <span>${this.formatTime(c.created_at)}</span>
            ${canDelete ? `<span class="comment-delete-btn" onclick="window.commentsDrawer.deleteComment('${c.id}')">Удалить</span>` : ''}
          </div>
        </div>
      `;
      this.listContainer.appendChild(item);
    });
  }

  async postComment() {
    if (!window.authService.isLoggedIn()) {
      window.openAuthModal('Войдите, чтобы оставлять комментарии!');
      return;
    }

    const text = this.input.value.trim();
    if (!text) return;

    const currentUser = window.authService.currentUser;
    const commentObj = {
      id: 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      video_id: this.currentVideoId,
      user_id: currentUser.id,
      username: currentUser.username,
      user_avatar: currentUser.avatar_url,
      text: text,
      created_at: new Date().toISOString()
    };

    this.input.value = '';
    await window.dbService.addComment(commentObj);
    window.showToast('💬 Комментарий добавлен!');
    await this.loadComments();

    // Update comment counter in the current card
    const currentCard = document.querySelector(`.video-card[data-id="${this.currentVideoId}"]`);
    if (currentCard) {
      const countEl = currentCard.querySelector('.action-item:nth-child(3) .action-count');
      if (countEl) {
        countEl.textContent = parseInt(countEl.textContent || '0') + 1;
      }
    }
  }

  async deleteComment(commentId) {
    await window.dbService.deleteComment(commentId);
    window.showToast('🗑 Комментарий удален');
    await this.loadComments();
  }

  formatTime(isoString) {
    if (!isoString) return 'только что';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.commentsDrawer = new CommentsDrawer();
