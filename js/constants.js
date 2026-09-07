// js/constants.js
// База данных: 12 реальных моделей смартфонов, 2 винта у всех моделей, цены и SVG-рендер

window.GAME_CONSTANTS = {
  INITIAL_BALANCE_CARD: 15000,
  INITIAL_BALANCE_CASH: 0,
  TIME_SPEED_MS: 1200,

  DEVICE_SKINS: {
    phone_titanium: { id: 'phone_titanium', name: 'Titanium Dark', frameColor: '#2b2c30', accent: '#60a5fa', type: 'island' },
    phone_natural: { id: 'phone_natural', name: 'Titanium Natural', frameColor: '#4f4b47', accent: '#fbbf24', type: 'island' },
    phone_ultra: { id: 'phone_ultra', name: 'Armor Gray', frameColor: '#1e2024', accent: '#a855f7', type: 'punch' },
    phone_porcelain: { id: 'phone_porcelain', name: 'Porcelain White', frameColor: '#e2e8f0', accent: '#34d399', type: 'punch' }
  },

  PHONE_MODELS: {
    iphone_11: {
      id: 'iphone_11',
      name: 'iPhone 11',
      brand: 'Apple',
      baseMarketPrice: 19500,
      colorVariants: ['#1e1e20', '#f5f5f7', '#97d8b2', '#f6e27a', '#a3c9e2', '#e85d75'],
      colorNames: ['Black', 'White', 'Green', 'Yellow', 'Purple', 'Red'],
      parts: {
        screen: { oemPrice: 3200, copyPrice: 1500, name: 'Liquid Retina IPS 6.1"' },
        battery: { oemPrice: 1900, copyPrice: 850, name: 'АКБ 3110 мАч' },
        camera: { oemPrice: 2400, copyPrice: 1100, name: 'Камера Dual 12MP' },
        housing: { oemPrice: 2100, copyPrice: 950, name: 'Корпус со стеклом' }
      },
      screwCount: 2,
      cameraStyle: 'dual_diagonal',
      screenType: 'notch'
    },
    iphone_13_pro: {
      id: 'iphone_13_pro',
      name: 'iPhone 13 Pro',
      brand: 'Apple',
      baseMarketPrice: 53000,
      colorVariants: ['#3b3c36', '#e2e4e1', '#98b1c4', '#fad790', '#3b4e43'],
      colorNames: ['Graphite', 'Silver', 'Sierra Blue', 'Gold', 'Alpine Green'],
      parts: {
        screen: { oemPrice: 12500, copyPrice: 4800, name: 'Super Retina XDR 120Hz' },
        battery: { oemPrice: 3400, copyPrice: 1450, name: 'АКБ 3095 мАч' },
        camera: { oemPrice: 6500, copyPrice: 2800, name: 'Блок камер Triple 12MP Pro' },
        housing: { oemPrice: 4500, copyPrice: 1950, name: 'Стальная рамка + стекло' }
      },
      screwCount: 2,
      cameraStyle: 'triple_pro',
      screenType: 'notch'
    },
    iphone_15_pro: {
      id: 'iphone_15_pro',
      name: 'iPhone 15 Pro Max',
      brand: 'Apple',
      baseMarketPrice: 94000,
      colorVariants: ['#514e4b', '#dcd8d0', '#2a3442', '#212226'],
      colorNames: ['Natural Titanium', 'White Titanium', 'Blue Titanium', 'Black Titanium'],
      parts: {
        screen: { oemPrice: 23000, copyPrice: 9500, name: 'Dynamic Island OLED 120Hz' },
        battery: { oemPrice: 5500, copyPrice: 2350, name: 'АКБ 4422 мАч' },
        camera: { oemPrice: 12000, copyPrice: 5100, name: 'Камера 48MP 5x Zoom' },
        housing: { oemPrice: 9800, copyPrice: 4200, name: 'Титановый корпус' }
      },
      screwCount: 2,
      cameraStyle: 'triple_pro',
      screenType: 'island'
    },
    iphone_16_pro: {
      id: 'iphone_16_pro',
      name: 'iPhone 16 Pro Max',
      brand: 'Apple',
      baseMarketPrice: 138000,
      colorVariants: ['#28282b', '#dedad2', '#595552', '#a88f7b'],
      colorNames: ['Black Titanium', 'White Titanium', 'Natural Titanium', 'Desert Titanium'],
      parts: {
        screen: { oemPrice: 32000, copyPrice: 14000, name: 'Bezelless OLED 6.9"' },
        battery: { oemPrice: 7200, copyPrice: 3100, name: 'АКБ 4685 мАч Metal Can' },
        camera: { oemPrice: 16000, copyPrice: 7000, name: 'Fusion 48MP + Tetraprism' },
        housing: { oemPrice: 14000, copyPrice: 6000, name: 'Grade 5 Titanium Body' }
      },
      screwCount: 2,
      cameraStyle: 'triple_pro',
      screenType: 'island'
    },
    samsung_s22: {
      id: 'samsung_s22',
      name: 'Samsung Galaxy S22',
      brand: 'Samsung',
      baseMarketPrice: 28500,
      colorVariants: ['#1c2022', '#f2f1ed', '#5b7065', '#d4a59a'],
      colorNames: ['Phantom Black', 'Phantom White', 'Green', 'Pink Gold'],
      parts: {
        screen: { oemPrice: 8500, copyPrice: 3600, name: 'Dynamic AMOLED 2X 120Hz' },
        battery: { oemPrice: 2600, copyPrice: 1050, name: 'АКБ 3700 мАч' },
        camera: { oemPrice: 4200, copyPrice: 1750, name: 'Камера 50MP + 3x Zoom' },
        housing: { oemPrice: 2900, copyPrice: 1250, name: 'Стекло Gorilla Glass Victus' }
      },
      screwCount: 2,
      cameraStyle: 'vertical_android',
      screenType: 'punch'
    },
    samsung_s24_ultra: {
      id: 'samsung_s24_ultra',
      name: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      baseMarketPrice: 89000,
      colorVariants: ['#323438', '#5b5866', '#ece9df', '#dbaf58'],
      colorNames: ['Titanium Black', 'Titanium Violet', 'Titanium Gray', 'Titanium Yellow'],
      parts: {
        screen: { oemPrice: 22000, copyPrice: 9800, name: 'Flat Dynamic AMOLED 2600nit' },
        battery: { oemPrice: 4900, copyPrice: 2100, name: 'АКБ 5000 мАч 45W' },
        camera: { oemPrice: 13000, copyPrice: 5500, name: 'Quad Cam 200MP + 5x Periscope' },
        housing: { oemPrice: 9500, copyPrice: 4200, name: 'Titanium Armor Frame' }
      },
      screwCount: 2,
      cameraStyle: 'quad_ultra',
      screenType: 'punch'
    },
    samsung_z_flip: {
      id: 'samsung_z_flip',
      name: 'Samsung Galaxy Z Flip 5',
      brand: 'Samsung',
      baseMarketPrice: 47000,
      colorVariants: ['#282c32', '#ded9cf', '#d1e6d4', '#dfd5e6'],
      colorNames: ['Graphite', 'Cream', 'Mint', 'Lavender'],
      parts: {
        screen: { oemPrice: 18000, copyPrice: 7800, name: 'Infinity Flex AMOLED 120Hz' },
        battery: { oemPrice: 3600, copyPrice: 1500, name: 'Dual Battery 3700 мАч' },
        camera: { oemPrice: 5200, copyPrice: 2250, name: 'Dual 12MP Flex Cam' },
        housing: { oemPrice: 7500, copyPrice: 3200, name: 'Flex Hinge + Armor Alu' }
      },
      screwCount: 2,
      cameraStyle: 'horizontal_flip',
      screenType: 'punch'
    },
    xiaomi_rednote: {
      id: 'xiaomi_rednote',
      name: 'Xiaomi Redmi Note 12 Pro',
      brand: 'Xiaomi',
      baseMarketPrice: 15500,
      colorVariants: ['#1a1f2c', '#dce7f3', '#68a0d4', '#9f86c0'],
      colorNames: ['Midnight Black', 'Polar White', 'Sky Blue', 'Stardust Purple'],
      parts: {
        screen: { oemPrice: 3100, copyPrice: 1350, name: 'AMOLED 120Hz FHD+' },
        battery: { oemPrice: 1550, copyPrice: 700, name: 'АКБ 5000 мАч 67W' },
        camera: { oemPrice: 2100, copyPrice: 900, name: 'Камера 50MP IMX766' },
        housing: { oemPrice: 1200, copyPrice: 550, name: 'Задняя крышка Glossy' }
      },
      screwCount: 2,
      cameraStyle: 'vertical_android',
      screenType: 'punch'
    },
    xiaomi_14_ultra: {
      id: 'xiaomi_14_ultra',
      name: 'Xiaomi 14 Ultra',
      brand: 'Xiaomi',
      baseMarketPrice: 83000,
      colorVariants: ['#171718', '#f2efe9', '#3b5a82'],
      colorNames: ['Black Vegan Leather', 'White Vegan Leather', 'Dragon Crystal Blue'],
      parts: {
        screen: { oemPrice: 20000, copyPrice: 8800, name: 'C8 AMOLED 3000nit WQHD+' },
        battery: { oemPrice: 4600, copyPrice: 1950, name: 'АКБ 5300 мАч 90W' },
        camera: { oemPrice: 14500, copyPrice: 6200, name: 'Quad 1" Sensor 50MP' },
        housing: { oemPrice: 8000, copyPrice: 3600, name: 'Guardian Structure Leather' }
      },
      screwCount: 2,
      cameraStyle: 'giant_circle_leica',
      screenType: 'punch'
    },
    pixel_9_pro: {
      id: 'pixel_9_pro',
      name: 'Google Pixel 9 Pro',
      brand: 'Google',
      baseMarketPrice: 79000,
      colorVariants: ['#282c30', '#f4f3ef', '#5a625f', '#d7bfce'],
      colorNames: ['Obsidian', 'Porcelain', 'Hazel', 'Rose Quartz'],
      parts: {
        screen: { oemPrice: 19500, copyPrice: 8500, name: 'Super Actua LTPO 120Hz' },
        battery: { oemPrice: 4400, copyPrice: 1850, name: 'АКБ 4700 мАч' },
        camera: { oemPrice: 12200, copyPrice: 5300, name: 'Visor Cam 50MP + 5x Tele' },
        housing: { oemPrice: 7500, copyPrice: 3300, name: 'Satin Glass + Polished Alu' }
      },
      screwCount: 2,
      cameraStyle: 'visor_bar',
      screenType: 'punch'
    },
    honor_magic_6: {
      id: 'honor_magic_6',
      name: 'Honor Magic 6 Pro',
      brand: 'Honor',
      baseMarketPrice: 68000,
      colorVariants: ['#1e2024', '#426861', '#e8ded4'],
      colorNames: ['Epi Green', 'Black', 'Cloud Purple'],
      parts: {
        screen: { oemPrice: 16500, copyPrice: 7200, name: 'LTPO Curved 5000nit' },
        battery: { oemPrice: 4000, copyPrice: 1700, name: 'Кремний-углерод 5600 мАч' },
        camera: { oemPrice: 11500, copyPrice: 4900, name: 'Falcon Camera 180MP Periscope' },
        housing: { oemPrice: 6200, copyPrice: 2700, name: 'NanoCrystal Glass Body' }
      },
      screwCount: 2,
      cameraStyle: 'giant_circle_leica',
      screenType: 'island'
    },
    nothing_phone_2: {
      id: 'nothing_phone_2',
      name: 'Nothing Phone (2)',
      brand: 'Nothing',
      baseMarketPrice: 39000,
      colorVariants: ['#23272e', '#e4e7ec'],
      colorNames: ['Dark Grey', 'White Glyph'],
      parts: {
        screen: { oemPrice: 9200, copyPrice: 3900, name: 'Flexible OLED 120Hz' },
        battery: { oemPrice: 2900, copyPrice: 1200, name: 'АКБ 4700 мАч 45W' },
        camera: { oemPrice: 5000, copyPrice: 2200, name: 'Dual 50MP Sony Sensor' },
        housing: { oemPrice: 5600, copyPrice: 2500, name: 'Glyph Transparent Back Glass' }
      },
      screwCount: 2,
      cameraStyle: 'dual_diagonal',
      screenType: 'punch'
    }
  },

  DEFECTS: {
    SCREEN_CRACKED: {
      id: 'SCREEN_CRACKED',
      name: 'Разбит дисплей',
      desc: 'Паутина трещин, полосы на матрице или глючит тачскрин',
      pricePenaltyMultiplier: 0.38,
      requiresPart: 'screen'
    },
    BATTERY_DEAD: {
      id: 'BATTERY_DEAD',
      name: 'Убитый аккумулятор',
      desc: 'Емкость ниже 70%, выключается на холоде, быстро тает заряд',
      pricePenaltyMultiplier: 0.16,
      requiresPart: 'battery'
    },
    CAMERA_BLURRED: {
      id: 'CAMERA_BLURRED',
      name: 'Сломана камера',
      desc: 'Трещина на линзе, пятна на снимках или дрожит оптическая стабилизация',
      pricePenaltyMultiplier: 0.22,
      requiresPart: 'camera'
    },
    HOUSING_DENTED: {
      id: 'HOUSING_DENTED',
      name: 'Побитый корпус',
      desc: 'Глубокие сколы на гранях, треснуто заднее стекло',
      pricePenaltyMultiplier: 0.14,
      requiresPart: 'housing'
    },
    DIRTY_AND_DUSTY: {
      id: 'DIRTY_AND_DUSTY',
      name: 'Следы грязи и пыль',
      desc: 'Забиты сетки динамиков, отпечатки, жирные разводы',
      pricePenaltyMultiplier: 0.06,
      canBeCleaned: true
    }
  },

  LISTING_TEMPLATES: [
    {
      urgent: [
        'Срочно продаю свой телефон! Нужны деньги на оплату аренды. Полный комплект с коробкой. Отдам первому, кто заберет!',
        'Срочная продажа в связи с переходом на новую модель. Работает без нареканий, торг уместен.',
        'Срочно нужны финансы. Любые проверки на месте!'
      ],
      cracked: [
        'Упал с дивана на плитку, треснуло стекло. Сенсор работает везде, можно пользоваться так или под восстановление мастеру.',
        'Разбит экран, упал на пробежке. Картинка есть, на запчасти или замену дисплея. Комплект телефон и провод.',
        'Ребенок уронил телефон, по экрану пошли полосы. Менять экран нет времени, купили новый.'
      ],
      upgrade: [
        'Продаю личный телефон, покупал год назад в магазине. Состояние хорошее, носился в чехле, аккумулятор держит день.',
        'Идеальное состояние, ни одной царапинки. Полный заводской комплект, чек сохранился. Причина — подарили флагман.'
      ],
      shady: [
        'Телефон в отличном состоянии, всё работает! Продаю так как лежит без дела. (ВНИМАНИЕ: возможны скрытые нюансы)',
        'Продам телефон брата. Вроде всё включается, внешне красивый. Приезжайте смотрите сами.'
      ]
    }
  ],

  DISTRICTS: [
    'м. Площадь Революции', 'м. Китай-город', 'м. Таганская', 'м. Курская',
    'м. Белорусская', 'м. Университет', 'м. Сокольники', 'ТРЦ «Европейский»',
    'м. Парк Культуры', 'м. ВДНХ', 'Центр, у кофейни'
  ],

  NPC_NAMES: [
    'Артём М.', 'Елена С.', 'Влад «Скупщик»', 'Дмитрий Ремонт', 'Светлана К.',
    'Максим (Студент)', 'Игорь Петрович', 'Алиса В.', 'Сергей 24/7', 'Кристина',
    'Роман Девайс', 'Ольга В.', 'Михаил Т.', 'Юлия Фото', 'Павел Экспресс', 'Даниил',
    'Константин Tech', 'Виктория', 'Артур Перекуп', 'Мария Лайф'
  ],

  AVATAR_ICONS: ['👨‍🦱', '👩‍🦰', '🧔', '🧑‍💻', '👵', '👨‍🎓', '🧓', '👩‍🎨', '😎', '👱‍♀️', '👨‍💼', '👩‍💼', '🤖', '🧑‍🔧'],

  NPC_ARCHETYPES: {
    URGENT_SELLER: { id: 'URGENT_SELLER', patience: 5, greed: 0.72, hiddenDefectChance: 0.04, dialogueTag: 'urgent' },
    GREEDY_SELLER: { id: 'GREEDY_SELLER', patience: 2, greed: 0.95, hiddenDefectChance: 0.08, dialogueTag: 'greedy' },
    SHADY_DEALER: { id: 'SHADY_DEALER', patience: 3, greed: 0.80, hiddenDefectChance: 0.65, dialogueTag: 'shady' },
    SIMPLE_BUYER: { id: 'SIMPLE_BUYER', patience: 3, priceTolerance: 1.05, demandsGift: false },
    PICKY_BUYER: { id: 'PICKY_BUYER', patience: 2, priceTolerance: 0.93, demandsGift: true }
  },

  TOOLS: {
    SCREWDRIVER: { id: 'SCREWDRIVER', name: 'Отвертка', icon: '🪛', desc: 'Откручивание и закручивание винтов' },
    SUCTION_CUP: { id: 'SUCTION_CUP', name: 'Присоска', icon: '🪟', desc: 'Вскрытие и закрытие корпуса' },
    TWEEZERS: { id: 'TWEEZERS', name: 'Пинцет', icon: '🤏', desc: 'Установка и извлечение модулей' },
    CLEANING_CLOTH: { id: 'CLEANING_CLOTH', name: 'Салфетка', icon: '🧽', desc: 'Очистка стекла и корпуса от грязи' },
    TESTER: { id: 'TESTER', name: 'Тестер', icon: '⚡', desc: 'Проверка работоспособности' }
  },

  renderPhoneMockupSVG(modelId, color, defects = []) {
    const model = window.GAME_CONSTANTS.PHONE_MODELS[modelId] || window.GAME_CONSTANTS.PHONE_MODELS.iphone_11;
    const isCracked = defects.includes('SCREEN_CRACKED');

    let cameraSvg = '';
    if (model.cameraStyle === 'dual_diagonal') {
      cameraSvg = `
        <rect x="8" y="8" width="22" height="22" rx="6" fill="#1e1e24" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <circle cx="14" cy="14" r="4" fill="#0b0b0e" stroke="#555" stroke-width="1"/>
        <circle cx="24" cy="24" r="4" fill="#0b0b0e" stroke="#555" stroke-width="1"/>
      `;
    } else if (model.cameraStyle === 'triple_pro') {
      cameraSvg = `
        <rect x="8" y="8" width="26" height="26" rx="7" fill="#22252a" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        <circle cx="15" cy="15" r="4" fill="#09090c" stroke="#888" stroke-width="1"/>
        <circle cx="27" cy="15" r="4" fill="#09090c" stroke="#888" stroke-width="1"/>
        <circle cx="21" cy="27" r="4" fill="#09090c" stroke="#888" stroke-width="1"/>
      `;
    } else if (model.cameraStyle === 'quad_ultra') {
      cameraSvg = `
        <circle cx="15" cy="14" r="4" fill="#09090c" stroke="#aaa" stroke-width="1"/>
        <circle cx="15" cy="24" r="4" fill="#09090c" stroke="#aaa" stroke-width="1"/>
        <circle cx="15" cy="34" r="4" fill="#09090c" stroke="#aaa" stroke-width="1"/>
        <circle cx="26" cy="19" r="3" fill="#09090c" stroke="#aaa" stroke-width="0.8"/>
      `;
    } else if (model.cameraStyle === 'giant_circle_leica') {
      cameraSvg = `
        <circle cx="40" cy="32" r="20" fill="#181a20" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
        <circle cx="32" cy="26" r="4" fill="#050508" stroke="#888" stroke-width="1"/>
        <circle cx="48" cy="26" r="4" fill="#050508" stroke="#888" stroke-width="1"/>
        <circle cx="32" cy="38" r="4" fill="#050508" stroke="#888" stroke-width="1"/>
        <circle cx="48" cy="38" r="4" fill="#050508" stroke="#888" stroke-width="1"/>
      `;
    } else if (model.cameraStyle === 'visor_bar') {
      cameraSvg = `
        <rect x="2" y="16" width="76" height="18" rx="8" fill="#181a20" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
        <circle cx="24" cy="25" r="4.5" fill="#050508" stroke="#888" stroke-width="1"/>
        <circle cx="38" cy="25" r="4.5" fill="#050508" stroke="#888" stroke-width="1"/>
        <rect x="52" y="21" width="10" height="8" rx="2" fill="#050508" stroke="#888" stroke-width="1"/>
      `;
    } else if (model.cameraStyle === 'horizontal_flip') {
      cameraSvg = `
        <rect x="6" y="8" width="68" height="45" rx="8" fill="#0a0a0f" stroke="#333" stroke-width="1"/>
        <circle cx="18" cy="18" r="4" fill="#000" stroke="#777" stroke-width="1"/>
        <circle cx="32" cy="18" r="4" fill="#000" stroke="#777" stroke-width="1"/>
      `;
    } else {
      cameraSvg = `
        <rect x="8" y="8" width="14" height="34" rx="7" fill="#181a20" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
        <circle cx="15" cy="15" r="3.5" fill="#050508" stroke="#777" stroke-width="0.8"/>
        <circle cx="15" cy="25" r="3.5" fill="#050508" stroke="#777" stroke-width="0.8"/>
        <circle cx="15" cy="35" r="3.5" fill="#050508" stroke="#777" stroke-width="0.8"/>
      `;
    }

    return `
      <svg viewBox="0 0 80 130" class="real-phone-svg-mockup">
        <rect x="5" y="4" width="70" height="122" rx="16" fill="${color}" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
        ${cameraSvg}
        ${isCracked ? `
          <path d="M 10 20 L 40 60 L 25 90 L 70 115 M 40 60 L 65 35 M 40 60 L 50 100" stroke="rgba(255,255,255,0.88)" stroke-width="2.5" fill="none" stroke-linecap="round" />
        ` : ''}
      </svg>
    `;
  }
};
