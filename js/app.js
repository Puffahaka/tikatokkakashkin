/**
 * MAIN APP CONTROLLER
 * Навигация по экранам, модальные окна авторизации,
 * просмотр и редактирование профилей.
 */

// Переключение между экранами
window.switchScreen = function(screenName) {
  if (screenName === 'friends_feed') {
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

    const screen = document.getElementById('screen-feed');
    if (screen) screen.classList.add('active');

    const navTab = document.querySelector('.nav-tab[data-screen="friends_feed"]');
    if (navTab) navTab.classList.add('active');

    document.querySelector('.feed-tab[data-tab="friends"]')?.click();
    return;
  }

  document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const screen = document.getElementById(`screen-${screenName}`);
  if (screen) screen.classList.add('active');

  const navTab = document.querySelector(`.nav-tab[data-screen="${screenName}"]`);
  if (navTab) navTab.classList.add('active');

  // Остановка или запуск видео в зависимости от активного экрана
  if (screenName !== 'feed' && window.feedEngine?.currentPlayingVideo) {
    window.feedEngine.currentPlayingVideo.pause();
  }

  if (screenName === 'feed') {
    if (window.feedEngine?.currentPlayingVideo) {
      window.feedEngine.currentPlayingVideo.play().catch(e => {});
    }
  } else if (screenName === 'inbox') {
    window.friendsModule.loadInbox();
  } else if (screenName === 'profile') {
    window.loadMyProfile();
  }
};

// Открытие модального окна авторизации
window.openAuthModal = function(title = 'Войдите в TikTop') {
  const modal = document.getElementById('auth-modal');
  const modalTitle = document.getElementById('auth-modal-title');
  if (modalTitle) modalTitle.textContent = title;
  modal.classList.add('open');
};

// Просмотр профиля любого пользователя
window.viewUserProfile = async function(userId, username) {
  const currentUser = window.authService.currentUser;
  if (currentUser && currentUser.id === userId) {
    window.switchScreen('profile');
    return;
  }

  const user = await window.dbService.getUserById(userId) || await window.dbService.getUserByUsername(username);
  if (!user) return;

  const profileScreen = document.getElementById('screen-profile');
  window.switchScreen('profile');
  window.renderProfileData(user, false);
};

// Загрузка собственного профиля
window.loadMyProfile = async function() {
  if (!window.authService.isLoggedIn()) {
    window.openAuthModal('Войдите, чтобы открыть свой профиль');
    return;
  }
  const user = window.authService.currentUser;
  window.renderProfileData(user, true);
};

// Отрисовка данных профиля
window.renderProfileData = async function(user, isOwnProfile) {
  const avatarEl = document.getElementById('profile-avatar-img');
  const nameEl = document.getElementById('profile-display-name');
  const handleEl = document.getElementById('profile-handle');
  const bioEl = document.getElementById('profile-bio');
  const editBtn = document.getElementById('btn-edit-profile');
  const followBtn = document.getElementById('btn-profile-follow');
  const adminBtn = document.getElementById('btn-profile-admin');
  const logoutBtn = document.getElementById('btn-profile-logout');

  if (avatarEl) avatarEl.src = user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  if (nameEl) {
    nameEl.innerHTML = `
      ${user.display_name || user.username}
      ${user.username.toLowerCase() === 'puffahaka' ? '<span class="badge-admin">👑 ADMIN</span>' : ''}
    `;
  }
  if (handleEl) handleEl.textContent = `@${user.username}`;
  if (bioEl) bioEl.textContent = user.bio || 'Нет описания профиля.';

  // Счетчики
  const followingCount = await window.dbService.getFollowingCount(user.id);
  const followersCount = await window.dbService.getFollowersCount(user.id);
  const friends = await window.dbService.getMutualFriends(user.id);

  document.getElementById('stat-following-count').textContent = followingCount;
  document.getElementById('stat-followers-count').textContent = followersCount;
  document.getElementById('stat-friends-count').textContent = friends.length;

  // Видимость кнопок
  if (isOwnProfile) {
    if (editBtn) editBtn.style.display = 'block';
    if (followBtn) followBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    // Кнопка Админки только для puffahaka!
    if (adminBtn) {
      adminBtn.style.display = window.authService.isAdmin() ? 'flex' : 'none';
    }
  } else {
    if (editBtn) editBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (adminBtn) adminBtn.style.display = 'none';
    if (followBtn) {
      followBtn.style.display = 'block';
      const currentUser = window.authService.currentUser;
      const isFollowing = currentUser ? await window.dbService.isFollowing(currentUser.id, user.id) : false;
      const isFriend = currentUser ? await window.dbService.areFriends(currentUser.id, user.id) : false;

      if (isFriend) {
        followBtn.textContent = 'Друзья 🤝';
        followBtn.className = 'btn-secondary';
      } else if (isFollowing) {
        followBtn.textContent = 'Вы подписаны';
        followBtn.className = 'btn-secondary';
      } else {
        followBtn.textContent = 'Подписаться';
        followBtn.className = 'btn-primary';
      }

      followBtn.onclick = async () => {
        if (!window.authService.isLoggedIn()) {
          window.openAuthModal('Войдите, чтобы подписываться!');
          return;
        }
        await window.dbService.toggleFollow(window.authService.currentUser.id, user.id);
        window.renderProfileData(user, false);
      };
    }
  }

  // Загрузка видео пользователя в сетку профиля
  const videosGrid = document.getElementById('profile-videos-grid');
  if (videosGrid) {
    videosGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:20px;">⏳ Загрузка видео...</div>';
    const allVideos = await window.dbService.getVideos();
    const userVideos = allVideos.filter(v => v.user_id === user.id);

    if (userVideos.length === 0) {
      videosGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:30px;">Пока нет опубликованных видео 📹</div>';
    } else {
      videosGrid.innerHTML = '';
      userVideos.forEach(v => {
        const item = document.createElement('div');
        item.className = 'grid-video-item';
        item.innerHTML = `
          <video src="${v.video_url}#t=0.5" preload="metadata"></video>
          <div class="grid-views-badge">❤️ ${v.likes_count || 0}</div>
        `;
        item.onclick = () => {
          window.switchScreen('feed');
          window.feedEngine.loadFeed();
        };
        videosGrid.appendChild(item);
      });
    }
  }
};

// Инициализация интерфейса и слушателей
document.addEventListener('DOMContentLoaded', async () => {
  // Навигация
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const screen = tab.dataset.screen;
      if (screen) window.switchScreen(screen);
    });
  });

  // Модалка авторизации: переключение между Входом и Регистрацией
  const tabLogin = document.getElementById('auth-tab-login');
  const tabRegister = document.getElementById('auth-tab-register');
  const authSubmitBtn = document.getElementById('btn-auth-submit');
  const authDisplayNameGroup = document.getElementById('auth-group-displayname');
  let authMode = 'login'; // 'login' | 'register'

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
      authMode = 'login';
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      authDisplayNameGroup.style.display = 'none';
      authSubmitBtn.textContent = 'Войти';
    });

    tabRegister.addEventListener('click', () => {
      authMode = 'register';
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      authDisplayNameGroup.style.display = 'flex';
      authSubmitBtn.textContent = 'Зарегистрироваться';
    });
  }

  // Кнопка отправки формы авторизации
  if (authSubmitBtn) {
    authSubmitBtn.addEventListener('click', async () => {
      const username = document.getElementById('auth-username').value.trim();
      const password = document.getElementById('auth-password').value.trim();
      const displayName = document.getElementById('auth-displayname').value.trim();

      if (!username || !password) {
        window.showToast('⚠️ Введите юзернейм и пароль!');
        return;
      }

      authSubmitBtn.disabled = true;
      authSubmitBtn.textContent = 'Подождите...';

      try {
        if (authMode === 'register') {
          const user = await window.authService.register(username, password, displayName);
          window.showToast(`🎉 Добро пожаловать, @${user.username}!`);
        } else {
          const user = await window.authService.login(username, password);
          window.showToast(`👋 С возвращением, @${user.username}!`);
        }
        document.getElementById('auth-modal').classList.remove('open');
        window.feedEngine.loadFeed();
        if (document.getElementById('screen-profile').classList.contains('active')) {
          window.loadMyProfile();
        }
      } catch (err) {
        window.showToast(`❌ ${err.message}`);
      } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = authMode === 'register' ? 'Зарегистрироваться' : 'Войти';
      }
    });
  }

  // Закрытие модалок по крестику
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal-overlay')?.classList.remove('open');
    });
  });

  // Закрытие модалок при клике на затемненную область (backdrop)
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  // Редактирование профиля и смены фото
  const editProfileBtn = document.getElementById('btn-edit-profile');
  const editProfileModal = document.getElementById('edit-profile-modal');
  const saveProfileBtn = document.getElementById('btn-save-profile');
  const profileAvatarClickable = document.getElementById('profile-avatar-clickable');
  const avatarFileInput = document.getElementById('edit-avatar-file-input');
  const avatarUploadBox = document.getElementById('modal-avatar-upload-box');
  const chooseAvatarBtn = document.getElementById('btn-choose-avatar-file');
  const modalAvatarPreview = document.getElementById('edit-modal-avatar-preview');
  const editAvatarUrlInput = document.getElementById('edit-avatar-url');

  const openEditModal = () => {
    const user = window.authService.currentUser;
    if (!user) return;
    document.getElementById('edit-displayname').value = user.display_name || '';
    document.getElementById('edit-bio').value = user.bio || '';
    if (editAvatarUrlInput) editAvatarUrlInput.value = user.avatar_url || '';
    if (modalAvatarPreview) modalAvatarPreview.src = user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
    editProfileModal.classList.add('open');
  };

  if (editProfileBtn) editProfileBtn.addEventListener('click', openEditModal);
  if (profileAvatarClickable) {
    profileAvatarClickable.addEventListener('click', () => {
      if (document.getElementById('btn-edit-profile')?.style.display !== 'none') {
        openEditModal();
      }
    });
  }

  // Клик по кнопке выбора файла или по аватару в модалке
  if (chooseAvatarBtn && avatarFileInput) {
    chooseAvatarBtn.addEventListener('click', () => avatarFileInput.click());
  }
  if (avatarUploadBox && avatarFileInput) {
    avatarUploadBox.addEventListener('click', () => avatarFileInput.click());
  }

  // Загрузка фото с устройства через FileReader
  if (avatarFileInput) {
    avatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          const dataUrl = re.target.result;
          if (modalAvatarPreview) modalAvatarPreview.src = dataUrl;
          if (editAvatarUrlInput) editAvatarUrlInput.value = dataUrl;
          window.showToast('📸 Фото выбрано!');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Выбор готового пресета аватарок
  document.querySelectorAll('.avatar-preset-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.avatar-preset-item').forEach(p => p.classList.remove('selected'));
      item.classList.add('selected');
      const src = item.getAttribute('src');
      if (modalAvatarPreview) modalAvatarPreview.src = src;
      if (editAvatarUrlInput) editAvatarUrlInput.value = src;
    });
  });

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
      const displayName = document.getElementById('edit-displayname').value;
      const bio = document.getElementById('edit-bio').value;
      const avatarUrl = editAvatarUrlInput ? editAvatarUrlInput.value : '';

      saveProfileBtn.disabled = true;
      saveProfileBtn.textContent = 'Сохраняем...';

      try {
        await window.authService.updateProfile({ displayName, bio, avatarUrl });
        window.showToast('✅ Профиль и фото успешно обновлены!');
        editProfileModal.classList.remove('open');
        window.loadMyProfile();
        window.feedEngine.loadFeed();
      } catch (e) {
        window.showToast(`❌ ${e.message}`);
      } finally {
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = 'Сохранить профиль';
      }
    });
  }

  // Выход из аккаунта
  const logoutBtn = document.getElementById('btn-profile-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Вы уверены, что хотите выйти?')) {
        window.authService.clearSession();
        window.showToast('Вы вышли из аккаунта');
        window.switchScreen('feed');
        window.feedEngine.loadFeed();
      }
    });
  }

  // Кнопка открытия админки
  const adminBtn = document.getElementById('btn-profile-admin');
  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      window.adminPanel.open();
    });
  }

  // Старт ленты
  await window.feedEngine.init();
});
