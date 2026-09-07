// js/apps/homescreen.js
// Рабочий стол, шторка системных уведомлений и запуск приложений

class HomeScreenApp {
  constructor() {
    this.apps = [
      { id: 'flip_avito', name: 'Асиво', icon: '🛍️', badge: 0, color: '#3f78e0' },
      { id: 'parts_market', name: 'PartsMarket', icon: '📦', badge: 0, color: '#f56a00' },
      { id: 'workbench', name: 'Верстак', icon: '🔧', badge: 0, color: '#10b981' },
      { id: 't_bank', name: 'Банк', icon: '💳', badge: 0, color: '#eab308' },
      { id: 'deal_meeting', name: 'Встречи', icon: '🤝', badge: 0, color: '#8b5cf6' },
      { id: 'settings', name: 'Настройки', icon: '⚙️', badge: 0, color: '#64748b' }
    ];
    this.isShadeOpen = false;
    this.notificationHistory = [];
  }

  init() {
    this.render();
    this.bindEvents();
    this.updateBadges();
  }

  bindEvents() {
    window.eventBus.on('time:tick', () => this.updateClockAndBar());
    window.eventBus.on('wallet:updated', () => this.updateClockAndBar());
    window.eventBus.on('state:updated', () => this.updateBadges());
    window.eventBus.on('notification:push', (n) => {
      this.notificationHistory.unshift({
        id: 'notif_' + Date.now(),
        timeStr: window.timeSystem.formatTime(),
        ...n
      });
      if (this.notificationHistory.length > 20) this.notificationHistory.pop();
      this.showToast(n);
      this.updateBadges();
    });

    // Клик по статус бару открывает шторку уведомлений
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) {
      statusBar.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          this.toggleNotificationShade();
        }
      });
    }
  }

  render() {
    const screenEl = document.getElementById('screen-homescreen');
    if (!screenEl) return;

    screenEl.innerHTML = `
      <div class="homescreen-container">
        <!-- Виджет времени и баланса -->
        <div class="homescreen-widget">
          <div class="widget-time" id="home-widget-time">10:00</div>
          <div class="widget-date" id="home-widget-date">День 1, Понедельник</div>
          <div class="widget-balance">
            <span>Баланс:</span>
            <strong id="home-widget-balance">40 000 ₽</strong>
          </div>
        </div>

        <!-- Сетка приложений с Настройками -->
        <div class="app-grid">
          ${this.apps.map(app => `
            <div class="app-icon-item" data-app="${app.id}">
              <div class="app-icon-box" style="background: ${app.color};">
                <span class="app-icon-symbol">${app.icon}</span>
                <span class="app-badge" id="badge-${app.id}" style="display: none;">0</span>
              </div>
              <span class="app-title">${app.name}</span>
            </div>
          `).join('')}
        </div>

        <!-- Совет перекупщика -->
        <div class="homescreen-tip-card">
          <div class="tip-header">💡 Совет мастера:</div>
          <div class="tip-body">
            В мастерской детали можно свободно раскладывать на коврике! Чтобы выгодно продать телефон, очищайте корпус и устраняйте скрытые дефекты.
          </div>
        </div>
      </div>

      <!-- Выдвижная шторка системных уведомлений (Notification Shade) -->
      <div class="notification-shade ${this.isShadeOpen ? 'open' : ''}" id="notification-shade">
        <div class="shade-header">
          <div class="shade-time-block">
            <span class="shade-clock" id="shade-clock">10:00</span>
            <span class="shade-date" id="shade-date">День 1</span>
          </div>
          <button class="btn-clear-shade" id="btn-clear-shade">Очистить все</button>
        </div>

        <div class="shade-notifications-list" id="shade-notifications-list">
          ${this._renderShadeNotifications()}
        </div>

        <div class="shade-handle" id="shade-handle">
          <span>▲ Закрыть шторку</span>
        </div>
      </div>
    `;

    // Привязка кликов по приложениям
    screenEl.querySelectorAll('.app-icon-item').forEach(el => {
      el.addEventListener('click', () => {
        const appId = el.dataset.app;
        window.soundFx.playClick();
        window.openApp(appId);
      });
    });

    // Управление шторкой
    const handle = screenEl.querySelector('#shade-handle');
    if (handle) {
      handle.addEventListener('click', () => this.toggleNotificationShade(false));
    }

    const btnClear = screenEl.querySelector('#btn-clear-shade');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.notificationHistory = [];
        this._updateShadeList();
      });
    }

    this.updateClockAndBar();
  }

  _renderShadeNotifications() {
    if (this.notificationHistory.length === 0) {
      return '<div class="empty-shade">Нет новых системных уведомлений</div>';
    }

    return this.notificationHistory.map(n => `
      <div class="shade-notif-item" data-app="${n.app || ''}">
        <div class="shade-notif-top">
          <strong>${n.title}</strong>
          <span class="shade-notif-time">${n.timeStr}</span>
        </div>
        <div class="shade-notif-body">${n.body}</div>
      </div>
    `).join('');
  }

  _updateShadeList() {
    const listEl = document.getElementById('shade-notifications-list');
    if (listEl) {
      listEl.innerHTML = this._renderShadeNotifications();
      this._bindShadeItems(listEl);
    }
  }

  _bindShadeItems(container) {
    container.querySelectorAll('.shade-notif-item').forEach(item => {
      item.addEventListener('click', () => {
        const app = item.dataset.app;
        if (app) {
          this.toggleNotificationShade(false);
          window.openApp(app);
        }
      });
    });
  }

  toggleNotificationShade(force = null) {
    this.isShadeOpen = force !== null ? force : !this.isShadeOpen;
    const shadeEl = document.getElementById('notification-shade');
    if (shadeEl) {
      shadeEl.classList.toggle('open', this.isShadeOpen);
      if (this.isShadeOpen) {
        window.soundFx.playClick();
        this._updateShadeList();
      }
    }
  }

  updateClockAndBar() {
    const time = window.gameState.state.time;
    const timeStr = window.timeSystem.formatTime(time);
    
    const sbTime = document.getElementById('status-bar-time');
    if (sbTime) sbTime.textContent = timeStr;

    const sbBalance = document.getElementById('status-bar-balance');
    if (sbBalance) {
      sbBalance.textContent = window.gameState.totalBalance.toLocaleString('ru-RU') + ' ₽';
    }

    const widgetTime = document.getElementById('home-widget-time');
    if (widgetTime) widgetTime.textContent = timeStr;

    const widgetDate = document.getElementById('home-widget-date');
    if (widgetDate) {
      const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      widgetDate.textContent = `День ${time.day} (${days[(time.day - 1) % 7]})`;
    }

    const widgetBalance = document.getElementById('home-widget-balance');
    if (widgetBalance) {
      widgetBalance.textContent = window.gameState.totalBalance.toLocaleString('ru-RU') + ' ₽';
    }
  }

  updateBadges() {
    const readyMeetings = window.gameState.state.scheduledMeetings.filter(m => m.status === 'ready').length;
    this._setBadge('deal_meeting', readyMeetings);

    const activeChats = window.gameState.state.chats.filter(c => c.state === 'negotiating').length;
    this._setBadge('flip_avito', activeChats);

    const brokenPhones = window.gameState.state.inventory.phones.filter(p => p.currentDefects.length > 0).length;
    this._setBadge('workbench', brokenPhones);
  }

  _setBadge(appId, count) {
    const badgeEl = document.getElementById(`badge-${appId}`);
    if (!badgeEl) return;
    if (count > 0) {
      badgeEl.textContent = count > 9 ? '9+' : count;
      badgeEl.style.display = 'flex';
    } else {
      badgeEl.style.display = 'none';
    }
  }

  showToast({ title, body, app, data }) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'phone-toast';
    toast.innerHTML = `
      <div class="toast-indicator"></div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-body">${body}</div>
      </div>
    `;

    toast.addEventListener('click', () => {
      toast.remove();
      if (app) {
        window.soundFx.playClick();
        window.openApp(app, data);
      }
    });

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }
}

window.homeScreenApp = new HomeScreenApp();
