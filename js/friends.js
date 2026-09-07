/**
 * FRIENDS & DIRECT MESSAGES MODULE
 * Система взаимных подписок (Друзья), отправка видео друзьям,
 * чаты и входящие сообщения.
 */

class FriendsModule {
  constructor() {
    this.shareModal = document.getElementById('share-friends-modal');
    this.shareFriendsList = document.getElementById('share-friends-list');
    this.shareNoteInput = document.getElementById('share-message-note');
    this.currentShareVideoId = null;

    this.inboxStoriesList = document.getElementById('inbox-stories-list');
    this.inboxMessagesList = document.getElementById('inbox-messages-list');

    this.init();
  }

  init() {
    const closeShare = document.getElementById('btn-close-share');
    if (closeShare) {
      closeShare.addEventListener('click', () => {
        this.shareModal.classList.remove('open');
        this.currentShareVideoId = null;
      });
    }
  }

  async openShareModal(videoId) {
    if (!window.authService.isLoggedIn()) {
      window.openAuthModal('Войдите, чтобы делиться видео с друзьями!');
      return;
    }

    this.currentShareVideoId = videoId;
    this.shareModal.classList.add('open');
    await this.renderShareFriendsList();
  }

  async renderShareFriendsList() {
    if (!this.shareFriendsList) return;
    this.shareFriendsList.innerHTML = '<div style="color:var(--text-dim);text-align:center;padding:15px;">⏳ Поиск друзей...</div>';

    const currentUser = window.authService.currentUser;
    const friends = await window.dbService.getMutualFriends(currentUser.id);

    if (friends.length === 0) {
      this.shareFriendsList.innerHTML = `
        <div style="text-align:center;padding:15px;color:var(--text-dim);font-size:13px;">
          У вас пока нет взаимных друзей 🤝<br>
          <span style="font-size:12px;color:var(--text-muted);">Чтобы стать друзьями, подпишитесь друг на друга!</span>
        </div>
      `;
      return;
    }

    this.shareFriendsList.innerHTML = '';
    friends.forEach(f => {
      const item = document.createElement('div');
      item.className = 'friend-share-item';
      item.innerHTML = `
        <div class="friend-share-user">
          <img class="friend-share-avatar" src="${f.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" alt="${f.username}">
          <div>
            <div style="font-size:14px;font-weight:700;color:#fff;">${f.display_name || f.username}</div>
            <div style="font-size:11px;color:var(--text-dim);">@${f.username}</div>
          </div>
        </div>
        <button class="btn-primary" style="padding:6px 14px;font-size:12px;" onclick="window.friendsModule.sendVideoToFriend('${f.id}', '${f.username}', this)">Отправить ✈️</button>
      `;
      this.shareFriendsList.appendChild(item);
    });
  }

  async sendVideoToFriend(friendId, friendUsername, btnElement) {
    const currentUser = window.authService.currentUser;
    const note = this.shareNoteInput ? this.shareNoteInput.value.trim() : '';

    btnElement.disabled = true;
    btnElement.textContent = 'Отправка...';

    const msgObj = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      sender_id: currentUser.id,
      receiver_id: friendId,
      video_id: this.currentShareVideoId,
      content: note || 'Смотри какое крутое видео! 🔥',
      is_read: false,
      created_at: new Date().toISOString()
    };

    await window.dbService.sendMessage(msgObj);
    window.showToast(`✈️ Видео отправлено другу @${friendUsername}!`);

    // Increment share counter on video
    const db = window.dbService.getLocalDb();
    const vid = (db.videos || []).find(v => v.id === this.currentShareVideoId);
    if (vid) {
      vid.shares_count = (vid.shares_count || 0) + 1;
      window.dbService.saveLocalDb(db);
    }

    this.shareModal.classList.remove('open');
    if (this.shareNoteInput) this.shareNoteInput.value = '';
  }

  // Загрузка экрана «Входящие» (Inbox)
  async loadInbox() {
    const currentUser = window.authService.currentUser;
    if (!currentUser) {
      if (this.inboxMessagesList) {
        this.inboxMessagesList.innerHTML = `
          <div style="text-align:center;padding:40px;color:var(--text-dim);">
            Войдите в аккаунт, чтобы просматривать сообщения и видео от друзей 💬
          </div>
        `;
      }
      return;
    }

    // Загрузка взаимных друзей в блок историй
    if (this.inboxStoriesList) {
      const friends = await window.dbService.getMutualFriends(currentUser.id);
      this.inboxStoriesList.innerHTML = '';
      
      if (friends.length === 0) {
        this.inboxStoriesList.innerHTML = '<div style="font-size:12px;color:var(--text-dim);padding:8px;">Подпишитесь взаимно, чтобы здесь появились друзья!</div>';
      } else {
        friends.forEach(f => {
          const s = document.createElement('div');
          s.className = 'story-item';
          s.onclick = () => window.viewUserProfile(f.id, f.username);
          s.innerHTML = `
            <div class="story-avatar-ring">
              <img class="story-avatar" src="${f.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" alt="${f.username}">
            </div>
            <span class="story-name">${f.display_name || f.username}</span>
          `;
          this.inboxStoriesList.appendChild(s);
        });
      }
    }

    // Загрузка сообщений и видео
    if (this.inboxMessagesList) {
      this.inboxMessagesList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-dim);">⏳ Загрузка сообщений...</div>';
      const messages = await window.dbService.getUserMessages(currentUser.id);

      if (messages.length === 0) {
        this.inboxMessagesList.innerHTML = `
          <div style="text-align:center;padding:40px;color:var(--text-dim);font-size:14px;">
            У вас пока нет сообщений 📭<br>
            <span style="font-size:12px;color:var(--text-muted);margin-top:6px;display:block;">Отправьте смешное видео взаимному другу из ленты!</span>
          </div>
        `;
        return;
      }

      this.inboxMessagesList.innerHTML = '';
      for (const m of messages) {
        const isMeSender = m.sender_id === currentUser.id;
        const otherUserId = isMeSender ? m.receiver_id : m.sender_id;
        const otherUser = await window.dbService.getUserById(otherUserId) || { username: 'Пользователь', avatar_url: '' };

        const item = document.createElement('div');
        item.className = 'message-item';
        item.innerHTML = `
          <img class="friend-share-avatar" src="${otherUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" alt="">
          <div class="message-item-body">
            <div class="message-sender">${isMeSender ? 'Вы ➡️ ' + otherUser.username : otherUser.username}</div>
            <div class="message-preview">
              ${m.video_id ? '<span class="shared-video-tag">🎬 Видео</span>' : ''}
              ${m.content || 'Поделился видео'}
            </div>
          </div>
          <span style="font-size:10px;color:var(--text-dim);">${new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        `;
        
        if (m.video_id) {
          item.onclick = () => {
            window.showToast('🎬 Открываем отправленное видео...');
            window.switchScreen('feed');
          };
        }

        this.inboxMessagesList.appendChild(item);
      }
    }
  }
}

window.friendsModule = new FriendsModule();
