// js/apps/parts_market.js - Маркетплейс деталей с современным логистическим складом и отслеживанием доставок

class PartsMarketApp {
  constructor() {
    this.selectedModelId = 'ifruit_11';
    this.activeTab = 'catalog';
    this.warehouseFilter = 'all';
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    window.eventBus.on('inventory:updated', () => {
      if (window.gameState.state.activeApp === 'parts_market') {
        this.render();
      }
    });
    window.eventBus.on('delivery:arrived', () => {
      if (window.gameState.state.activeApp === 'parts_market') {
        this.render();
      }
    });
  }

  render() {
    const screenEl = document.getElementById('screen-parts_market');
    if (!screenEl) return;

    const totalParts = window.gameState.state.inventory.spareParts.reduce((s, p) => s + p.count, 0);
    const totalDeliveries = window.gameState.state.pendingDeliveries.length;

    screenEl.innerHTML = `
      <div class="parts-market-container">
        <div class="parts-header">
          <div class="parts-logo">
            <span>📦</span>
            <strong>PartsMarket</strong>
          </div>
          <div class="parts-sub">Быстрая доставка курьером САДЭК за 15 мин.</div>
        </div>

        <div class="parts-tabs">
          <button class="parts-tab ${this.activeTab === 'catalog' ? 'active' : ''}" data-tab="catalog">
            Каталог деталей
          </button>
          <button class="parts-tab ${this.activeTab === 'my_parts' ? 'active' : ''}" data-tab="my_parts">
            Склад и доставки (${totalParts}${totalDeliveries > 0 ? ` + 🚚${totalDeliveries}` : ''})
          </button>
        </div>

        <div class="parts-body">
          ${this.activeTab === 'catalog' ? this._renderCatalog() : this._renderWarehouse()}
        </div>
      </div>
    `;

    this._bindEvents(screenEl);
  }

  _renderCatalog() {
    const model = window.GAME_CONSTANTS.PHONE_MODELS[this.selectedModelId] || window.GAME_CONSTANTS.PHONE_MODELS.iphone_11;

    return `
      <div class="model-picker">
        <label class="form-label">Модель смартфона для подбора:</label>
        <select class="form-select" id="parts-model-select">
          ${Object.values(window.GAME_CONSTANTS.PHONE_MODELS).map(m => `
            <option value="${m.id}" ${m.id === this.selectedModelId ? 'selected' : ''}>
              ${m.name}
            </option>
          `).join('')}
        </select>
      </div>

      <div class="parts-list">
        ${Object.entries(model.parts).map(([partType, partInfo]) => `
          <div class="part-card" data-type="${partType}">
            <div class="part-card-header">
              <span class="part-icon">${this._getPartIcon(partType)}</span>
              <strong>${partInfo.name}</strong>
            </div>

            <div class="part-variants">
              <div class="part-variant-box standard">
                <div class="variant-info">
                  <span class="variant-badge copy">⚡ КОПИЯ (HQ)</span>
                  <span class="variant-desc">Выгодная цена для быстрой перепродажи</span>
                </div>
                <div class="variant-buy-row">
                  <span class="variant-price">${partInfo.copyPrice.toLocaleString('ru-RU')} ₽</span>
                  <button class="btn-buy-part btn-copy" data-model="${model.id}" data-type="${partType}" data-quality="copy" data-price="${partInfo.copyPrice}">
                    Заказать
                  </button>
                </div>
              </div>

              <div class="part-variant-box premium">
                <div class="variant-info">
                  <span class="variant-badge oem">⭐ ОРИГИНАЛ (OEM)</span>
                  <span class="variant-desc">Заводское качество, максимальная маржа</span>
                </div>
                <div class="variant-buy-row">
                  <span class="variant-price">${partInfo.oemPrice.toLocaleString('ru-RU')} ₽</span>
                  <button class="btn-buy-part btn-oem" data-model="${model.id}" data-type="${partType}" data-quality="oem" data-price="${partInfo.oemPrice}">
                    Заказать
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ОБНОВЛЕННЫЙ КРАСИВЫЙ СКЛАД И ЛОГИСТИКА ДОСТАВОК
  _renderWarehouse() {
    let parts = window.gameState.state.inventory.spareParts;
    const deliveries = window.gameState.state.pendingDeliveries;
    const time = window.gameState.state.time;
    const currentTotalMin = time.day * 1440 + time.hour * 60 + time.minute;

    if (this.warehouseFilter !== 'all') {
      parts = parts.filter(p => p.partType === this.warehouseFilter);
    }

    return `
      <div class="modern-warehouse-view">
        
        <!-- СЕКЦИЯ 1: ДОСТАВКИ В ПУТИ -->
        <div class="logistics-deliveries-block">
          <div class="logistics-header-row">
            <div class="logistics-title">
              <span>🚚</span>
              <strong>Доставки курьером (САДЭК Экспресс)</strong>
            </div>
            <span class="logistics-count-tag">${deliveries.length} в пути</span>
          </div>

          ${deliveries.length === 0 ? `
            <div class="logistics-empty-card">
              <span class="logistics-empty-icon">📦✨</span>
              <div>
                <strong>Нет активных доставок</strong>
                <p>Все заказанные детали получены и находятся на складе.</p>
              </div>
            </div>
          ` : `
            <div class="logistics-cards-stack">
              ${deliveries.map(d => {
                const arrMin = d.arrivalTotalMinutes || (d.targetHour * 60 + d.targetMinute);
                const remainingMin = Math.max(1, arrMin - currentTotalMin);
                const progressPct = Math.min(95, Math.max(15, Math.round((1 - remainingMin / 15) * 100)));

                return `
                  <div class="logistics-active-card">
                    <div class="logistics-card-top">
                      <div class="logistics-parcel-meta">
                        <span class="parcel-type-icon">${this._getPartIcon(d.partType)}</span>
                        <div>
                          <strong>${d.partName}</strong>
                          <div class="parcel-quality-pill ${d.quality}">${d.quality === 'oem' ? '⭐ ОРИГИНАЛ (OEM)' : '⚡ КОПИЯ (HQ)'} ×${d.count}</div>
                        </div>
                      </div>
                      <div class="logistics-eta-tag">
                        <span>Прибытие в:</span>
                        <strong>${String(d.targetHour).padStart(2, '0')}:${String(d.targetMinute).padStart(2, '0')}</strong>
                        <small>(через ~${remainingMin} мин)</small>
                      </div>
                    </div>

                    <div class="logistics-progress-wrapper">
                      <div class="logistics-progress-track">
                        <div class="logistics-progress-fill" style="width: ${progressPct}%;"></div>
                      </div>
                      <div class="logistics-stages-labels">
                        <span class="stage-label passed">Оформлено</span>
                        <span class="stage-label active">${remainingMin <= 1 ? 'Курьер прибыл! 📍' : 'В пути с курьером 🚚'}</span>
                        <span class="stage-label ${remainingMin <= 1 ? 'active' : ''}">Роспись в накладной</span>
                      </div>
                    </div>

                    ${remainingMin <= 1 ? `
                      <button class="btn-sign-delivery-manual" data-id="${d.id}" style="margin-top: 8px; width: 100%; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border: none; border-radius: 6px; padding: 8px; font-weight: 800; font-size: 11px; cursor: pointer;">
                        ✍️ Расписаться и принять посылку
                      </button>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- СЕКЦИЯ 2: НАЛИЧИЕ НА СКЛАДЕ -->
        <div class="warehouse-stock-block">
          <div class="warehouse-stock-header">
            <div class="stock-title">
              <span>📦</span>
              <strong>Наличие деталей на складе</strong>
            </div>
            <div class="stock-filter-chips">
              <button class="stock-chip ${this.warehouseFilter === 'all' ? 'active' : ''}" data-filter="all">Все</button>
              <button class="stock-chip ${this.warehouseFilter === 'screen' ? 'active' : ''}" data-filter="screen">📱 Дисплеи</button>
              <button class="stock-chip ${this.warehouseFilter === 'battery' ? 'active' : ''}" data-filter="battery">🔋 АКБ</button>
              <button class="stock-chip ${this.warehouseFilter === 'camera' ? 'active' : ''}" data-filter="camera">📷 Камеры</button>
              <button class="stock-chip ${this.warehouseFilter === 'housing' ? 'active' : ''}" data-filter="housing">🛡️ Корпуса</button>
            </div>
          </div>

          ${parts.length === 0 ? `
            <div class="empty-state warehouse-empty">
              <div class="empty-illustration">📦</div>
              <h3>На складе нет деталей</h3>
              <p class="sub-text">Закажите экраны, аккумуляторы или камеры во вкладке каталога для ремонта смартфонов.</p>
              <button class="btn-primary btn-to-catalog" id="btn-go-to-catalog">Перейти в каталог</button>
            </div>
          ` : `
            <div class="warehouse-modern-grid">
              ${parts.map(p => {
                const m = window.GAME_CONSTANTS.PHONE_MODELS[p.modelId];
                return `
                  <div class="modern-stock-card ${p.quality}">
                    <div class="stock-card-header">
                      <span class="stock-model-badge">${m ? m.name : p.modelId}</span>
                      <span class="stock-quality-tag ${p.quality}">${p.quality === 'oem' ? '⭐ OEM' : '⚡ COPY'}</span>
                    </div>

                    <div class="stock-visual-preview">
                      <div class="stock-svg-box">
                        ${window.workbenchApp._renderRealisticPartSVG(p.partType, p.quality, 'tray')}
                      </div>
                    </div>

                    <div class="stock-card-footer">
                      <div class="stock-part-title">${this._getPartName(p.partType)}</div>
                      <div class="stock-quantity-row">
                        <span>В наличии:</span>
                        <strong class="stock-count-badge">${p.count} шт.</strong>
                      </div>
                      <button class="btn-stock-use-repair" data-model="${p.modelId}">
                        🛠️ На верстак
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

      </div>
    `;
  }

  _bindEvents(container) {
    container.querySelectorAll('.parts-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        window.soundFx.playClick();
        this.activeTab = tab.dataset.tab;
        this.render();
      });
    });

    const selectModel = container.querySelector('#parts-model-select');
    if (selectModel) {
      selectModel.addEventListener('change', (e) => {
        this.selectedModelId = e.target.value;
        this.render();
      });
    }

    container.querySelectorAll('.stock-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        window.soundFx.playClick();
        this.warehouseFilter = chip.dataset.filter;
        this.render();
      });
    });

    const btnGoCatalog = container.querySelector('#btn-go-to-catalog');
    if (btnGoCatalog) {
      btnGoCatalog.addEventListener('click', () => {
        window.soundFx.playClick();
        this.activeTab = 'catalog';
        this.render();
      });
    }

    container.querySelectorAll('.btn-stock-use-repair').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundFx.playClick();
        const modelId = btn.dataset.model;
        const compatiblePhone = window.gameState.state.inventory.phones.find(p => p.modelId === modelId);
        if (compatiblePhone) {
          window.workbenchApp.selectedPhoneId = compatiblePhone.id;
        }
        window.openApp('workbench');
      });
    });

    container.querySelectorAll('.btn-sign-delivery-manual').forEach(btn => {
      btn.addEventListener('click', () => {
        const delId = btn.dataset.id;
        const del = window.gameState.state.pendingDeliveries.find(d => d.id === delId);
        if (del) {
          window.showCourierSignatureModal(del, () => {
            this.render();
          });
        }
      });
    });

    container.querySelectorAll('.btn-buy-part').forEach(btn => {
      btn.addEventListener('click', () => {
        const modelId = btn.dataset.model;
        const partType = btn.dataset.type;
        const quality = btn.dataset.quality;
        const price = Number(btn.dataset.price);

        if (!window.gameState.canAfford(price, 'card')) {
          window.showAlert('Недостаточно средств на банковской карте для покупки этой детали!', 'Недостаточно средств', '💳');
          return;
        }

        const model = window.GAME_CONSTANTS.PHONE_MODELS[modelId];
        const partName = model.parts[partType].name;

        window.gameState.spendMoney(price, 'card', 'parts', `Покупка ${partName} (${quality.toUpperCase()})`);

        // Доставка через 15 минут игрового времени
        const target = window.timeSystem.addMinutes(15);
        window.gameState.state.pendingDeliveries.push({
          id: 'del_' + Date.now() + Math.floor(Math.random() * 100),
          modelId,
          partType,
          quality,
          count: 1,
          partName,
          targetHour: target.hour,
          targetMinute: target.minute,
          arrivalTotalMinutes: target.totalMinutes,
          awaitingSignature: false,
          completed: false
        });

        window.soundFx.playMoney();
        window.gameState.save();
        window.showAlert(`Деталь «${partName}» заказана! Курьер доставит её через 15 игровых минут. При получении потребуется расписаться.`, 'Заказ оформлен', '🚚');
        this.render();
      });
    });
  }

  _getPartIcon(type) {
    switch (type) {
      case 'screen': return '📱';
      case 'battery': return '🔋';
      case 'camera': return '📷';
      case 'housing': return '🛡️';
      default: return '⚙️';
    }
  }

  _getPartName(type) {
    switch (type) {
      case 'screen': return 'Дисплейный модуль';
      case 'battery': return 'Аккумулятор (АКБ)';
      case 'camera': return 'Блок камер';
      case 'housing': return 'Корпус со стеклом';
      default: return type;
    }
  }
}

window.partsMarketApp = new PartsMarketApp();
