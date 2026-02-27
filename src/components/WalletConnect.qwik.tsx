/** @jsxImportSource @builder.io/qwik */  

import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';  
import { Lucid } from 'lucid-cardano';  

export default component$(() => {  
  const address = useSignal('');  
  const balance = useSignal('0 $P2P');  

  useVisibleTask$(async () => {  
    const lucid = await Lucid.new(undefined, 'Mainnet');

    if (window.cardano) {
      const api = await window.cardano.nami?.enable() ||   
                 await window.cardano.eternl?.enable() ||   
                 await window.cardano.lace?.enable();  
      lucid.selectWallet(api);  

      const addr = (await lucid.wallet.address()).trim();  
      console.log('wallet address:', addr);
      address.value = addr.slice(0,12) + '...' + addr.slice(-8);  

      try {
        const fetchUrl = `/api/balance?address=${encodeURIComponent(addr)}`;
        console.log('fetching from:', fetchUrl);
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const data = await res.json();
          balance.value = `${data.lovelace} lovelace`;
        } else {
          console.error('fetch error status:', res.status, await res.text());
        }
      } catch (e) {
        console.error('balance lookup failed', e);
      }
    }  
  });  

  return (  
    <div>  
      {address.value ? (  
        <div>  
          <p>Connected: {address.value}</p>  
          <p>Balance: {balance.value}</p>  
          <button onClick$={() => alert('Buy $P2P coming soon — 1 GBP + fee')}>Buy $P2P</button>  
        </div>  
      ) : (  
        <button onClick$={async () => { /* trigger enable */ alert('Connect wallet — Nami/Eternl/Lace supported'); }}>Connect Cardano Wallet</button>  
      )}  
    </div>  
  );  
});
