import { useEffect, useState } from 'react';
import client from '../api/client';

export default function PriceTicker() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await client.get('/market/overview');
        if (!mounted) return;
        const crypto = res.data.crypto.map((c) => ({ symbol: c.symbol, price: c.price, change: c.change24h }));
        const gold = res.data.gold ? [{ symbol: 'XAU', price: res.data.gold.price, change: res.data.gold.change24h }] : [];
        const equities = res.data.equities.map((e) => ({ symbol: e.symbol, price: e.price, change: e.change24h }));
        setItems([...gold, ...crypto, ...equities]);
      } catch (e) {
        // silent - ticker degrades gracefully
      }
    }
    load();
    const interval = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden border-y border-[var(--border)] bg-[var(--surface)] py-2">
      <div className="flex w-max ticker-track gap-8 px-4">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap font-mono-data text-sm">
            <span className="text-[var(--text-muted)]">{item.symbol}</span>
            <span className="text-[var(--text)]">${item.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            <span className={item.change >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}>
              {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change || 0).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
