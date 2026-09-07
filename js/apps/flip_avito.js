// js/apps/flip_avito.js - Асиво с полноэкранным интерфейсом чата, огромным полем ввода цены и быстрыми кнопками

class FlipAvitoApp {
  constructor() {
    this.activeNavTab = 'search'; // 'search' | 'favorites' | 'my_ads' | 'chats' | 'profile'
    this.activeChatId = null;
    this.selectedFilter = 'all'; // 'all' | 'broken' | 'parts' | 'apple' | 'android' | 'cheap'
    this.searchQuery = '';
    this.favorites = []; // array of listing ids
    this.isNpcTyping = false;
  }

  init() {
    this._ensureInitialListings();
    this.bindEvents();
  }

  bindEvents() {
    window.eventBus.on('time:tick', () => {
      const time = window.gameState.state.time;
      if (time.minute % 20 === 0) {
        this._simulateMarketFluctuations();
      }
    });
    window.eventBus.on('flip_avito:new_buyer_inquiry', (data) => this._handleBuyerInquiry(data));
    window.eventBus.on('flip_avito:new_part_buyer_inquiry', (data) => this._handlePartBuyerInquiry(data));
    window.eventBus.on('reviews:updated', () => {
      if (this.activeNavTab === 'profile') this.render();
    });
  }

  render(targetChatId = null) {
    const screenEl = document.getElementById('screen-flip_avito');
    if (!screenEl) return;

    if (targetChatId) {
      this.activeNavTab = 'chats';
      this.activeChatId = targetChatId;
    }

    // Если открыт конкретный чат — рендерим полноценный полноэкранный чат (без таббара и поиска)
    if (this.activeNavTab === 'chats' && this.activeChatId) {
      screenEl.innerHTML = `
        <div class="asivo-ios-container asivo-chat-fullscreen">
          ${this._renderSingleChatView()}
        </div>
      `;
      this._bindEvents(screenEl);
      return;
    }

    const unreadChats = window.gameState.state.chats.filter(c => c.state === 'negotiating').length;
    const activePlayerAds = window.gameState.state.marketListings.playerListings.filter(l => l.status === 'active').length;

    screenEl.innerHTML = `
      <div class="asivo-ios-container">
        
        <!-- Верхняя поисковая панель iOS Асиво с кнопкой обновления -->
        <div class="asivo-top-header">
          <div class="asivo-search-pill">
            <span class="asivo-search-icon">🔍</span>
            <input type="text" id="asivo-search-input" placeholder="Поиск в Асиво" value="${this.searchQuery}" />
            <button class="asivo-filter-btn" id="btn-asivo-filter" title="Фильтры">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <button class="asivo-refresh-btn" id="btn-refresh-feed" title="Обновить предложения">
            🔄
          </button>
        </div>

        <!-- Основной скроллируемый контент активной вкладки -->
        <div class="asivo-scroll-body" id="asivo-scroll-body">
          ${this._renderNavTabContent()}
        </div>

        <!-- Нижний 5-кнопочный iOS таббар -->
        <div class="asivo-bottom-tabbar">
          
          <button class="asivo-nav-item ${this.activeNavTab === 'search' ? 'active' : ''}" data-nav="search">
            <div class="asivo-dots-icon">
              <span class="dot d-blue"></span>
              <span class="dot d-green"></span>
              <span class="dot d-cyan"></span>
              <span class="dot d-magenta"></span>
            </div>
            <span>Поиск</span>
          </button>

          <button class="asivo-nav-item ${this.activeNavTab === 'favorites' ? 'active' : ''}" data-nav="favorites">
            <span class="nav-icon">${this.favorites.length > 0 ? '❤️' : '🤍'}</span>
            <span>Избранное</span>
            ${this.favorites.length > 0 ? `<span class="nav-badge">${this.favorites.length}</span>` : ''}
          </button>

          <button class="asivo-nav-item center-plus-btn ${this.activeNavTab === 'my_ads' ? 'active' : ''}" data-nav="my_ads">
            <div class="plus-circle-blue">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span>Объявления</span>
            ${activePlayerAds > 0 ? `<span class="nav-badge">${activePlayerAds}</span>` : ''}
          </button>

          <button class="asivo-nav-item ${this.activeNavTab === 'chats' ? 'active' : ''}" data-nav="chats">
            <span class="nav-icon">💬</span>
            <span>Сообщения</span>
            ${unreadChats > 0 ? `<span class="nav-badge red">${unreadChats}</span>` : ''}
          </button>

          <button class="asivo-nav-item ${this.activeNavTab === 'profile' ? 'active' : ''}" data-nav="profile">
            <span class="nav-icon">👤</span>
            <span>Профиль</span>
          </button>

        </div>

      </div>
    `;

    this._bindEvents(screenEl);
  }

  _renderNavTabContent() {
    switch (this.activeNavTab) {
      case 'search': return this._renderSearchTab();
      case 'favorites': return this._renderFavoritesTab();
      case 'my_ads': return this._renderMyAdsTab();
      case 'chats': return this._renderChatsTab();
      case 'profile': return this._renderProfileTab();
      default: return this._renderSearchTab();
    }
  }

  // --- ВКЛАДКА 1: ПОИСК И ЛЕНТА (КАТЕГОРИИ: ЭЛЕКТРОНИКА И ЗАПЧАСТИ) ---
  _renderSearchTab() {
    const isElectronics = this.selectedFilter !== 'parts';

    return `
      <!-- Горизонтальные сторис-плашки -->
      <div class="asivo-stories-scroll">
        <div class="asivo-story-chip"><span class="chip-emoji">🖤</span> #яПомогаю</div>
        <div class="asivo-story-chip"><span class="chip-emoji">Ⓜ️</span> Молл</div>
        <div class="asivo-story-chip"><span class="chip-emoji">🧳</span> Путешествия</div>
        <div class="asivo-story-chip"><span class="chip-emoji">✨</span> Премиум</div>
        <div class="asivo-story-chip"><span class="chip-emoji">⚡</span> Скидки дня</div>
      </div>

      <!-- Категории: только Электроника и Запчасти -->
      <div class="asivo-categories-tech-grid">
        <div class="asivo-cat-tech-card ${isElectronics ? 'active' : ''}" data-cat="electronics">
          <div class="cat-tech-header">
            <span class="cat-tech-icon">📱</span>
            <strong>Электроника</strong>
          </div>
          <span class="cat-tech-desc">Смартфоны, планшеты и гаджеты</span>
        </div>

        <div class="asivo-cat-tech-card ${!isElectronics ? 'active' : ''}" data-cat="parts">
          <div class="cat-tech-header">
            <span class="cat-tech-icon">⚙️</span>
            <strong>Запчасти</strong>
          </div>
          <span class="cat-tech-desc">Модули, экраны, батареи и платы</span>
        </div>
      </div>

      <!-- Фильтры ленты -->
      <div class="feed-chips-bar">
        <button class="filter-chip ${this.selectedFilter === 'all' ? 'active' : ''}" data-filter="all">Все</button>
        <button class="filter-chip ${this.selectedFilter === 'broken' ? 'active' : ''}" data-filter="broken">🛠️ Под ремонт</button>
        <button class="filter-chip ${this.selectedFilter === 'parts' ? 'active' : ''}" data-filter="parts">📦 Запчасти</button>
        <button class="filter-chip ${this.selectedFilter === 'apple' ? 'active' : ''}" data-filter="apple">🍏 iPhone</button>
        <button class="filter-chip ${this.selectedFilter === 'android' ? 'active' : ''}" data-filter="android">🤖 Android</button>
        <button class="filter-chip ${this.selectedFilter === 'cheap' ? 'active' : ''}" data-filter="cheap">💸 До 30 000 ₽</button>
      </div>

      <!-- Сетка товаров (2 колонки) -->
      ${this._renderProductGrid()}
    `;
  }

  _renderProductGrid() {
    const query = this.searchQuery.toLowerCase().trim();
    let listings = window.gameState.state.marketListings.npcListings;

    if (this.selectedFilter === 'broken') {
      listings = listings.filter(item => (item.defects && item.defects.length > 0) || item.itemType === 'part');
    } else if (this.selectedFilter === 'parts') {
      listings = listings.filter(item => item.itemType === 'part');
    } else if (this.selectedFilter === 'apple') {
      listings = listings.filter(item => item.modelId && item.modelId.includes('iphone'));
    } else if (this.selectedFilter === 'android') {
      listings = listings.filter(item => item.modelId && !item.modelId.includes('iphone'));
    } else if (this.selectedFilter === 'cheap') {
      listings = listings.filter(item => item.price <= 30000);
    }

    if (query) {
      listings = listings.filter(item => 
        item.title.toLowerCase().includes(query) ||
        (item.modelName && item.modelName.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }

    if (listings.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-illustration">🔍</div>
          <h3>Ничего не найдено</h3>
          <p class="sub-text">Попробуйте изменить поисковый запрос или обновить ленту.</p>
        </div>
      `;
    }

    return `
      <div class="asivo-feed-grid">
        ${listings.map(item => {
          const isFav = this.favorites.includes(item.id);
          return `
            <div class="asivo-card-item" data-id="${item.id}">
              <div class="asivo-card-image-wrap">
                <button class="asivo-btn-fav ${isFav ? 'active' : ''}" data-fav-id="${item.id}" title="В избранное">
                  ${isFav ? '❤️' : '🤍'}
                </button>
                <div class="asivo-img-container">
                  ${item.itemType === 'part' ? `
                    <div class="asivo-part-mockup">
                      ${window.workbenchApp._renderRealisticPartSVG(item.partType, item.quality || 'oem', 'tray')}
                    </div>
                  ` : `
                    <div class="asivo-phone-mockup">
                      ${window.GAME_CONSTANTS.renderPhoneMockupSVG(item.modelId, item.color, item.defects)}
                    </div>
                  `}
                </div>
              </div>

              <div class="asivo-card-info">
                <div class="asivo-card-price">${item.price.toLocaleString('ru-RU')} ₽</div>
                <div class="asivo-card-title">${item.title}</div>
                <div class="asivo-card-delivery-badge">🚚 Доставка САДЭК</div>
                <div class="asivo-card-geo">${item.location} • ${item.timeAgo || '15 мин'}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // --- ВКЛАДКА 2: ИЗБРАННОЕ ---
  _renderFavoritesTab() {
    const favListings = window.gameState.state.marketListings.npcListings.filter(l => this.favorites.includes(l.id));

    return `
      <div class="tab-header-title">
        <h2>Избранное (${favListings.length})</h2>
      </div>

      ${favListings.length === 0 ? `
        <div class="empty-state">
          <div class="empty-illustration">❤️</div>
          <h3>В избранном пусто</h3>
          <p class="sub-text">Нажимайте на сердечко у объявлений в ленте, чтобы сохранить интересные предложения.</p>
        </div>
      ` : `
        <div class="asivo-feed-grid">
          ${favListings.map(item => `
            <div class="asivo-card-item" data-id="${item.id}">
              <div class="asivo-card-image-wrap">
                <button class="asivo-btn-fav active" data-fav-id="${item.id}">❤️</button>
                <div class="asivo-img-container">
                  ${item.itemType === 'part' ? `
                    <div class="asivo-part-mockup">
                      ${window.workbenchApp._renderRealisticPartSVG(item.partType, item.quality || 'oem', 'tray')}
                    </div>
                  ` : `
                    <div class="asivo-phone-mockup">
                      ${window.GAME_CONSTANTS.renderPhoneMockupSVG(item.modelId, item.color, item.defects)}
                    </div>
                  `}
                </div>
              </div>
              <div class="asivo-card-info">
                <div class="asivo-card-price">${item.price.toLocaleString('ru-RU')} ₽</div>
                <div class="asivo-card-title">${item.title}</div>
                <div class="asivo-card-delivery-badge">🚚 Доставка САДЭК</div>
                <div class="asivo-card-geo">${item.location}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  // --- ВКЛАДКА 3: МОИ ОБЪЯВЛЕНИЯ И ПОДАЧА ЛОТА ---
  _renderMyAdsTab() {
    const playerListings = window.gameState.state.marketListings.playerListings;
    const activeAds = playerListings.filter(l => l.status === 'active');
    const soldAds = playerListings.filter(l => l.status === 'sold');

    return `
      <div class="my-ads-container">
        <div class="my-ads-top-row">
          <h2>Мои объявления</h2>
          <button class="btn-post-ad-primary" id="btn-open-create-ad">+ Подать объявление</button>
        </div>

        <div class="ads-subtabs">
          <span class="subtab-pill active">Активные (${activeAds.length})</span>
          <span class="subtab-pill">Продано (${soldAds.length})</span>
        </div>

        ${activeAds.length === 0 ? `
          <div class="empty-state">
            <div class="empty-illustration">📢</div>
            <h3>Нет активных объявлений</h3>
            <p class="sub-text">Выставьте отремонтированный смартфон или снятые детали на продажу, чтобы заработать.</p>
            <button class="btn-primary" id="btn-create-first-ad">+ Разместить лот</button>
          </div>
        ` : `
          <div class="my-ads-list">
            ${activeAds.map(item => {
              const isPhone = item.itemType === 'phone';
              const p = item.phone || (item.phoneId ? window.gameState.getPhoneById(item.phoneId) : null);
              return `
                <div class="my-ad-card-item">
                  <div class="my-ad-thumb">
                    ${isPhone && p ? window.GAME_CONSTANTS.renderPhoneMockupSVG(p.modelId, p.color, p.currentDefects) : '📦'}
                  </div>
                  <div class="my-ad-info">
                    <div class="my-ad-title">${item.title}</div>
                    <div class="my-ad-price">${item.askingPrice.toLocaleString('ru-RU')} ₽</div>
                    <div class="my-ad-status active">● В продаже • Ждём предложений</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  // --- ВКЛАДКА 4: СПИСОК ЧАТОВ ---
  _renderChatsTab() {
    const chats = window.gameState.state.chats;

    return `
      <div class="chats-list-container">
        <div class="tab-header-title">
          <h2>Сообщения (${chats.length})</h2>
        </div>

        ${chats.length === 0 ? `
          <div class="empty-state">
            <div class="empty-illustration">💬</div>
            <h3>Нет сообщений</h3>
            <p class="sub-text">Выставите товар на продажу или напишите продавцам из ленты поиска.</p>
          </div>
        ` : `
          <div class="chats-stack">
            ${chats.map(c => {
              const lastMsg = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
              const isNegotiating = c.state === 'negotiating';
              const isBlocked = c.state === 'blocked';
              const lotTitle = (c.phoneData && (c.phoneData.title || c.phoneData.modelName)) || 'Товар';
              const offerVal = c.currentOffer ? Number(c.currentOffer).toLocaleString('ru-RU') + ' ₽' : '';
              return `
                <div class="chat-row-item ${isNegotiating ? 'unread' : ''} ${isBlocked ? 'is-blocked' : ''}" data-chat-id="${c.id}">
                  <div class="chat-avatar">${c.avatar || '🧑'}</div>
                  <div class="chat-meta">
                    <div class="chat-meta-top">
                      <strong class="chat-npc-name">${c.npcName || 'Покупатель'}</strong>
                      <span class="chat-time-tag">${lastMsg ? lastMsg.timeStr : ''}</span>
                    </div>
                    <div class="chat-lot-name">
                      📦 ${lotTitle} ${offerVal ? `• <b>${offerVal}</b>` : ''}
                      ${isBlocked ? '<span class="blocked-badge-mini">🚫 ЧС</span>' : ''}
                    </div>
                    <div class="chat-last-snippet">${lastMsg ? lastMsg.text : '...'}</div>
                  </div>
                  ${isNegotiating ? '<span class="chat-unread-dot"></span>' : ''}
                  ${isBlocked ? '<span class="chat-unread-dot red">🚫</span>' : ''}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  // --- ПОЛНОЭКРАННЫЙ ЭКРАН ОДИНОЧНОГО ЧАТА ---
  _renderSingleChatView() {
    const chat = window.gameState.state.chats.find(c => c.id === this.activeChatId);
    if (!chat) {
      return `
        <div class="empty-state" style="padding: 40px 16px; text-align: center;">
          <div class="empty-illustration">💬</div>
          <h3>Диалог завершен или не найден</h3>
          <button class="btn-primary" id="btn-back-to-chatlist" style="margin-top: 14px;">◀ Вернуться к сообщениям</button>
        </div>
      `;
    }

    const currentOfferNum = Number(chat.currentOffer) || 0;
    const lotTitle = (chat.phoneData && (chat.phoneData.title || chat.phoneData.modelName)) || 'Товар';
    const messages = chat.messages || [];

    return `
      <div class="single-chat-room-fullscreen">
        
        <!-- Шапка чата -->
        <div class="chat-room-header">
          <button class="btn-chat-back-nav" id="btn-back-to-chatlist" title="Назад к списку">
            <span class="back-arrow">◀</span> Назад
          </button>
          <div class="chat-room-user-center">
            <span class="chat-user-avatar-bubble">${chat.avatar || '🧑'}</span>
            <div class="chat-user-title-box">
              <strong class="chat-user-real-name">${chat.npcName || 'Покупатель'}</strong>
              <div class="chat-user-live-status">
                ${this.isNpcTyping ? '<span class="typing-pulsing">печатает...</span>' : '<span class="online-dot">●</span> в сети'}
              </div>
            </div>
          </div>
          <div style="width: 50px;"></div>
        </div>

        <!-- Плашка товара -->
        <div class="chat-item-summary-strip">
          <div class="item-summary-name">📦 ${lotTitle}</div>
          <div class="item-summary-price">Текущая цена: <b>${currentOfferNum.toLocaleString('ru-RU')} ₽</b></div>
        </div>

        <!-- Поток сообщений -->
        <div class="chat-conversation-flow" id="chat-msgs-scroll">
          ${messages.map(m => `
            <div class="chat-message-bubble-row ${m.sender === 'player' ? 'outgoing' : 'incoming'}">
              <div class="chat-msg-bubble-box">
                <p class="chat-msg-text">${m.text}</p>
                <span class="chat-msg-time-stamp">${m.timeStr || ''}</span>
              </div>
            </div>
          `).join('')}

          ${this.isNpcTyping ? `
            <div class="chat-message-bubble-row incoming typing-bubble-row">
              <div class="chat-msg-bubble-box typing-dots-box">
                <span class="t-dot"></span><span class="t-dot"></span><span class="t-dot"></span>
                <span class="typing-label-inline">Печатает ответ...</span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Нижняя консоль предложения цены и торга (ОГРОМНОЕ УДОБНОЕ ПОЛЕ) -->
        ${chat.state === 'negotiating' ? `
          <div class="chat-bottom-offer-console">
            
            <div class="huge-offer-input-card">
              <div class="huge-offer-header-row">
                <label for="input-custom-offer-val" class="huge-offer-title">💵 Ваша цена:</label>
                <span class="huge-offer-hint">Enter или кнопка</span>
              </div>

              <div class="huge-input-row">
                <div class="huge-input-field-wrap">
                  <input type="number" id="input-custom-offer-val" class="huge-price-input-element" placeholder="Введите сумму..." value="${chat.role === 'buyer' ? currentOfferNum : Math.round(currentOfferNum * 0.88)}" step="100" />
                  <span class="huge-currency-suffix">₽</span>
                </div>
                <button class="huge-btn-send-offer" id="btn-submit-custom-offer" ${this.isNpcTyping ? 'disabled' : ''}>
                  ✉️ Предложить
                </button>
              </div>
            </div>

            <!-- Быстрые кнопки торга -->
            <div class="huge-quick-actions-grid">
              ${chat.role === 'buyer' ? `
                <button class="btn-quick-action btn-agree-green" data-action="accept_buyer_offer" ${this.isNpcTyping ? 'disabled' : ''}>
                  🤝 Согласиться (${currentOfferNum.toLocaleString('ru-RU')} ₽)
                </button>
                <button class="btn-quick-action btn-counter-blue" data-action="counter_offer" ${this.isNpcTyping ? 'disabled' : ''}>
                  ❌ Без торга!
                </button>
                <button class="btn-quick-action btn-decline-red" data-action="decline_buyer" ${this.isNpcTyping ? 'disabled' : ''}>
                  🚫 Отказать
                </button>
              ` : `
                <button class="btn-quick-action btn-agree-green" data-action="agree" ${this.isNpcTyping ? 'disabled' : ''}>
                  🤝 Купить (${currentOfferNum.toLocaleString('ru-RU')} ₽)
                </button>
                <button class="btn-quick-action btn-counter-blue" data-action="discount_10" data-val="10" ${this.isNpcTyping ? 'disabled' : ''}>
                  📉 Скинь 10%
                </button>
                <button class="btn-quick-action btn-decline-red" data-action="decline" ${this.isNpcTyping ? 'disabled' : ''}>
                  🚫 Отказ
                </button>
              `}
            </div>

          </div>
        ` : `
          <div class="chat-finished-state-banner ${chat.state}">
            ${chat.state === 'deal_agreed' ? '🤝 Сделка согласована! Встреча назначена у метро.' : ''}
            ${chat.state === 'completed' ? '✓ Сделка успешно завершена' : ''}
            ${chat.state === 'declined' ? '✕ Переговоры завершены (отказ)' : ''}
            ${chat.state === 'blocked' ? '🚫 Продавец добавил вас в чёрный список за наглое занижение цены!' : ''}
          </div>
        `}

      </div>
    `;
  }

  // --- ВКЛАДКА 5: ПРОФИЛЬ ПЕРЕКУПА И СИСТЕМА ОТЗЫВОВ ---
  _renderProfileTab() {
    const stats = window.gameState.state.stats;
    const wallet = window.gameState.state.wallet;
    const reviews = window.gameState.state.reviews || [];

    const avgRating = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : '5.0';

    const fiveStarsCount = reviews.filter(r => r.rating === 5).length;
    const fourStarsCount = reviews.filter(r => r.rating === 4).length;

    return `
      <div class="asivo-profile-container">
        <div class="profile-card-top">
          <div class="profile-ava">👨‍🔧</div>
          <div class="profile-info">
            <h3>Мастер Перекуп</h3>
            <div class="profile-rating">
              <span class="rating-stars">⭐⭐⭐⭐⭐</span>
              <strong>${avgRating}</strong>
              <span class="reviews-count-sub">(${reviews.length} ${this._getReviewsPlural(reviews.length)})</span>
            </div>
            <div class="profile-verified">✓ Документы проверены • Асиво Доставка</div>
          </div>
        </div>

        <div class="profile-stats-grid">
          <div class="stat-box">
            <span class="stat-num">${stats.phonesSold}</span>
            <span class="stat-title">Продано девайсов</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">${stats.phonesRepaired}</span>
            <span class="stat-title">Отремонтировано</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">${stats.partsSold}</span>
            <span class="stat-title">Продано деталей</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">${stats.totalEarned.toLocaleString('ru-RU')} ₽</span>
            <span class="stat-title">Общая выручка</span>
          </div>
        </div>

        <div class="profile-wallet-banner">
          <div>
            <span>Баланс кошелька:</span>
            <strong>${(wallet.card + wallet.cash).toLocaleString('ru-RU')} ₽</strong>
          </div>
          <button class="btn-sm" onclick="window.openApp('t_bank')">В Банк 💳</button>
        </div>

        <!-- Секция: Отзывы покупателей -->
        <div class="profile-reviews-section">
          <div class="reviews-section-header">
            <h3>Отзывы покупателей (${reviews.length})</h3>
            <div class="reviews-rating-badge">⭐ ${avgRating} / 5.0</div>
          </div>

          <div class="reviews-breakdown-bar">
            <div class="breakdown-pill">5★: <b>${fiveStarsCount}</b></div>
            <div class="breakdown-pill">4★: <b>${fourStarsCount}</b></div>
            <div class="breakdown-pill">100% честные сделки</div>
          </div>

          <div class="reviews-list-stack">
            ${reviews.length === 0 ? `
              <div class="empty-state">
                <div class="empty-illustration">⭐</div>
                <h4>Пока нет отзывов</h4>
                <p class="sub-text">Продавайте отремонтированные телефоны и запчасти на встречах, чтобы получать отзывы от покупателей.</p>
              </div>
            ` : `
              ${reviews.map(r => `
                <div class="review-card-item">
                  <div class="review-header-row">
                    <div class="review-author">
                      <span class="author-ava">${r.avatar || '🧑'}</span>
                      <div>
                        <strong class="author-name-tag">${r.authorName}</strong>
                        <div class="review-stars-row">${'⭐'.repeat(r.rating || 5)}</div>
                      </div>
                    </div>
                    <span class="review-time-label">${r.timeStr || ''}</span>
                  </div>

                  <div class="review-item-tag">
                    <span>📦 Сделка:</span> <b>${r.itemTitle || 'Смартфон'}</b>
                  </div>

                  <p class="review-text-content">${r.text}</p>
                </div>
              `).join('')}
            `}
          </div>
        </div>

      </div>
    `;
  }

  _getReviewsPlural(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'отзыв';
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'отзыва';
    return 'отзывов';
  }

  _bindEvents(container) {
    // Навигация по 5 табам iOS таббара
    container.querySelectorAll('.asivo-nav-item').forEach(nav => {
      nav.addEventListener('click', () => {
        window.soundFx.playClick();
        this.activeNavTab = nav.dataset.nav;
        this.activeChatId = null;
        this.render();
      });
    });

    // Кнопка обновления предложений в ленте
    const btnRefresh = container.querySelector('#btn-refresh-feed');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        window.soundFx.playClick();
        this._simulateMarketFluctuations();
        if (window.gameState.state.marketListings.npcListings.length < 12) {
          this._generateRandomListing();
          this._generateRandomListing();
        }
        window.gameState.save();
        this.render();
        window.showAlert('Лента Асиво обновлена! Добавлены новые предложения.', 'Асиво', '🔄');
      });
    }

    // Клик по категориям (Электроника и Запчасти)
    container.querySelectorAll('.asivo-cat-tech-card').forEach(card => {
      card.addEventListener('click', () => {
        window.soundFx.playClick();
        const cat = card.dataset.cat;
        if (cat === 'parts') {
          this.selectedFilter = 'parts';
        } else {
          this.selectedFilter = 'all';
        }
        this.activeNavTab = 'search';
        this.render();
      });
    });

    // Фильтры
    container.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        window.soundFx.playClick();
        this.selectedFilter = chip.dataset.filter;
        this.render();
      });
    });

    // Поиск
    const inputSearch = container.querySelector('#asivo-search-input');
    if (inputSearch) {
      inputSearch.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
      });
      inputSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.render();
        }
      });
    }

    // Избранное (клик по сердечку)
    container.querySelectorAll('.asivo-btn-fav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.soundFx.playClick();
        const id = btn.dataset.favId;
        if (this.favorites.includes(id)) {
          this.favorites = this.favorites.filter(x => x !== id);
        } else {
          this.favorites.push(id);
        }
        this.render();
      });
    });

    // Клик по карточке товара -> модалка
    container.querySelectorAll('.asivo-card-item').forEach(card => {
      card.addEventListener('click', () => {
        window.soundFx.playClick();
        this._showListingDetailsModal(card.dataset.id);
      });
    });

    // Кнопка подать объявление
    const btnOpenCreateAd = container.querySelector('#btn-open-create-ad') || container.querySelector('#btn-create-first-ad');
    if (btnOpenCreateAd) {
      btnOpenCreateAd.addEventListener('click', () => {
        window.soundFx.playClick();
        this._showUnifiedCreateListingModal();
      });
    }

    // Чаты клик (открыть диалог)
    container.querySelectorAll('.chat-row-item').forEach(item => {
      item.addEventListener('click', () => {
        window.soundFx.playClick();
        this.activeChatId = item.dataset.chatId;
        this.render();
      });
    });

    // Назад из чата
    const btnBackChat = container.querySelector('#btn-back-to-chatlist');
    if (btnBackChat) {
      btnBackChat.addEventListener('click', () => {
        window.soundFx.playClick();
        this.activeChatId = null;
        this.render();
      });
    }

    // Автопрокрутка сообщений
    const msgsScroll = container.querySelector('#chat-msgs-scroll');
    if (msgsScroll) {
      msgsScroll.scrollTop = msgsScroll.scrollHeight;
    }

    // Торг в чате
    container.querySelectorAll('.btn-quick-action, .btn-bargain').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isNpcTyping) return;
        window.soundFx.playClick();
        this._handlePlayerReply(btn.dataset.action, Number(btn.dataset.val));
      });
    });

    const submitCustomOffer = () => {
      if (this.isNpcTyping) return;
      const input = container.querySelector('#input-custom-offer-val');
      if (!input) return;
      const cleanVal = input.value.toString().replace(/[^\d]/g, '');
      const customPrice = parseInt(cleanVal, 10);
      if (!customPrice || isNaN(customPrice) || customPrice <= 0) {
        window.showAlert('Введите корректную сумму предложения (в рублях)!', 'Внимание', '⚠️');
        return;
      }
      window.soundFx.playClick();
      this._handlePlayerReply('offer', customPrice);
    };

    const btnSubmitCustom = container.querySelector('#btn-submit-custom-offer');
    if (btnSubmitCustom) {
      btnSubmitCustom.addEventListener('click', (e) => {
        e.preventDefault();
        submitCustomOffer();
      });
    }

    const inputCustomOffer = container.querySelector('#input-custom-offer-val');
    if (inputCustomOffer) {
      inputCustomOffer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitCustomOffer();
        }
      });
    }
  }

  // --- ОБРАБОТКА ДИАЛОГА В ЧАТЕ ---
  _handlePlayerReply(action, val = null) {
    const chat = window.gameState.state.chats.find(c => c.id === this.activeChatId);
    if (!chat || chat.state !== 'negotiating') return;

    const timeStr = window.timeSystem.formatTime();
    const isCheeky = chat.personality === 'cheeky';

    if (action === 'offer') {
      const offeredPrice = val;
      chat.messages.push({
        sender: 'player',
        text: `Моё предложение: ${offeredPrice.toLocaleString('ru-RU')} ₽.`,
        timeStr
      });

      this.isNpcTyping = true;
      this.render();

      const replyDelay = 2500 + Math.random() * 1000;

      setTimeout(() => {
        this.isNpcTyping = false;

        if (chat.role === 'buyer') {
          if (offeredPrice <= chat.currentOffer * 1.05) {
            chat.currentOffer = offeredPrice;
            chat.messages.push({
              sender: 'npc',
              text: isCheeky 
                ? `Ладно, за ${offeredPrice.toLocaleString('ru-RU')} ₽ заберу. Выезжаю на встречу.`
                : `Договорились! Цена ${offeredPrice.toLocaleString('ru-RU')} ₽ устраивает. Где встретимся?`,
              timeStr: window.timeSystem.formatTime()
            });
            chat.state = 'deal_agreed';
            this._scheduleMeetingFromChat(chat);
            window.soundFx.playSuccess();
          } else {
            chat.patience -= 1;
            if (chat.patience <= 0) {
              chat.messages.push({
                sender: 'npc',
                text: isCheeky
                  ? `Ты в своем уме? За такие деньги сам пользуйся. Я пас.`
                  : `К сожалению, для меня это дорого. Отказываюсь от покупки.`,
                timeStr: window.timeSystem.formatTime()
              });
              chat.state = 'declined';
              chat.closedAtTotalMinutes = window.gameState.state.time.day * 1440 + window.gameState.state.time.hour * 60 + window.gameState.state.time.minute;
              window.soundFx.playFail();
            } else {
              const counter = Math.round((offeredPrice * 0.9) / 100) * 100;
              chat.currentOffer = counter;
              chat.messages.push({
                sender: 'npc',
                text: isCheeky
                  ? `Много хочешь! Моя крайняя цена — ${counter.toLocaleString('ru-RU')} ₽, больше не дам ни рубля.`
                  : `Слишком высокая цена. Готов предложить ${counter.toLocaleString('ru-RU')} ₽ максимум.`,
                timeStr: window.timeSystem.formatTime()
              });
              window.soundFx.playNotification();
            }
          }
        } else {
          // Игрок покупает у NPC продавца
          const initialPrice = chat.initialPrice || (chat.phoneData && chat.phoneData.price) || chat.currentOffer;
          const ratio = offeredPrice / initialPrice;

          // 1. Слишком наглое занижение (предложено меньше 55% от цены) -> СРАЗУ В ЧЁРНЫЙ СПИСОК
          if (ratio < 0.55) {
            const angryPhrases = [
              `Ты за кого меня держишь?! Ищи дураков в другом месте. В чёрный список!`,
              `С такими наглыми предложениями иди на свалку. Заблокирован, перекуп!`,
              `Ты в своем уме? Скинуть больше половины стоимости?! ЧС.`,
              `Слишком наглый. Больше мне не пиши. В бан.`
            ];
            const phrase = angryPhrases[Math.floor(Math.random() * angryPhrases.length)];
            chat.messages.push({
              sender: 'npc',
              text: phrase,
              timeStr: window.timeSystem.formatTime()
            });
            chat.state = 'blocked';
            chat.closedAtTotalMinutes = window.gameState.state.time.day * 1440 + window.gameState.state.time.hour * 60 + window.gameState.state.time.minute;
            window.soundFx.playFail();
            window.eventBus.emit('notification:push', {
              title: '🚫 Вас заблокировали!',
              body: `${chat.npcName} отправил вас в ЧС за наглое предложение!`,
              app: 'flip_avito',
              data: chat.id
            });
          } else if (ratio < 0.75) {
            // 2. Сильное занижение (скидка более 25%) -> потеря терпения и бан при повторе
            chat.patience -= 1;
            if (chat.patience <= 0) {
              chat.messages.push({
                sender: 'npc',
                text: `Терпение лопнуло. Я не собираюсь тратить время на наглых перекупов. Заблокирован.`,
                timeStr: window.timeSystem.formatTime()
              });
              chat.state = 'blocked';
              chat.closedAtTotalMinutes = window.gameState.state.time.day * 1440 + window.gameState.state.time.hour * 60 + window.gameState.state.time.minute;
              window.soundFx.playFail();
              window.eventBus.emit('notification:push', {
                title: '🚫 Вас заблокировали!',
                body: `${chat.npcName} заблокировал вас из-за повторного занижения цены!`,
                app: 'flip_avito',
                data: chat.id
              });
            } else {
              const counter = Math.round((chat.currentOffer * 0.95) / 100) * 100;
              chat.currentOffer = counter;
              chat.messages.push({
                sender: 'npc',
                text: `Слишком нагло! Моя крайняя цена — ${counter.toLocaleString('ru-RU')} ₽. Ещё одно такое предложение и отправлю в ЧС!`,
                timeStr: window.timeSystem.formatTime()
              });
              window.soundFx.playNotification();
            }
          } else if (offeredPrice >= chat.currentOffer * 0.92) {
            // 3. Адекватная цена -> согласие
            chat.currentOffer = offeredPrice;
            chat.messages.push({
              sender: 'npc',
              text: `Хорошо, по рукам! Отдам за ${offeredPrice.toLocaleString('ru-RU')} ₽. Жду у метро через 30 минут.`,
              timeStr: window.timeSystem.formatTime()
            });
            chat.state = 'deal_agreed';
            this._scheduleMeetingFromChat(chat);
            window.soundFx.playSuccess();
          } else {
            // 4. Умеренный торг
            chat.patience -= 1;
            if (chat.patience <= 0) {
              chat.messages.push({
                sender: 'npc',
                text: `Нет, это слишком мало! Не буду продавать в убыток. Всего доброго.`,
                timeStr: window.timeSystem.formatTime()
              });
              chat.state = 'declined';
              chat.closedAtTotalMinutes = window.gameState.state.time.day * 1440 + window.gameState.state.time.hour * 60 + window.gameState.state.time.minute;
              window.soundFx.playFail();
            } else {
              const counter = Math.round((chat.currentOffer * 0.95) / 100) * 100;
              chat.currentOffer = counter;
              chat.messages.push({
                sender: 'npc',
                text: `Слишком дёшево! Моя крайняя цена — ${counter.toLocaleString('ru-RU')} ₽.`,
                timeStr: window.timeSystem.formatTime()
              });
              window.soundFx.playNotification();
            }
          }
        }

        window.gameState.save();
        this.render();
      }, replyDelay);

    } else if (action === 'agree' || action === 'accept_buyer_offer') {
      chat.messages.push({
        sender: 'player',
        text: `Отлично, цена ${chat.currentOffer.toLocaleString('ru-RU')} ₽ устраивает. Где встретимся?`,
        timeStr
      });

      this.isNpcTyping = true;
      this.render();

      setTimeout(() => {
        this.isNpcTyping = false;
        chat.state = 'deal_agreed';
        this._scheduleMeetingFromChat(chat);
        chat.messages.push({
          sender: 'npc',
          text: isCheeky 
            ? `Договорились. Буду у метро через 30 минут, не опаздывай.`
            : `Отлично! Жду у метро через 30 минут.`,
          timeStr: window.timeSystem.formatTime()
        });
        window.soundFx.playSuccess();
        window.gameState.save();
        this.render();
      }, 2000);

    } else if (action === 'discount_10') {
      const discountPrice = Math.round((Number(chat.currentOffer) * 0.9) / 100) * 100;
      this._handlePlayerReply('offer', discountPrice);

    } else if (action === 'counter_offer') {
      chat.messages.push({
        sender: 'player',
        text: `Цена окончательная, без торга!`,
        timeStr
      });

      this.isNpcTyping = true;
      this.render();

      setTimeout(() => {
        this.isNpcTyping = false;
        if (Math.random() > 0.55 && !isCheeky) {
          chat.messages.push({
            sender: 'npc',
            text: `Хорошо, беру по вашей цене! Выезжаю на встречу.`,
            timeStr: window.timeSystem.formatTime()
          });
          chat.state = 'deal_agreed';
          this._scheduleMeetingFromChat(chat);
          window.soundFx.playSuccess();
        } else {
          chat.messages.push({
            sender: 'npc',
            text: isCheeky
              ? `Ну и сиди с ним дальше, перекуп. Я найду дешевле.`
              : `Жаль, тогда поищу другой вариант. Удачи с продажей.`,
            timeStr: window.timeSystem.formatTime()
          });
          chat.state = 'declined';
          chat.closedAtTotalMinutes = window.gameState.state.time.day * 1440 + window.gameState.state.time.hour * 60 + window.gameState.state.time.minute;
          window.soundFx.playFail();
        }
        window.gameState.save();
        this.render();
      }, 2500);

    } else if (action === 'decline' || action === 'decline_buyer') {
      chat.messages.push({
        sender: 'player',
        text: `Не договорились. Всего доброго.`,
        timeStr
      });
      chat.state = 'declined';
      chat.closedAtTotalMinutes = window.gameState.state.time.day * 1440 + window.gameState.state.time.hour * 60 + window.gameState.state.time.minute;
      window.gameState.save();
      this.render();
    }
  }

  // --- ГЕНЕРАЦИЯ ОБРАЩЕНИЙ ПОКУПАТЕЛЕЙ ---
  _handleBuyerInquiry({ listing, phone, marketValue }) {
    const buyerName = window.GAME_CONSTANTS.NPC_NAMES[Math.floor(Math.random() * window.GAME_CONSTANTS.NPC_NAMES.length)];
    const avatar = window.GAME_CONSTANTS.AVATAR_ICONS[Math.floor(Math.random() * window.GAME_CONSTANTS.AVATAR_ICONS.length)];

    const roll = Math.random();
    let personality = 'normal';
    let offer = listing.askingPrice;
    let initialGreeting = '';
    let patience = 3;

    if (roll < 0.30) {
      personality = 'cheeky';
      patience = 2;
      offer = Math.round((listing.askingPrice * (0.65 + Math.random() * 0.15)) / 100) * 100;
      const cheekyPhrases = [
        `Брат, за ${offer.toLocaleString('ru-RU')} ₽ заберу прямо сейчас с руками, больше оно не стоит.`,
        `Край за сколько отдашь? Скинь 4000-5000 и я выезжаю.`,
        `Дорого просишь! Давай за ${offer.toLocaleString('ru-RU')} ₽ или я пошел к другому продавцу.`,
        `Если с доставкой мне до двери за твой счет, то заберу за ${offer.toLocaleString('ru-RU')} ₽.`
      ];
      initialGreeting = cheekyPhrases[Math.floor(Math.random() * cheekyPhrases.length)];
    } else if (roll < 0.75) {
      personality = 'normal';
      offer = Math.round((listing.askingPrice * 0.90) / 100) * 100;
      initialGreeting = `Здравствуйте! Заинтересовал ваш ${phone.modelName}. Отдадите за ${offer.toLocaleString('ru-RU')} ₽ сегодня?`;
    } else {
      personality = 'polite';
      offer = listing.askingPrice;
      initialGreeting = `Добрый день! Увидел ваше объявление на ${phone.modelName}. Всё работает без нареканий? Готов купить за ${offer.toLocaleString('ru-RU')} ₽!`;
    }

    const chat = {
      id: 'chat_buyer_' + Date.now(),
      listingId: listing.id,
      npcName: buyerName,
      avatar: avatar,
      role: 'buyer',
      personality: personality,
      currentOffer: offer,
      patience: patience,
      phoneData: {
        phoneId: phone.id,
        modelId: phone.modelId,
        modelName: phone.modelName,
        title: `${phone.modelName} (${phone.colorName})`,
        color: phone.color,
        colorName: phone.colorName,
        defects: phone.currentDefects,
        isPlayerPhone: true
      },
      state: 'negotiating',
      messages: [
        {
          sender: 'npc',
          text: initialGreeting,
          timeStr: window.timeSystem.formatTime()
        }
      ]
    };

    window.gameState.state.chats.unshift(chat);
    window.gameState.save();

    window.soundFx.playNotification();
    window.eventBus.emit('notification:push', {
      title: 'Асиво: Новое сообщение!',
      body: `${buyerName}: "${initialGreeting.slice(0, 45)}..."`,
      app: 'flip_avito',
      data: chat.id
    });
  }

  _handlePartBuyerInquiry({ listing }) {
    const buyerName = window.GAME_CONSTANTS.NPC_NAMES[Math.floor(Math.random() * window.GAME_CONSTANTS.NPC_NAMES.length)];
    const avatar = window.GAME_CONSTANTS.AVATAR_ICONS[Math.floor(Math.random() * window.GAME_CONSTANTS.AVATAR_ICONS.length)];

    const roll = Math.random();
    let personality = roll < 0.30 ? 'cheeky' : 'normal';
    let offer = listing.askingPrice;

    if (personality === 'cheeky') {
      offer = Math.round((listing.askingPrice * 0.75) / 100) * 100;
    } else if (roll > 0.4) {
      offer = Math.round((listing.askingPrice * 0.88) / 100) * 100;
    }

    const chat = {
      id: 'chat_part_buyer_' + Date.now(),
      listingId: listing.id,
      npcName: buyerName,
      avatar: avatar,
      role: 'buyer',
      personality: personality,
      currentOffer: offer,
      patience: personality === 'cheeky' ? 2 : 3,
      phoneData: {
        itemType: 'part',
        modelId: listing.modelId,
        partType: listing.partType,
        quality: listing.quality,
        usedPartId: listing.usedPartId,
        title: listing.title,
        isPlayerPhone: false
      },
      state: 'negotiating',
      messages: [
        {
          sender: 'npc',
          text: personality === 'cheeky' 
            ? `Слушай, заберу эту деталь «${listing.title}» за ${offer.toLocaleString('ru-RU')} ₽ прямо сейчас, больше она не стоит.`
            : `Здравствуйте! Ищу запчасть: «${listing.title}». Заберу за ${offer.toLocaleString('ru-RU')} ₽.`,
          timeStr: window.timeSystem.formatTime()
        }
      ]
    };

    window.gameState.state.chats.unshift(chat);
    window.gameState.save();

    window.soundFx.playNotification();
    window.eventBus.emit('notification:push', {
      title: 'Асиво: Покупатель запчасти!',
      body: `${buyerName} написал по поводу «${listing.title}»`,
      app: 'flip_avito',
      data: chat.id
    });
  }

  _scheduleMeetingFromChat(chat) {
    const target = window.timeSystem.addMinutes(30);
    const agreedVal = Number(chat.currentOffer) || 0;
    const meeting = {
      id: 'meet_' + Date.now(),
      chatId: chat.id,
      type: chat.role === 'seller' ? 'buy' : 'sell',
      phoneData: chat.phoneData || {},
      agreedPrice: agreedVal,
      price: agreedVal,
      npcName: chat.npcName || 'Покупатель',
      avatar: chat.avatar || '🧑',
      location: window.GAME_CONSTANTS.DISTRICTS[Math.floor(Math.random() * window.GAME_CONSTANTS.DISTRICTS.length)],
      targetHour: target.hour,
      targetMinute: target.minute,
      targetTotalMinutes: target.totalMinutes,
      status: 'pending'
    };

    window.gameState.state.scheduledMeetings.push(meeting);
    window.gameState.save();

    window.eventBus.emit('notification:push', {
      title: 'Встреча назначена!',
      body: `${chat.npcName} ждет в ${String(target.hour).padStart(2, '0')}:${String(target.minute).padStart(2, '0')} (${meeting.location})`,
      app: 'deal_meeting'
    });
  }

  _showListingDetailsModal(listingId) {
    const item = window.gameState.state.marketListings.npcListings.find(l => l.id === listingId);
    if (!item) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3>${item.title}</h3>
          <button class="btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="modal-photo-preview">
            ${item.itemType === 'part' ? `
              <div style="width: 70px; height: 90px; display:flex; align-items:center; justify-content:center;">
                ${window.workbenchApp._renderRealisticPartSVG(item.partType, item.quality || 'oem', 'tray')}
              </div>
            ` : `
              ${window.GAME_CONSTANTS.renderPhoneMockupSVG(item.modelId, item.color, item.defects)}
            `}
          </div>
          <div class="modal-price-tag">${item.price.toLocaleString('ru-RU')} ₽</div>
          
          <div class="modal-seller-info">
            <span>${item.avatar} <b>${item.sellerName}</b></span>
            <span>📍 ${item.location}</span>
          </div>

          <div class="modal-desc-box">
            <strong>Описание продавца:</strong>
            <p>${item.description}</p>
          </div>

          <div class="modal-defects-list">
            <strong>Состояние:</strong>
            ${item.itemType === 'part' ? `<div class="defect-item good">📦 Запчасть: ${item.quality === 'oem' ? 'Оригинал (OEM)' : 'Копия (HQ)'}</div>` : `
              ${(!item.defects || item.defects.length === 0) ? '<div class="defect-item good">✨ Без поломок, идеальное состояние</div>' : ''}
              ${item.defects ? item.defects.map(d => `<div class="defect-item bad">⚠️ ${window.GAME_CONSTANTS.DEFECTS[d]?.name}</div>`).join('') : ''}
            `}
          </div>
        </div>
        <div class="modal-footer">
          ${(() => {
            const existingChat = window.gameState.state.chats.find(c => c.listingId === item.id && c.role === 'seller');
            if (existingChat && existingChat.state === 'blocked') {
              return `<button class="btn-primary" disabled style="opacity: 0.65; background: #ef4444; border-color: #ef4444; cursor: not-allowed;">🚫 Вы в чёрном списке у продавца</button>`;
            }
            return `<button class="btn-primary" id="btn-start-chat-listing">💬 Написать и предложить цену</button>`;
          })()}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());
    const btnStart = modal.querySelector('#btn-start-chat-listing');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        modal.remove();
        this._openOrCreateChatForListing(item);
      });
    }
  }

  _openOrCreateChatForListing(listing) {
    let existingChat = window.gameState.state.chats.find(
      c => c.listingId === listing.id && c.role === 'seller' && c.state !== 'completed'
    );

    if (!existingChat) {
      existingChat = {
        id: 'chat_' + Date.now(),
        listingId: listing.id,
        npcName: listing.sellerName,
        avatar: listing.avatar,
        role: 'seller',
        initialPrice: listing.price,
        currentOffer: listing.price,
        patience: 3,
        phoneData: {
          listingId: listing.id,
          modelId: listing.modelId,
          modelName: listing.modelName,
          title: listing.title,
          price: listing.price,
          color: listing.color,
          colorName: listing.colorName,
          defects: listing.defects || [],
          itemType: listing.itemType,
          partType: listing.partType,
          quality: listing.quality
        },
        state: 'negotiating',
        messages: [
          {
            sender: 'npc',
            text: `Здравствуйте! Продаю «${listing.title}» за ${listing.price.toLocaleString('ru-RU')} ₽. Вас интересует покупка?`,
            timeStr: window.timeSystem.formatTime()
          }
        ]
      };
      window.gameState.state.chats.unshift(existingChat);
      window.gameState.save();
    }

    this.activeNavTab = 'chats';
    this.activeChatId = existingChat.id;
    this.render();
  }

  _showUnifiedCreateListingModal() {
    const activeListedPhoneIds = window.gameState.state.marketListings.playerListings
      .filter(l => l.status === 'active' && l.phoneId)
      .map(l => l.phoneId);
    const availablePhones = window.gameState.state.inventory.phones.filter(p => !activeListedPhoneIds.includes(p.id));

    const activeListedUsedPartIds = window.gameState.state.marketListings.playerListings
      .filter(l => l.status === 'active' && l.usedPartId)
      .map(l => l.usedPartId);
    const availableUsedParts = (window.gameState.state.inventory.usedParts || []).filter(p => !activeListedUsedPartIds.includes(p.id));
    const availableSpareParts = window.gameState.state.inventory.spareParts.filter(p => p.count > 0);

    const hasPhones = availablePhones.length > 0;
    const hasParts = availableSpareParts.length > 0 || availableUsedParts.length > 0;

    if (!hasPhones && !hasParts) {
      window.showAlert('Все ваши смартфоны и детали уже выставлены на продажу или отсутствуют на складе!', 'Нет свободных товаров', '📦');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3>Разместить объявление в Асиво</h3>
          <button class="btn-close-modal">✕</button>
        </div>
        <div class="modal-body">
          <label class="form-label">Категория товара:</label>
          <div class="theme-switch-grid" style="margin-bottom: 10px;">
            <button class="theme-choice-btn ${hasPhones ? 'active' : ''}" id="btn-select-sell-type-phone">
              <span class="theme-icon">📱</span>
              <strong>Смартфон (${availablePhones.length})</strong>
            </button>
            <button class="theme-choice-btn ${!hasPhones && hasParts ? 'active' : ''}" id="btn-select-sell-type-part">
              <span class="theme-icon">📦</span>
              <strong>Запчасть (${availableSpareParts.length + availableUsedParts.length})</strong>
            </button>
          </div>

          <div id="section-sell-phone" style="display: ${hasPhones ? 'block' : 'none'};">
            <label class="form-label">Выберите смартфон из инвентаря:</label>
            <select class="form-select" id="select-phone-to-sell">
              ${availablePhones.map(p => `
                <option value="${p.id}">${p.modelName} (${p.colorName}) — Оценка: ${window.gameState.calculateMarketValue(p).toLocaleString('ru-RU')} ₽</option>
              `).join('')}
            </select>
          </div>

          <div id="section-sell-part" style="display: ${!hasPhones && hasParts ? 'block' : 'none'};">
            <label class="form-label">Выберите запчасть со склада:</label>
            <select class="form-select" id="select-part-to-sell">
              ${availableSpareParts.map(p => {
                const m = window.GAME_CONSTANTS.PHONE_MODELS[p.modelId];
                return `<option value="new_${p.id}">${m ? m.name : p.modelId} — ${p.partType} (${p.quality.toUpperCase()}) ×${p.count}</option>`;
              }).join('')}
              ${availableUsedParts.map(p => `
                <option value="used_${p.id}">${p.modelName} — ${p.partType} (Снятая б/у) ~${p.estimatedValue} ₽</option>
              `).join('')}
            </select>
          </div>

          <label class="form-label" style="margin-top: 10px;">Цена продажи (₽):</label>
          <input type="number" class="form-input" id="input-selling-price" step="100" />
        </div>
        <div class="modal-footer">
          <button class="btn-primary" id="btn-submit-unified-listing">Опубликовать объявление</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let currentSellType = hasPhones ? 'phone' : 'part';
    const secPhone = modal.querySelector('#section-sell-phone');
    const secPart = modal.querySelector('#section-sell-part');
    const btnPhone = modal.querySelector('#btn-select-sell-type-phone');
    const btnPart = modal.querySelector('#btn-select-sell-type-part');
    const inputPrice = modal.querySelector('#input-selling-price');
    const selectPhone = modal.querySelector('#select-phone-to-sell');
    const selectPart = modal.querySelector('#select-part-to-sell');

    const updatePrice = () => {
      if (currentSellType === 'phone') {
        if (selectPhone && selectPhone.value) {
          const p = window.gameState.getPhoneById(selectPhone.value);
          if (p) inputPrice.value = window.gameState.calculateMarketValue(p);
        }
      } else {
        if (selectPart && selectPart.value) {
          const val = selectPart.value;
          if (val.startsWith('new_')) {
            inputPrice.value = 3500;
          } else {
            const usedId = val.replace('used_', '');
            const up = window.gameState.state.inventory.usedParts.find(p => p.id === usedId);
            inputPrice.value = up ? up.estimatedValue : 1500;
          }
        }
      }
    };

    btnPhone.addEventListener('click', () => {
      if (!hasPhones) return window.showAlert('У вас нет свободных смартфонов!', 'Инвентарь', '📱');
      currentSellType = 'phone';
      btnPhone.classList.add('active');
      btnPart.classList.remove('active');
      secPhone.style.display = 'block';
      secPart.style.display = 'none';
      updatePrice();
    });

    btnPart.addEventListener('click', () => {
      if (!hasParts) return window.showAlert('У вас нет свободных деталей!', 'Инвентарь', '📦');
      currentSellType = 'part';
      btnPart.classList.add('active');
      btnPhone.classList.remove('active');
      secPart.style.display = 'block';
      secPhone.style.display = 'none';
      updatePrice();
    });

    if (selectPhone) selectPhone.addEventListener('change', updatePrice);
    if (selectPart) selectPart.addEventListener('change', updatePrice);
    updatePrice();

    modal.querySelector('.btn-close-modal').addEventListener('click', () => modal.remove());

    modal.querySelector('#btn-submit-unified-listing').addEventListener('click', () => {
      const price = Number(inputPrice.value);
      if (!price || price <= 0) {
        window.showAlert('Укажите корректную цену продажи!', 'Внимание', '⚠️');
        return;
      }

      if (currentSellType === 'phone') {
        const phone = window.gameState.getPhoneById(selectPhone.value);
        if (!phone) return;

        window.gameState.state.marketListings.playerListings.push({
          id: 'player_lot_' + Date.now(),
          itemType: 'phone',
          phoneId: phone.id,
          phone: phone,
          title: `${phone.modelName} ${phone.colorName}`,
          askingPrice: price,
          status: 'active',
          createdAtDay: window.gameState.state.time.day
        });
      } else {
        const val = selectPart.value;
        if (val.startsWith('new_')) {
          const partId = val.replace('new_', '');
          const sp = window.gameState.state.inventory.spareParts.find(p => p.id === partId);
          if (!sp) return;
          const m = window.GAME_CONSTANTS.PHONE_MODELS[sp.modelId];

          window.gameState.state.marketListings.playerListings.push({
            id: 'player_lot_part_' + Date.now(),
            itemType: 'part',
            modelId: sp.modelId,
            partType: sp.partType,
            quality: sp.quality,
            title: `${sp.partType.toUpperCase()} для ${m ? m.name : sp.modelId} (${sp.quality.toUpperCase()})`,
            askingPrice: price,
            status: 'active',
            createdAtDay: window.gameState.state.time.day
          });
        } else {
          const usedId = val.replace('used_', '');
          const up = window.gameState.state.inventory.usedParts.find(p => p.id === usedId);
          if (!up) return;

          window.gameState.state.marketListings.playerListings.push({
            id: 'player_lot_part_' + Date.now(),
            itemType: 'part',
            modelId: up.modelId,
            partType: up.partType,
            quality: 'used',
            usedPartId: up.id,
            title: `${up.partType.toUpperCase()} для ${up.modelName} (Б/У)`,
            askingPrice: price,
            status: 'active',
            createdAtDay: window.gameState.state.time.day
          });
        }
      }

      window.gameState.save();
      window.soundFx.playSuccess();
      modal.remove();
      this.activeNavTab = 'my_ads';
      this.render();
      window.showAlert(`Объявление опубликовано в Асиво за ${price.toLocaleString('ru-RU')} ₽! Покупатели скоро напишут вам в чат.`, 'Объявление размещено', '📢');
    });
  }

  _ensureInitialListings() {
    if (window.gameState.state.marketListings.npcListings.length === 0) {
      for (let i = 0; i < 8; i++) {
        this._generateRandomListing();
      }
    }
  }

  _simulateMarketFluctuations() {
    const listings = window.gameState.state.marketListings.npcListings;
    if (listings.length > 4 && Math.random() < 0.4) {
      listings.splice(Math.floor(Math.random() * listings.length), 1);
    }
    if (listings.length < 14 && Math.random() < 0.7) {
      this._generateRandomListing();
    }
    window.gameState.save();
  }

  _generateRandomListing() {
    const isPart = Math.random() < 0.28;
    const modelKeys = Object.keys(window.GAME_CONSTANTS.PHONE_MODELS);
    const modelId = modelKeys[Math.floor(Math.random() * modelKeys.length)];
    const model = window.GAME_CONSTANTS.PHONE_MODELS[modelId];

    const sellerName = window.GAME_CONSTANTS.NPC_NAMES[Math.floor(Math.random() * window.GAME_CONSTANTS.NPC_NAMES.length)];
    const avatar = window.GAME_CONSTANTS.AVATAR_ICONS[Math.floor(Math.random() * window.GAME_CONSTANTS.AVATAR_ICONS.length)];
    const location = window.GAME_CONSTANTS.DISTRICTS[Math.floor(Math.random() * window.GAME_CONSTANTS.DISTRICTS.length)];

    if (isPart) {
      const partTypes = ['screen', 'battery', 'camera', 'housing'];
      const partType = partTypes[Math.floor(Math.random() * partTypes.length)];
      const quality = Math.random() < 0.5 ? 'oem' : 'copy';
      const basePartPrice = quality === 'oem' ? model.parts[partType].oemPrice : model.parts[partType].copyPrice;
      const price = Math.round((basePartPrice * (0.8 + Math.random() * 0.3)) / 100) * 100;

      window.gameState.state.marketListings.npcListings.unshift({
        id: 'npc_lot_part_' + Date.now() + Math.floor(Math.random() * 1000),
        itemType: 'part',
        modelId,
        modelName: model.name,
        partType,
        quality,
        title: `${model.parts[partType].name} (${quality.toUpperCase()})`,
        price,
        sellerName,
        avatar,
        location,
        timeAgo: `${Math.floor(Math.random() * 45) + 5} мин назад`,
        description: `Оригинальная или качественная деталь для ${model.name}. Полностью исправна.`
      });
      return;
    }

    const colorIdx = Math.floor(Math.random() * model.colorVariants.length);
    const color = model.colorVariants[colorIdx];
    const colorName = model.colorNames[colorIdx];

    const possibleDefects = ['SCREEN_CRACKED', 'BATTERY_DEAD', 'CAMERA_BLURRED', 'HOUSING_DENTED', 'DIRTY_AND_DUSTY'];
    const defects = [];
    if (Math.random() < 0.75) {
      defects.push(possibleDefects[Math.floor(Math.random() * possibleDefects.length)]);
      if (Math.random() < 0.35) {
        defects.push('DIRTY_AND_DUSTY');
      }
    }

    let estPrice = model.baseMarketPrice;
    defects.forEach(d => {
      const defObj = window.GAME_CONSTANTS.DEFECTS[d];
      if (defObj) estPrice *= (1 - defObj.pricePenaltyMultiplier);
    });
    const price = Math.round((estPrice * (0.85 + Math.random() * 0.25)) / 100) * 100;

    let desc = 'Продаю личный телефон, в хорошем состоянии.';
    if (defects.includes('SCREEN_CRACKED')) desc = 'Упал со стола, треснул экран. Сенсор работает, на запчасти или ремонт.';
    else if (defects.includes('BATTERY_DEAD')) desc = 'Быстро садится батарея на морозе. В остальном всё отлично.';

    window.gameState.state.marketListings.npcListings.unshift({
      id: 'npc_lot_' + Date.now() + Math.floor(Math.random() * 1000),
      itemType: 'phone',
      modelId,
      modelName: model.name,
      color,
      colorName,
      defects,
      title: `${model.name} ${colorName}`,
      price,
      sellerName,
      avatar,
      location,
      timeAgo: `${Math.floor(Math.random() * 40) + 3} мин назад`,
      description: desc
    });
  }
}

window.flipAvitoApp = new FlipAvitoApp();
