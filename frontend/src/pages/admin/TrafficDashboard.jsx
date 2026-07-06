import { useEffect, useState } from 'react';
import client from '../../api/client';
import Card from '../../components/Card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function TrafficDashboard() {
  const [data, setData] = useState(null);

  async function load() {
    const res = await client.get('/admin/traffic/summary');
    setData(res.data);
  }
  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, []);

  if (!data) return <p className="text-sm text-[var(--text-muted)]">Loading…</p>;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-[var(--text)]">Traffic dashboard</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">Live diagnostics — no third-party tracking libraries.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total requests" value={data.total_requests} />
        <Stat label="Unique visitors" value={data.unique_visitors} />
        <Stat label="Avg latency" value={`${data.avg_latency_ms} ms`} />
        <Stat label="Bounce rate" value={`${data.bounce_rate_pct}%`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-base font-semibold text-[var(--text)]">Requests by hour (last 24h)</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly_last_24h}>
                <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--surface-alt)', border: '1px solid var(--border)' }} />
                <Bar dataKey="hits" fill="var(--mint)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-[var(--text)]">Top paths</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {data.top_paths.map((p) => (
              <li key={p.path} className="flex items-center justify-between text-sm">
                <span className="font-mono-data text-[var(--text)] truncate">{p.path}</span>
                <span className="text-[var(--text-muted)]">{p.hits}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-[var(--text)]">Top referrers</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {data.top_referrers.map((r) => (
              <li key={r.referrer} className="flex items-center justify-between text-sm">
                <span className="text-[var(--text)] truncate">{r.referrer}</span>
                <span className="text-[var(--text-muted)]">{r.hits}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-[var(--text)]">Status codes</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {data.status_breakdown.map((s) => (
              <li key={s.status_code} className="flex items-center justify-between text-sm">
                <span className={`font-mono-data ${s.status_code >= 400 ? 'text-[var(--coral)]' : 'text-[var(--mint)]'}`}>{s.status_code}</span>
                <span className="text-[var(--text-muted)]">{s.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <Card>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 font-mono-data text-2xl text-[var(--text)]">{value}</div>
    </Card>
  );
}
