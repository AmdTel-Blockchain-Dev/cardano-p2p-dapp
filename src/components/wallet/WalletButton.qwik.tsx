import { component$, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik';
import type { Lucid } from 'lucid-cardano'; // We'll import properly in next steps

export const WalletButton = component$(() => {
  const isConnected = useSignal(false);
  const address = useSignal('');
  const isLoading = useSignal(false);
  const showProfile = useSignal(false);

  // Simple store for wallet state (we'll persist to localStorage later)
  const walletState = useStore({
    walletName: '',
    lucidInstance: null as Lucid | null,
  });

  // Placeholder: detect available wallets (CIP-30)
  const availableWallets = useSignal<string[]>([]);

  // Visible task to check for injected wallets on client
  useVisibleTask$(() => {
    const wallets: string[] = [];
    if ((window as any).cardano) {
      Object.keys((window as any).cardano).forEach((key) => {
        if ((window as any).cardano[key]?.enable) {
          wallets.push(key.charAt(0).toUpperCase() + key.slice(1));
        }
      });
    }
    availableWallets.value = wallets.length ? wallets : ['Nami', 'Eternl', 'Flint']; // fallback for dev
    console.log('🔍 Detected wallets:', availableWallets.value);
  });

  const connectWallet = $(async (walletName: string) => {
    isLoading.value = true;
    try {
      // TODO: Real Lucid + CIP-30 connect in Step 2
      console.log(`Connecting to ${walletName}...`);
      // Simulate for now
      await new Promise((resolve) => setTimeout(resolve, 800));

      walletState.walletName = walletName;
      address.value = 'addr1qx...truncated1234567890'; // placeholder
      isConnected.value = true;
      showProfile.value = false;

      // TODO: persist to localStorage
      console.log('✅ Connected with', walletName);
    } catch (err) {
      console.error('❌ Wallet connect failed', err);
    } finally {
      isLoading.value = false;
    }
  });

  const disconnect = $(() => {
    isConnected.value = false;
    address.value = '';
    walletState.walletName = '';
    walletState.lucidInstance = null;
    showProfile.value = false;
    console.log('👋 Disconnected');
  });

  const toggleProfile = $(() => {
    showProfile.value = !showProfile.value;
  });

  return (
    <div class="wallet-button-wrapper relative inline-block">
      {!isConnected.value ? (
        // Connect state
        <button
          onClick$={() => {
            // For now, auto-pick first wallet or open simple list
            if (availableWallets.value.length > 0) {
              connectWallet(availableWallets.value[0]);
            } else {
              alert('No Cardano wallets detected. Please install Nami/Eternl/etc.');
            }
          }}
          disabled={isLoading.value}
          class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl flex items-center gap-2 transition-all disabled:opacity-70"
        >
          {isLoading.value ? 'Connecting...' : '🔗 Connect Wallet'}
        </button>
      ) : (
        // Connected / Profile state
        <button
          onClick$={toggleProfile}
          class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl flex items-center gap-3 transition-all"
        >
          <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Profile
          <span class="text-xs opacity-75 truncate max-w-[140px]">
            {address.value.slice(0, 8)}...{address.value.slice(-6)}
          </span>
        </button>
      )}

      {/* Simple profile popover (we'll improve with proper Popover later) */}
      {showProfile.value && isConnected.value && (
        <div class="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-5 z-50 text-sm">
          <div class="flex justify-between items-center mb-4">
            <div>
              <p class="font-mono text-xs text-zinc-400">Connected via</p>
              <p class="font-semibold">{walletState.walletName}</p>
            </div>
            <button onClick$={disconnect} class="text-red-400 hover:text-red-500 text-xs underline">
              Log out
            </button>
          </div>

          <div class="bg-zinc-800 rounded-xl p-3 mb-4 font-mono text-xs break-all">
            {address.value}
          </div>

          <div class="space-y-2">
            <button
              onClick$={() => alert('View full profile page — coming soon')}
              class="w-full py-2 text-left px-4 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              👤 View Profile
            </button>
            <button
              onClick$={() => {
                disconnect();
                // Re-trigger connect flow
                setTimeout(() => {
                  if (availableWallets.value.length > 0) connectWallet(availableWallets.value[0]);
                }, 300);
              }}
              class="w-full py-2 text-left px-4 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              🔄 Switch Wallet
            </button>
          </div>

          <button
            onClick$={toggleProfile}
            class="mt-4 w-full text-center text-zinc-400 hover:text-white text-xs"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
});