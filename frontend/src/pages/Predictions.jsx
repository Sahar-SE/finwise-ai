import { useState } from 'react';
import client from '../api/client';
import Card from '../components/Card';
import { Sparkles } from 'lucide-react';

const PRESETS = {
  crypto: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'],
  gold: ['XAU'],
  trading: ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'],
};

export default function Predictions() {
  const [assetType, setAssetType] = useState('crypto');
  const [symbol, setSymbol] = useState('BTC');
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function requestPrediction(e) {
    e.preventDefault();
    setError(''); setResult(null); setStatus('pending'); setBusy(true);
    try {
      const res = await client.post('/predictions/request', { asset_type: assetType, symbol });
      setTaskId(res.data.task_id);
      poll(res.data.task_id);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start prediction.');
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
          setResult(res.data.result);
          setBusy(false);
        }
      } catch (err) {
        clearInterval(interval);
        setError('Lost connection while checking prediction status.');
        setBusy(false);
      }
    }, 800);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-[var(--text)]">AI trend predictions</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        Requests run asynchronously — the backend queues a task and returns instantly, then computes the result in the background (mirroring a Celery worker pattern).
      </p>

      <Card className="mt-6">
        <form onSubmit={requestPrediction} className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Market</span>
            <select
              value={assetType}
              onChange={(e) => { setAssetType(e.target.value); setSymbol(PRESETS[e.target.value][0]); }}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]"
            >
              <option value="crypto">Crypto</option>
              <option value="gold">Gold</option>
              <option value="trading">Equity / Trading</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Symbol</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]">
              {PRESETS[assetType].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[var(--mint)] px-4 py-2.5 font-medium text-[#05130D] hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Sparkles size={16} /> {busy ? 'Analyzing…' : 'Run prediction'}
            </button>
          </div>
        </form>
      </Card>

      {error && <div className="mt-4 rounded-md border border-[var(--coral)]/40 bg-[var(--coral)]/10 px-3 py-2 text-sm text-[var(--coral)]">{error}</div>}

      {taskId && (
        <Card className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">Task ID</span>
            <span className="font-mono-data text-[var(--text)]">{taskId}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-[var(--text-muted)]">Status</span>
            <span className={status === 'complete' ? 'text-[var(--mint)]' : 'text-[var(--gold)]'}>{status}</span>
          </div>
        </Card>
      )}

      {result && (
        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[var(--text)]">{result.symbol} outlook</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${result.direction === 'bullish' ? 'bg-[var(--mint)]/15 text-[var(--mint)]' : result.direction === 'bearish' ? 'bg-[var(--coral)]/15 text-[var(--coral)]' : 'bg-[var(--azure)]/15 text-[var(--azure)]'}`}>
              {result.direction}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Confidence" value={`${result.confidence_pct}%`} />
            <Stat label="MA (5)" value={result.moving_average_5 ?? '—'} />
            <Stat label="MA (20)" value={result.moving_average_20 ?? '—'} />
            <Stat label="Projected next" value={result.projected_price_next_period} />
          </div>
          <p className="mt-4 text-xs text-[var(--text-muted)]">{result.disclaimer}</p>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 font-mono-data text-lg text-[var(--text)]">{value}</div>
    </div>
  );
}
