// js/time_system.js
// Игровое время, доставка с росписью курьеру и авто-очистка оконченных диалогов

class TimeSystem {
  constructor() {
    this.timerId = null;
    this.isPaused = false;
  }

  start() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      if (!this.isPaused) {
        this.tick();
      }
    }, window.GAME_CONSTANTS.TIME_SPEED_MS);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    window.eventBus.emit('time:pause_toggled', this.isPaused);
  }

  tick() {
    const time = window.gameState.state.time;
    time.minute += 1;

    if (time.minute >= 60) {
      time.minute = 0;
      time.hour += 1;
      if (time.hour >= 24) {
        time.hour = 8;
        time.day += 1;
        window.eventBus.emit('time:new_day', time.day);
      }
      window.eventBus.emit('time:hour_passed', time);
    }

    this._checkDeliveries();
    this._checkMeetings();
    this._checkPlayerListingsInquiries();
    this._checkMarketAutoPublications();
    this._cleanOldFinishedChats();

    window.eventBus.emit('time:tick', { ...time });
  }

  // Автоматическая публикация новых объявлений продавцами в Асиво каждые 5-10 игровых минут
  _checkMarketAutoPublications() {
    const time = window.gameState.state.time;
    if (time.minute % 5 === 0) {
      if (window.flipAvitoApp) {
        window.flipAvitoApp._simulateMarketFluctuations();
      }
    }
  }

  _checkDeliveries() {
    const time = window.gameState.state.time;
    const currentTotalMinutes = time.day * 1440 + time.hour * 60 + time.minute;
    const deliveries = window.gameState.state.pendingDeliveries;

    for (let i = deliveries.length - 1; i >= 0; i--) {
      const d = deliveries[i];
      const targetTime = d.arrivalTotalMinutes || d.arriveTotalMinutes || 0;

      if (currentTotalMinutes >= targetTime && !d.awaitingSignature) {
        d.awaitingSignature = true;
        window.soundFx.playNotification();

        // Запрос интерактивной росписи игрока за получение
        window.eventBus.emit('delivery:request_signature', {
          delivery: d,
          onSigned: () => {
            // Начисление запчастей после росписи в накладной
            if (d.items && Array.isArray(d.items)) {
              d.items.forEach(item => {
                window.gameState.addSparePart(item.modelId, item.partType, item.quality, item.count);
              });
            } else if (d.modelId && d.partType) {
              window.gameState.addSparePart(d.modelId, d.partType, d.quality || 'copy', d.count || 1);
            }

            const delIndex = window.gameState.state.pendingDeliveries.findIndex(item => item.id === d.id);
            if (delIndex !== -1) {
              window.gameState.state.pendingDeliveries.splice(delIndex, 1);
            }
            window.gameState.save();

            window.soundFx.playSuccess();
            window.eventBus.emit('inventory:updated', window.gameState.state.inventory);
          }
        });
      }
    }
  }

  _checkMeetings() {
    const time = window.gameState.state.time;
    const currentTotalMinutes = time.day * 1440 + time.hour * 60 + time.minute;
    const meetings = window.gameState.state.scheduledMeetings;

    meetings.forEach(m => {
      if (m.status === 'pending' && currentTotalMinutes >= m.targetTotalMinutes) {
        m.status = 'ready';
        window.gameState.save();
        window.soundFx.playNotification();
        window.eventBus.emit('meeting:ready', m);
        window.eventBus.emit('notification:push', {
          title: 'Встреча началась!',
          body: `${m.type === 'buy' ? 'Продавец' : 'Покупатель'} ждет вас: ${m.phoneData.modelName || m.phoneData.title}`,
          app: 'deal_meeting',
          data: m
        });
      }
    });
  }

  _checkPlayerListingsInquiries() {
    const time = window.gameState.state.time;
    // Клиенты пишут реже: проверка каждые 20 игровых минут с умеренной вероятностью
    if (time.minute % 20 !== 0) return;

    const listings = window.gameState.state.marketListings.playerListings.filter(l => l.status === 'active');
    if (listings.length === 0) return;

    listings.forEach(listing => {
      if (listing.itemType === 'part') {
        const existingChat = window.gameState.state.chats.find(
          c => c.listingId === listing.id && c.role === 'buyer' && c.state !== 'completed' && c.state !== 'declined'
        );
        if (!existingChat && Math.random() < 0.35) {
          window.eventBus.emit('flip_avito:new_part_buyer_inquiry', { listing });
        }
      } else {
        const phone = window.gameState.getPhoneById(listing.phoneId);
        if (!phone) return;

        const marketValue = window.gameState.calculateMarketValue(phone);
        const ratio = listing.askingPrice / marketValue;

        let chance = 0.28;
        if (ratio < 0.9) chance = 0.55;
        else if (ratio < 1.05) chance = 0.35;
        else if (ratio > 1.25) chance = 0.08;

        if (Math.random() < chance) {
          const existingChat = window.gameState.state.chats.find(
            c => c.listingId === listing.id && c.role === 'buyer' && c.state !== 'completed' && c.state !== 'declined'
          );
          if (!existingChat) {
            window.eventBus.emit('flip_avito:new_buyer_inquiry', { listing, phone, marketValue });
          }
        }
      }
    });
  }

  // Автоматическое удаление оконченных и отклоненных чатов через 30 игровых минут
  _cleanOldFinishedChats() {
    const time = window.gameState.state.time;
    const currentTotalMinutes = time.day * 1440 + time.hour * 60 + time.minute;
    const chats = window.gameState.state.chats;

    let modified = false;
    for (let i = chats.length - 1; i >= 0; i--) {
      const c = chats[i];
      if (c.state === 'completed' || c.state === 'declined') {
        if (!c.closedAtTotalMinutes) {
          c.closedAtTotalMinutes = currentTotalMinutes;
          modified = true;
        } else if (currentTotalMinutes - c.closedAtTotalMinutes >= 30) {
          chats.splice(i, 1);
          modified = true;
        }
      }
    }

    if (modified) {
      window.gameState.save();
      if (window.gameState.state.activeApp === 'flip_avito') {
        window.flipAvitoApp.render();
      }
    }
  }

  formatTime(timeObj = null) {
    const t = timeObj || window.gameState.state.time;
    return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
  }

  addMinutes(minutesToAdd) {
    const time = window.gameState.state.time;
    let total = time.hour * 60 + time.minute + minutesToAdd;
    let targetDay = time.day;
    while (total >= 1440) {
      total -= 1440;
      targetDay += 1;
    }
    const targetHour = Math.floor(total / 60);
    const targetMinute = total % 60;
    return {
      day: targetDay,
      hour: targetHour,
      minute: targetMinute,
      totalMinutes: targetDay * 1440 + total
    };
  }
}

window.timeSystem = new TimeSystem();
