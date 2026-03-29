import { LitElement, html, css } from 'lit';

class WalletButton extends LitElement {
  static properties = {
    isConnected: { type: Boolean, state: true },
    address: { type: String, state: true },
    walletName: { type: String, state: true },
    isLoading: { type: Boolean, state: true },
    showProfile: { type: Boolean, state: true },
    availableWallets: { type: Array, state: true }
  };

  constructor() {
    super();
    this.isConnected = false;
    this.address = '';
    this.walletName = '';
    this.isLoading = false;
    this.showProfile = false;
    this.availableWallets = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.detectWallets();
  }

  detectWallets() {
    const wallets = [];
    if (window.cardano) {
      Object.keys(window.cardano).forEach(key => {
        if (window.cardano[key]?.enable) {
          wallets.push(key.charAt(0).toUpperCase() + key.slice(1));
        }
      });
    }
    this.availableWallets = wallets.length ? wallets : ['Nami', 'Eternl', 'Flint'];
  }

  async connectWallet(selectedWallet) {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      console.log(`🔗 Connecting to ${selectedWallet}...`);
      await new Promise(r => setTimeout(r, 700)); // placeholder

      this.walletName = selectedWallet;
      this.address = 'addr1qx...truncated-real-address-coming-in-next-step';
      this.isConnected = true;
      console.log(`✅ Connected via ${selectedWallet}`);
    } catch (err) {
      console.error(err);
      alert('Wallet connection failed. Is the extension installed and unlocked?');
    } finally {
      this.isLoading = false;
    }
  }

  disconnect() {
    this.isConnected = false;
    this.address = '';
    this.walletName = '';
    this.showProfile = false;
  }

  render() {
    return html`
      ${!this.isConnected 
        ? html`
          <button 
            @click=${() => this.connectWallet(this.availableWallets[0] || 'Nami')}
            ?disabled=${this.isLoading}
            style="padding: 0.75rem 1.5rem; background: #2563eb; color: white; border: none; border-radius: 0.75rem; cursor: pointer;"
          >
            ${this.isLoading ? 'Connecting...' : '🔗 Connect Wallet'}
          </button>`
        : html`
          <button 
            @click=${() => (this.showProfile = !this.showProfile)}
            style="padding: 0.75rem 1.5rem; background: #16a34a; color: white; border: none; border-radius: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;"
          >
            <span style="display: inline-block; width: 8px; height: 8px; background: #4ade80; border-radius: 9999px; animation: pulse 2s infinite;"></span>
            Profile
            <span style="font-size: 0.75rem; opacity: 0.75;">
              ${this.address ? `${this.address.slice(0,8)}...${this.address.slice(-6)}` : ''}
            </span>
          </button>`}

      ${this.showProfile && this.isConnected ? html`   <!-- Marketplace grid will go here in next PR -->  
  </main> 
        <div style="position: absolute; right: 0; margin-top: 0.5rem; width: 20rem; background: #18181b; border: 1px solid #3f3f46; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.4); z-index: 50;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <div>
              <div style="font-size: 0.75rem; color: #a1a1aa;">Connected via</div>
              <div style="font-weight: 600;">${this.walletName}</div>
            </div>
            <button @click=${this.disconnect} style="color: #f87171; font-size: 0.75rem; text-decoration: underline;">Log out</button>
          </div>

          <div style="background: #27272a; padding: 0.75rem; border-radius: 0.75rem; font-family: monospace; font-size: 0.75rem; word-break: break-all; margin-bottom: 1rem;">
            ${this.address}
          </div>

          <button @click=${() => alert('View full profile – coming soon')} style="width: 100%; text-align: left; padding: 0.5rem 1rem; border-radius: 0.75rem; margin-bottom: 0.25rem;">👤 View Profile</button>
          <button @click=${() => { this.disconnect(); setTimeout(() => this.connectWallet(this.availableWallets[0]), 300); }} style="width: 100%; text-align: left; padding: 0.5rem 1rem; border-radius: 0.75rem;">🔄 Switch Wallet</button>

          <button @click=${() => (this.showProfile = false)} style="margin-top: 1rem; width: 100%; color: #a1a1aa; font-size: 0.75rem;">Close</button>
        </div>` : ''}
    `;
  }
}

customElements.define('wallet-button', WalletButton);