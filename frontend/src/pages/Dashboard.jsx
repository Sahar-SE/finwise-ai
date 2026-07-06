import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import client from '../api/client';
import Card from '../components/Card';
import { RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [crypto, setCrypto] = useState([]);
  const [gold, setGold] = useState(null);
  const [equities, setEquities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const res = await client.get('/market/overview');
      setCrypto(res.data.crypto);
      setGold(res.data.gold);
      setEquities(res.data.equities);
    } catch (err) {
      setError('Could not load live market data. Retrying automatically…');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[var(--text)]">Live market dashboard</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Crypto, gold, and equities — refreshed every 30 seconds.</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && <div className="mt-4 rounded-md border border-[var(--coral)]/40 bg-[var(--coral)]/10 px-3 py-2 text-sm text-[var(--coral)]">{error}</div>}

      {/* Gold */}
      {gold && (
        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[var(--text-muted)]">XAU/USD · Gold</div>
              <div className="mt-1 font-mono-data text-3xl text-[var(--gold)]">${gold.price?.toLocaleString()}</div>
            </div>
            <div className={`font-mono-data text-sm ${gold.change24h >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
              {gold.change24h >= 0 ? '▲' : '▼'} {Math.abs(gold.change24h).toFixed(2)}% · 24h
            </div>
          </div>
        </Card>
      )}

      {/* Crypto grid */}
      <h2 className="mt-10 font-display text-lg font-semibold text-[var(--text)]">Top cryptocurrencies</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {crypto.map((c) => (
          <Card key={c.symbol}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[var(--text)]">{c.name}</div>
                <div className="text-xs text-[var(--text-muted)]">{c.symbol}</div>
              </div>
              <div className="text-right">
                <div className="font-mono-data text-sm text-[var(--text)]">${c.price?.toLocaleString()}</div>
                <div className={`text-xs ${c.change24h >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                  {c.change24h >= 0 ? '▲' : '▼'} {Math.abs(c.change24h || 0).toFixed(2)}%
                </div>
              </div>
            </div>
            {c.sparkline?.length > 1 && (
              <div className="mt-3 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={c.sparkline.map((p, i) => ({ i, p }))}>
                    <Line type="monotone" dataKey="p" stroke={c.change24h >= 0 ? 'var(--mint)' : 'var(--coral)'} strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Equities */}
      <h2 className="mt-10 font-display text-lg font-semibold text-[var(--text)]">Equities watchlist</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {equities.map((e) => (
          <Card key={e.symbol}>
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--text)]">{e.symbol}</div>
              <div className="text-right">
                <div className="font-mono-data text-sm text-[var(--text)]">${e.price?.toLocaleString()}</div>
                <div className={`text-xs ${e.change24h >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                  {e.change24h >= 0 ? '▲' : '▼'} {Math.abs(e.change24h || 0).toFixed(2)}%
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {equities[0]?.simulated && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Equity and gold prices are simulated for this demo. Add a free Alpha Vantage / GoldAPI key in the backend .env to switch to live feeds — see the setup guide.
        </p>
      )}
    </div>
  );
}
