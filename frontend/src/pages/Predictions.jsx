import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import client from '../api/client';
import Card from '../components/Card';
import { Sparkles, TrendingUp, AlertTriangle, ShieldCheck, Cpu, ChevronRight, Activity, Zap } from 'lucide-react';

const PRESETS = {
  crypto: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'AVAX', 'LINK'],
  gold: ['XAU'],
  trading: ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'META'],
};

const HORIZONS = [
  { value: '24h', label: '24 Hours (Short-term)' },
  { value: '7d', label: '7 Days (Medium-term)' },
  { value: '30d', label: '30 Days (Macro Horizon)' },
];

const MODELS = [
  { value: 'hybrid_ai', label: 'Gemini AI + Technical Ensemble' },
  { value: 'quantitative_ml', label: 'Multi-Factor Quantitative ML' },
  { value: 'monte_carlo', label: 'Monte Carlo 1,000-Path Simulation' },
];

export default function Predictions() {
  const location = useLocation();
  const [assetType, setAssetType] = useState('crypto');
  const [symbol, setSymbol] = useState('BTC');
  const [horizon, setHorizon] = useState('7d');
  const [modelType, setModelType] = useState('hybrid_ai');
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Check for pre-filled query from quick predict links
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sym = params.get('symbol');
    const type = params.get('type');
    if (sym) setSymbol(sym.toUpperCase());
    if (type && PRESETS[type]) setAssetType(type);
  }, [location]);

  async function requestPrediction(e) {
    if (e) e.preventDefault();
    setError(''); setResult(null); setStatus('pending'); setBusy(true);
    try {
      const res = await client.post('/predictions/request', {
        asset_type: assetType,
        symbol,
        horizon,
        model_type: modelType,
      });
      setTaskId(res.data.task_id);
      poll(res.data.task_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start AI prediction model.');
      setBusy(false);
    }
  }

  function poll(id) {
    const interval = setInterval(async () => {
      try {
        const res = await client.get(`/predictions/${id}`);
        setStatus(res.data.status);
        if (res.data.status === 'complete' || res.data.status === 'failed') {
          clearInterval(interval);
          setResult(res.data.result_json || res.data.result);
          setBusy(false);
        }
      } catch (err) {
        clearInterval(interval);
        setError('Lost connection while fetching prediction updates.');
        setBusy(false);
      }
    }, 600);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mint)]/30 bg-[var(--mint)]/10 px-3 py-1 text-xs font-semibold text-[var(--mint)]">
            <Cpu size={14} className="animate-spin" /> Next-Gen Financial AI Engine v2.5
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
            AI Market Predictions
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Powered by Google Gemini LLM reasoning, quantitative multi-indicator ensembles, and 1,000-path Monte Carlo simulations.
          </p>
        </div>
      </div>

      {/* Control Card */}
      <Card className="mt-6 border-l-4 border-l-[var(--mint)]">
        <form onSubmit={requestPrediction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-medium text-[var(--text-muted)]">
            <span>Market Category</span>
            <select
              value={assetType}
              onChange={(e) => {
                const newType = e.target.value;
                setAssetType(newType);
                setSymbol(PRESETS[newType][0]);
              }}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm font-medium text-[var(--text)] focus:border-[var(--mint)] focus:outline-none"
            >
              <option value="crypto">Crypto Assets</option>
              <option value="gold">Gold & Precious Metals</option>
              <option value="trading">Equities & Tech Stocks</option>
            </select>
          </label>

          <label className="text-xs font-medium text-[var(--text-muted)]">
            <span>Asset Symbol</span>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm font-medium text-[var(--text)] focus:border-[var(--mint)] focus:outline-none font-mono-data"
            >
              {PRESETS[assetType]?.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-[var(--text-muted)]">
            <span>Forecast Horizon</span>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm font-medium text-[var(--text)] focus:border-[var(--mint)] focus:outline-none"
            >
              {HORIZONS.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-[var(--text-muted)]">
            <span>AI Model Engine</span>
            <select
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2.5 text-sm font-medium text-[var(--text)] focus:border-[var(--mint)] focus:outline-none"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--mint)] px-4 py-2.5 font-semibold text-[#05130D] shadow-lg shadow-[var(--mint)]/20 hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles size={18} className={busy ? 'animate-spin' : ''} />
              {busy ? 'Running AI Engine…' : 'Generate Prediction'}
            </button>
          </div>
        </form>
      </Card>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--coral)]/40 bg-[var(--coral)]/10 px-4 py-3 text-sm text-[var(--coral)]">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Loading Task Card */}
      {busy && (
        <Card className="mt-6 text-center py-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--mint)]/10 text-[var(--mint)] animate-pulse">
            <Cpu size={32} />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-[var(--text)]">
            Analyzing {symbol} with Financial AI…
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Calculating RSI oscillators, MACD crossovers, Monte Carlo stochastic paths, and Gemini LLM thesis.
          </p>
          <div className="mt-4 mx-auto max-w-xs h-1.5 w-full bg-[var(--surface-alt)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--mint)] animate-pulse w-3/4"></div>
          </div>
        </Card>
      )}

      {/* Prediction Output Results */}
      {result && !busy && (
        <div className="mt-8 space-y-6">
          {/* Signal Header Banner */}
          <SignalHeader result={result} />

          {/* Core Forecast & Price Targets */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Chart Column */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-[var(--text)] flex items-center gap-2">
                    <TrendingUp size={18} className="text-[var(--mint)]" /> Forecast Path & Target Corridor
                  </h3>
                  <span className="text-xs font-mono-data text-[var(--text-muted)]">
                    Horizon: {result.horizon}
                  </span>
                </div>

                {/* SVG Forecast Path Visualizer */}
                <div className="mt-4 h-64 w-full">
                  <ForecastChart result={result} />
                </div>
              </Card>
            </div>

            {/* Target Price Cards */}
            <div className="space-y-4">
              <Card>
                <div className="text-xs text-[var(--text-muted)]">Current Spot Price</div>
                <div className="mt-1 font-mono-data text-2xl font-bold text-[var(--text)]">
                  ${result.last_price?.toLocaleString()}
                </div>
              </Card>

              <Card className="border-l-4 border-l-[var(--mint)]">
                <div className="text-xs text-[var(--text-muted)]">Projected Target ({result.horizon})</div>
                <div className="mt-1 flex items-baseline justify-between">
                  <div className="font-mono-data text-3xl font-extrabold text-[var(--mint)]">
                    ${result.projected_price_next_period?.toLocaleString()}
                  </div>
                  <div className={`font-mono-data text-sm font-semibold ${result.pct_change_forecast >= 0 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                    {result.pct_change_forecast >= 0 ? '+' : ''}{result.pct_change_forecast}%
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <div className="text-xs text-[var(--text-muted)]">Bull Target (95%)</div>
                  <div className="mt-1 font-mono-data text-lg font-semibold text-[var(--mint)]">
                    ${result.forecast_chart_series?.bull_target?.toLocaleString() || result.monte_carlo?.bull_target_95?.toLocaleString()}
                  </div>
                </Card>

                <Card>
                  <div className="text-xs text-[var(--text-muted)]">Bear Target (5%)</div>
                  <div className="mt-1 font-mono-data text-lg font-semibold text-[var(--coral)]">
                    ${result.forecast_chart_series?.bear_target?.toLocaleString() || result.monte_carlo?.bear_target_05?.toLocaleString()}
                  </div>
                </Card>
              </div>

              {result.monte_carlo?.value_at_risk_95_pct && (
                <Card className="bg-[var(--surface-alt)]">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>95% Value at Risk (VaR)</span>
                    <span className="font-mono-data text-[var(--coral)]">{result.monte_carlo.value_at_risk_95_pct}% max downside</span>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Technical Indicators Matrix */}
          {result.technical_indicators && (
            <Card>
              <h3 className="font-display text-base font-semibold text-[var(--text)] flex items-center gap-2">
                <Activity size={18} className="text-[var(--azure)]" /> Quantitative Indicator Matrix
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <IndicatorMetric
                  label="RSI (14-Period)"
                  value={result.technical_indicators.rsi}
                  status={result.technical_indicators.rsi_status}
                  highlight={result.technical_indicators.rsi > 70 ? 'coral' : result.technical_indicators.rsi < 30 ? 'mint' : 'normal'}
                />
                <IndicatorMetric
                  label="MACD Signal"
                  value={result.technical_indicators.macd?.status}
                  status={`Hist: ${result.technical_indicators.macd?.histogram}`}
                  highlight={result.technical_indicators.macd?.status?.includes('Bullish') ? 'mint' : 'coral'}
                />
                <IndicatorMetric
                  label="Bollinger Bandwidth"
                  value={`${result.technical_indicators.bollinger?.bandwidth_pct}%`}
                  status={`Upper: $${result.technical_indicators.bollinger?.upper}`}
                />
                <IndicatorMetric
                  label="Volatility Rating"
                  value={result.technical_indicators.volatility_rating}
                  status="ATR Stochastic Risk"
                  highlight={result.technical_indicators.volatility_rating === 'High' ? 'gold' : 'mint'}
                />
              </div>
            </Card>
          )}

          {/* Executive AI Thesis & Actionable Advice */}
          {result.ai_analysis && (
            <Card className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-alt)] border-l-4 border-l-[var(--azure)]">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-[var(--text)] flex items-center gap-2">
                  <Zap size={20} className="text-[var(--gold)]" /> Financial AI Analysis & Market Thesis
                </h3>
                <span className="rounded-full bg-[var(--azure)]/15 px-3 py-1 text-xs font-semibold text-[var(--azure)]">
                  Gemini LLM Synthesizer
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[var(--text)] font-medium">
                {result.ai_analysis.thesis}
              </p>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {/* Catalysts */}
                <div className="rounded-xl border border-[var(--mint)]/20 bg-[var(--mint)]/5 p-4">
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--mint)] flex items-center gap-1.5">
                    <ShieldCheck size={16} /> Primary Market Catalysts
                  </h4>
                  <ul className="mt-3 space-y-2 text-xs text-[var(--text)]">
                    {result.ai_analysis.catalysts?.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[var(--mint)] font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks */}
                <div className="rounded-xl border border-[var(--coral)]/20 bg-[var(--coral)]/5 p-4">
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--coral)] flex items-center gap-1.5">
                    <AlertTriangle size={16} /> Key Downside Risks
                  </h4>
                  <ul className="mt-3 space-y-2 text-xs text-[var(--text)]">
                    {result.ai_analysis.risks?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[var(--coral)] font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Advice */}
              {result.ai_analysis.actionable_advice && (
                <div className="mt-6 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 p-4">
                  <div className="text-xs font-bold text-[var(--gold)] uppercase tracking-wider">
                    🎯 Tactical Action Plan
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[var(--text)]">
                    {result.ai_analysis.actionable_advice}
                  </div>
                </div>
              )}

              <p className="mt-4 text-xs text-[var(--text-muted)] italic">
                {result.disclaimer}
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function SignalHeader({ result }) {
  const signal = result.signal || 'BUY';
  const confidence = result.confidence_pct || 85.0;

  const bgStyle =
    signal.includes('BUY')
      ? 'bg-[var(--mint)]/15 border-[var(--mint)]/40 text-[var(--mint)]'
      : signal.includes('SELL')
      ? 'bg-[var(--coral)]/15 border-[var(--coral)]/40 text-[var(--coral)]'
      : 'bg-[var(--azure)]/15 border-[var(--azure)]/40 text-[var(--azure)]';

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-2 border-[var(--border)]">
      <div className="flex items-center gap-4">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${bgStyle} font-display text-2xl font-black shadow-inner`}>
          {signal.includes('BUY') ? '▲' : signal.includes('SELL') ? '▼' : '▬'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black tracking-wider uppercase ${bgStyle}`}>
              {signal}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono-data">
              {result.symbol} · {result.horizon}
            </span>
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-[var(--text)]">
            AI Outlook: <span className="capitalize">{result.direction} Confluence</span>
          </h2>
        </div>
      </div>

      {/* Confidence Gauge */}
      <div className="w-full sm:w-64">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)]">Model Confidence</span>
          <span className="font-mono-data font-bold text-[var(--text)]">{confidence}%</span>
        </div>
        <div className="mt-1.5 h-2.5 w-full rounded-full bg-[var(--surface-alt)] overflow-hidden border border-[var(--border)]">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              signal.includes('BUY') ? 'bg-[var(--mint)]' : signal.includes('SELL') ? 'bg-[var(--coral)]' : 'bg-[var(--azure)]'
            }`}
            style={{ width: `${confidence}%` }}
          ></div>
        </div>
      </div>
    </Card>
  );
}

function IndicatorMetric({ label, value, status, highlight }) {
  const color = highlight === 'mint' ? 'text-[var(--mint)]' : highlight === 'coral' ? 'text-[var(--coral)]' : highlight === 'gold' ? 'text-[var(--gold)]' : 'text-[var(--text)]';
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className={`mt-1 font-mono-data text-base font-bold ${color}`}>{value ?? '—'}</div>
      {status && <div className="mt-0.5 text-[10px] text-[var(--text-muted)] truncate">{status}</div>}
    </div>
  );
}

function ForecastChart({ result }) {
  const series = result.forecast_chart_series || {};
  const hist = series.historical || [100, 102, 101, 104, 106, 105, 108];
  const proj = series.projected_path || [108, 110, 112, 115];
  const bull = series.bull_target || proj[proj.length - 1] * 1.08;
  const bear = series.bear_target || proj[proj.length - 1] * 0.92;

  const allPoints = [...hist, ...proj];
  const minVal = Math.min(...allPoints, bear) * 0.98;
  const maxVal = Math.max(...allPoints, bull) * 1.02;
  const range = maxVal - minVal || 1;

  const width = 500;
  const height = 200;
  const padding = 25;

  function getY(v) {
    return height - padding - ((v - minVal) / range) * (height - 2 * padding);
  }

  const stepX = (width - 2 * padding) / (allPoints.length - 1 || 1);

  // SVG points string for historical
  const histPointsStr = hist
    .map((val, idx) => `${padding + idx * stepX},${getY(val)}`)
    .join(' ');

  // SVG points string for projected
  const projStartIdx = hist.length - 1;
  const projPointsStr = proj
    .map((val, idx) => `${padding + (projStartIdx + idx) * stepX},${getY(val)}`)
    .join(' ');

  const lastX = padding + (allPoints.length - 1) * stepX;
  const bullY = getY(bull);
  const bearY = getY(bear);
  const projY = getY(proj[proj.length - 1]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible">
      {/* Background Grid Lines */}
      <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} />
      <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} />

      {/* Shaded Confidence Cone */}
      <polygon
        points={`${padding + projStartIdx * stepX},${getY(hist[hist.length - 1])} ${lastX},${bullY} ${lastX},${bearY}`}
        fill="var(--mint)"
        opacity={0.12}
      />

      {/* Historical Line */}
      <polyline fill="none" stroke="var(--azure)" strokeWidth={2.5} points={histPointsStr} />

      {/* Projected Line */}
      <polyline fill="none" stroke="var(--mint)" strokeWidth={2.5} strokeDasharray="5 4" points={projPointsStr} />

      {/* Bull & Bear Target Dots */}
      <circle cx={lastX} cy={bullY} r={4} fill="var(--mint)" />
      <circle cx={lastX} cy={bearY} r={4} fill="var(--coral)" />
      <circle cx={lastX} cy={projY} r={5} fill="var(--gold)" />

      {/* Labels */}
      <text x={lastX + 6} y={bullY + 4} fill="var(--mint)" fontSize="10" fontFamily="monospace" fontWeight="bold">
        Bull: ${bull.toFixed(0)}
      </text>
      <text x={lastX + 6} y={bearY + 4} fill="var(--coral)" fontSize="10" fontFamily="monospace" fontWeight="bold">
        Bear: ${bear.toFixed(0)}
      </text>
    </svg>
  );
}
