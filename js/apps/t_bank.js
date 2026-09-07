// js/apps/t_bank.js - Т-Банк с внутриигровыми диалоговыми окнами

class TBankApp {
  constructor() {
    this.activeTab = 'accounts';
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    window.eventBus.on('wallet:updated', () => {
      if (window.gameState.state.activeApp === 't_bank') {
        this.render();
      }
    });
  }

  render() {
    const screenEl = document.getElementById('screen-t_bank');
    if (!screenEl) return;

    const wallet = window.gameState.state.wallet;

    screenEl.innerHTML = `
      <div class="bank-container">
        <div class="bank-header">
          <div class="bank-brand-row">
            <div class="bank-logo">
              <span class="bank-logo-badge">💳</span>
              <span>Мой Банк</span>
            </div>
            <span class="bank-user-tag">Счёт перекупщика</span>
          </div>

          <div class="bank-main-balance">
            <span class="balance-label">Суммарный капитал:</span>
            <div class="balance-amount">${(wallet.card + wallet.cash).toLocaleString('ru-RU')} ₽</div>
          </div>
        </div>

        <div class="bank-tabs">
          <button class="bank-tab ${this.activeTab === 'accounts' ? 'active' : ''}" data-tab="accounts">Счета и карты</button>
          <button class="bank-tab ${this.activeTab === 'analytics' ? 'active' : ''}" data-tab="analytics">Аналитика</button>
          <button class="bank-tab ${this.activeTab === 'history' ? 'active' : ''}" data-tab="history">История</button>
        </div>

        <div class="bank-content">
          ${this._renderTabContent()}
        </div>
      </div>
    `;

    this._bindEvents(screenEl);
  }

  _renderTabContent() {
    if (this.activeTab === 'accounts') return this._renderAccounts();
    if (this.activeTab === 'analytics') return this._renderAnalytics();
    if (this.activeTab === 'history') return this._renderHistory();
    return '';
  }

  _renderAccounts() {
    const wallet = window.gameState.state.wallet;

    return `
      <div class="bank-cards-stack">
        <div class="bank-card black-card">
          <div class="card-chip"></div>
          <div class="card-type-logo">Дебетовая карта</div>
          <div class="card-balance">${wallet.card.toLocaleString('ru-RU')} ₽</div>
          <div class="card-footer">
            <span>•••• 4242</span>
            <button class="btn-card-action" id="btn-atm-action">Банкомат</button>
          </div>
        </div>

        <div class="bank-card cash-card">
          <div class="card-type">💵 Наличные (В кармане / Сейф)</div>
          <div class="card-digits">Купюры для личных встреч</div>
          <div class="card-balance">${wallet.cash.toLocaleString('ru-RU')} ₽</div>
        </div>
      </div>

      <div class="bank-quick-actions">
        <button class="btn-bank-action" id="btn-atm-deposit">
          <span>🏦</span> Внести наличные на карту (Банкомат)
        </button>
        <button class="btn-bank-action" id="btn-atm-withdraw">
          <span>🏧</span> Снять наличные с карты
        </button>
      </div>
    `;
  }

  _renderAnalytics() {
    const stats = window.gameState.state.stats;
    const totalProfit = stats.totalEarned - stats.totalSpent;

    return `
      <div class="analytics-grid">
        <div class="analytics-stat-card">
          <div class="stat-title">Чистая прибыль (P&L):</div>
          <div class="stat-value ${totalProfit >= 0 ? 'profit-pos' : 'profit-neg'}">
            ${totalProfit >= 0 ? '+' : ''}${totalProfit.toLocaleString('ru-RU')} ₽
          </div>
        </div>

        <div class="analytics-stat-card">
          <div class="stat-title">Всего заработано:</div>
          <div class="stat-value text-green">+${stats.totalEarned.toLocaleString('ru-RU')} ₽</div>
        </div>

        <div class="analytics-stat-card">
          <div class="stat-title">Всего потрачено:</div>
          <div class="stat-value text-red">-${stats.totalSpent.toLocaleString('ru-RU')} ₽</div>
        </div>

        <div class="analytics-stat-card">
          <div class="stat-title">Телефонов продано:</div>
          <div class="stat-value">${stats.phonesSold} шт.</div>
        </div>

        <div class="analytics-stat-card">
          <div class="stat-title">Успешных ремонтов:</div>
          <div class="stat-value">${stats.phonesRepaired} шт.</div>
        </div>

        <div class="analytics-stat-card">
          <div class="stat-title">Рекордная маржа со сделки:</div>
          <div class="stat-value text-gold">+${stats.bestDealProfit.toLocaleString('ru-RU')} ₽</div>
        </div>
      </div>
    `;
  }

  _renderHistory() {
    const txs = window.gameState.state.transactions;
    if (txs.length === 0) {
      return '<div class="empty-state">История операций пуста</div>';
    }

    return `
      <div class="transactions-list">
        ${txs.map(tx => `
          <div class="tx-item">
            <div class="tx-icon-box ${tx.type}">${tx.type === 'income' ? '↓' : '↑'}</div>
            <div class="tx-details">
              <div class="tx-desc">${tx.description}</div>
              <div class="tx-time">День ${tx.day}, ${tx.timeStr} • ${tx.paymentMethod === 'card' ? 'Карта' : 'Наличные'}</div>
            </div>
            <div class="tx-amount ${tx.type}">
              ${tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('ru-RU')} ₽
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  _bindEvents(container) {
    container.querySelectorAll('.bank-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        window.soundFx.playClick();
        this.activeTab = tab.dataset.tab;
        this.render();
      });
    });

    const btnDep = container.querySelector('#btn-atm-deposit');
    if (btnDep) {
      btnDep.addEventListener('click', () => {
        const cash = window.gameState.state.wallet.cash;
        if (cash <= 0) {
          window.showAlert('У вас нет наличных денег для внесения на карту!', 'Банкомат', '🏧');
          return;
        }
        window.gameState.state.wallet.cash = 0;
        window.gameState.state.wallet.card += cash;
        window.soundFx.playMoney();
        window.gameState.save();
        window.showAlert(`Все наличные (${cash.toLocaleString('ru-RU')} ₽) внесены на карту через банкомат!`, 'Банкомат', '🏧');
        this.render();
      });
    }

    const btnWith = container.querySelector('#btn-atm-withdraw');
    if (btnWith) {
      btnWith.addEventListener('click', () => {
        const amount = 10000;
        if (window.gameState.state.wallet.card < amount) {
          window.showAlert('Недостаточно средств на карте для снятия 10 000 ₽!', 'Банкомат', '🏧');
          return;
        }
        window.gameState.state.wallet.card -= amount;
        window.gameState.state.wallet.cash += amount;
        window.soundFx.playMoney();
        window.gameState.save();
        window.showAlert(`Снято ${amount.toLocaleString('ru-RU')} ₽ наличными в карман для личных встреч.`, 'Банкомат', '🏧');
        this.render();
      });
    }
  }
}

window.tBankApp = new TBankApp();
