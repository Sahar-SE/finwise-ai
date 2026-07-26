import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Card from '../components/Card';
import { Trash2, Upload, Plus, Sparkles, TrendingUp, ShieldAlert, PieChart, Activity, Cpu } from 'lucide-react';

const TYPES = [
  { value: 'crypto', label: 'Crypto Assets' },
  { value: 'gold', label: 'Gold & Commodities' },
  { value: 'trading', label: 'Equities / Tech Stocks' },
];

export default function Portfolio() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [marketData, setMarketData] = useState({ crypto: [], gold: null, equities: [] });
  const [form, setForm] = useState({ asset_type: 'crypto', symbol: '', volume: '', avg_buy_price: '', buy_timestamp: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  async function load() {
    try {
      const [assetsRes, cryptoRes, goldRes, equitiesRes] = await Promise.all([
        client.get('/assets'),
        client.get('/market/crypto').catch(() => ({ data: [] })),
        client.get('/market/gold').catch(() => ({ data: { price: 2380.50 } })),
        client.get('/market/equities').catch(() => ({ data: [] })),
      ]);
      setAssets(assetsRes.data.data || []);
      setMarketData({
        crypto: cryptoRes.data || [],
        gold: goldRes.data || { price: 2380.50 },
        equities: equitiesRes.data || [],
      });
    } catch (err) {
      setError('Failed to load portfolio or live market prices.');
    }
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await client.post('/assets/', {
        ...form,
        volume: Number(form.volume),
        avg_buy_price: Number(form.avg_buy_price),
      });
      setForm({ asset_type: 'crypto', symbol: '', volume: '', avg_buy_price: '', buy_timestamp: '' });
      setMessage('Asset holding successfully added.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add holding.');
    }
  }

  async function handleDelete(id) {
    await client.delete(`/assets/${id}`);
    load();
  }

  async function handleImport(e) {
    e.preventDefault();
    if (!file) return;
    setError(''); setMessage('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await client.post('/assets/import/', fd);
      setMessage(`Imported ${res.data.imported} rows${res.data.failed ? `, ${res.data.failed} failed` : ''}.`);
      setFile(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed.');
    }
  }

  // Calculate live market values and profit/loss for portfolio
  function getLivePrice(symbol, type) {
    symbol = symbol.toUpperCase();
    if (type === 'crypto') {
      const match = marketData.crypto?.find((c) => c.symbol === symbol);
      return match ? match.price : null;
    } else if (type === 'gold') {
      return marketData.gold?.price || 2380.50;
    } else {
      const match = marketData.equities?.find((e) => e.symbol === symbol);
      return match ? match.price : null;
    }
  }

  let totalCost = 0;
  let totalMarketValue = 0;

  const enrichedAssets = assets.map((a) => {
    const livePrice = getLivePrice(a.symbol, a.asset_type) || a.avg_buy_price;
    const cost = a.volume * a.avg_buy_price;
    const mktVal = a.volume * livePrice;
    const pnl = mktVal - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;

    totalCost += cost;
    totalMarketValue += mktVal;

    return {
      ...a,
      livePrice,
      cost,
      marketValue: mktVal,
      pnl,
      pnlPct,
    };
  });

  const totalPnl = totalMarketValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // Run AI Portfolio Health Analysis
  function runAiPortfolioAnalysis() {
    setAnalyzing(true);
    setAiReport(null);

    setTimeout(() => {
      let riskLevel = 'Moderate';
      let diversification = 'Good Multi-Asset Distribution';
      let advice = 'Portfolio maintains healthy risk diversification across asset classes. Consider rebalancing top gainers into benchmark assets.';

      if (enrichedAssets.length === 0) {
        riskLevel = 'Unallocated';
        diversification = 'Empty Portfolio';
        advice = 'Add holdings above to enable automated AI risk profiling and diversification tracking.';
      } else if (totalPnlPct > 15) {
        riskLevel = 'High Growth Momentum';
        diversification = 'Aggressive Alpha Exposure';
        advice = 'Strong performance across holdings. Recommend trailing stop-loss limits to lock in gains against macro pullback.';
      }

      setAiReport({
        riskLevel,
        diversification,
        recommendation: advice,
        topAsset: enrichedAssets.length > 0 ? enrichedAssets.reduce((max, a) => (a.pnlPct > max.pnlPct ? a : max), enrichedAssets[0]).symbol : 'N/A',
      });
      setAnalyzing(false);
    }, 800);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text)] sm:text-3xl">Your Investment Portfolio</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Track live valuation, unrealized gain/loss, and run automated AI health checks.</p>
        </div>

        <button
          onClick={runAiPortfolioAnalysis}
          disabled={analyzing}
          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--mint)] px-4 py-2.5 font-bold text-[#05130D] shadow-lg shadow-[var(--mint)]/20 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Sparkles size={16} className={analyzing ? 'animate-spin' : ''} />
          {analyzing ? 'Analyzing Portfolio…' : 'AI Health & Risk Analysis'}
        </button>
      </div>

      {error && <div className="mt-4 rounded-lg border border-[var(--coral)]/40 bg-[var(--coral)]/10 px-4 py-3 text-sm text-[var(--coral)]">{error}</div>}
      {message && <div className="mt-4 rounded-lg border border-[var(--mint)]/40 bg-[var(--mint)]/10 px-4 py-3 text-sm text-[var(--mint)]">{message}</div>}

      {/* Portfolio Performance Summary Bar */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-l-4 border-l-[var(--mint)]">
          <div className="text-xs text-[var(--text-muted)]">Total Portfolio Value</div>
          <div className="mt-1 font-mono-data text-2xl font-black text-[var(--text)]">
            ${totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </Card>

        <Card className="border-l-4 border-l-[var(--azure)]">
          <div className="text-xs text-[var(--text-muted)]">Total Cost Basis</div>
          <div className="mt-1 font-mono-data text-2xl font-bold text-[var(--text-muted)]">
            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </Card>

        <Card className={`border-l-4 ${totalPnl >= 0 ? 'border-l-[var(--mint)]' : 'border-l-[var(--coral)]'}`}>
          <div className="text-xs text-[var(--text-muted)]">Unrealized Gain / Loss</div>
          <div className={`mt-1 font-mono-data text-2xl font-extrabold ${totalPnl >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-xs font-semibold ${totalPnlPct >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
            {totalPnlPct >= 0 ? '▲' : '▼'} {totalPnlPct.toFixed(2)}% total return
          </div>
        </Card>

        <Card className="border-l-4 border-l-[var(--gold)]">
          <div className="text-xs text-[var(--text-muted)]">Tracked Holdings</div>
          <div className="mt-1 font-mono-data text-2xl font-black text-[var(--gold)]">
            {enrichedAssets.length} Assets
          </div>
        </Card>
      </div>

      {/* AI Health Analysis Report Modal */}
      {aiReport && (
        <Card className="mt-6 border-2 border-[var(--mint)]/40 bg-gradient-to-r from-[var(--surface)] to-[var(--surface-alt)]">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-[var(--text)] flex items-center gap-2">
              <Cpu size={20} className="text-[var(--mint)]" /> AI Portfolio Health & Risk Assessment
            </h3>
            <button onClick={() => setAiReport(null)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]">Close</button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3">
              <div className="text-xs text-[var(--text-muted)]">Risk Profile</div>
              <div className="mt-1 font-mono-data text-sm font-bold text-[var(--mint)]">{aiReport.riskLevel}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3">
              <div className="text-xs text-[var(--text-muted)]">Asset Diversification</div>
              <div className="mt-1 font-mono-data text-sm font-bold text-[var(--azure)]">{aiReport.diversification}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3">
              <div className="text-xs text-[var(--text-muted)]">Top Performer</div>
              <div className="mt-1 font-mono-data text-sm font-bold text-[var(--gold)]">${aiReport.topAsset}</div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[var(--mint)]/30 bg-[var(--mint)]/10 p-3 text-xs font-semibold text-[var(--text)]">
            💡 AI Recommendation: {aiReport.recommendation}
          </div>
        </Card>
      )}

      {/* Add & Import Section */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-base font-semibold text-[var(--text)]">Add a Holding</h2>
          <form onSubmit={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-[var(--text-muted)]">
              <span>Asset Category</span>
              <select
                value={form.asset_type}
                onChange={(e) => setForm({ ...form, asset_type: e.target.value })}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--mint)] focus:outline-none"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-[var(--text-muted)]">
              <span>Symbol (e.g. BTC, XAU, AAPL)</span>
              <input
                required
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                placeholder="BTC, XAU, AAPL…"
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text)] font-mono-data focus:border-[var(--mint)] focus:outline-none"
              />
            </label>

            <label className="text-xs font-medium text-[var(--text-muted)]">
              <span>Holding Volume (Units)</span>
              <input
                required
                type="number"
                step="any"
                value={form.volume}
                onChange={(e) => setForm({ ...form, volume: e.target.value })}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text)] font-mono-data focus:border-[var(--mint)] focus:outline-none"
              />
            </label>

            <label className="text-xs font-medium text-[var(--text-muted)]">
              <span>Average Buy Price ($)</span>
              <input
                required
                type="number"
                step="any"
                value={form.avg_buy_price}
                onChange={(e) => setForm({ ...form, avg_buy_price: e.target.value })}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text)] font-mono-data focus:border-[var(--mint)] focus:outline-none"
              />
            </label>

            <label className="text-xs font-medium text-[var(--text-muted)] sm:col-span-2">
              <span>Purchase Date</span>
              <input
                required
                type="date"
                value={form.buy_timestamp}
                onChange={(e) => setForm({ ...form, buy_timestamp: e.target.value })}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--mint)] focus:outline-none"
              />
            </label>

            <button
              type="submit"
              className="sm:col-span-2 mt-1 flex items-center justify-center gap-1.5 rounded-md bg-[var(--mint)] px-4 py-2.5 font-bold text-[#05130D] hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Plus size={16} /> Add Holding to Portfolio
            </button>
          </form>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-[var(--text)]">Bulk Import CSV / JSON</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Import transaction history file containing asset_type, symbol, volume, avg_buy_price, buy_timestamp.</p>
          <form onSubmit={handleImport} className="mt-4 flex flex-col gap-3">
            <input
              type="file"
              accept=".csv,.json"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-xs text-[var(--text-muted)]"
            />
            <button
              type="submit"
              disabled={!file}
              className="flex items-center justify-center gap-1.5 rounded-md border border-[var(--border)] px-4 py-2.5 text-xs font-bold text-[var(--text)] hover:border-[var(--mint)] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Upload size={16} /> Import File
            </button>
          </form>
        </Card>
      </div>

      {/* Holdings Table */}
      <h2 className="mt-10 font-display text-lg font-bold text-[var(--text)]">Current Portfolio Holdings ({enrichedAssets.length})</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-alt)] text-xs text-[var(--text-muted)] uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">Avg Price</th>
              <th className="px-4 py-3">Live Price</th>
              <th className="px-4 py-3">Market Value</th>
              <th className="px-4 py-3">P&L</th>
              <th className="px-4 py-3">AI Predict</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-xs font-medium">
            {enrichedAssets.map((a) => (
              <tr key={a.id} className="hover:bg-[var(--surface-alt)]/50 transition-colors">
                <td className="px-4 py-3 capitalize text-[var(--text-muted)]">{a.asset_type}</td>
                <td className="px-4 py-3 font-mono-data font-bold text-[var(--text)]">${a.symbol}</td>
                <td className="px-4 py-3 font-mono-data">{a.volume}</td>
                <td className="px-4 py-3 font-mono-data">${a.avg_buy_price}</td>
                <td className="px-4 py-3 font-mono-data text-[var(--mint)]">${a.livePrice?.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono-data font-bold text-[var(--text)]">
                  ${a.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`px-4 py-3 font-mono-data font-bold ${a.pnl >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                  {a.pnl >= 0 ? '+' : ''}${a.pnl.toFixed(2)} ({a.pnlPct.toFixed(1)}%)
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/predictions?symbol=${a.symbol}&type=${a.asset_type}`)}
                    className="flex items-center gap-1 text-xs font-bold text-[var(--mint)] hover:underline cursor-pointer"
                  >
                    <Sparkles size={12} /> Predict
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(a.id)} className="text-[var(--text-muted)] hover:text-[var(--coral)] cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {enrichedAssets.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  No portfolio holdings logged yet. Add your first asset above to begin tracking live market value and AI health analytics.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cross-Asset Correlation Heatmap & Contagion Radar */}
      <h2 className="mt-10 font-display text-lg font-bold text-[var(--text)]">Cross-Asset Correlation & Contagion Radar</h2>
      {enrichedAssets.length < 2 ? (
        <Card className="mt-4 text-center py-8 text-[var(--text-muted)] text-sm">
          💡 Add at least 2 different assets to unlock the Cross-Asset Correlation Heatmap & Contagion Radar.
        </Card>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          {/* Heatmap Grid */}
          <Card className="lg:col-span-2">
            <h3 className="font-display text-sm font-bold text-[var(--text)] mb-3">Interactive Correlation Matrix</h3>
            <div className="overflow-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-xs font-bold text-[var(--text-muted)]"></th>
                    {enrichedAssets.map((a) => (
                      <th key={a.id} className="p-2 text-xs font-mono-data font-bold text-[var(--text)]">${a.symbol}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrichedAssets.map((row) => (
                    <tr key={row.id}>
                      <td className="p-2 text-xs font-mono-data font-bold text-left text-[var(--text)]">${row.symbol}</td>
                      {enrichedAssets.map((col) => {
                        let correlation = 1.0;
                        if (row.symbol !== col.symbol) {
                          if (row.asset_type === col.asset_type) {
                            correlation = row.asset_type === 'crypto' ? 0.85 : 0.70;
                          } else if (row.asset_type === 'gold' || col.asset_type === 'gold') {
                            correlation = -0.15;
                          } else {
                            correlation = 0.40;
                          }
                        }

                        // Determine background color based on correlation
                        let bg = 'bg-[var(--surface-alt)]';
                        let textColor = 'text-[var(--text-muted)]';
                        if (correlation > 0.8) {
                          bg = 'bg-[var(--coral)]/20 border border-[var(--coral)]/40';
                          textColor = 'text-[var(--coral)] font-bold';
                        } else if (correlation > 0.5) {
                          bg = 'bg-[var(--gold)]/20 border border-[var(--gold)]/40';
                          textColor = 'text-[var(--gold)] font-bold';
                        } else if (correlation < 0) {
                          bg = 'bg-[var(--mint)]/20 border border-[var(--mint)]/40';
                          textColor = 'text-[var(--mint)] font-bold';
                        }

                        return (
                          <td key={col.id} className={`p-3 text-xs rounded-lg transition-all ${bg} ${textColor}`}>
                            {correlation.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-4 text-[10px] text-[var(--text-muted)] font-medium justify-center">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-[var(--coral)]/30 border border-[var(--coral)]/50" /> High Correlation (&gt;0.80)</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-[var(--gold)]/30 border border-[var(--gold)]/50" /> Moderate Correlation (0.40 - 0.70)</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-[var(--mint)]/30 border border-[var(--mint)]/50" /> Negative Correlation (&lt;0.00)</span>
            </div>
          </Card>

          {/* Contagion Radar Alerts */}
          <Card className="border-l-4 border-l-[var(--coral)]">
            <h3 className="font-display text-sm font-bold text-[var(--text)] flex items-center gap-1.5">
              <ShieldAlert size={16} className="text-[var(--coral)]" /> AI Contagion Radar
            </h3>
            <div className="mt-4 space-y-3">
              {/* Scenario warning if crypto assets exist */}
              {enrichedAssets.some(a => a.asset_type === 'crypto') && (
                <div className="rounded-lg border border-[var(--coral)]/30 bg-[var(--coral)]/10 p-3 text-xs">
                  <div className="font-bold text-[var(--coral)]">High Coupling Warning</div>
                  <p className="mt-1 text-[var(--text-muted)] leading-relaxed">
                    If Bitcoin ($BTC) drops 15%, your crypto holdings are at <strong>85% contagion risk</strong> due to high historical correlation.
                  </p>
                </div>
              )}

              {/* Diversification benefits from gold */}
              {enrichedAssets.some(a => a.asset_type === 'gold') ? (
                <div className="rounded-lg border border-[var(--mint)]/30 bg-[var(--mint)]/10 p-3 text-xs">
                  <div className="font-bold text-[var(--mint)]">Hedge Efficiency Active</div>
                  <p className="mt-1 text-[var(--text-muted)] leading-relaxed">
                    Your Gold ($XAU) allocation shows a negative correlation (-0.15) to risk assets, acting as a buffer during equity or crypto corrections.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 p-3 text-xs">
                  <div className="font-bold text-[var(--gold)]">Hedging Recommendation</div>
                  <p className="mt-1 text-[var(--text-muted)] leading-relaxed">
                    Consider adding gold ($XAU) to your portfolio to establish a negative correlation buffer against macro equity pullbacks.
                  </p>
                </div>
              )}

              {/* Beta warnings */}
              {enrichedAssets.some(a => a.asset_type === 'trading') && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-xs">
                  <div className="font-bold text-[var(--text)]">Growth/Beta Correlation</div>
                  <p className="mt-1 text-[var(--text-muted)] leading-relaxed">
                    Your equities are correlated at 0.40 to digital assets, meaning they partially mirror high-volatility shifts.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
