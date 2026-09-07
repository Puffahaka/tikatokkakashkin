// js/state.js
// Централизованное хранилище состояния игры с поддержкой б/у запчастей и тем

class GameStateManager {
  constructor() {
    this.STORAGE_KEY = 'PHONE_FLIPPER_SAVE_V6';
    this.state = this._getInitialState();
  }

  _getInitialState() {
    return {
      settings: {
        theme: 'light',
        deviceSkin: 'phone_titanium'
      },
      wallet: {
        card: window.GAME_CONSTANTS.INITIAL_BALANCE_CARD,
        cash: window.GAME_CONSTANTS.INITIAL_BALANCE_CASH
      },
      time: {
        day: 1,
        hour: 10,
        minute: 0
      },
      inventory: {
        phones: [],
        spareParts: [],
        usedParts: [] // Склад снятых/старых/битых запчастей под перепродажу на Авито
      },
      marketListings: {
        npcListings: [],
        playerListings: [],
        playerPartListings: []
      },
      chats: [],
      scheduledMeetings: [],
      pendingDeliveries: [],
      transactions: [],
      stats: {
        totalEarned: 0,
        totalSpent: 0,
        phonesSold: 0,
        phonesRepaired: 0,
        partsSold: 0,
        bestDealProfit: 0
      },
      reviews: [
        {
          id: 'rev_init_1',
          authorName: 'Александр К.',
          avatar: '👨‍💼',
          rating: 5,
          itemTitle: 'iPhone 13 Pro 256GB',
          text: 'Купил телефон, состояние супер! Батарею заменили качественно, всё летает. Рекомендую мастера.',
          timeStr: '2 дня назад'
        },
        {
          id: 'rev_init_2',
          authorName: 'Мария В.',
          avatar: '👩',
          rating: 5,
          itemTitle: 'Samsung Galaxy S22',
          text: 'Всё честно рассказал про состояние, встретились вовремя. Телефон как новенький!',
          timeStr: 'Вчера'
        }
      ],
      activeApp: 'homescreen',
      selectedPhoneForRepair: null
    };
  }

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.state = JSON.parse(saved);
        if (!this.state.settings) {
          this.state.settings = { theme: 'light', deviceSkin: 'ifruit_titanium' };
        }
        if (!this.state.inventory.usedParts) {
          this.state.inventory.usedParts = [];
        }
        if (!this.state.marketListings.playerPartListings) {
          this.state.marketListings.playerPartListings = [];
        }
        if (!this.state.reviews) {
          this.state.reviews = [
            {
              id: 'rev_init_1',
              authorName: 'Александр К.',
              avatar: '👨‍💼',
              rating: 5,
              itemTitle: 'iPhone 13 Pro 256GB',
              text: 'Купил телефон, состояние супер! Батарею заменили качественно, всё летает. Рекомендую мастера.',
              timeStr: '2 дня назад'
            },
            {
              id: 'rev_init_2',
              authorName: 'Мария В.',
              avatar: '👩',
              rating: 5,
              itemTitle: 'Samsung Galaxy S22',
              text: 'Всё честно рассказал про состояние, встретились вовремя. Телефон как новенький!',
              timeStr: 'Вчера'
            }
          ];
        }
      } catch (e) {
        this.state = this._getInitialState();
      }
    } else {
      this.state = this._getInitialState();
      this._seedInitialData();
    }
    this.applyTheme(this.state.settings.theme);
    this.save();
  }

  toggleTheme() {
    const nextTheme = this.state.settings.theme === 'dark' ? 'light' : 'dark';
    this.state.settings.theme = nextTheme;
    this.applyTheme(nextTheme);
    this.save();
    window.eventBus.emit('theme:changed', nextTheme);
  }

  applyTheme(theme) {
    const wrapper = document.querySelector('.phone-viewport-wrapper');
    if (wrapper) {
      wrapper.setAttribute('data-theme', theme);
    }
    document.body.setAttribute('data-theme', theme);
  }

  _seedInitialData() {
    this.addTransaction({
      type: 'income',
      category: 'other',
      amount: this.state.wallet.card + this.state.wallet.cash,
      paymentMethod: 'card',
      description: 'Стартовый капитал перекупщика'
    });

    this.state.inventory.phones = [];
    this.state.inventory.spareParts = [];
    this.state.inventory.usedParts = [];
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {}
  }

  resetGame() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.state = this._getInitialState();
    this._seedInitialData();
    this.applyTheme(this.state.settings.theme);
    this.save();
    window.eventBus.emit('game:reset', this.state);
    window.eventBus.emit('state:updated', this.state);
  }

  createPhoneInstance(modelId, options = {}) {
    const model = window.GAME_CONSTANTS.PHONE_MODELS[modelId] || window.GAME_CONSTANTS.PHONE_MODELS.ifruit_11;

    const colorIdx = options.colorIndex ?? Math.floor(Math.random() * model.colorVariants.length);
    const defects = options.defects ? [...options.defects] : [];
    
    const partsInstalled = {
      screen: defects.includes('SCREEN_CRACKED') ? 'broken' : 'oem',
      battery: defects.includes('BATTERY_DEAD') ? 'broken' : 'oem',
      camera: defects.includes('CAMERA_BLURRED') ? 'broken' : 'oem',
      housing: defects.includes('HOUSING_DENTED') ? 'broken' : 'oem'
    };

    return {
      id: 'phone_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      modelId: modelId,
      modelName: model.name,
      color: model.colorVariants[colorIdx],
      colorName: model.colorNames[colorIdx],
      buyPrice: options.buyPrice || 0,
      currentDefects: defects,
      cleanliness: defects.includes('DIRTY_AND_DUSTY') ? 20 : 95,
      partsInstalled: partsInstalled,
      screwsCountTotal: model.screwCount,
      disassembly: {
        screwsRemoved: 0,
        housingOpened: false
      },
      testedWorking: false,
      isPlayerPhone: true
    };
  }

  get totalBalance() {
    return this.state.wallet.card + this.state.wallet.cash;
  }

  canAfford(amount, preferredMethod = 'card') {
    if (preferredMethod === 'card' && this.state.wallet.card >= amount) return true;
    if (preferredMethod === 'cash' && this.state.wallet.cash >= amount) return true;
    return this.totalBalance >= amount;
  }

  spendMoney(amount, preferredMethod = 'card', category = 'other', description = '') {
    if (!this.canAfford(amount, preferredMethod)) {
      window.soundFx.playFail();
      return false;
    }

    let methodUsed = preferredMethod;
    if (preferredMethod === 'card') {
      if (this.state.wallet.card >= amount) {
        this.state.wallet.card -= amount;
      } else {
        const remainder = amount - this.state.wallet.card;
        this.state.wallet.card = 0;
        this.state.wallet.cash -= remainder;
        methodUsed = 'card+cash';
      }
    } else {
      if (this.state.wallet.cash >= amount) {
        this.state.wallet.cash -= amount;
      } else {
        const remainder = amount - this.state.wallet.cash;
        this.state.wallet.cash = 0;
        this.state.wallet.card -= remainder;
        methodUsed = 'cash+card';
      }
    }

    this.state.stats.totalSpent += amount;
    this.addTransaction({
      type: 'expense',
      category,
      amount,
      paymentMethod: methodUsed,
      description
    });

    this.save();
    window.eventBus.emit('wallet:updated', this.state.wallet);
    window.eventBus.emit('state:updated', this.state);
    return true;
  }

  receiveMoney(amount, method = 'card', category = 'other', description = '', profit = 0) {
    if (method === 'card') {
      this.state.wallet.card += amount;
    } else {
      this.state.wallet.cash += amount;
    }

    this.state.stats.totalEarned += amount;
    if (profit > this.state.stats.bestDealProfit) {
      this.state.stats.bestDealProfit = profit;
    }

    this.addTransaction({
      type: 'income',
      category,
      amount,
      paymentMethod: method,
      description,
      profit
    });

    window.soundFx.playMoney();
    this.save();
    window.eventBus.emit('wallet:updated', this.state.wallet);
    window.eventBus.emit('state:updated', this.state);
  }

  addTransaction(tx) {
    const transaction = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      day: this.state.time.day,
      timeStr: `${String(this.state.time.hour).padStart(2, '0')}:${String(this.state.time.minute).padStart(2, '0')}`,
      ...tx
    };
    this.state.transactions.unshift(transaction);
    if (this.state.transactions.length > 80) {
      this.state.transactions.pop();
    }
  }

  addSparePart(modelId, partType, quality, count = 1) {
    const existing = this.state.inventory.spareParts.find(
      p => p.modelId === modelId && p.partType === partType && p.quality === quality
    );
    if (existing) {
      existing.count += count;
    } else {
      this.state.inventory.spareParts.push({
        id: 'part_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        modelId,
        partType,
        quality,
        count
      });
    }
    this.save();
    window.eventBus.emit('inventory:updated', this.state.inventory);
  }

  useSparePart(modelId, partType, quality) {
    const item = this.state.inventory.spareParts.find(
      p => p.modelId === modelId && p.partType === partType && p.quality === quality && p.count > 0
    );
    if (!item) return false;
    item.count -= 1;
    if (item.count <= 0) {
      this.state.inventory.spareParts = this.state.inventory.spareParts.filter(p => p !== item);
    }
    this.save();
    window.eventBus.emit('inventory:updated', this.state.inventory);
    return true;
  }

  completeDeliverySignature(deliveryId) {
    const idx = this.state.pendingDeliveries.findIndex(d => d.id === deliveryId);
    if (idx === -1) return false;
    const d = this.state.pendingDeliveries.splice(idx, 1)[0];

    if (d.items && Array.isArray(d.items)) {
      d.items.forEach(item => {
        this.addSparePart(item.modelId, item.partType, item.quality, item.count);
      });
    } else if (d.modelId && d.partType) {
      this.addSparePart(d.modelId, d.partType, d.quality || 'copy', d.count || 1);
    }

    this.save();
    window.soundFx.playSuccess();
    window.eventBus.emit('inventory:updated', this.state.inventory);
    return true;
  }

  // --- УПРАВЛЕНИЕ СНЯТЫМИ СТАРЫМИ/БИТЫМИ ДЕТАЛЯМИ (USED PARTS) ---
  addUsedPart(modelId, partType, condition = 'broken') {
    const model = window.GAME_CONSTANTS.PHONE_MODELS[modelId] || { name: 'Смартфон' };
    const usedPart = {
      id: 'used_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      modelId,
      modelName: model.name,
      partType,
      condition, // 'broken' | 'worn' | 'working'
      estimatedValue: Math.round(((model.parts?.[partType]?.copyPrice || 1000) * 0.4) / 100) * 100
    };
    this.state.inventory.usedParts.unshift(usedPart);
    this.save();
    window.eventBus.emit('inventory:updated', this.state.inventory);
    return usedPart;
  }

  removeUsedPart(usedPartId) {
    const idx = this.state.inventory.usedParts.findIndex(p => p.id === usedPartId);
    if (idx !== -1) {
      const removed = this.state.inventory.usedParts.splice(idx, 1)[0];
      this.save();
      window.eventBus.emit('inventory:updated', this.state.inventory);
      return removed;
    }
    return null;
  }

  addPhoneToInventory(phone) {
    phone.isPlayerPhone = true;
    this.state.inventory.phones.push(phone);
    this.save();
    window.eventBus.emit('inventory:updated', this.state.inventory);
    window.eventBus.emit('state:updated', this.state);
  }

  removePhoneFromInventory(phoneId) {
    const idx = this.state.inventory.phones.findIndex(p => p.id === phoneId);
    if (idx !== -1) {
      const removed = this.state.inventory.phones.splice(idx, 1)[0];
      this.save();
      window.eventBus.emit('inventory:updated', this.state.inventory);
      window.eventBus.emit('state:updated', this.state);
      return removed;
    }
    return null;
  }

  getPhoneById(phoneId) {
    return this.state.inventory.phones.find(p => p.id === phoneId);
  }

  calculateMarketValue(phone) {
    const model = window.GAME_CONSTANTS.PHONE_MODELS[phone.modelId];
    if (!model) return 0;

    let value = model.baseMarketPrice;
    phone.currentDefects.forEach(defectId => {
      const def = window.GAME_CONSTANTS.DEFECTS[defectId];
      if (def) value -= model.baseMarketPrice * def.pricePenaltyMultiplier;
    });

    Object.entries(phone.partsInstalled).forEach(([type, quality]) => {
      if (quality === 'copy') value *= 0.92;
    });

    if (phone.cleanliness >= 90) value *= 1.05;
    else if (phone.cleanliness < 40) value *= 0.94;

    return Math.max(Math.round(value / 100) * 100, 1500);
  }

  addBuyerReview({ authorName, avatar, itemTitle, isPhone = true }) {
    if (!this.state.reviews) this.state.reviews = [];

    // 85% шанс 5 звезд, 15% 4 звезды
    const isFiveStar = Math.random() < 0.85;
    const rating = isFiveStar ? 5 : 4;

    const phonePositiveTexts = [
      'Отличный продавец! Телефон работает идеально, экран как новый, без лагов.',
      'Купил девайс, всё супер! Быстро договорились, на встрече проверили все функции.',
      'Честный и приятный продавец. Телефон в прекрасном состоянии, рекомендую!',
      'Всё соответствует описанию. Батарея держит отлично, девайс летает.',
      'Отличная сделка, продавец сделал скидку и был очень вежлив. 5 звезд!'
    ];

    const partPositiveTexts = [
      'Запчасть подошла идеально! Установил сам, всё работает без нареканий.',
      'Отличный модуль, качественный и рабочий. Спасибо продавцу за быструю сделку!',
      'Купил на верстак, всё проверил — деталь отличного качества. Рекомендую.'
    ];

    const fourStarTexts = [
      'В целом всё хорошо, телефон рабочий, но на встречу продавец немного опоздал.',
      'Девайс отличный, единственное — корпус немного запылился, в остальном всё супер.'
    ];

    let text = '';
    if (rating === 5) {
      const list = isPhone ? phonePositiveTexts : partPositiveTexts;
      text = list[Math.floor(Math.random() * list.length)];
    } else {
      text = fourStarTexts[Math.floor(Math.random() * fourStarTexts.length)];
    }

    const newReview = {
      id: 'rev_' + Date.now(),
      authorName: authorName || 'Покупатель Асиво',
      avatar: avatar || '🧑',
      rating,
      itemTitle: itemTitle || 'Смартфон',
      text,
      timeStr: `День ${this.state.time.day}, ${String(this.state.time.hour).padStart(2, '0')}:${String(this.state.time.minute).padStart(2, '0')}`
    };

    this.state.reviews.unshift(newReview);
    this.save();
    window.eventBus.emit('reviews:updated', this.state.reviews);

    window.eventBus.emit('notification:push', {
      title: `Асиво: Новый отзыв (${'⭐'.repeat(rating)})`,
      body: `${newReview.authorName}: "${text.slice(0, 45)}..."`,
      app: 'flip_avito'
    });
  }
}

window.gameState = new GameStateManager();
