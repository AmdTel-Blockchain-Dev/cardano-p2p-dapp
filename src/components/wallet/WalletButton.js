import { LitElement, html, css } from 'lit';

class WalletButton extends LitElement {
  static properties = {
    isConnected: { type: Boolean, state: true },
    address: { type: String, state: true },
    walletName: { type: String, state: true },
    isLoading: { type: Boolean, state: true },
    showProfile: { type: Boolean, state: true },
    showModal: { type: Boolean, state: true },
    modalContent: { type: Object, state: true },
    currentWalletApi: { type: Object, state: true },
    availableWallets: { type: Array, state: true }
  };

  static get styles() {
    return css`
      :host {
        --primary-blue: #0066ff;
        --bg: light-dark(#ffffff, #1a1a1a);
        --surface: light-dark(#f8f9fa, #2a2a2a);
        --text: light-dark(#111111, #eeeeee);
        --text-secondary: light-dark(#555555, #aaaaaa);
        --border: light-dark(#dddddd, #444444);
        --danger: #ff5555;
        --radius: 12px;
        --button-radius: 9999px;
      }

      .connect-btn {
        padding: 0.75rem 1.5rem;
        border-radius: var(--button-radius);
        font-weight: 600;
        cursor: pointer;
        background: var(--primary-blue);
        color: white;
        border: none;
      }

      .connect-btn:hover {
        background: #0052cc;
      }

      .connected-btn {
        padding: 0.75rem 1.5rem;
        border-radius: var(--button-radius);
        font-weight: 600;
        cursor: pointer;
        background: var(--surface);
        color: var(--text);
        border: 1px solid var(--border);
      }

      .popover {
        position: absolute;
        top: 60px;
        right: 20px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 1rem;
        width: 240px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        color: var(--text);
        z-index: 100;
      }

      .modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 1.5rem;
        width: 320px;
        z-index: 1000;
        color: var(--text);
        box-shadow: 0 10px 40px rgba(0,0,0,0.4);
      }

      .modal-header {
        font-size: 1.1rem;
        margin-bottom: 1rem;
        font-weight: 600;
        color: var(--text);
      }

      .modal-body button {
        display: block;
        width: 100%;
        padding: 0.75rem;
        margin: 0.4rem 0;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        color: var(--text);
        cursor: pointer;
        font-size: 0.95rem;
      }

      .modal-body button:hover {
        background: light-dark(#f0f0f0, #3a3a3a);
        border-color: var(--primary-blue);
      }

      .modal-close {
        margin-top: 1rem;
        background: transparent;
        color: var(--text-secondary);
        border: none;
        font-size: 0.9rem;
        cursor: pointer;
      }

      .modal-close:hover {
        color: var(--text);
      }

      /* Popover buttons */
      .popover-btn {
        display: block;
        width: 100%;
        text-align: left;
        padding: 0.6rem 1rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        margin-bottom: 0.25rem;
        color: var(--text);
        cursor: pointer;
      }

      .popover-btn:hover {
        background: light-dark(#f0f0f0, #3a3a3a);
        border-color: var(--primary-blue);
      }

      .popover-btn.danger {
        color: var(--danger);
      }
    `;
  }

  constructor() {
    super();
    this.isConnected = false;
    this.address = '';
    this.walletName = '';
    this.isLoading = false;
    this.showProfile = false;
    this.showModal = false;
    this.modalContent = null;
    this.currentWalletApi = null;
    this.availableWallets = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.restoreSession();
    this.detectWallets();
  }

  detectWallets() {
    const wallets = [];
    if (window.cardano) {
      Object.keys(window.cardano).forEach(key => {
        if (typeof window.cardano[key]?.enable === 'function') {
          wallets.push(key.charAt(0).toUpperCase() + key.slice(1));
        }
      });
    }
    this.availableWallets = wallets.length ? wallets : ['Nami', 'Eternl', 'Flint', 'Lace'];
  }

  restoreSession() {
    const savedWallet = localStorage.getItem('cardano-wallet-name');
    const savedAddress = localStorage.getItem('cardano-active-address');
    if (savedWallet && savedAddress) {
      this.walletName = savedWallet;
      this.address = savedAddress;
      this.isConnected = true;
    }
  }

  truncateAddress(addr) {
    return addr ? `${addr.slice(0, 8)}...${addr.slice(-8)}` : '';
  }

  openModal(content) {
    this.modalContent = content;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.modalContent = null;
  }

  showWalletSelector() {
    if (this.isLoading) return;

    const walletItems = this.availableWallets.map(name => html`
      <button class="wallet-option" @click=${() => this.enableWalletAndShowAddressSelector(name)}>
        ${name}
      </button>
    `);

    this.openModal(html`
      <div class="modal-header">Select Wallet to Login</div>
      <div class="modal-body">
        ${walletItems}
      </div>
      <button class="modal-close" @click=${() => this.closeModal()}>Cancel</button>
    `);
  }

  async enableWalletAndShowAddressSelector(walletName) {
    this.isLoading = true;
    this.closeModal();

    try {
      const walletApi = await window.cardano[walletName.toLowerCase()].enable();
      const addresses = await walletApi.getUsedAddresses();

      if (!addresses || addresses.length === 0) {
        throw new Error('No addresses found in this wallet');
      }

      const addressItems = addresses.map(addr => html`
        <button class="address-option" @click=${() => this.finalizeLogin(walletName, addr, walletApi)}>
          ${this.truncateAddress(addr)}
        </button>
      `);

      this.openModal(html`
        <div class="modal-header">Select Address for ${walletName}</div>
        <div class="modal-body">
          ${addressItems}
        </div>
        <button class="modal-close" @click=${() => this.closeModal()}>Cancel</button>
      `);
    } catch (err) {
      console.error(err);
      alert(`Failed to connect to ${walletName}. Make sure the extension is installed and unlocked.`);
    } finally {
      this.isLoading = false;
    }
  }

  finalizeLogin(walletName, selectedAddress, walletApi) {
    localStorage.setItem('cardano-wallet-name', walletName);
    localStorage.setItem('cardano-active-address', selectedAddress);

    this.walletName = walletName;
    this.address = selectedAddress;
    this.currentWalletApi = walletApi;
    this.isConnected = true;
    this.closeModal();

    console.log(`Logged in with ${walletName} — ${this.truncateAddress(selectedAddress)}`);
  }

  async switchAddress() {
    if (!this.currentWalletApi || !this.walletName) return;

    this.isLoading = true;

    try {
      const addresses = await this.currentWalletApi.getUsedAddresses();

      const addressItems = addresses.map(addr => html`
        <button class="address-option" @click=${() => {
          localStorage.setItem('cardano-active-address', addr);
          this.address = addr;
          this.closeModal();
          console.log(`Switched to address: ${this.truncateAddress(addr)}`);
        }}>
          ${this.truncateAddress(addr)}
        </button>
      `);

      this.openModal(html`
        <div class="modal-header">Switch Address (${this.walletName})</div>
        <div class="modal-body">
          ${addressItems}
        </div>
        <button class="modal-close" @click=${() => this.closeModal()}>Cancel</button>
      `);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch addresses.');
    } finally {
      this.isLoading = false;
    }
  }

  disconnect() {
    localStorage.removeItem('cardano-wallet-name');
    localStorage.removeItem('cardano-active-address');
    this.isConnected = false;
    this.address = '';
    this.walletName = '';
    this.currentWalletApi = null;
    this.showProfile = false;
    this.closeModal();
  }

  render() {
    return html`
      ${!this.isConnected 
        ? html`
          <button class="connect-btn" @click=${() => this.showWalletSelector()} ?disabled=${this.isLoading}>
            ${this.isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ` 
        : html`
          <button class="connected-btn" @click=${() => this.showProfile = !this.showProfile}>
            ${this.truncateAddress(this.address)}
          </button>
        `}

      <!-- Profile Popover -->
      ${this.showProfile && this.isConnected ? html`
        <div class="popover">
          <div style="margin-bottom: 0.75rem; font-size: 0.9rem; color: var(--text-secondary);">
            Connected via <strong>${this.walletName}</strong>
          </div>
          <button class="popover-btn" @click=${() => alert('View full profile – coming soon')}>
            View Profile
          </button>
          <button class="popover-btn" @click=${() => this.switchAddress()}>
            Switch Address
          </button>
          <button class="popover-btn danger" @click=${() => this.disconnect()}>
            Log Off
          </button>
          <button class="modal-close" @click=${() => this.showProfile = false}>
            Close
          </button>
        </div>
      ` : ''}

      <!-- Global Modal -->
      ${this.showModal && this.modalContent ? html`
        <div class="modal">
          ${this.modalContent}
        </div>
      ` : ''}
    `;
  }
}

customElements.define('wallet-button', WalletButton);