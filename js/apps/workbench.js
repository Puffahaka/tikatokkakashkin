// js/apps/workbench.js
// Верстак: полностью без текстовых подписей, естественные пропорции без растяжения, полноразмерные детали на столе и лоток б/у запчастей

class WorkbenchApp {
  constructor() {
    this.selectedPhoneId = null;
    this.activeTool = 'SCREWDRIVER';
    this.draggedItem = null;
    this.matLooseParts = []; // Детали, свободно лежащие на столе: { id, modelId, partType, quality, x, y }
    this.cleanlinessSwipeCount = 0;
  }

  init() {
    this.bindEvents();
    this._initFreeFormDragEngine();
  }

  bindEvents() {
    window.eventBus.on('inventory:updated', () => {
      if (window.gameState.state.activeApp === 'workbench') {
        this.render();
      }
    });
  }

  render() {
    const screenEl = document.getElementById('screen-workbench');
    if (!screenEl) return;

    const phones = window.gameState.state.inventory.phones;
    if ((!this.selectedPhoneId || !phones.some(p => p.id === this.selectedPhoneId)) && phones.length > 0) {
      this.selectedPhoneId = phones[0].id;
    }

    const currentPhone = phones.find(p => p.id === this.selectedPhoneId);

    screenEl.innerHTML = `
      <div class="workbench-fullscreen-container">
        <!-- Верхний HUD верстака -->
        <div class="workbench-hud-top">
          <button class="btn-exit-workbench" id="btn-exit-repair" title="Выход на рабочий стол">
            <span>✕</span> Выход
          </button>
          
          <div class="workbench-phone-selector-wrap">
            <button class="btn-custom-wb-phone-picker" id="btn-open-wb-phone-picker" title="Сменить смартфон на верстаке">
              <span class="picker-phone-badge">📱</span>
              <span class="picker-phone-name">${currentPhone ? `${currentPhone.modelName}` : 'Выбрать телефон'}</span>
              <span class="picker-arrow">▾</span>
            </button>
          </div>

          <div class="hud-phone-value">
            ${currentPhone ? window.gameState.calculateMarketValue(currentPhone).toLocaleString('ru-RU') + ' ₽' : ''}
          </div>
        </div>

        ${!currentPhone ? this._renderEmptyState() : this._renderWorkbench(currentPhone)}
      </div>

      <!-- Призрачный фантом при перетаскивании -->
      <div id="drag-ghost" class="drag-ghost" style="display: none;"></div>
    `;

    this._bindDomEvents(screenEl, currentPhone);
  }

  _renderEmptyState() {
    return `
      <div class="empty-state workbench-empty">
        <div class="empty-illustration">📱🛠️</div>
        <h3>На верстаке нет смартфона</h3>
        <p class="sub-text">Купите поврежденный телефон на «Асиво», чтобы приступить к разборке.</p>
        <button class="btn-primary" onclick="window.openApp('flip_avito')">Перейти на Асиво</button>
      </div>
    `;
  }
  _renderWorkbench(phone) {
    const model = window.GAME_CONSTANTS.PHONE_MODELS[phone.modelId];
    const spareParts = window.gameState.state.inventory.spareParts.filter(
      p => p.modelId === phone.modelId && p.count > 0
    );
    const usedParts = window.gameState.state.inventory.usedParts || [];

    return `
      <div class="workbench-layout-fullscreen">
        <!-- Тулбар инструментов с подписями -->
        <div class="tools-dock-compact">
          ${Object.values(window.GAME_CONSTANTS.TOOLS).map(tool => `
            <button class="tool-btn-compact ${this.activeTool === tool.id ? 'active' : ''}" data-tool="${tool.id}">
              <span class="tool-icon">${tool.icon}</span>
              <span class="tool-label-text">${tool.name}</span>
            </button>
          `).join('')}
        </div>

        <!-- Центральный рабочий стол -->
        <div class="mat-viewport-expanded" id="workbench-mat">
          
          <!-- Лоток снятых старых / битых деталей (Boneyard / Used Parts Tray) -->
          <div class="used-parts-bin-tray" id="used-parts-bin" title="Сюда складываются снятые детали для перепродажи на Асиво">
            <div class="used-bin-header">
              <span>📦 Снятые детали (${usedParts.length})</span>
              ${usedParts.length > 0 ? '<button class="btn-sell-used-avito" id="btn-sell-used-parts">Продать на Асиво</button>' : ''}
            </div>
            <div class="used-bin-grid">
              ${usedParts.length === 0 ? '<div class="empty-bin-msg">Снимите битые модули из телефона</div>' : ''}
              ${usedParts.slice(0, 4).map(up => `
                <div class="used-part-thumb-mini" title="${up.modelName} (${up.partType})">
                  ${this._renderRealisticPartSVG(up.partType, 'broken', 'mini')}
                </div>
              `).join('')}
              ${usedParts.length > 4 ? `<div class="more-used-tag">+${usedParts.length - 4}</div>` : ''}
            </div>
          </div>

          <!-- Магнитный лоток винтов -->
          <div class="magnetic-screw-tray">
            <div class="screw-holes-grid">
              ${Array.from({ length: phone.screwsCountTotal }).map((_, i) => `
                <div class="magnetic-screw-slot ${i < phone.disassembly.screwsRemoved ? 'has-screw' : ''}">
                  ${i < phone.disassembly.screwsRemoved ? '🔩' : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Станция телефона -->
          <div class="phone-disassembly-station" id="phone-station">
            ${this._renderPhoneBody(phone, model)}
          </div>

          <!-- Полноразмерные детали, свободно лежащие на коврике (БЕЗ надписей и искажений) -->
          <div class="mat-loose-parts-container" id="mat-loose-parts">
            ${this.matLooseParts.map(lp => `
              <div class="mat-loose-part-fullsize ${lp.partType}" 
                   style="left: ${lp.x}px; top: ${lp.y}px;"
                   data-loose-id="${lp.id}"
                   data-model="${lp.modelId}"
                   data-part="${lp.partType}"
                   data-quality="${lp.quality}">
                ${this._renderRealisticPartSVG(lp.partType, lp.quality, 'fullsize')}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Нижний лоток новых деталей (Физические карточки БЕЗ текста) -->
        <div class="workbench-tray-clean">
          <div class="tray-parts-clean-grid" id="tray-parts-list">
            ${spareParts.length === 0 ? `
              <div class="empty-tray-notice">
                <button class="btn-sm-market" onclick="window.openApp('parts_market')">+ PartsMarket</button>
              </div>
            ` : ''}

            ${spareParts.map(sp => `
              <div class="physical-part-card ${sp.quality} ${sp.partType}" 
                   data-drag-source="tray"
                   data-model="${sp.modelId}" 
                   data-part="${sp.partType}" 
                   data-quality="${sp.quality}">
                <div class="part-svg-wrapper">
                  ${this._renderRealisticPartSVG(sp.partType, sp.quality, 'tray')}
                </div>
                <div class="part-corner-badge ${sp.quality}">
                  ${sp.quality === 'oem' ? '⭐' : '⚡'} ×${sp.count}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // Естественные неискаженные SVG чертежи компонентов с правильными пропорциями
  _renderRealisticPartSVG(partType, quality, mode = 'fullsize') {
    if (partType === 'battery') {
      return `
        <svg viewBox="0 0 70 170" class="component-svg-battery">
          <rect x="2" y="2" width="66" height="166" rx="6" fill="#141416" stroke="#38383c" stroke-width="2"/>
          <rect x="5" y="6" width="60" height="158" rx="4" fill="#0d0d0f"/>
          <!-- Ярлыки pull-tabs -->
          <rect x="12" y="156" width="18" height="8" rx="2" fill="#000"/>
          <rect x="40" y="156" width="18" height="8" rx="2" fill="#000"/>
          <!-- Технические маркировки -->
          <text x="35" y="32" fill="#a1a1aa" font-size="5.5" font-weight="bold" text-anchor="middle">Li-ion 3.85V</text>
          <text x="35" y="44" fill="#71717a" font-size="4.5" text-anchor="middle">Rechargeable</text>
          <text x="35" y="56" fill="#71717a" font-size="4.5" text-anchor="middle">High Density</text>
          <text x="35" y="78" fill="#fbbf24" font-size="10" font-weight="bold" text-anchor="middle">⚠️</text>
          <text x="35" y="92" fill="#52525b" font-size="4" text-anchor="middle">Do not crush</text>
          <!-- Шлейф -->
          <path d="M 8 8 L 2 8 L 2 20" fill="none" stroke="#b8860b" stroke-width="3"/>
          <rect x="0" y="18" width="6" height="6" rx="1" fill="#ffd700"/>
        </svg>
      `;
    } else if (partType === 'camera') {
      return `
        <svg viewBox="0 0 70 70" class="component-svg-camera">
          <rect x="2" y="2" width="66" height="66" rx="10" fill="#181b22" stroke="#475569" stroke-width="2"/>
          <circle cx="24" cy="24" r="14" fill="#07080c" stroke="#64748b" stroke-width="2"/>
          <circle cx="24" cy="24" r="7" fill="#1e3a8a"/>
          <circle cx="27" cy="21" r="2.5" fill="#60a5fa"/>

          <circle cx="48" cy="48" r="14" fill="#07080c" stroke="#64748b" stroke-width="2"/>
          <circle cx="48" cy="48" r="7" fill="#1e3a8a"/>
          <circle cx="51" cy="45" r="2.5" fill="#60a5fa"/>

          <circle cx="48" cy="20" r="5.5" fill="#fef08a" stroke="#ca8a04" stroke-width="1"/>
          <circle cx="24" cy="52" r="4" fill="#000" stroke="#333" stroke-width="1"/>
          <path d="M 35 66 L 35 70" stroke="#b8860b" stroke-width="3"/>
        </svg>
      `;
    } else if (partType === 'screen') {
      return `
        <svg viewBox="0 0 70 95" class="component-svg-screen">
          <rect x="2" y="2" width="66" height="91" rx="8" fill="#0a0e16" stroke="#334155" stroke-width="2"/>
          <rect x="6" y="6" width="58" height="70" rx="4" fill="#131926" stroke="#1e293b"/>
          <rect x="14" y="20" width="18" height="14" rx="2" fill="#0f172a" stroke="#475569"/>
          <rect x="38" y="20" width="18" height="14" rx="2" fill="#0f172a" stroke="#475569"/>
          <!-- Коннектор FPC -->
          <path d="M 22 78 L 22 92 L 48 92 L 48 78" fill="#b8860b" stroke="#daa520" stroke-width="1"/>
          <line x1="25" y1="88" x2="45" y2="88" stroke="#ffd700" stroke-width="2" stroke-dasharray="2,1"/>
        </svg>
      `;
    } else {
      return `
        <svg viewBox="0 0 60 80" class="part-svg-preview">
          <rect x="8" y="4" width="44" height="72" rx="10" fill="#27272a" stroke="#71717a" stroke-width="1.5"/>
        </svg>
      `;
    }
  }

  _renderPhoneBody(phone, model) {
    const isOpened = phone.disassembly.housingOpened;
    const screwsRemaining = phone.screwsCountTotal - phone.disassembly.screwsRemoved;

    if (!isOpened) {
      return `
        <div class="phone-realistic-chassis" style="background: ${phone.color};">
          <div class="phone-glass-screen ${phone.currentDefects.includes('SCREEN_CRACKED') ? 'cracked' : ''}" id="phone-outer-screen">
            <div class="screen-dynamic-island">
              <span class="island-camera"></span>
            </div>

            ${phone.currentDefects.includes('SCREEN_CRACKED') ? `
              <div class="realistic-cracks-overlay">
                <svg viewBox="0 0 200 350" class="crack-svg-path">
                  <path d="M 30 50 L 110 130 L 70 210 L 170 290 M 110 130 L 180 80 M 110 130 L 140 230 M 70 210 L 20 280" stroke="rgba(255,255,255,0.88)" stroke-width="2.5" fill="none" stroke-linecap="round" />
                  <path d="M 120 140 L 160 190 M 60 190 L 90 250" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" fill="none" />
                </svg>
              </div>
            ` : ''}

            ${phone.cleanliness < 85 ? `
              <div class="realistic-dirt-overlay" style="opacity: ${(100 - phone.cleanliness) / 85};"></div>
            ` : ''}

            <div class="screen-idle-logo">${model.name}</div>
          </div>

          <!-- Нижние винты корпуса (откручивание и закручивание) -->
          <div class="bottom-screws-bar">
            ${Array.from({ length: phone.screwsCountTotal }).map((_, i) => {
              const isRemoved = i < phone.disassembly.screwsRemoved;
              return `
                <button class="screw-button ${isRemoved ? 'removed' : 'tightened'}" data-screw-idx="${i}" title="${isRemoved ? 'Резьба (винт выкручен) — кликните отверткой 🪛, чтобы закрутить винт обратно' : 'Винт закручен — кликните отверткой 🪛, чтобы выкрутить в лоток'}">
                  <span class="screw-thread">${isRemoved ? '⭕' : '✚'}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else {
      // ПОЛНОСТЬЮ БЕЗ НАДПИСЕЙ И С ЕСТЕСТВЕННЫМИ ПРОПОРЦИЯМИ
      return `
        <div class="phone-opened-chassis-fullsize" style="border-color: ${phone.color};">
          <div class="internals-header">
            <span>${model.name}</span>
            <button class="btn-close-chassis" id="btn-close-phone-body">✕ Закрыть</button>
          </div>

          <div class="motherboard-realistic-board-fullsize">
            
            <!-- Левая половина: Аккумуляторный отсек -->
            <div class="motherboard-drop-slot-full battery-bay-full ${phone.partsInstalled.battery === 'broken' ? 'slot-broken' : 'slot-ok'}" 
                 data-drop-slot="battery">
              <div class="slot-component-visual-full">
                ${phone.partsInstalled.battery === 'empty' ? `
                  <div class="empty-bay-indicator"></div>
                ` : `
                  <div class="installed-fullsize-card">
                    ${this._renderRealisticPartSVG('battery', phone.partsInstalled.battery, 'fullsize')}
                    ${phone.partsInstalled.battery === 'broken' ? '<button class="btn-eject-part-full" data-eject="battery" title="Снять в лоток">✕</button>' : ''}
                  </div>
                `}
              </div>
            </div>

            <!-- Правая верхняя: Камера -->
            <div class="motherboard-drop-slot-full camera-bay-full ${phone.partsInstalled.camera === 'broken' ? 'slot-broken' : 'slot-ok'}" 
                 data-drop-slot="camera">
              <div class="slot-component-visual-full">
                ${phone.partsInstalled.camera === 'empty' ? `
                  <div class="empty-bay-indicator"></div>
                ` : `
                  <div class="installed-fullsize-card">
                    ${this._renderRealisticPartSVG('camera', phone.partsInstalled.camera, 'fullsize')}
                    ${phone.partsInstalled.camera === 'broken' ? '<button class="btn-eject-part-full" data-eject="camera" title="Снять в лоток">✕</button>' : ''}
                  </div>
                `}
              </div>
            </div>

            <!-- Правая нижняя: Дисплейный модуль -->
            <div class="motherboard-drop-slot-full screen-bay-full ${phone.partsInstalled.screen === 'broken' ? 'slot-broken' : 'slot-ok'}" 
                 data-drop-slot="screen">
              <div class="slot-component-visual-full">
                ${phone.partsInstalled.screen === 'empty' ? `
                  <div class="empty-bay-indicator"></div>
                ` : `
                  <div class="installed-fullsize-card">
                    ${this._renderRealisticPartSVG('screen', phone.partsInstalled.screen, 'fullsize')}
                    ${phone.partsInstalled.screen === 'broken' ? '<button class="btn-eject-part-full" data-eject="screen" title="Снять в лоток">✕</button>' : ''}
                  </div>
                `}
              </div>
            </div>

          </div>
        </div>
      `;
    }
  }
  _bindDomEvents(container, phone) {
    if (!phone) return;

    const btnExit = container.querySelector('#btn-exit-repair');
    if (btnExit) {
      btnExit.addEventListener('click', () => {
        window.soundFx.playClick();
        window.openApp('homescreen');
      });
    }

    const btnPicker = container.querySelector('#btn-open-wb-phone-picker');
    if (btnPicker) {
      btnPicker.addEventListener('click', () => {
        window.soundFx.playClick();
        this._showCustomPhonePickerModal();
      });
    }

    // Продажа снятых б/у запчастей на Авито
    const btnSellUsed = container.querySelector('#btn-sell-used-parts');
    if (btnSellUsed) {
      btnSellUsed.addEventListener('click', () => {
        window.soundFx.playClick();
        this._showSellUsedPartsModal();
      });
    }

    container.querySelectorAll('.tool-btn-compact').forEach(btn => {
      btn.addEventListener('click', () => {
        window.soundFx.playClick();
        this.activeTool = btn.dataset.tool;
        this.render();
      });
    });

    container.querySelectorAll('.screw-button').forEach(screwBtn => {
      screwBtn.addEventListener('click', () => {
        if (this.activeTool !== 'SCREWDRIVER') {
          window.showAlert('Возьмите отвертку 🪛 на панели инструментов, чтобы открутить или закрутить винты!', 'Инструмент', '🪛');
          return;
        }

        const isRemoved = screwBtn.classList.contains('removed');
        if (isRemoved) {
          // Закрутить винт обратно
          if (phone.disassembly.screwsRemoved > 0) {
            phone.disassembly.screwsRemoved -= 1;
            window.soundFx.playScrew();
            window.gameState.save();
            this.render();
          }
        } else {
          // Выкрутить винт
          if (phone.disassembly.screwsRemoved < phone.screwsCountTotal) {
            phone.disassembly.screwsRemoved += 1;
            window.soundFx.playScrew();
            window.gameState.save();
            this.render();
          }
        }
      });
    });

    const outerScreen = container.querySelector('#phone-outer-screen');
    if (outerScreen) {
      outerScreen.addEventListener('click', () => {
        if (this.activeTool === 'SUCTION_CUP') {
          if (phone.disassembly.screwsRemoved < phone.screwsCountTotal) {
            window.showAlert('Сначала выкрутите все винты отверткой 🪛!', 'Инструмент', '🪛');
            return;
          }
          phone.disassembly.housingOpened = true;
          window.soundFx.playSnap();
          window.gameState.save();
          this.render();
        } else if (this.activeTool === 'CLEANING_CLOTH') {
          this._handleCleaningSwipe(phone);
        }
      });

      outerScreen.addEventListener('pointermove', (e) => {
        if (this.activeTool === 'CLEANING_CLOTH' && e.buttons > 0) {
          this._handleCleaningSwipe(phone);
        }
      });
    }

    const btnClose = container.querySelector('#btn-close-phone-body');
    if (btnClose) {
      btnClose.addEventListener('click', () => {
        phone.disassembly.housingOpened = false;
        window.soundFx.playSnap();
        window.gameState.save();
        this.render();
      });
    }

    // Демонтаж детали -> отправка в Лоток снятых запчастей под перепродажу на Авито
    container.querySelectorAll('.btn-eject-part-full').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const partType = btn.dataset.eject;
        const currentCondition = phone.partsInstalled[partType];
        phone.partsInstalled[partType] = 'empty';

        // Добавляем в лоток б/у запчастей
        window.gameState.addUsedPart(phone.modelId, partType, currentCondition);
        window.soundFx.playSnap();
        window.gameState.save();
        this.render();
      });
    });

    if (this.activeTool === 'TESTER') {
      const mat = container.querySelector('#workbench-mat');
      if (mat) {
        const testBtn = document.createElement('button');
        testBtn.className = 'btn-primary btn-run-test-pulse';
        testBtn.innerHTML = '⚡ Диагностика';
        testBtn.addEventListener('click', () => this._runDeviceTest(phone));
        mat.appendChild(testBtn);
      }
    }
  }

  _showSellUsedPartsModal() {
    const used = window.gameState.state.inventory.usedParts || [];
    if (used.length === 0) return;

    const totalEstimate = used.reduce((sum, p) => sum + (p.estimatedValue || 500), 0);

    window.showConfirm(
      `У вас в лотке ${used.length} снятых деталей общей оценочной стоимостью ~${totalEstimate.toLocaleString('ru-RU')} ₽.\n\nПродать их оптом мастерским через ФлипАвито прямо сейчас?`,
      'Продажа запчастей на Авито',
      '📦',
      () => {
        const payout = totalEstimate;
        window.gameState.receiveMoney(payout, 'card', 'phones', `Продажа б/у запчастей (${used.length} шт.)`, payout);
        window.gameState.state.inventory.usedParts = [];
        window.gameState.state.stats.partsSold += used.length;
        window.gameState.save();
        window.showAlert(`Успешно продано ${used.length} запчастей на сумму +${payout.toLocaleString('ru-RU')} ₽!`, 'Деньги зачислены', '💰');
        this.render();
      }
    );
  }

  // --- СВОБОДНЫЙ DRAG & DROP С ПОЛНЫМ РАЗМЕРОМ ДЕТАЛЕЙ НА СТОЛЕ ---

  _initFreeFormDragEngine() {
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    document.addEventListener('pointerdown', (e) => {
      const trayCard = e.target.closest('.physical-part-card');
      if (trayCard) {
        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;

        this.draggedItem = {
          from: 'tray',
          modelId: trayCard.dataset.model,
          partType: trayCard.dataset.part,
          quality: trayCard.dataset.quality,
          svgHtml: trayCard.querySelector('.part-svg-wrapper').innerHTML
        };
        return;
      }

      const looseCard = e.target.closest('.mat-loose-part-fullsize');
      if (looseCard) {
        startX = e.clientX;
        startY = e.clientY;
        isDragging = false;

        this.draggedItem = {
          from: 'mat',
          looseId: looseCard.dataset.looseId,
          modelId: looseCard.dataset.model,
          partType: looseCard.dataset.part,
          quality: looseCard.dataset.quality,
          svgHtml: looseCard.innerHTML
        };
        return;
      }
    });

    document.addEventListener('pointermove', (e) => {
      if (!this.draggedItem) return;

      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist > 3 && !isDragging) {
        isDragging = true;
        const ghost = document.getElementById('drag-ghost');
        if (ghost) {
          ghost.innerHTML = this.draggedItem.svgHtml;
          ghost.className = `drag-ghost ${this.draggedItem.partType}`;
          ghost.style.display = 'flex';
        }
      }

      if (isDragging) {
        const ghost = document.getElementById('drag-ghost');
        if (ghost) {
          ghost.style.left = `${e.clientX}px`;
          ghost.style.top = `${e.clientY}px`;
        }

        document.querySelectorAll('[data-drop-slot]').forEach(slot => {
          const rect = slot.getBoundingClientRect();
          const isOver = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
          if (isOver) {
            if (slot.dataset.dropSlot === this.draggedItem.partType) {
              slot.classList.add('drop-socket-highlight');
            }
          } else {
            slot.classList.remove('drop-socket-highlight');
          }
        });
      }
    });

    document.addEventListener('pointerup', (e) => {
      if (!this.draggedItem) return;

      const currentPhone = window.gameState.getPhoneById(this.selectedPhoneId);
      const matEl = document.getElementById('workbench-mat');

      if (isDragging) {
        let droppedOnSocket = null;
        document.querySelectorAll('[data-drop-slot]').forEach(slot => {
          const rect = slot.getBoundingClientRect();
          if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
            droppedOnSocket = slot.dataset.dropSlot;
          }
        });

        if (droppedOnSocket && currentPhone) {
          if (!currentPhone.disassembly.housingOpened) {
            window.showAlert('Сначала откройте корпус присоской 🪟!', 'Корпус закрыт', '🪟');
          } else if (droppedOnSocket === this.draggedItem.partType) {
            this._installPart(currentPhone, this.draggedItem.modelId, this.draggedItem.partType, this.draggedItem.quality, this.draggedItem.from, this.draggedItem.looseId);
          } else {
            window.soundFx.playFail();
          }
        } else if (matEl) {
          const matRect = matEl.getBoundingClientRect();
          if (e.clientX >= matRect.left && e.clientX <= matRect.right && e.clientY >= matRect.top && e.clientY <= matRect.bottom) {
            const relX = Math.max(10, Math.min(matRect.width - 65, e.clientX - matRect.left - 30));
            const relY = Math.max(10, Math.min(matRect.height - 120, e.clientY - matRect.top - 50));

            if (this.draggedItem.from === 'tray') {
              if (window.gameState.useSparePart(this.draggedItem.modelId, this.draggedItem.partType, this.draggedItem.quality)) {
                this.matLooseParts.push({
                  id: 'loose_' + Date.now() + Math.floor(Math.random() * 100),
                  modelId: this.draggedItem.modelId,
                  partType: this.draggedItem.partType,
                  quality: this.draggedItem.quality,
                  x: relX,
                  y: relY
                });
                window.soundFx.playSnap();
              }
            } else if (this.draggedItem.from === 'mat') {
              const lp = this.matLooseParts.find(p => p.id === this.draggedItem.looseId);
              if (lp) {
                lp.x = relX;
                lp.y = relY;
                window.soundFx.playSnap();
              }
            }
            this.render();
          }
        }
      } else if (!isDragging && currentPhone) {
        if (currentPhone.disassembly.housingOpened) {
          this._installPart(currentPhone, this.draggedItem.modelId, this.draggedItem.partType, this.draggedItem.quality, this.draggedItem.from, this.draggedItem.looseId);
        }
      }

      this._resetDragState();
    });

    document.addEventListener('pointercancel', () => this._resetDragState());
  }

  _resetDragState() {
    this.draggedItem = null;
    const ghost = document.getElementById('drag-ghost');
    if (ghost) ghost.style.display = 'none';
    document.querySelectorAll('[data-drop-slot]').forEach(s => {
      s.classList.remove('drop-socket-highlight');
    });
  }

  _installPart(phone, modelId, partType, quality, fromSource = 'tray', looseId = null) {
    if (phone.modelId !== modelId) {
      window.showAlert('Эта деталь не совместима с данной моделью!', 'Несовместимость', '❌');
      return;
    }

    if (fromSource === 'tray') {
      if (!window.gameState.useSparePart(modelId, partType, quality)) {
        window.showAlert('У вас нет этой запчасти на складе!', 'Склад пуст', '📦');
        return;
      }
    } else if (fromSource === 'mat' && looseId) {
      this.matLooseParts = this.matLooseParts.filter(p => p.id !== looseId);
    }

    phone.partsInstalled[partType] = quality;

    const defectMap = {
      screen: 'SCREEN_CRACKED',
      battery: 'BATTERY_DEAD',
      camera: 'CAMERA_BLURRED',
      housing: 'HOUSING_DENTED'
    };
    const resolved = defectMap[partType];
    if (resolved) {
      phone.currentDefects = phone.currentDefects.filter(d => d !== resolved);
    }

    window.soundFx.playSuccess();
    window.gameState.save();
    window.gameState.state.stats.phonesRepaired += 1;
    this.render();
  }

  _handleCleaningSwipe(phone) {
    if (phone.cleanliness >= 100) return;
    this.cleanlinessSwipeCount += 1;
    if (this.cleanlinessSwipeCount % 2 === 0) {
      phone.cleanliness = Math.min(100, phone.cleanliness + 10);
      window.soundFx.playSpray();
      if (phone.cleanliness >= 90) {
        phone.currentDefects = phone.currentDefects.filter(d => d !== 'DIRTY_AND_DUSTY');
      }
      window.gameState.save();
      this.render();
    }
  }

  _runDeviceTest(phone) {
    if (phone.disassembly.housingOpened) {
      window.showAlert('Нельзя тестировать телефон в открытом состоянии! Закройте корпус присоской 🪟 и закрутите винты отверткой.', 'Корпус открыт', '⚠️');
      return;
    }

    if (phone.disassembly.screwsRemoved > 0) {
      window.showAlert('Корпус не закреплен! Закрутите оба нижних винта отверткой 🪛 перед тестированием.', 'Винты не закручены', '🪛');
      return;
    }

    const hasBroken = Object.values(phone.partsInstalled).some(v => v === 'broken' || v === 'empty');
    if (hasBroken) {
      window.soundFx.playFail();
      window.showAlert('Ошибка диагностики: внутри найдены неисправные или отсутствующие модули!', 'Тест провален', '❌');
    } else {
      window.soundFx.playSuccess();
      phone.testedWorking = true;
      window.gameState.save();
      window.showAlert(`Успех! ${phone.modelName} полностью исправен и готов к продаже на ФлипАвито с максимальной маржой!`, 'Диагностика OK', '🎉');
      this.render();
    }
  }

  // КАСТОМНЫЙ ВНУТРИИГРОВОЙ ВЫБОР ТЕЛЕФОНА (ВМЕСТО NATIVE SELECT)
  _showCustomPhonePickerModal() {
    const phones = window.gameState.state.inventory.phones;
    if (phones.length === 0) {
      window.showAlert('У вас нет смартфонов в инвентаре! Купите телефон на ФлипАвито.', 'Инвентарь пуст', '📱');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card phone-picker-modal-card">
        <div class="modal-header">
          <div>
            <h3>Выберите смартфон на верстак</h3>
            <span class="sub-label">В инвентаре: ${phones.length} шт.</span>
          </div>
          <button class="btn-close-modal">✕</button>
        </div>

        <div class="modal-body custom-phone-picker-list">
          ${phones.map(p => {
            const isSelected = p.id === this.selectedPhoneId;
            const marketVal = window.gameState.calculateMarketValue(p);

            return `
              <div class="custom-phone-card-item ${isSelected ? 'active-selected' : ''}" data-id="${p.id}">
                <div class="picker-card-preview">
                  ${window.GAME_CONSTANTS.renderPhoneMockupSVG(p.modelId, p.color, p.currentDefects)}
                </div>

                <div class="picker-card-meta">
                  <div class="picker-card-top">
                    <strong>${p.modelName}</strong>
                    <span class="picker-color-tag" style="background: ${p.color};">${p.colorName}</span>
                  </div>

                  <div class="picker-defects-tags">
                    ${p.currentDefects.length === 0 ? '<span class="picker-tag good">✨ Идеал</span>' : ''}
                    ${p.currentDefects.map(d => `<span class="picker-tag bad">⚠️ ${window.GAME_CONSTANTS.DEFECTS[d]?.name || d}</span>`).join('')}
                  </div>

                  <div class="picker-card-bottom">
                    <span class="picker-val">Оценка: <b>${marketVal.toLocaleString('ru-RU')} ₽</b></span>
                    <span class="picker-cleanliness">Чистота: ${p.cleanliness}%</span>
                  </div>
                </div>

                <button class="btn-select-device-now ${isSelected ? 'current' : ''}">
                  ${isSelected ? '✓ На столе' : 'Выбрать'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());

    modal.querySelectorAll('.custom-phone-card-item').forEach(card => {
      card.addEventListener('click', () => {
        window.soundFx.playClick();
        this.selectedPhoneId = card.dataset.id;
        modal.remove();
        this.render();
      });
    });
  }
}

window.workbenchApp = new WorkbenchApp();
