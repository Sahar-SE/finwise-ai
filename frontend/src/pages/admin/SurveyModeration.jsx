import { useEffect, useState } from 'react';
import client from '../../api/client';
import Card from '../../components/Card';
import { Check, X, Trash2 } from 'lucide-react';

export default function SurveyModeration() {
  const [filter, setFilter] = useState('pending');
  const [rows, setRows] = useState([]);

  async function load() {
    const res = await client.get(`/admin/surveys?status=${filter}`);
    setRows(res.data.data);
  }
  useEffect(() => { load(); }, [filter]);

  async function approve(id) { await client.post(`/admin/surveys/${id}/approve`); load(); }
  async function reject(id) { await client.post(`/admin/surveys/${id}/reject`); load(); }
  async function remove(id) { await client.delete(`/admin/surveys/${id}`); load(); }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--text)]">Survey moderation</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Approve feedback to publish it on the homepage, or reject to flag it inactive.</p>

      <div className="mt-4 flex gap-2">
        {['pending', 'published', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-md border px-3 py-1.5 text-sm capitalize ${filter === f ? 'border-[var(--mint)] text-[var(--mint)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--text)]">{r.username}</span>
                  <span className="text-xs text-[var(--text-muted)] capitalize">· {r.primary_market_focus}</span>
                  <span className="text-[var(--gold)] text-sm">{'★'.repeat(r.rating_score)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${r.is_published ? 'bg-[var(--mint)]/15 text-[var(--mint)]' : 'bg-[var(--border)] text-[var(--text-muted)]'}`}>
                    {r.is_published ? 'published' : 'pending'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--text)]">{r.qualitative_feedback}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{r.created_at}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!r.is_published && (
                  <button onClick={() => approve(r.id)} className="rounded-md border border-[var(--mint)]/40 p-2 text-[var(--mint)] hover:bg-[var(--mint)]/10"><Check size={16} /></button>
                )}
                {r.is_published && (
                  <button onClick={() => reject(r.id)} className="rounded-md border border-[var(--gold)]/40 p-2 text-[var(--gold)] hover:bg-[var(--gold)]/10"><X size={16} /></button>
                )}
                <button onClick={() => remove(r.id)} className="rounded-md border border-[var(--coral)]/40 p-2 text-[var(--coral)] hover:bg-[var(--coral)]/10"><Trash2 size={16} /></button>
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-[var(--text-muted)]">Nothing here.</p>}
      </div>
    </div>
  );
}
