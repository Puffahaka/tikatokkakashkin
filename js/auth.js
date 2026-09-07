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

  // SHA-256 хэширование пароля
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

  isAdmin() {
    if (!this.currentUser) return false;
    return this.currentUser.is_admin || this.currentUser.username.toLowerCase() === 'puffahaka';
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

    // Проверка на существование пользователя
    const existing = await window.dbService.getUserByUsername(username);
    if (existing) {
      throw new Error('Пользователь с таким ником уже существует');
    }

    const passwordHash = await this.hashPassword(password);
    
    // Специальное условие: puffahaka получает статус админа!
    const isAdmin = username === 'puffahaka';

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=faces',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&h=150&fit=crop&crop=faces',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop&crop=faces'
    ];
    const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const newUser = {
      id: 'u-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      username: username,
      password_hash: passwordHash,
      display_name: displayName.trim() || username,
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

    const user = await window.dbService.getUserByUsername(username);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    if (user.is_banned) {
      throw new Error('Ваш аккаунт заблокирован администрацией');
    }

    const passwordHash = await this.hashPassword(password);
    // Проверяем хэш или plain text (для демо)
    if (user.password_hash !== passwordHash && user.password_hash !== password) {
      throw new Error('Неверный пароль');
    }

    // Если это puffahaka, гарантируем права админа
    if (user.username.toLowerCase() === 'puffahaka' && !user.is_admin) {
      user.is_admin = true;
      await window.dbService.updateUser(user.id, { is_admin: true });
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
