// js/apps/settings.js - Настройки без браузерных alert/confirm

class SettingsApp {
  constructor() {}

  init() {
    this.bindEvents();
  }

  bindEvents() {
    window.eventBus.on('theme:changed', () => {
      if (window.gameState.state.activeApp === 'settings') {
        this.render();
      }
    });
  }

  render() {
    const screenEl = document.getElementById('screen-settings');
    if (!screenEl) return;

    const settings = window.gameState.state.settings;
    const skins = window.GAME_CONSTANTS.DEVICE_SKINS;
    const currentSkin = settings.deviceSkin || 'phone_titanium';

    screenEl.innerHTML = `
      <div class="settings-container">
        <div class="settings-header">
          <button class="btn-settings-back" id="btn-settings-back">◀</button>
          <h2>Настройки</h2>
        </div>

        <div class="settings-content">
          <!-- 1. ТЕМА ОФОРМЛЕНИЯ -->
          <div class="settings-section">
            <div class="section-label">Оформление системы</div>
            <div class="theme-switch-grid">
              <button class="theme-choice-btn ${settings.theme === 'dark' ? 'active' : ''}" data-theme="dark">
                <span class="theme-icon">🌙</span>
                <strong>Тёмная</strong>
              </button>
              <button class="theme-choice-btn ${settings.theme === 'light' ? 'active' : ''}" data-theme="light">
                <span class="theme-icon">☀️</span>
                <strong>Светлая</strong>
              </button>
            </div>
          </div>

          <!-- 2. ВЫБОР ДЕВАЙСА (СКИНОМ КОРПУСА) -->
          <div class="settings-section">
            <div class="section-label">Скин виртуального смартфона</div>
            <div class="device-skins-grid">
              ${Object.values(skins).map(s => `
                <div class="skin-card ${s.id === currentSkin ? 'active' : ''}" data-skin="${s.id}">
                  <div class="skin-swatch" style="background: ${s.frameColor}; border-color: ${s.accent};"></div>
                  <div class="skin-info">
                    <strong>${s.name}</strong>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- 3. ЗВУК И ЭФФЕКТЫ -->
          <div class="settings-section">
            <div class="section-label">Звуки и тактильность</div>
            <div class="settings-row">
              <span>Звуковые эффекты (Web Audio)</span>
              <button class="btn-toggle-sound" id="btn-toggle-sound">
                ${window.soundFx.muted ? '🔇 Выкл' : '🔊 Вкл'}
              </button>
            </div>
          </div>

          <!-- 4. СКОРОСТЬ ВРЕМЕНИ -->
          <div class="settings-section">
            <div class="section-label">Игровое время</div>
            <div class="time-speed-row">
              <button class="btn-speed ${!window.timeSystem.isPaused ? 'active' : ''}" id="btn-speed-play">▶️ Идет</button>
              <button class="btn-speed ${window.timeSystem.isPaused ? 'active' : ''}" id="btn-speed-pause">⏸️ Пауза</button>
            </div>
          </div>

          <!-- 5. ОПАСНАЯ ЗОНА: СБРОС -->
          <div class="settings-section danger-zone">
            <div class="section-label">Данные и прогресс</div>
            <button class="btn-danger-full" id="btn-reset-game-data">
              🗑️ Сбросить весь прогресс и начать заново
            </button>
          </div>
        </div>
      </div>
    `;

    this._bindEvents(screenEl);
  }

  _bindEvents(container) {
    const btnBack = container.querySelector('#btn-settings-back');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        window.soundFx.playClick();
        window.openApp('homescreen');
      });
    }

    container.querySelectorAll('.theme-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        window.soundFx.playClick();
        window.gameState.state.settings.theme = theme;
        window.gameState.applyTheme(theme);
        window.gameState.save();
        window.eventBus.emit('theme:changed', theme);
        this.render();
      });
    });

    container.querySelectorAll('.skin-card').forEach(card => {
      card.addEventListener('click', () => {
        const skinId = card.dataset.skin;
        window.soundFx.playClick();
        window.gameState.state.settings.deviceSkin = skinId;
        this._applySkin(skinId);
        window.gameState.save();
        this.render();
      });
    });

    const btnSound = container.querySelector('#btn-toggle-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        window.soundFx.muted = !window.soundFx.muted;
        window.soundFx.playClick();
        this.render();
      });
    }

    const btnPlay = container.querySelector('#btn-speed-play');
    const btnPause = container.querySelector('#btn-speed-pause');
    if (btnPlay && btnPause) {
      btnPlay.addEventListener('click', () => {
        window.timeSystem.resume();
        window.soundFx.playClick();
        this.render();
      });
      btnPause.addEventListener('click', () => {
        window.timeSystem.pause();
        window.soundFx.playClick();
        this.render();
      });
    }

    const btnReset = container.querySelector('#btn-reset-game-data');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        window.showConfirm(
          'Внимание! Все накопленные средства, купленные смартфоны и запчасти на складе будут удалены.\n\nНачать игру заново со стартовым капиталом?',
          'Сброс игры',
          '🗑️',
          () => {
            window.gameState.resetGame();
            window.openApp('homescreen');
          }
        );
      });
    }
  }

  _applySkin(skinId) {
    const skin = window.GAME_CONSTANTS.DEVICE_SKINS[skinId];
    if (!skin) return;

    const wrapper = document.querySelector('.phone-viewport-wrapper');
    if (wrapper) {
      wrapper.style.borderColor = skin.frameColor;
    }
  }
}

window.settingsApp = new SettingsApp();
