import { useState, useEffect } from 'react';
import client from '../api/client';
import Card from '../components/Card';
import { History, Sparkles, TrendingUp, ArrowRight, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

export default function TimeMachine() {
  const [moments, setMoments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/predictions/time-machine/moments').then((res) => {
      setMoments(res.data.moments || []);
    }).catch(() => {});
  }, []);

  async function runSimulation(momentId) {
    setSelectedId(momentId);
    setResult(null);
    setError('');
    setLoading(true);
    try {
      const res = await client.post('/predictions/time-machine/simulate', {
        moment_id: momentId,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to run simulation. Make sure you have portfolio holdings.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--azure)]/40 bg-[var(--azure)]/10 px-3 py-1 text-xs font-bold text-[var(--azure)]">
          <History size={14} /> Time Travel — Unprecedented Financial Simulator
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
          Portfolio Time Machine
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          What if you had invested the exact same amount of money during famous historical moments? Travel back to the COVID crash bottom, Bitcoin halvings, or previous cycle peaks and witness the difference.
        </p>
      </div>

      {/* Historical Moments Grid */}
      <h2 className="mt-8 font-display text-lg font-bold text-[var(--text)]">Select a Time Travel Destination</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {moments.map((m) => (
          <button
            key={m.id}
            onClick={() => runSimulation(m.id)}
            disabled={loading}
            className={`group cursor-pointer rounded-2xl border p-5 text-left transition-all hover:shadow-lg disabled:opacity-50 ${
              selectedId === m.id
                ? 'border-[var(--azure)] bg-[var(--azure)]/10 shadow-md shadow-[var(--azure)]/10'
                : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--azure)]/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{m.icon}</span>
              <span className="rounded-full bg-[var(--surface-alt)] px-2.5 py-1 font-mono-data text-[10px] font-bold text-[var(--text-muted)]">
                {m.date}
              </span>
            </div>
            <h3 className="mt-3 font-display text-sm font-bold text-[var(--text)]">{m.name}</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">{m.description}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-[var(--coral)]/40 bg-[var(--coral)]/10 px-4 py-3 text-sm text-[var(--coral)]">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card className="mt-8 py-12 text-center">
          <Clock size={40} className="mx-auto text-[var(--azure)] animate-spin" />
          <h3 className="mt-4 font-display text-lg font-bold text-[var(--text)]">
            Traversing Historical Market Coordinates…
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Fetching index prices, scaling your purchase volumes, and evaluating present-day valuations.
          </p>
        </Card>
      )}

      {/* Result Simulation */}
      {result && !loading && (
        <div className="mt-8 space-y-6">
          {/* Summary Banner */}
          <Card className="border-2 border-[var(--azure)]/30 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-alt)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--azure)]">
                  <History size={16} /> Destination: {result.moment?.name} ({result.moment?.date})
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{result.moment?.description}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--text-muted)]">Hypothetical Portfolio Value</div>
                <div className="font-mono-data text-2xl font-black text-[var(--mint)]">
                  ${result.total_hypothetical_value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </Card>

          {/* Core comparison stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <div className="text-xs text-[var(--text-muted)]">Original Invested Amount</div>
              <div className="mt-1 font-mono-data text-2xl font-bold text-[var(--text)]">
                ${result.total_invested?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </Card>
            <Card>
              <div className="text-xs text-[var(--text-muted)]">Actual Current Value</div>
              <div className="mt-1 font-mono-data text-2xl font-bold text-[var(--text-muted)]">
                ${result.total_actual_value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </Card>
            <Card className="border-l-4 border-l-[var(--mint)]">
              <div className="text-xs text-[var(--text-muted)]">Time Travel Advantage</div>
              <div className={`mt-1 font-mono-data text-2xl font-extrabold ${result.hypothetical_gain_diff >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                {result.hypothetical_gain_diff >= 0 ? '+' : ''}${result.hypothetical_gain_diff?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">Difference compared to actual entry dates</div>
            </Card>
          </div>

          {/* Per-Asset Performance Breakdown */}
          <Card>
            <h3 className="font-display text-base font-bold text-[var(--text)] flex items-center gap-2">
              <TrendingUp size={18} className="text-[var(--azure)]" /> Detailed Time-Travel Asset Performance
            </h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-medium">
                <thead className="bg-[var(--surface-alt)] text-[10px] uppercase text-[var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-2.5">Asset</th>
                    <th className="px-4 py-2.5 text-right">Invested</th>
                    <th className="px-4 py-2.5 text-right">Historical Price</th>
                    <th className="px-4 py-2.5 text-right">Hypothetical Units</th>
                    <th className="px-4 py-2.5 text-right">Hypothetical Return</th>
                    <th className="px-4 py-2.5 text-right font-bold text-[var(--mint)]">Simulated Value</th>
                    <th className="px-4 py-2.5 text-right">Multiplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-mono-data">
                  {result.asset_results?.map((a, i) => (
                    <tr key={i} className="hover:bg-[var(--surface-alt)]/30">
                      <td className="px-4 py-3 font-bold text-[var(--text)]">${a.symbol}</td>
                      <td className="px-4 py-3 text-right">${a.invested_amount?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        {a.historical_price ? `$${a.historical_price.toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">{a.hypothetical_units || 'N/A'}</td>
                      <td className={`px-4 py-3 text-right font-bold ${a.hypothetical_return_pct >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                        {a.hypothetical_return_pct >= 0 ? '▲' : '▼'} {Math.abs(a.hypothetical_return_pct).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right font-black text-[var(--mint)]">
                        ${a.hypothetical_value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[var(--azure)]">
                        {a.multiplier}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI Insight report */}
          {result.ai_insight && (
            <Card className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-alt)] border-l-4 border-l-[var(--gold)]">
              <h3 className="font-display text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <Sparkles size={20} className="text-[var(--gold)]" /> AI Time-Travel Insights
              </h3>
              <div className="mt-2 text-sm font-bold text-[var(--gold)]">{result.ai_insight.headline}</div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text)]">{result.ai_insight.lesson}</p>

              {result.ai_insight.forward_looking && (
                <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--text)]">
                  <span className="font-bold text-[var(--azure)]">Forward Strategy:</span> {result.ai_insight.forward_looking}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
