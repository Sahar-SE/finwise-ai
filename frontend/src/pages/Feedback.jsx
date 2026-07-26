import { useState } from 'react';
import client from '../api/client';
import Card from '../components/Card';

export default function Feedback() {
  const [form, setForm] = useState({ username: '', rating_score: 5, qualitative_feedback: '', primary_market_focus: 'crypto' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(''); setError(''); setBusy(true);
    try {
      const res = await client.post('/surveys/', form);
      setMessage(res.data.message);
      setForm({ username: '', rating_score: 5, qualitative_feedback: '', primary_market_focus: 'crypto' });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit feedback.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-2xl font-semibold text-[var(--text)]">Share your feedback</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Your response is reviewed before it appears publicly on the homepage.</p>

      {message && <div className="mt-4 rounded-md border border-[var(--mint)]/40 bg-[var(--mint)]/10 px-3 py-2 text-sm text-[var(--mint)]">{message}</div>}
      {error && <div className="mt-4 rounded-md border border-[var(--coral)]/40 bg-[var(--coral)]/10 px-3 py-2 text-sm text-[var(--coral)]">{error}</div>}

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Your name</span>
            <input required minLength={2} maxLength={50} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]" />
          </label>

          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Which market do you follow most?</span>
            <select value={form.primary_market_focus} onChange={(e) => setForm({ ...form, primary_market_focus: e.target.value })}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]">
              <option value="crypto">Crypto</option>
              <option value="gold">Gold</option>
              <option value="trading">Trading / Equities</option>
            </select>
          </label>

          <div className="text-sm">
            <span className="text-[var(--text-muted)]">Rating</span>
            <div className="mt-1 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setForm({ ...form, rating_score: n })}
                  className={`h-9 w-9 rounded-md border ${form.rating_score >= n ? 'border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
                  ★
                </button>
              ))}
            </div>
          </div>

          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Your feedback</span>
            <textarea required maxLength={1000} rows={4} value={form.qualitative_feedback} onChange={(e) => setForm({ ...form, qualitative_feedback: e.target.value })}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]"
              placeholder="What's working well? What could be better?" />
          </label>

          <button type="submit" disabled={busy} className="mt-2 rounded-md bg-[var(--mint)] px-4 py-2.5 font-medium text-[#05130D] hover:opacity-90 disabled:opacity-50 transition-opacity">
            {busy ? 'Submitting…' : 'Submit feedback'}
          </button>
        </form>
      </Card>
    </div>
  );
}
