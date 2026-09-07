// js/main.js
// Главная точка входа: навигация, переключение тем, внутриигровые модальные окна и роспись курьеру

window.showAlert = function(message, title = 'Уведомление', icon = '💡', onOk = null) {
  const container = document.querySelector('.phone-viewport-wrapper') || document.body;
  
  const existing = document.getElementById('ingame-alert-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'ingame-alert-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card ingame-popup-card">
      <div class="ingame-popup-header">
        <span class="ingame-popup-icon">${icon}</span>
        <h4>${title}</h4>
      </div>
      <div class="ingame-popup-body">
        <p>${message}</p>
      </div>
      <div class="ingame-popup-footer">
        <button class="btn-primary" id="btn-ingame-alert-ok">Понятно</button>
      </div>
    </div>
  `;

  container.appendChild(modal);

  const btnOk = modal.querySelector('#btn-ingame-alert-ok');
  btnOk.addEventListener('click', () => {
    window.soundFx.playClick();
    modal.remove();
    if (onOk) onOk();
  });
};

window.showConfirm = function(message, title = 'Подтверждение', icon = '❓', onConfirm = null, onCancel = null) {
  const container = document.querySelector('.phone-viewport-wrapper') || document.body;
  
  const existing = document.getElementById('ingame-confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'ingame-confirm-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card ingame-popup-card">
      <div class="ingame-popup-header">
        <span class="ingame-popup-icon">${icon}</span>
        <h4>${title}</h4>
      </div>
      <div class="ingame-popup-body">
        <p>${message}</p>
      </div>
      <div class="ingame-popup-footer double-btn">
        <button class="btn-secondary" id="btn-ingame-cancel">Отмена</button>
        <button class="btn-primary" id="btn-ingame-confirm">Да, продолжить</button>
      </div>
    </div>
  `;

  container.appendChild(modal);

  modal.querySelector('#btn-ingame-confirm').addEventListener('click', () => {
    window.soundFx.playClick();
    modal.remove();
    if (onConfirm) onConfirm();
  });

  modal.querySelector('#btn-ingame-cancel').addEventListener('click', () => {
    window.soundFx.playClick();
    modal.remove();
    if (onCancel) onCancel();
  });
};

// Интерактивная электронная накладная с росписью курьеру (Signature Receipt Modal)
window.showCourierSignatureModal = function(delivery, onSigned) {
  const container = document.querySelector('.phone-viewport-wrapper') || document.body;

  const existing = document.getElementById('courier-signature-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'courier-signature-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card courier-receipt-card">
      <div class="receipt-header">
        <div class="receipt-courier-ava">🚚</div>
        <div>
          <h4>Служба доставки САДЭК Экспресс</h4>
          <span class="receipt-track-num">Накладная №${delivery.id || 'SADEK-' + Date.now().toString().slice(-6)}</span>
        </div>
      </div>

      <div class="receipt-item-info">
        <div class="receipt-item-name">📦 <b>${delivery.partName || 'Запчасть к смартфону'}</b></div>
        <div class="receipt-item-quality">Качество: <b>${(delivery.quality || 'OEM').toUpperCase()}</b> • Кол-во: <b>${delivery.count || 1} шт.</b></div>
      </div>

      <div class="signature-pad-wrapper">
        <div class="signature-instruction">Поставьте роспись за получение посылки:</div>
        <div class="signature-canvas-container">
          <canvas id="courier-sign-canvas" width="280" height="110"></canvas>
          <button class="btn-clear-signature" id="btn-clear-signature" title="Стереть подпись">🔄 Очистить</button>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-primary btn-sign-confirm" id="btn-confirm-signature">✍️ Расписаться и принять посылку</button>
      </div>
    </div>
  `;

  container.appendChild(modal);

  const canvas = modal.querySelector('#courier-sign-canvas');
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let isDrawing = false;
  let hasSigned = false;

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    isDrawing = true;
    hasSigned = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => {
    isDrawing = false;
  };

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stopDraw);

  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  window.addEventListener('touchend', stopDraw);

  modal.querySelector('#btn-clear-signature').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSigned = false;
  });

  modal.querySelector('#btn-confirm-signature').addEventListener('click', () => {
    window.soundFx.playClick();
    modal.remove();
    window.gameState.completeDeliverySignature(delivery.id);
    if (onSigned) onSigned();
    window.showAlert(
      `Вы расписались в накладной! ${delivery.partName || 'Запчасть'} успешно доставлена и готова к установке на верстаке.`,
      'Посылка получена',
      '📦'
    );
  });
};

window.openApp = function(appId, param = null) {
  document.querySelectorAll('.app-screen').forEach(screen => {
    screen.classList.remove('active');
  });

  const targetScreen = document.getElementById(`screen-${appId}`);
  if (targetScreen) {
    targetScreen.classList.add('active');
    window.gameState.state.activeApp = appId;

    const statusBar = document.querySelector('.status-bar');
    const bottomNav = document.querySelector('.phone-bottom-nav');
    const phoneWrapper = document.querySelector('.phone-viewport-wrapper');

    if (appId === 'workbench') {
      if (statusBar) statusBar.classList.add('hide-in-repair');
      if (bottomNav) bottomNav.classList.add('hide-in-repair');
      if (phoneWrapper) phoneWrapper.classList.add('repair-fullscreen-mode');
    } else {
      if (statusBar) statusBar.classList.remove('hide-in-repair');
      if (bottomNav) bottomNav.classList.remove('hide-in-repair');
      if (phoneWrapper) phoneWrapper.classList.remove('repair-fullscreen-mode');
    }

    switch (appId) {
      case 'homescreen':
        window.homeScreenApp.render();
        break;
      case 'flip_avito':
        window.flipAvitoApp.render(param);
        break;
      case 'parts_market':
        window.partsMarketApp.render();
        break;
      case 'workbench':
        window.workbenchApp.render();
        break;
      case 't_bank':
        window.tBankApp.render();
        break;
      case 'deal_meeting':
        window.dealMeetingApp.render(param ? param.id : null);
        break;
      case 'settings':
        window.settingsApp.render();
        break;
    }

    const navHome = document.getElementById('btn-nav-home');
    if (navHome) {
      navHome.style.display = (appId === 'homescreen' || appId === 'workbench') ? 'none' : 'flex';
    }

    window.eventBus.emit('app:opened', appId);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window.gameState.init();

  window.homeScreenApp.init();
  window.flipAvitoApp.init();
  window.partsMarketApp.init();
  window.workbenchApp.init();
  window.tBankApp.init();
  window.dealMeetingApp.init();
  window.settingsApp.init();

  // Слушатель запроса росписи за посылку
  window.eventBus.on('delivery:request_signature', ({ delivery, onSigned }) => {
    window.showCourierSignatureModal(delivery, onSigned);
  });

  window.timeSystem.start();

  const btnHomeBar = document.getElementById('home-indicator-bar');
  if (btnHomeBar) {
    btnHomeBar.addEventListener('click', () => {
      window.soundFx.playClick();
      window.openApp('homescreen');
    });
  }

  const btnNavHome = document.getElementById('btn-nav-home');
  if (btnNavHome) {
    btnNavHome.addEventListener('click', () => {
      window.soundFx.playClick();
      window.openApp('homescreen');
    });
  }

  const btnThemeToggle = document.getElementById('btn-toggle-theme');
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      window.soundFx.playClick();
      window.gameState.toggleTheme();
      btnThemeToggle.textContent = window.gameState.state.settings.theme === 'dark' ? '☀️' : '🌙';
    });
    btnThemeToggle.textContent = window.gameState.state.settings.theme === 'dark' ? '☀️' : '🌙';
  }

  const btnPause = document.getElementById('btn-toggle-time');
  if (btnPause) {
    btnPause.addEventListener('click', (e) => {
      e.stopPropagation();
      window.timeSystem.togglePause();
      btnPause.textContent = window.timeSystem.isPaused ? '▶️' : '⏸️';
    });
  }

  const btnReset = document.getElementById('btn-reset-save');
  if (btnReset) {
    btnReset.addEventListener('click', (e) => {
      e.stopPropagation();
      window.showConfirm(
        'Вы действительно хотите сбросить весь прогресс и начать заново?',
        'Сброс сохранения',
        '🔄',
        () => {
          window.gameState.resetGame();
          window.openApp('homescreen');
        }
      );
    });
  }

  window.openApp('homescreen');
});
