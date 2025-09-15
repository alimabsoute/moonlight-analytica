import { useEffect, useState } from 'react';
const TABS = ['tracker','counter','analytics'];
export function useHashTabs(defaultTab='tracker') {
  const [tab,setTab] = useState(() => {
    const h=(location.hash||'').slice(1); return TABS.includes(h)?h:defaultTab;
  });
  useEffect(()=>{ const onHash=()=>{ const h=(location.hash||'').slice(1); if(TABS.includes(h)) setTab(h); };
    window.addEventListener('hashchange', onHash); return ()=>window.removeEventListener('hashchange', onHash);
  },[]);
  useEffect(()=>{ const h='#'+tab; if(location.hash!==h) location.hash=h; },[tab]);
  return [tab,setTab];
}