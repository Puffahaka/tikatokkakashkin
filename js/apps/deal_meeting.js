// js/apps/deal_meeting.js - Экран очных встреч у метро с фиксацией времени завершения для автоочистки чатов

class DealMeetingApp {
  constructor() {
    this.activeMeetingId = null;
    this.inspectionProgress = 0;
    this.revealedHiddenDefect = false;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    window.eventBus.on('time:tick', () => {
      const meetings = window.gameState.state.scheduledMeetings;
      const currentMin = window.gameState.state.time.hour * 60 + window.gameState.state.time.minute;

      meetings.forEach(m => {
        if (m.status === 'pending' && currentMin >= m.targetTotalMinutes) {
          m.status = 'ready';
          window.soundFx.playNotification();
          window.eventBus.emit('notification:push', {
            title: 'Встреча началась!',
            body: `${m.npcName} ждет вас у метро: ${m.phoneData.modelName || m.phoneData.title}!`,
            app: 'deal_meeting',
            data: { id: m.id }
          });
        }
      });
      window.gameState.save();
    });
  }

  render(meetingId = null) {
    const screenEl = document.getElementById('screen-deal_meeting');
    if (!screenEl) return;

    if (meetingId) {
      this.activeMeetingId = meetingId;
    }

    const meetings = window.gameState.state.scheduledMeetings;
    const activeMeeting = meetings.find(m => m.id === this.activeMeetingId);

    if (activeMeeting) {
      screenEl.innerHTML = this._renderActiveMeetingRoom(activeMeeting);
      this._bindMeetingRoomEvents(screenEl, activeMeeting);
    } else {
      screenEl.innerHTML = this._renderMeetingsList(meetings);
      this._bindListEvents(screenEl);
    }
  }

  _renderMeetingsList(meetings) {
    return `
      <div class="meeting-container">
        <div class="meeting-top-bar">
          <div>
            <strong>Очные встречи</strong>
            <div class="meeting-sub-title">Сделки у метро, проверка и оплата</div>
          </div>
          <span class="meeting-counter-pill">${meetings.length} в списке</span>
        </div>

        <div class="meeting-body-scroll">
          ${meetings.length === 0 ? `
            <div class="empty-state">
              <div class="empty-illustration">🚇🤝</div>
              <h3>Нет активных встреч</h3>
              <p class="sub-text">Договоритесь о встрече в чате на «ФлипАвито», чтобы купить или продать товар.</p>
              <button class="btn-primary" onclick="window.openApp('flip_avito')">Перейти на ФлипАвито</button>
            </div>
          ` : ''}

          <div class="meeting-cards-stack">
            ${meetings.map(m => {
              const isPart = m.phoneData?.itemType === 'part';
              return `
                <div class="meeting-modern-card ${m.status}">
                  <div class="meeting-avatar-badge">${m.avatar}</div>
                  <div class="meeting-meta-box">
                    <div class="meeting-partner-row">
                      <strong class="partner-name">${m.npcName}</strong>
                      <span class="status-chip ${m.status}">${m.status === 'ready' ? '🟢 На месте' : '⏳ В пути'}</span>
                    </div>
                    <div class="meeting-subject-tag">
                      ${m.type === 'buy' ? 'Покупка' : 'Продажа'}: <b>${m.phoneData.modelName || m.phoneData.title}</b>
                    </div>
                    <div class="meeting-price-row">
                      <span>Сумма: <b>${m.price.toLocaleString('ru-RU')} ₽</b></span>
                      <small>Время: ${String(m.targetHour).padStart(2, '0')}:${String(m.targetMinute).padStart(2, '0')}</small>
                    </div>
                  </div>
                  <button class="btn-approach-deal ${m.status === 'ready' ? 'active' : ''}" data-id="${m.id}">
                    ${m.status === 'ready' ? 'Подойти ▶' : 'Ждать'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  _renderActiveMeetingRoom(m) {
    const isBuying = m.type === 'buy';
    const isPart = m.phoneData?.itemType === 'part';
    const itemTitle = m.phoneData.modelName || m.phoneData.title || 'Товар';

    return `
      <div class="metro-scene-wrapper">
        <div class="metro-hud-top">
          <button class="btn-metro-back" id="btn-leave-meeting">◀ Назад</button>
          <div class="partner-profile-pill">
            <span class="partner-ava">${m.avatar}</span>
            <div>
              <strong>${m.npcName}</strong>
              <div class="partner-sub">📍 У входа в метро • ${isBuying ? 'Продавец' : 'Покупатель'}</div>
            </div>
          </div>
        </div>

        <div class="metro-scene-stage">
          <div class="metro-speech-bubble" id="meeting-dialog-bubble">
            ${isBuying ? `«Привет! Вот ${isPart ? 'деталь' : 'телефон'}, как и договаривались. Можешь проверить перед оплатой.»` : `«Привет! Готов забрать ${itemTitle} за ${m.price.toLocaleString('ru-RU')} ₽.»`}
          </div>

          <div class="metro-item-showcase" id="inspection-phone">
            <div class="showcase-visual-content">
              ${isPart ? `
                <div class="showcase-part-box">
                  ${window.workbenchApp._renderRealisticPartSVG(m.phoneData.partType, m.phoneData.quality || 'oem', 'tray')}
                </div>
              ` : `
                <div class="showcase-phone-box">
                  ${window.GAME_CONSTANTS.renderPhoneMockupSVG(m.phoneData.modelId, m.phoneData.color, m.phoneData.defects)}
                </div>
              `}
            </div>
            <div class="showcase-item-title">${itemTitle}</div>
          </div>

          ${isBuying ? `
            <div class="metro-inspection-control">
              <div class="inspection-bar-track">
                <div class="inspection-bar-fill" style="width: ${this.inspectionProgress}%;"></div>
              </div>
              <div class="inspection-guide-text">
                ${this.inspectionProgress < 100 ? `Нажимайте на товар для проверки (${this.inspectionProgress}%)` : '✨ Осмотр завершен! Все проверено.'}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="metro-actions-dock">
          <div class="metro-deal-amount-tag">
            <span>К оплате:</span>
            <strong>${m.price.toLocaleString('ru-RU')} ₽</strong>
          </div>

          ${isBuying ? `
            <div class="metro-btn-group">
              ${this.revealedHiddenDefect ? `
                <button class="btn-metro-action warning" id="btn-demand-discount">⚠️ Сбить цену за скрытый дефект (-20%)</button>
              ` : ''}
              <button class="btn-metro-action success" id="btn-confirm-purchase">💵 Оплатить и забрать</button>
              <button class="btn-metro-action danger" id="btn-cancel-deal">✕ Отказаться от сделки</button>
            </div>
          ` : `
            <div class="metro-btn-group">
              <button class="btn-metro-action success" id="btn-confirm-sale">🤝 Передать товар и получить деньги</button>
              <button class="btn-metro-action danger" id="btn-cancel-deal">✕ Отменить сделку</button>
            </div>
          `}
        </div>
      </div>
    `;
  }

  _bindListEvents(container) {
    container.querySelectorAll('.btn-approach-deal.active').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundFx.playClick();
        this.activeMeetingId = btn.dataset.id;
        this.inspectionProgress = 0;
        this.revealedHiddenDefect = false;
        this.render();
      });
    });
  }

  _bindMeetingRoomEvents(container, m) {
    const btnLeave = container.querySelector('#btn-leave-meeting');
    if (btnLeave) {
      btnLeave.addEventListener('click', () => {
        window.soundFx.playClick();
        this.activeMeetingId = null;
        this.render();
      });
    }

    const itemEl = container.querySelector('#inspection-phone');
    if (itemEl && m.type === 'buy') {
      itemEl.addEventListener('click', () => {
        window.soundFx.playClick();
        this.inspectionProgress = Math.min(100, this.inspectionProgress + 35);

        if (this.inspectionProgress >= 70 && m.phoneData.hiddenDefect && !this.revealedHiddenDefect) {
          this.revealedHiddenDefect = true;
          window.soundFx.playFail();
          const defName = window.GAME_CONSTANTS.DEFECTS[m.phoneData.hiddenDefect]?.name || m.phoneData.hiddenDefect;
          
          const bubble = container.querySelector('#meeting-dialog-bubble');
          if (bubble) {
            bubble.innerHTML = `⚠️ <b>Найден скрытый дефект!</b> Продавец умолчал про: <i>«${defName}»</i>.`;
            bubble.classList.add('danger-text');
          }
        }
        this.render();
      });
    }

    const btnDiscount = container.querySelector('#btn-demand-discount');
    if (btnDiscount) {
      btnDiscount.addEventListener('click', () => {
        const discount = Math.round((m.price * 0.2) / 100) * 100;
        m.price -= discount;
        this.revealedHiddenDefect = false;
        window.soundFx.playMoney();
        window.showAlert(`Продавец занервничал и согласился скинуть -${discount.toLocaleString('ru-RU')} ₽! Новая цена: ${m.price.toLocaleString('ru-RU')} ₽.`, 'Торг успешен', '💰');
        this.render();
      });
    }

    const btnBuy = container.querySelector('#btn-confirm-purchase');
    if (btnBuy) {
      btnBuy.addEventListener('click', () => {
        if (!window.gameState.canAfford(m.price, 'card')) {
          window.showAlert('Недостаточно средств (на карте или наличными) для покупки!', 'Ошибка оплаты', '❌');
          return;
        }

        const isPart = m.phoneData?.itemType === 'part';
        window.gameState.spendMoney(m.price, 'card', isPart ? 'parts' : 'phones', `Покупка ${m.phoneData.modelName || m.phoneData.title} у ${m.npcName}`);

        if (isPart) {
          window.gameState.addSparePart(m.phoneData.modelId, m.phoneData.partType, m.phoneData.quality || 'oem', 1);
          this._completeAndCloseMeeting(m.id);
          window.soundFx.playSuccess();
          window.showAlert(`Сделка завершена! Запчасть добавлена на склад верстака.`, 'Покупка запчасти', '📦', () => {
            this.activeMeetingId = null;
            window.openApp('workbench');
          });
        } else {
          const newPhone = window.gameState.createPhoneInstance(m.phoneData.modelId, {
            colorIndex: 0,
            defects: m.phoneData.defects,
            buyPrice: m.price
          });
          newPhone.color = m.phoneData.color;
          newPhone.colorName = m.phoneData.colorName;

          window.gameState.addPhoneToInventory(newPhone);
          this._completeAndCloseMeeting(m.id);
          window.soundFx.playSuccess();
          window.showAlert(`Сделка завершена! ${newPhone.modelName} добавлен в ваш инвентарь.`, 'Успешная покупка', '🎉', () => {
            this.activeMeetingId = null;
            window.openApp('workbench');
          });
        }
      });
    }

    const btnSale = container.querySelector('#btn-confirm-sale');
    if (btnSale) {
      btnSale.addEventListener('click', () => {
        const isPart = m.phoneData?.itemType === 'part';

        if (isPart) {
          if (m.phoneData.quality === 'used' || m.phoneData.usedPartId) {
            window.gameState.removeUsedPart(m.phoneData.usedPartId);
          } else {
            window.gameState.useSparePart(m.phoneData.modelId, m.phoneData.partType, m.phoneData.quality || 'oem');
          }

          window.gameState.receiveMoney(m.price, 'card', 'phones', `Продажа детали: ${m.phoneData.title}`, m.price);
          window.gameState.state.stats.partsSold += 1;
          this._completeAndCloseMeeting(m.id);

          // Покупатель оставляет отзыв в Асиво
          window.gameState.addBuyerReview({
            authorName: m.npcName,
            avatar: m.avatar,
            itemTitle: m.phoneData.title || m.phoneData.modelName,
            isPhone: false
          });

          window.soundFx.playSuccess();
          window.showAlert(`Запчасть успешно продана! Зачислено +${m.price.toLocaleString('ru-RU')} ₽ на баланс. Покупатель оставил отзыв в профиле Асиво.`, 'Сделка завершена', '💵', () => {
            this.activeMeetingId = null;
            window.openApp('homescreen');
          });
        } else {
          const phone = window.gameState.getPhoneById(m.phoneData.phoneId);
          const profit = phone ? m.price - phone.buyPrice : m.price;

          window.gameState.receiveMoney(m.price, 'card', 'phones', `Продажа ${m.phoneData.modelName} покупателю ${m.npcName}`, profit);
          if (phone) window.gameState.removePhoneFromInventory(phone.id);

          window.gameState.state.stats.phonesSold += 1;
          this._completeAndCloseMeeting(m.id);

          // Покупатель оставляет отзыв в Асиво
          window.gameState.addBuyerReview({
            authorName: m.npcName,
            avatar: m.avatar,
            itemTitle: m.phoneData.title || m.phoneData.modelName,
            isPhone: true
          });

          window.soundFx.playSuccess();
          window.showAlert(`Смартфон продан! Вы заработали +${m.price.toLocaleString('ru-RU')} ₽ (чистая прибыль: +${profit.toLocaleString('ru-RU')} ₽)! Покупатель оставил отзыв в профиле Асиво.`, 'Успешная продажа', '💵', () => {
            this.activeMeetingId = null;
            window.openApp('homescreen');
          });
        }
      });
    }

    const btnCancel = container.querySelector('#btn-cancel-deal');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        window.showConfirm('Вы уверены, что хотите отменить встречу и уйти?', 'Отмена встречи', '❓', () => {
          this._completeAndCloseMeeting(m.id);
          this.activeMeetingId = null;
          this.render();
        });
      });
    }
  }

  _completeAndCloseMeeting(meetingId) {
    const currentTotalMinutes = window.gameState.state.time.day * 1440 + window.gameState.state.time.hour * 60 + window.gameState.state.time.minute;
    const meeting = window.gameState.state.scheduledMeetings.find(m => m.id === meetingId);
    if (meeting) {
      if (meeting.chatId) {
        const chat = window.gameState.state.chats.find(c => c.id === meeting.chatId);
        if (chat) {
          chat.state = 'completed';
          chat.closedAtTotalMinutes = currentTotalMinutes;
          if (chat.listingId) {
            const playerLot = window.gameState.state.marketListings.playerListings.find(l => l.id === chat.listingId);
            if (playerLot) playerLot.status = 'sold';
            const npcLot = window.gameState.state.marketListings.npcListings.find(l => l.id === chat.listingId);
            if (npcLot) window.gameState.state.marketListings.npcListings = window.gameState.state.marketListings.npcListings.filter(l => l !== npcLot);
          }
        }
      }
    }

    window.gameState.state.scheduledMeetings = window.gameState.state.scheduledMeetings.filter(m => m.id !== meetingId);
    window.gameState.save();
  }
}

window.dealMeetingApp = new DealMeetingApp();
