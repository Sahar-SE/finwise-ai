import { useEffect, useState } from 'react';
import client from '../../api/client';

export default function AdminUsers() {
  const [rows, setRows] = useState([]);
  useEffect(() => { client.get('/admin/users').then((res) => setRows(res.data.data)); }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--text)]">Users</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{rows.length} registered accounts.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface-alt)] text-[var(--text-muted)]">
            <tr><th className="px-4 py-3">Username</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Joined</th></tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 text-[var(--text)]">{u.username}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${u.role === 'admin' ? 'bg-[var(--gold)]/15 text-[var(--gold)]' : 'bg-[var(--border)] text-[var(--text-muted)]'}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{u.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
