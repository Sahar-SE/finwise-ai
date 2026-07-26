import { useState, useEffect } from 'react';
import client from '../api/client';
import Card from '../components/Card';
import { BookOpen, Plus, Trash2, Cpu, Brain, TrendingUp, AlertTriangle, Award, BarChart3 } from 'lucide-react';

const EMOTIONS = [
  { value: 'confident', label: '😎 Confident', color: 'mint' },
  { value: 'fearful', label: '😰 Fearful', color: 'coral' },
  { value: 'fomo', label: '🔥 FOMO', color: 'gold' },
  { value: 'revenge', label: '😤 Revenge', color: 'coral' },
  { value: 'disciplined', label: '🧘 Disciplined', color: 'mint' },
  { value: 'greedy', label: '🤑 Greedy', color: 'gold' },
  { value: 'uncertain', label: '🤔 Uncertain', color: 'azure' },
];

const ACTIONS = [
  { value: 'buy', label: 'Buy / Long' },
  { value: 'sell', label: 'Sell / Close' },
  { value: 'short', label: 'Short' },
  { value: 'hold', label: 'Hold (Observation)' },
];

const OUTCOMES = [
  { value: 'open', label: '🔄 Still Open' },
  { value: 'profit', label: '✅ Profit' },
  { value: 'loss', label: '❌ Loss' },
  { value: 'breakeven', label: '↔️ Breakeven' },
];

export default function TradeJournal() {
  const [entries, setEntries] = useState([]);
  const [insights, setInsights] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    action: 'buy', symbol: '', asset_type: 'crypto',
    entry_price: '', exit_price: '', volume: '',
    emotion: 'disciplined', outcome: 'open', notes: '',
  });

  async function loadEntries() {
    try {
      const res = await client.get('/journal/');
      setEntries(res.data.data || []);
    } catch (err) { /* empty portfolio */ }
  }

  async function loadInsights() {
    setLoadingInsights(true);
    try {
      const res = await client.get('/journal/insights');
      setInsights(res.data);
    } catch (err) { /* no insights yet */ }
    setLoadingInsights(false);
  }

  useEffect(() => { loadEntries(); loadInsights(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    try {
      await client.post('/journal/', {
        ...form,
        entry_price: form.entry_price ? Number(form.entry_price) : null,
        exit_price: form.exit_price ? Number(form.exit_price) : null,
        volume: form.volume ? Number(form.volume) : 0,
      });
      setMessage('Trade logged successfully.');
      setForm({ action: 'buy', symbol: '', asset_type: 'crypto', entry_price: '', exit_price: '', volume: '', emotion: 'disciplined', outcome: 'open', notes: '' });
      setShowForm(false);
      loadEntries();
      loadInsights();
    } catch (err) {
      setMessage('Failed to log trade.');
    }
  }

  async function handleDelete(entryId) {
    await client.delete(`/journal/${entryId}`);
    loadEntries();
    loadInsights();
  }

  const emotionLabel = (val) => EMOTIONS.find((e) => e.value === val)?.label || val;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--azure)]/40 bg-[var(--azure)]/10 px-3 py-1 text-xs font-bold text-[var(--azure)]">
            <Brain size={14} /> Exclusive Feature — Behavioral Finance AI
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
            AI Trade Journal
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Log every trade with emotion tags. AI detects behavioral patterns, calculates your discipline score, and coaches you to trade better.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-[var(--mint)] px-5 py-2.5 font-bold text-[#05130D] shadow-lg shadow-[var(--mint)]/20 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Plus size={18} /> Log a Trade
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-lg border border-[var(--mint)]/40 bg-[var(--mint)]/10 px-4 py-2 text-sm text-[var(--mint)]">{message}</div>
      )}

      {/* Trade Entry Form */}
      {showForm && (
        <Card className="mt-6 border-2 border-[var(--mint)]/40">
          <h2 className="font-display text-base font-bold text-[var(--text)] flex items-center gap-2">
            <BookOpen size={18} className="text-[var(--mint)]" /> Log Trade Decision
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-[var(--text-muted)]">
              <span>Action</span>
              <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--mint)] focus:outline-none">
                {ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </label>

            <label className="text-xs font-medium text-[var(--text-muted)]">
              <span>Symbol</span>
              <input required value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                placeholder="BTC, AAPL, XAU…"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text)] font-mono-data focus:border-[var(--mint)] focus:outline-none" />
            </label>

            <label className="text-xs font-medium text-[var(--text-muted)]">
              <span>Entry Price ($)</span>
              <input type="number" step="any" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text)] font-mono-data focus:border-[var(--mint)] focus:outline-none" />
            </label>

            <label className="text-xs font-medium text-[var(--text-muted)]">
              <span>Exit Price ($)</span>
              <input type="number" step="any" value={form.exit_price} onChange={(e) => setForm({ ...form, exit_price: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text)] font-mono-data focus:border-[var(--mint)] focus:outline-none" />
            </label>

            {/* Emotion Selector — the key differentiator */}
            <div className="sm:col-span-2 lg:col-span-4">
              <div className="text-xs font-bold text-[var(--text-muted)] mb-2">How are you feeling about this trade?</div>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((em) => (
                  <button
                    key={em.value}
                    type="button"
                    onClick={() => setForm({ ...form, emotion: em.value })}
                    className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                      form.emotion === em.value
                        ? `bg-[var(--${em.color})]/20 border-2 border-[var(--${em.color})] text-[var(--text)] shadow-md`
                        : 'border border-[var(--border)] bg-[var(--surface-alt)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    {em.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="text-xs font-medium text-[var(--text-muted)]">
              <span>Outcome</span>
              <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--mint)] focus:outline-none">
                {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>

            <label className="text-xs font-medium text-[var(--text-muted)] sm:col-span-1 lg:col-span-3">
              <span>Notes (optional)</span>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Why did you take this trade? What was your thesis?"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--mint)] focus:outline-none" />
            </label>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button type="submit"
                className="flex items-center gap-2 rounded-lg bg-[var(--mint)] px-6 py-2.5 font-bold text-[#05130D] hover:opacity-90 transition-opacity cursor-pointer">
                <BookOpen size={16} /> Save Trade Entry
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* AI Behavioral Intelligence Report */}
      {insights && insights.total_trades > 0 && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-[var(--text)] flex items-center gap-2">
              <Brain size={22} className="text-[var(--azure)]" /> AI Behavioral Intelligence Report
            </h2>
            <button onClick={loadInsights} disabled={loadingInsights}
              className="text-xs font-bold text-[var(--azure)] hover:underline cursor-pointer">
              {loadingInsights ? 'Analyzing…' : 'Refresh Analysis'}
            </button>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Card className="border-l-4 border-l-[var(--mint)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Total Trades</div>
              <div className="mt-1 font-mono-data text-2xl font-black text-[var(--text)]">{insights.total_trades}</div>
            </Card>
            <Card className="border-l-4 border-l-[var(--mint)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Win Rate</div>
              <div className={`mt-1 font-mono-data text-2xl font-black ${insights.win_rate_pct >= 50 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                {insights.win_rate_pct}%
              </div>
            </Card>
            <Card className="border-l-4 border-l-[var(--azure)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Discipline Score</div>
              <div className="mt-1 font-mono-data text-2xl font-black text-[var(--azure)]">{insights.discipline_score}/100</div>
            </Card>
            <Card className="border-l-4 border-l-[var(--mint)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Wins / Losses</div>
              <div className="mt-1 font-mono-data text-lg font-bold text-[var(--text)]">
                <span className="text-[var(--mint)]">{insights.wins}W</span> / <span className="text-[var(--coral)]">{insights.losses}L</span>
              </div>
            </Card>
            <Card className="border-l-4 border-l-[var(--gold)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Dominant Emotion</div>
              <div className="mt-1 text-lg font-bold text-[var(--text)]">{emotionLabel(insights.dominant_emotion)}</div>
            </Card>
          </div>

          {/* Emotion Win Rate Breakdown */}
          {insights.emotion_win_rates && Object.keys(insights.emotion_win_rates).length > 0 && (
            <Card>
              <h3 className="font-display text-sm font-bold text-[var(--text)] flex items-center gap-2">
                <BarChart3 size={16} className="text-[var(--azure)]" /> Win Rate by Emotional State
              </h3>
              <div className="mt-4 space-y-2">
                {Object.entries(insights.emotion_win_rates).map(([emo, rate]) => (
                  <div key={emo} className="flex items-center gap-3">
                    <div className="w-28 text-xs font-medium text-[var(--text)]">{emotionLabel(emo)}</div>
                    <div className="flex-1 h-4 rounded-full bg-[var(--surface-alt)] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${rate >= 50 ? 'bg-[var(--mint)]' : 'bg-[var(--coral)]'}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <div className={`w-12 text-right font-mono-data text-xs font-bold ${rate >= 50 ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>
                      {rate}%
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Detected Behavioral Patterns */}
          {insights.patterns?.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {insights.patterns.map((p, idx) => (
                <Card
                  key={idx}
                  className={`border-l-4 ${
                    p.type === 'positive' ? 'border-l-[var(--mint)]' :
                    p.type === 'danger' ? 'border-l-[var(--coral)]' :
                    p.type === 'warning' ? 'border-l-[var(--gold)]' :
                    'border-l-[var(--azure)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {p.type === 'positive' ? <Award size={16} className="text-[var(--mint)]" /> :
                     p.type === 'danger' ? <AlertTriangle size={16} className="text-[var(--coral)]" /> :
                     p.type === 'warning' ? <AlertTriangle size={16} className="text-[var(--gold)]" /> :
                     <TrendingUp size={16} className="text-[var(--azure)]" />}
                    <span className="text-xs font-bold text-[var(--text)]">{p.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">{p.detail}</p>
                </Card>
              ))}
            </div>
          )}

          {/* AI Coaching Advice */}
          {insights.coaching && (
            <Card className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-alt)] border-2 border-[var(--azure)]/30">
              <h3 className="font-display text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <Brain size={20} className="text-[var(--azure)]" /> AI Behavioral Coach
              </h3>
              <div className="mt-2 text-sm font-bold text-[var(--azure)]">{insights.coaching.headline}</div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text)]">{insights.coaching.advice}</p>

              {insights.coaching.action_items?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Action Items</div>
                  {insights.coaching.action_items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--text)]">
                      <span className="text-[var(--mint)] font-bold">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Trade History Timeline */}
      <h2 className="mt-10 font-display text-xl font-bold text-[var(--text)]">Trade History ({entries.length})</h2>
      <div className="mt-4 space-y-3">
        {entries.map((e) => (
          <Card key={e.entry_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${
                e.action === 'buy' ? 'bg-[var(--mint)]/15' :
                e.action === 'sell' ? 'bg-[var(--coral)]/15' :
                e.action === 'short' ? 'bg-[var(--coral)]/15' :
                'bg-[var(--azure)]/15'
              }`}>
                {e.action === 'buy' ? '📈' : e.action === 'sell' ? '📉' : e.action === 'short' ? '🔻' : '👁️'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-data text-sm font-bold text-[var(--text)]">{e.action.toUpperCase()} ${e.symbol}</span>
                  <span className="text-sm">{emotionLabel(e.emotion)}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    e.outcome === 'profit' ? 'bg-[var(--mint)]/15 text-[var(--mint)]' :
                    e.outcome === 'loss' ? 'bg-[var(--coral)]/15 text-[var(--coral)]' :
                    'bg-[var(--azure)]/15 text-[var(--azure)]'
                  }`}>
                    {OUTCOMES.find(o => o.value === e.outcome)?.label || e.outcome}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  {e.entry_price && `Entry: $${e.entry_price}`}
                  {e.exit_price && ` → Exit: $${e.exit_price}`}
                  {e.notes && ` · "${e.notes}"`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[var(--text-muted)]">{new Date(e.created_at).toLocaleDateString()}</span>
              <button onClick={() => handleDelete(e.entry_id)} className="text-[var(--text-muted)] hover:text-[var(--coral)] cursor-pointer">
                <Trash2 size={14} />
              </button>
            </div>
          </Card>
        ))}
        {entries.length === 0 && (
          <Card className="text-center py-8 text-[var(--text-muted)] text-sm">
            No trades logged yet. Click "Log a Trade" above to start building your behavioral intelligence profile.
          </Card>
        )}
      </div>
    </div>
  );
}
