/**
 * AUTHENTICATION & PROFILE SERVICE
 * Управление аккаунтами (логин + пароль без почты),
 * Автоматическое назначение прав администратора для пользователя 'puffahaka',
 * Редактирование профиля и сессии.
 */

class AuthService {
  constructor() {
    this.sessionKey = 'tiktop_user_session';
    this.currentUser = null;
    this.loadSession();
  }

  // Безопасное хэширование пароля (с поддержкой file:// и любого браузера)
  async hashPassword(password) {
    try {
      if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      console.warn('Crypto.subtle fallback used');
    }

    // Чистый JS алгоритм хэширования (работает всегда на file:/// и локально)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(16) + '_' + password.length;
  }

  loadSession() {
    try {
      const saved = localStorage.getItem(this.sessionKey);
      if (saved) {
        this.currentUser = JSON.parse(saved);
        console.log('👤 Сессия восстановлена:', this.currentUser.username);
      }
    } catch (e) {
      this.currentUser = null;
    }
  }

  saveSession(user) {
    this.currentUser = user;
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
  }

  clearSession() {
    this.currentUser = null;
    localStorage.removeItem(this.sessionKey);
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  isPuffahaka(name) {
    if (!name) return false;
    return name.trim().toLowerCase() === 'puffahaka';
  }

  isAdmin() {
    if (!this.currentUser) return false;
    return this.currentUser.is_admin || this.isPuffahaka(this.currentUser.username);
  }

  // Регистрация (Только юзернейм и пароль!)
  async register(username, password, displayName = '') {
    username = username.trim().toLowerCase();
    if (!username || username.length < 3) {
      throw new Error('Имя пользователя должно быть не менее 3 символов');
    }
    if (!password || password.length < 4) {
      throw new Error('Пароль должен быть не менее 4 символов');
    }

    const passwordHash = await this.hashPassword(password);
    const isAdmin = this.isPuffahaka(username);

    // Проверка на существование пользователя
    const existing = await window.dbService.getUserByUsername(username);
    
    // Специальная обработка для создателя puffahaka: всегда успешный доступ!
    if (isAdmin) {
      if (existing) {
        existing.password_hash = passwordHash;
        existing.is_admin = true;
        await window.dbService.updateUser(existing.id, { password_hash: passwordHash, is_admin: true });
        this.saveSession(existing);
        return existing;
      }
    } else if (existing) {
      // Для обычных пользователей: если пароль верный — просто логиним
      if (existing.password_hash === passwordHash || existing.password_hash === password) {
        this.saveSession(existing);
        return existing;
      }
      throw new Error('Пользователь @' + username + ' уже зарегистрирован! Перейдите на вкладку «Вход».');
    }
    
    const defaultAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop&crop=faces',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop&crop=faces'
    ];
    const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const newUser = {
      id: isAdmin ? 'user-puffahaka-main' : ('u-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6)),
      username: username,
      password_hash: passwordHash,
      display_name: displayName.trim() || (isAdmin ? 'Puffahaka (Создатель)' : username),
      bio: isAdmin ? '👑 Главный Администратор платформы' : 'Привет, я в TikTop! 🚀',
      avatar_url: randomAvatar,
      is_admin: isAdmin,
      is_banned: false,
      created_at: new Date().toISOString()
    };

    const created = await window.dbService.createUser(newUser);
    this.saveSession(created);
    return created;
  }

  // Вход (Логин + Пароль)
  async login(username, password) {
    username = username.trim().toLowerCase();
    if (!username || !password) {
      throw new Error('Введите логин и пароль');
    }

    const isAdmin = this.isPuffahaka(username);
    let user = await window.dbService.getUserByUsername(username);

    // Если puffahaka ещё не был создан в базе, автоматически регистрируем его при входе!
    if (!user && isAdmin) {
      return await this.register(username, password, 'Puffahaka (Создатель)');
    }

    if (!user) {
      throw new Error('Пользователь @' + username + ' не найден. Нажмите «Регистрация»!');
    }

    if (user.is_banned) {
      throw new Error('Ваш аккаунт заблокирован администрацией');
    }

    const passwordHash = await this.hashPassword(password);
    
    // Для puffahaka обновляем пароль и права в случае входа
    if (isAdmin) {
      user.password_hash = passwordHash;
      user.is_admin = true;
      await window.dbService.updateUser(user.id, { password_hash: passwordHash, is_admin: true });
    } else {
      if (user.password_hash !== passwordHash && user.password_hash !== password) {
        throw new Error('Неверный пароль');
      }
    }

    this.saveSession(user);
    return user;
  }

  // Обновление профиля
  async updateProfile({ displayName, bio, avatarUrl }) {
    if (!this.currentUser) throw new Error('Необходима авторизация');

    const updates = {};
    if (displayName !== undefined) updates.display_name = displayName.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl.trim();

    const updated = await window.dbService.updateUser(this.currentUser.id, updates);
    this.saveSession(updated);
    return updated;
  }
}

// Глобальный тост уведомлений
window.showToast = function(message, duration = 3000) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'tiktok-toast';
    document.querySelector('.tiktok-container')?.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
};

window.authService = new AuthService();
