import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import client from '../api/client';
import Card from '../components/Card';
import { RefreshCw, Sparkles, Search, TrendingUp, DollarSign, Activity, Zap } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [crypto, setCrypto] = useState([]);
  const [gold, setGold] = useState(null);
  const [equities, setEquities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const res = await client.get('/market/overview');
      setCrypto(res.data.crypto || []);
      setGold(res.data.gold || null);
      setEquities(res.data.equities || []);
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

  const filteredCrypto = crypto.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEquities = equities.filter((e) => e.symbol.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)] sm:text-3xl">Live Market Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Real-time crypto, gold, and equities pricing with direct AI prediction shortcuts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search symbol or asset…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] pl-9 pr-3 py-2 text-xs font-medium text-[var(--text)] focus:border-[var(--mint)] focus:outline-none w-48 sm:w-64"
            />
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--mint)] transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-[var(--coral)]/40 bg-[var(--coral)]/10 px-4 py-3 text-sm text-[var(--coral)]">
          {error}
        </div>
      )}

      {/* Global Market Overview Bar */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-l-4 border-l-[var(--mint)]">
          <div className="text-xs text-[var(--text-muted)]">Market Sentiment</div>
          <div className="mt-1 flex items-baseline justify-between font-mono-data text-xl font-extrabold text-[var(--mint)]">
            <span>78% BULLISH</span>
            <Zap size={18} />
          </div>
        </Card>

        <Card className="border-l-4 border-l-[var(--gold)]">
          <div className="text-xs text-[var(--text-muted)]">Spot Gold (XAU)</div>
          <div className="mt-1 font-mono-data text-xl font-extrabold text-[var(--gold)]">
            ${gold?.price?.toLocaleString() || '2,380.50'}
          </div>
        </Card>

        <Card className="border-l-4 border-l-[var(--azure)]">
          <div className="text-xs text-[var(--text-muted)]">Active Tracked Assets</div>
          <div className="mt-1 font-mono-data text-xl font-extrabold text-[var(--text)]">
            {crypto.length + equities.length + 1} Assets
          </div>
        </Card>

        <Card className="border-l-4 border-l-[var(--mint)]">
          <div className="text-xs text-[var(--text-muted)]">AI Engine Model</div>
          <div className="mt-1 flex items-center gap-1 font-mono-data text-sm font-bold text-[var(--mint)]">
            <Sparkles size={16} /> Gemini 2.5 Hybrid
          </div>
        </Card>
      </div>

      {/* Gold Highlight Card */}
      {gold && (!search || 'gold'.includes(search.toLowerCase()) || 'xau'.includes(search.toLowerCase())) && (
        <Card className="mt-8 bg-gradient-to-r from-[var(--surface)] to-[var(--surface-alt)] border-2 border-[var(--gold)]/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--gold)]/15 px-2.5 py-0.5 text-xs font-bold text-[var(--gold)] uppercase">
                  Precious Metal Benchmark
                </span>
                <span className="text-xs text-[var(--text-muted)]">XAU/USD · Spot Gold</span>
              </div>
              <div className="mt-2 font-mono-data text-3xl font-black text-[var(--gold)]">
                ${gold.price?.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`font-mono-data text-base font-bold ${gold.change24h >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                {gold.change24h >= 0 ? '▲' : '▼'} {Math.abs(gold.change24h || 0).toFixed(2)}% · 24h
              </div>
              <button
                onClick={() => navigate('/predictions?symbol=XAU&type=gold')}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--gold)] px-4 py-2 text-xs font-bold text-black hover:opacity-90 transition-opacity cursor-pointer shadow-md"
              >
                <Sparkles size={14} /> Quick AI Predict
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Top Cryptocurrencies */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-[var(--text)]">Top Cryptocurrencies</h2>
        <span className="text-xs text-[var(--text-muted)]">{filteredCrypto.length} Coins</span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCrypto.map((c) => (
          <Card key={c.symbol} className="hover:border-[var(--mint)]/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-base font-bold text-[var(--text)]">{c.name}</div>
                  <div className="text-xs font-mono-data font-semibold text-[var(--text-muted)]">${c.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono-data text-base font-bold text-[var(--text)]">${c.price?.toLocaleString()}</div>
                  <div className={`text-xs font-semibold ${c.change24h >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                    {c.change24h >= 0 ? '▲' : '▼'} {Math.abs(c.change24h || 0).toFixed(2)}%
                  </div>
                </div>
              </div>

              {c.sparkline?.length > 1 && (
                <div className="mt-3 h-14">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={c.sparkline.map((p, i) => ({ i, p }))}>
                      <Line
                        type="monotone"
                        dataKey="p"
                        stroke={c.change24h >= 0 ? 'var(--mint)' : 'var(--coral)'}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-end">
              <button
                onClick={() => navigate(`/predictions?symbol=${c.symbol}&type=crypto`)}
                className="flex items-center gap-1 text-xs font-bold text-[var(--mint)] hover:underline cursor-pointer"
              >
                <Sparkles size={12} /> AI Predict {c.symbol} →
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Equities Watchlist */}
      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-[var(--text)]">Equities Watchlist</h2>
        <span className="text-xs text-[var(--text-muted)]">{filteredEquities.length} Stocks</span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEquities.map((e) => (
          <Card key={e.symbol} className="hover:border-[var(--azure)]/40 transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-base font-bold text-[var(--text)]">{e.symbol}</div>
                <div className="text-xs text-[var(--text-muted)]">Equity Asset</div>
              </div>
              <div className="text-right">
                <div className="font-mono-data text-base font-bold text-[var(--text)]">${e.price?.toLocaleString()}</div>
                <div className={`text-xs font-semibold ${e.change24h >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                  {e.change24h >= 0 ? '▲' : '▼'} {Math.abs(e.change24h || 0).toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-end">
              <button
                onClick={() => navigate(`/predictions?symbol=${e.symbol}&type=trading`)}
                className="flex items-center gap-1 text-xs font-bold text-[var(--azure)] hover:underline cursor-pointer"
              >
                <Sparkles size={12} /> AI Predict {e.symbol} →
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
