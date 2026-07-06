import { useEffect, useState } from 'react';
import client from '../api/client';
import Card from '../components/Card';
import { Trash2, Upload, Plus } from 'lucide-react';

const TYPES = [
  { value: 'crypto', label: 'Crypto' },
  { value: 'gold', label: 'Gold' },
  { value: 'trading', label: 'Equity / Trading' },
];

export default function Portfolio() {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({ asset_type: 'crypto', symbol: '', volume: '', avg_buy_price: '', buy_timestamp: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);

  async function load() {
    const res = await client.get('/assets');
    setAssets(res.data.data);
  }
  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      await client.post('/assets', {
        ...form,
        volume: Number(form.volume),
        avg_buy_price: Number(form.avg_buy_price),
      });
      setForm({ asset_type: 'crypto', symbol: '', volume: '', avg_buy_price: '', buy_timestamp: '' });
      setMessage('Asset added.');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add asset.');
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
      const res = await client.post('/assets/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage(`Imported ${res.data.imported} rows${res.data.failed ? `, ${res.data.failed} failed` : ''}.`);
      setFile(null);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed.');
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-[var(--text)]">Your portfolio</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Log holdings manually, or import a CSV/JSON transaction history.</p>

      {error && <div className="mt-4 rounded-md border border-[var(--coral)]/40 bg-[var(--coral)]/10 px-3 py-2 text-sm text-[var(--coral)]">{error}</div>}
      {message && <div className="mt-4 rounded-md border border-[var(--mint)]/40 bg-[var(--mint)]/10 px-3 py-2 text-sm text-[var(--mint)]">{message}</div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-base font-semibold text-[var(--text)]">Add a holding</h2>
          <form onSubmit={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-[var(--text-muted)]">Asset type</span>
              <select
                value={form.asset_type} onChange={(e) => setForm({ ...form, asset_type: e.target.value })}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]"
              >
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-[var(--text-muted)]">Symbol</span>
              <input required value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                placeholder="BTC, XAU, AAPL…"
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]" />
            </label>
            <label className="text-sm">
              <span className="text-[var(--text-muted)]">Volume</span>
              <input required type="number" step="any" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]" />
            </label>
            <label className="text-sm">
              <span className="text-[var(--text-muted)]">Average buy price ($)</span>
              <input required type="number" step="any" value={form.avg_buy_price} onChange={(e) => setForm({ ...form, avg_buy_price: e.target.value })}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]" />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="text-[var(--text-muted)]">Buy date</span>
              <input required type="date" value={form.buy_timestamp} onChange={(e) => setForm({ ...form, buy_timestamp: e.target.value })}
                className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]" />
            </label>
            <button type="submit" className="sm:col-span-2 mt-1 flex items-center justify-center gap-1.5 rounded-md bg-[var(--mint)] px-4 py-2.5 font-medium text-[#05130D] hover:opacity-90 transition-opacity">
              <Plus size={16} /> Add holding
            </button>
          </form>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-[var(--text)]">Bulk import</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">CSV columns: asset_type, symbol, volume, avg_buy_price, buy_timestamp. JSON: array of the same fields.</p>
          <form onSubmit={handleImport} className="mt-4 flex flex-col gap-3">
            <input type="file" accept=".csv,.json" onChange={(e) => setFile(e.target.files[0])}
              className="text-sm text-[var(--text-muted)]" />
            <button type="submit" disabled={!file} className="flex items-center justify-center gap-1.5 rounded-md border border-[var(--border)] px-4 py-2.5 font-medium text-[var(--text)] hover:border-[var(--mint)] disabled:opacity-40 transition-colors">
              <Upload size={16} /> Import file
            </button>
          </form>
        </Card>
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold text-[var(--text)]">Holdings ({assets.length})</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-alt)] text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">Avg buy price</th>
              <th className="px-4 py-3">Buy date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 capitalize text-[var(--text-muted)]">{a.asset_type}</td>
                <td className="px-4 py-3 font-mono-data text-[var(--text)]">{a.symbol}</td>
                <td className="px-4 py-3 font-mono-data">{a.volume}</td>
                <td className="px-4 py-3 font-mono-data">${a.avg_buy_price}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{a.buy_timestamp}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(a.id)} className="text-[var(--text-muted)] hover:text-[var(--coral)]">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">No holdings yet. Add one above to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
