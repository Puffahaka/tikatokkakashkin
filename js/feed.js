/**
 * TIKTOP VIDEO FEED & PLAYER ENGINE
 * Управление вертикальной лентой, воспроизведением,
 * жестами свайпа, двойным тапом для лайка и загрузкой видео.
 */

class FeedEngine {
  constructor() {
    this.container = document.getElementById('feed-container');
    this.currentVideos = [];
    this.activeTab = 'for_you'; // 'for_you' | 'following' | 'friends'
    this.currentIndex = 0;
    this.currentPlayingVideo = null;
    this.isMuted = false;
    this.touchStartY = 0;
    this.lastTapTime = 0;
  }

  async init() {
    this.setupTabs();
    this.setupUploadModal();
    this.setupKeyboardControls();
    await this.loadFeed();
    this.setupFeedScrollObserver();
  }

  setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      const activeScreen = document.querySelector('.app-screen.active');
      if (activeScreen && activeScreen.id === 'screen-feed' && !document.querySelector('.modal-overlay.open')) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.container.scrollBy({ top: this.container.clientHeight, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.container.scrollBy({ top: -this.container.clientHeight, behavior: 'smooth' });
        }
      }
    });
  }

  setupTabs() {
    const tabs = document.querySelectorAll('.feed-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', async (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTab = tab.dataset.tab;
        await this.loadFeed();
      });
    });
  }

  async loadFeed() {
    if (!this.container) return;
    this.container.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100%;color:#fff;">⏳ Загрузка трендов...</div>';

    let allVideos = await window.dbService.getVideos();
    const currentUser = window.authService.currentUser;

    if (this.activeTab === 'following') {
      if (!currentUser) {
        this.renderEmptyState('Войдите в аккаунт, чтобы видеть видео авторов, на которых вы подписаны!');
        return;
      }
      const followingIds = [];
      const db = window.dbService.getLocalDb();
      (db.follows || []).forEach(f => {
        if (f.follower_id === currentUser.id) followingIds.push(f.following_id);
      });
      allVideos = allVideos.filter(v => followingIds.includes(v.user_id));
      if (allVideos.length === 0) {
        this.renderEmptyState('Вы пока ни на кого не подписаны. Найдите интересных авторов в ленте «Для вас»!');
        return;
      }
    } else if (this.activeTab === 'friends') {
      if (!currentUser) {
        this.renderEmptyState('Войдите в аккаунт, чтобы видеть видео взаимных друзей 🤝!');
        return;
      }
      const friends = await window.dbService.getMutualFriends(currentUser.id);
      const friendIds = friends.map(f => f.id);
      allVideos = allVideos.filter(v => friendIds.includes(v.user_id));
      if (allVideos.length === 0) {
        this.renderEmptyState('У вас пока нет взаимных друзей. Подпишитесь друг на друга, чтобы стать друзьями!');
        return;
      }
    }

    if (this.activeTab === 'for_you' && allVideos.length === 0) {
      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:24px;text-align:center;gap:16px;">
          <span style="font-size:56px;">📹</span>
          <div style="font-size:18px;font-weight:700;color:#fff;">В ленте пока нет видео</div>
          <div style="font-size:14px;color:var(--text-dim);max-width:320px;">Будьте первыми! Загрузите своё видео с устройства или вставьте ссылку.</div>
          <button class="btn-primary" onclick="document.getElementById('btn-nav-upload').click()">Опубликовать видео [+]</button>
        </div>
      `;
      return;
    }

    this.currentVideos = allVideos;
    this.renderVideos();
  }

  renderEmptyState(msg) {
    this.container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:24px;text-align:center;gap:16px;">
        <span style="font-size:48px;">🎬</span>
        <div style="font-size:16px;font-weight:600;color:#fff;">${msg}</div>
        <button class="btn-primary" onclick="document.querySelector('.feed-tab[data-tab=\\'for_you\\']').click()">Перейти в «Для вас»</button>
      </div>
    `;
  }

  async renderVideos() {
    this.container.innerHTML = '';
    const currentUser = window.authService.currentUser;

    for (let i = 0; i < this.currentVideos.length; i++) {
      const v = this.currentVideos[i];
      const card = document.createElement('div');
      card.className = 'video-card';
      card.dataset.index = i;
      card.dataset.id = v.id;

      const isLiked = currentUser ? await window.dbService.isVideoLikedByUser(v.id, currentUser.id) : false;
      const isFriend = currentUser ? await window.dbService.areFriends(currentUser.id, v.user_id) : false;
      const isFollowing = currentUser ? await window.dbService.isFollowing(currentUser.id, v.user_id) : false;
      const isOwnVideo = currentUser && currentUser.id === v.user_id;

      card.innerHTML = `
        <video class="video-player" src="${v.video_url}" loop playsinline preload="metadata"></video>
        
        <div class="play-indicator">▶</div>

        <!-- Overlay Info -->
        <div class="video-overlay">
          <div class="video-info">
            <div class="author-row">
              <span class="author-name" onclick="window.viewUserProfile('${v.user_id}', '${v.username}')">
                @${v.username}
                ${isFriend ? '<span class="badge-friend">Друзья 🤝</span>' : ''}
                ${v.username.toLowerCase() === 'puffahaka' ? '<span class="badge-admin">👑 ADMIN</span>' : ''}
              </span>
            </div>
            <div class="video-caption">
              ${v.caption}
            </div>
            <div class="music-marquee">
              <span class="music-icon">🎵</span>
              <span>${v.music_title || 'Оригинальный звук'}</span>
            </div>
          </div>
        </div>

        <!-- Floating Sidebar Actions -->
        <div class="video-actions">
          <!-- Avatar & Follow Plus -->
          <div class="action-item" onclick="window.viewUserProfile('${v.user_id}', '${v.username}')">
            <div class="action-avatar-wrapper">
              <img class="action-avatar" src="${v.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" alt="${v.username}">
              ${!isFollowing && !isOwnVideo ? `<div class="follow-plus-btn" onclick="event.stopPropagation(); window.feedEngine.handleFollowClick('${v.user_id}', this)">+</div>` : ''}
            </div>
          </div>

          <!-- Like Button -->
          <div class="action-item" onclick="window.feedEngine.handleLikeClick('${v.id}', this)">
            <div class="action-btn ${isLiked ? 'liked' : ''}">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
            <span class="action-count">${v.likes_count || 0}</span>
          </div>

          <!-- Comments Button -->
          <div class="action-item" onclick="window.commentsDrawer.open('${v.id}')">
            <div class="action-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <span class="action-count">${v.comments_count || 0}</span>
          </div>

          <!-- Share to Friends Button -->
          <div class="action-item" onclick="window.friendsModule.openShareModal('${v.id}')">
            <div class="action-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </div>
            <span class="action-count">${v.shares_count || 0}</span>
          </div>

          <!-- Spinning Disc -->
          <div class="spinning-disc">
            <img class="disc-inner-avatar" src="${v.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" alt="">
          </div>
        </div>
      `;

      // Tap / Double-tap events
      this.attachVideoEvents(card);
      this.container.appendChild(card);
    }

    // Play first video
    setTimeout(() => {
      this.playVideoAtIndex(0);
    }, 200);
  }

  attachVideoEvents(card) {
    const video = card.querySelector('video');
    const playIndicator = card.querySelector('.play-indicator');

    card.addEventListener('click', (e) => {
      // Игнорируем клики по кнопкам сайдбара
      if (e.target.closest('.video-actions') || e.target.closest('.video-info')) return;

      const currentTime = new Date().getTime();
      const tapLength = currentTime - this.lastTapTime;

      if (tapLength < 300 && tapLength > 0) {
        // Double Tap -> Like & Flying Heart Animation
        this.handleDoubleTapLike(card, e);
        e.preventDefault();
      } else {
        // Single Tap -> Play / Pause Toggle
        setTimeout(() => {
          if (new Date().getTime() - this.lastTapTime >= 300) {
            if (video.paused) {
              video.play();
              playIndicator.classList.remove('show');
            } else {
              video.pause();
              playIndicator.classList.add('show');
            }
          }
        }, 200);
      }
      this.lastTapTime = currentTime;
    });
  }

  handleDoubleTapLike(card, e) {
    const videoId = card.dataset.id;
    const likeBtnItem = card.querySelector('.video-actions .action-item:nth-child(2)');
    
    // Create flying heart element
    const heart = document.createElement('div');
    heart.className = 'flying-heart';
    heart.innerHTML = '❤️';
    
    const rect = card.getBoundingClientRect();
    const x = e.clientX ? (e.clientX - rect.left) : (rect.width / 2);
    const y = e.clientY ? (e.clientY - rect.top) : (rect.height / 2);
    
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    card.appendChild(heart);

    setTimeout(() => heart.remove(), 800);

    // Trigger like if not already liked
    if (likeBtnItem) {
      const btn = likeBtnItem.querySelector('.action-btn');
      if (btn && !btn.classList.contains('liked')) {
        this.handleLikeClick(videoId, likeBtnItem);
      }
    }
  }

  async handleLikeClick(videoId, element) {
    if (!window.authService.isLoggedIn()) {
      window.openAuthModal('Войдите, чтобы ставить лайки!');
      return;
    }

    const btn = element.querySelector('.action-btn');
    const countEl = element.querySelector('.action-count');
    const currentLikes = parseInt(countEl?.textContent || '0');

    const liked = await window.dbService.toggleLike(videoId, window.authService.currentUser.id);
    
    if (liked) {
      if (btn) {
        btn.classList.add('liked');
        btn.querySelector('svg')?.setAttribute('fill', 'currentColor');
      }
      if (countEl) countEl.textContent = currentLikes + 1;
      window.showToast('❤️ Видео понравилось!');
    } else {
      if (btn) {
        btn.classList.remove('liked');
        btn.querySelector('svg')?.setAttribute('fill', 'none');
      }
      if (countEl) countEl.textContent = Math.max(0, currentLikes - 1);
    }
  }

  async handleFollowClick(authorId, btnElement) {
    if (!window.authService.isLoggedIn()) {
      window.openAuthModal('Войдите, чтобы подписываться!');
      return;
    }

    const followed = await window.dbService.toggleFollow(window.authService.currentUser.id, authorId);
    if (followed) {
      btnElement.classList.add('hidden');
      const isFriend = await window.dbService.areFriends(window.authService.currentUser.id, authorId);
      if (isFriend) {
        window.showToast('🤝 Вы теперь взаимные друзья!');
      } else {
        window.showToast('✅ Вы подписались на автора!');
      }
    }
  }

  setupFeedScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          if (this.currentPlayingVideo && this.currentPlayingVideo !== video) {
            this.currentPlayingVideo.pause();
          }
          this.currentPlayingVideo = video;
          video.play().catch(e => console.log('Autoplay policy'));
          entry.target.querySelector('.play-indicator')?.classList.remove('show');
        } else {
          if (video) video.pause();
        }
      });
    }, { threshold: [0.6] });

    // Re-observe cards
    const cards = this.container.querySelectorAll('.video-card');
    cards.forEach(c => observer.observe(c));
  }

  playVideoAtIndex(index) {
    const card = this.container.querySelector(`.video-card[data-index="${index}"]`);
    if (card) {
      const video = card.querySelector('video');
      if (video) {
        if (this.currentPlayingVideo) this.currentPlayingVideo.pause();
        this.currentPlayingVideo = video;
        video.play().catch(e => console.log('Autoplay'));
      }
    }
  }

  setupUploadModal() {
    const uploadBtn = document.getElementById('btn-nav-upload');
    const uploadModal = document.getElementById('upload-modal');
    const fileInput = document.getElementById('upload-file-input');
    const videoPreview = document.getElementById('upload-preview-player');
    const previewBox = document.getElementById('upload-preview-box');
    const placeholderTxt = document.getElementById('upload-placeholder-txt');
    const submitBtn = document.getElementById('btn-submit-upload');

    let selectedVideoDataUrl = '';

    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        if (!window.authService.isLoggedIn()) {
          window.openAuthModal('Войдите, чтобы создавать и публиковать видео!');
          return;
        }
        uploadModal.classList.add('open');
      });
    }

    if (previewBox && fileInput) {
      previewBox.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            selectedVideoDataUrl = re.target.result;
            videoPreview.src = selectedVideoDataUrl;
            videoPreview.style.display = 'block';
            if (placeholderTxt) placeholderTxt.style.display = 'none';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        const caption = document.getElementById('upload-caption').value.trim();
        const musicTitle = document.getElementById('upload-music').value.trim() || 'Оригинальный звук';
        const urlInput = document.getElementById('upload-url-input').value.trim();

        const finalVideoUrl = selectedVideoDataUrl || urlInput || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

        if (!caption) {
          window.showToast('⚠️ Введите описание для видео!');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Публикуем...';

        const currentUser = window.authService.currentUser;
        const newVideo = {
          id: 'v-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
          user_id: currentUser.id,
          username: currentUser.username,
          user_avatar: currentUser.avatar_url,
          video_url: finalVideoUrl,
          caption: caption,
          music_title: musicTitle,
          tags: '#тиктоп #новинка',
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          is_deleted: false,
          created_at: new Date().toISOString()
        };

        await window.dbService.createVideo(newVideo);
        window.showToast('🚀 Видео успешно опубликовано!');
        uploadModal.classList.remove('open');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Опубликовать';

        // Reset inputs
        document.getElementById('upload-caption').value = '';
        document.getElementById('upload-url-input').value = '';
        if (videoPreview) videoPreview.style.display = 'none';
        if (placeholderTxt) placeholderTxt.style.display = 'block';

        // Switch to home and reload
        window.switchScreen('feed');
        await this.loadFeed();
      });
    }
  }
}

window.feedEngine = new FeedEngine();
