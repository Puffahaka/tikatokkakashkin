/**
 * ADMIN PANEL MODULE (EXCLUSIVE FOR 'PUFFAHAKA')
 * Панель управления, модерация видео и пользователей,
 * просмотр системной статистики.
 */

class AdminPanel {
  constructor() {
    this.modal = document.getElementById('admin-modal');
    this.statsContainer = document.getElementById('admin-stats-container');
    this.videosList = document.getElementById('admin-videos-list');
    this.usersList = document.getElementById('admin-users-list');

    this.init();
  }

  init() {
    const closeBtn = document.getElementById('btn-close-admin');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.modal.classList.remove('open');
      });
    }

    // Tabs inside admin panel
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.target;
        document.querySelectorAll('.admin-subview').forEach(v => v.style.display = 'none');
        const activeView = document.getElementById(`admin-view-${target}`);
        if (activeView) activeView.style.display = 'block';
      });
    });
  }

  async open() {
    if (!window.authService.isAdmin()) {
      window.showToast('⛔ Доступ запрещен! Только для puffahaka 👑');
      return;
    }

    this.modal.classList.add('open');
    await this.loadStats();
    await this.loadVideos();
    await this.loadUsers();
  }

  async loadStats() {
    if (!this.statsContainer) return;
    const stats = await window.dbService.getSystemStats();
    this.statsContainer.innerHTML = `
      <div class="admin-stat-card">
        <div class="admin-stat-val">${stats.totalUsers}</div>
        <div class="admin-stat-title">👥 Пользователи</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-val">${stats.totalVideos}</div>
        <div class="admin-stat-title">🎬 Видео в ленте</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-val">${stats.totalLikes}</div>
        <div class="admin-stat-title">❤️ Лайки</div>
      </div>
      <div class="admin-stat-card">
        <div class="admin-stat-val">${stats.totalComments}</div>
        <div class="admin-stat-title">💬 Комментарии</div>
      </div>
    `;
  }

  async loadVideos() {
    if (!this.videosList) return;
    this.videosList.innerHTML = '<tr><td colspan="4" style="text-align:center;">⏳ Загрузка видео...</td></tr>';

    const videos = await window.dbService.getVideos();
    if (videos.length === 0) {
      this.videosList.innerHTML = '<tr><td colspan="4" style="text-align:center;">Нет видео для отображения</td></tr>';
      return;
    }

    this.videosList.innerHTML = '';
    videos.forEach(v => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>@${v.username}</td>
        <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v.caption}</td>
        <td>❤️ ${v.likes_count || 0}</td>
        <td>
          <button class="admin-btn-action admin-btn-delete" onclick="window.adminPanel.deleteVideo('${v.id}')">Удалить</button>
        </td>
      `;
      this.videosList.appendChild(row);
    });
  }

  async loadUsers() {
    if (!this.usersList) return;
    this.usersList.innerHTML = '<tr><td colspan="4" style="text-align:center;">⏳ Загрузка пользователей...</td></tr>';

    const users = await window.dbService.getAllUsers();
    this.usersList.innerHTML = '';

    users.forEach(u => {
      const row = document.createElement('tr');
      const isPuffahaka = u.username.toLowerCase() === 'puffahaka';
      row.innerHTML = `
        <td>
          @${u.username}
          ${isPuffahaka ? '<span style="color:#ffd700;">👑</span>' : ''}
          ${u.is_banned ? '<span style="color:#ff334b;">[БАН]</span>' : ''}
        </td>
        <td>${u.display_name || u.username}</td>
        <td>${u.is_admin ? 'Admin' : 'User'}</td>
        <td>
          ${!isPuffahaka ? `
            <button class="admin-btn-action admin-btn-ban" onclick="window.adminPanel.toggleBanUser('${u.id}', ${!u.is_banned})">
              ${u.is_banned ? 'Разбан' : 'Бан'}
            </button>
          ` : '<span style="color:var(--text-dim);font-size:10px;">Создатель</span>'}
        </td>
      `;
      this.usersList.appendChild(row);
    });
  }

  async deleteVideo(videoId) {
    if (confirm('Вы точно хотите удалить это видео?')) {
      await window.dbService.deleteVideo(videoId);
      window.showToast('🗑 Видео удалено администратором');
      await this.loadVideos();
      await this.loadStats();
      await window.feedEngine.loadFeed();
    }
  }

  async toggleBanUser(userId, newBanStatus) {
    await window.dbService.updateUser(userId, { is_banned: newBanStatus });
    window.showToast(newBanStatus ? '🚫 Пользователь заблокирован' : '✅ Пользователь разблокирован');
    await this.loadUsers();
  }
}

window.adminPanel = new AdminPanel();
