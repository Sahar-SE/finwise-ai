import { useState, useEffect } from 'react';
import client from '../api/client';
import Card from '../components/Card';
import { ShieldAlert, Cpu, Zap, TrendingDown, TrendingUp, Shield, ChevronDown } from 'lucide-react';

export default function StressTest() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [customShock, setCustomShock] = useState(-20);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/predictions/stress-test/scenarios').then((res) => {
      setScenarios(res.data.scenarios || []);
    }).catch(() => {});
  }, []);

  async function runTest(scenarioId) {
    setSelectedId(scenarioId);
    setResult(null);
    setError('');
    setRunning(true);
    try {
      const payload = { scenario_id: scenarioId };
      if (scenarioId === 'custom') payload.custom_shock_pct = customShock / 100;
      const res = await client.post('/predictions/stress-test/run', payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to run stress test. Make sure you have portfolio holdings.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--coral)]/40 bg-[var(--coral)]/10 px-3 py-1 text-xs font-bold text-[var(--coral)]">
          <ShieldAlert size={14} /> Exclusive Feature — Not Available on Competing Platforms
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
          AI Portfolio Stress Test
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Simulate macro crash scenarios against your <strong>actual portfolio</strong> — see projected dollar impact, recovery timeline, and AI-generated hedge strategies.
        </p>
      </div>

      {/* Scenario Selection Grid */}
      <h2 className="mt-8 font-display text-lg font-bold text-[var(--text)]">Select a Macro Scenario</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => runTest(s.id)}
            disabled={running}
            className={`group relative cursor-pointer rounded-2xl border p-5 text-left transition-all hover:shadow-lg disabled:opacity-50 ${
              selectedId === s.id
                ? 'border-[var(--mint)] bg-[var(--mint)]/10 shadow-md shadow-[var(--mint)]/10'
                : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--mint)]/50'
            }`}
          >
            <div className="text-3xl">{s.icon}</div>
            <h3 className="mt-2 font-display text-sm font-bold text-[var(--text)]">{s.name}</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">{s.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(s.shocks || {}).map(([cls, pct]) => (
                <span
                  key={cls}
                  className={`rounded px-1.5 py-0.5 font-mono-data text-[10px] font-bold ${
                    pct >= 0 ? 'bg-[var(--mint)]/15 text-[var(--mint)]' : 'bg-[var(--coral)]/15 text-[var(--coral)]'
                  }`}
                >
                  {cls}: {pct >= 0 ? '+' : ''}{(pct * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          </button>
        ))}

        {/* Custom Scenario Card */}
        <button
          onClick={() => runTest('custom')}
          disabled={running}
          className={`group cursor-pointer rounded-2xl border p-5 text-left transition-all hover:shadow-lg disabled:opacity-50 ${
            selectedId === 'custom'
              ? 'border-[var(--azure)] bg-[var(--azure)]/10 shadow-md shadow-[var(--azure)]/10'
              : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--azure)]/50'
          }`}
        >
          <div className="text-3xl">⚙️</div>
          <h3 className="mt-2 font-display text-sm font-bold text-[var(--text)]">Custom Scenario</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Define your own shock percentage.</p>
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <input
              type="range"
              min={-60}
              max={60}
              value={customShock}
              onChange={(e) => setCustomShock(Number(e.target.value))}
              className="w-full accent-[var(--azure)]"
            />
            <div className={`text-center font-mono-data text-xs font-bold ${customShock >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
              {customShock >= 0 ? '+' : ''}{customShock}%
            </div>
          </div>
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-[var(--coral)]/40 bg-[var(--coral)]/10 px-4 py-3 text-sm text-[var(--coral)]">
          {error}
        </div>
      )}

      {/* Running Animation */}
      {running && (
        <Card className="mt-8 py-12 text-center">
          <Cpu size={40} className="mx-auto text-[var(--coral)] animate-spin" />
          <h3 className="mt-4 font-display text-lg font-bold text-[var(--text)]">Running Macro Stress Simulation…</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Applying shock multipliers to your actual holdings, computing per-asset drawdowns, and generating AI hedge strategies.</p>
        </Card>
      )}

      {/* Results */}
      {result && !running && (
        <div className="mt-8 space-y-6">
          {/* Scenario + Portfolio Summary */}
          <Card className="border-2 border-[var(--coral)]/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--coral)]">
                  <ShieldAlert size={16} /> Stress Test Result: {result.scenario?.name}
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{result.scenario?.description}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--text-muted)]">Est. Recovery</div>
                <div className="font-mono-data text-lg font-bold text-[var(--text)]">{result.recovery_days_est} days</div>
              </div>
            </div>
          </Card>

          {/* Portfolio Before/After Gauge */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <div className="text-xs text-[var(--text-muted)]">Portfolio Before</div>
              <div className="mt-1 font-mono-data text-2xl font-bold text-[var(--text)]">
                ${result.portfolio_before?.toLocaleString()}
              </div>
            </Card>
            <Card className={`border-l-4 ${result.total_drawdown >= 0 ? 'border-l-[var(--mint)]' : 'border-l-[var(--coral)]'}`}>
              <div className="text-xs text-[var(--text-muted)]">Portfolio After Shock</div>
              <div className={`mt-1 font-mono-data text-2xl font-extrabold ${result.total_drawdown >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                ${result.portfolio_after?.toLocaleString()}
              </div>
            </Card>
            <Card className="border-l-4 border-l-[var(--gold)]">
              <div className="text-xs text-[var(--text-muted)]">Total Impact</div>
              <div className={`mt-1 font-mono-data text-2xl font-extrabold ${result.total_drawdown_pct >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                {result.total_drawdown_pct >= 0 ? '+' : ''}{result.total_drawdown_pct}%
              </div>
              <div className={`text-xs font-mono-data ${result.total_drawdown >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                {result.total_drawdown >= 0 ? '+' : ''}${result.total_drawdown?.toLocaleString()}
              </div>
            </Card>
          </div>

          {/* Per-Asset Impact Waterfall */}
          <Card>
            <h3 className="font-display text-base font-bold text-[var(--text)] flex items-center gap-2">
              <TrendingDown size={18} className="text-[var(--coral)]" /> Per-Asset Impact Waterfall
            </h3>
            <div className="mt-4 space-y-3">
              {result.asset_impacts?.map((a, idx) => {
                const maxAbs = Math.max(...result.asset_impacts.map(x => Math.abs(x.pct_impact)), 1);
                const barWidth = Math.min(100, (Math.abs(a.pct_impact) / maxAbs) * 100);
                const isPositive = a.pct_impact >= 0;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-16 text-xs font-mono-data font-bold text-[var(--text)]">${a.symbol}</div>
                    <div className="flex-1 relative">
                      <div className="h-5 w-full rounded-full bg-[var(--surface-alt)] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isPositive ? 'bg-[var(--mint)]' : 'bg-[var(--coral)]'}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <div className={`w-20 text-right font-mono-data text-xs font-bold ${isPositive ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                      {isPositive ? '+' : ''}{a.pct_impact}%
                    </div>
                    <div className={`w-24 text-right font-mono-data text-xs ${isPositive ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                      {isPositive ? '+' : ''}${a.dollar_impact?.toLocaleString()}
                    </div>
                    <div className="w-16 text-right text-[10px] text-[var(--text-muted)]">
                      ~{a.recovery_days_est}d
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* AI Hedge Strategy */}
          {result.hedge_strategy && (
            <Card className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-alt)] border-l-4 border-l-[var(--azure)]">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <Shield size={20} className="text-[var(--azure)]" /> AI Hedge Strategy & Risk Report
                </h3>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${
                    result.hedge_strategy.risk_rating === 'CRITICAL' ? 'bg-[var(--coral)]/20 text-[var(--coral)]' :
                    result.hedge_strategy.risk_rating === 'HIGH' ? 'bg-[var(--gold)]/20 text-[var(--gold)]' :
                    result.hedge_strategy.risk_rating === 'MODERATE' ? 'bg-[var(--azure)]/20 text-[var(--azure)]' :
                    'bg-[var(--mint)]/20 text-[var(--mint)]'
                  }`}>
                    {result.hedge_strategy.risk_rating} RISK
                  </span>
                  <div className="text-center">
                    <div className="text-[10px] text-[var(--text-muted)]">Survival</div>
                    <div className="font-mono-data text-sm font-black text-[var(--text)]">{result.hedge_strategy.survival_score}/100</div>
                  </div>
                </div>
              </div>

              {/* Hedge Actions */}
              <div className="mt-5 space-y-2">
                {result.hedge_strategy.hedge_actions?.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--text)]">
                    <span className="text-[var(--azure)] font-bold">{idx + 1}.</span>
                    <span>{action}</span>
                  </div>
                ))}
              </div>

              {/* Protective Assets */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs font-bold text-[var(--text-muted)]">Protective Assets:</span>
                {result.hedge_strategy.protective_assets?.map((pa, idx) => (
                  <span key={idx} className="rounded-lg bg-[var(--mint)]/15 px-2.5 py-1 text-xs font-bold text-[var(--mint)]">
                    🛡️ {pa}
                  </span>
                ))}
              </div>

              {/* Coaching Note */}
              {result.hedge_strategy.coaching_note && (
                <div className="mt-4 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 p-3 text-xs font-semibold text-[var(--text)]">
                  💡 {result.hedge_strategy.coaching_note}
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
