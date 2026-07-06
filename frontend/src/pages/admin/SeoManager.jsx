import { useEffect, useState } from 'react';
import client from '../../api/client';
import Card from '../../components/Card';
import { Trash2, Save } from 'lucide-react';

export default function SeoManager() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ path: '', title: '', meta_description: '', og_image: '', canonical_uri: '' });
  const [message, setMessage] = useState('');

  async function load() {
    const res = await client.get('/admin/seo');
    setRows(res.data.data);
  }
  useEffect(() => { load(); }, []);

  async function handleSave(e) {
    e.preventDefault();
    await client.post('/admin/seo', form);
    setMessage(`Saved meta rules for ${form.path}`);
    setForm({ path: '', title: '', meta_description: '', og_image: '', canonical_uri: '' });
    load();
  }

  async function handleDelete(id) {
    await client.delete(`/admin/seo/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--text)]">SEO manager</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Set per-path metadata. Sitemap and robots.txt update automatically from these entries.</p>

      {message && <div className="mt-4 rounded-md border border-[var(--mint)]/40 bg-[var(--mint)]/10 px-3 py-2 text-sm text-[var(--mint)]">{message}</div>}

      <Card className="mt-6">
        <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="text-[var(--text-muted)]">Path</span>
            <input required value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} placeholder="/crypto/btc"
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]" />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-[var(--text-muted)]">Title</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]" />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="text-[var(--text-muted)]">Meta description</span>
            <textarea rows={2} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]" />
          </label>
          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Open Graph image URL</span>
            <input value={form.og_image} onChange={(e) => setForm({ ...form, og_image: e.target.value })}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]" />
          </label>
          <label className="text-sm">
            <span className="text-[var(--text-muted)]">Canonical URI</span>
            <input value={form.canonical_uri} onChange={(e) => setForm({ ...form, canonical_uri: e.target.value })}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-[var(--text)]" />
          </label>
          <button type="submit" className="sm:col-span-2 mt-1 flex items-center justify-center gap-1.5 rounded-md bg-[var(--mint)] px-4 py-2.5 font-medium text-[#05130D] hover:opacity-90 transition-opacity">
            <Save size={16} /> Save meta rule
          </button>
        </form>
      </Card>

      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-alt)] text-[var(--text-muted)]">
            <tr><th className="px-4 py-3">Path</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 font-mono-data text-[var(--text)]">{r.path}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{r.title}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{r.updated_at}</td>
                <td className="px-4 py-3"><button onClick={() => handleDelete(r.id)} className="text-[var(--text-muted)] hover:text-[var(--coral)]"><Trash2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
