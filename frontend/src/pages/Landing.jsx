import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShieldCheck, Zap, LineChart as LineChartIcon } from 'lucide-react';
import PriceTicker from '../components/PriceTicker';
import Card from '../components/Card';
import client from '../api/client';

export default function Landing() {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    client.get('/surveys/published').then((res) => setTestimonials(res.data.data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div>
      <PriceTicker />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-block rounded-full border border-[var(--border)] px-3 py-1 text-xs font-mono-data text-[var(--mint)]">
              CRYPTO · GOLD · EQUITIES
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-[var(--text)] sm:text-5xl">
              Read the market's
              <span className="text-[var(--mint)]"> pulse</span>,
              not just its price.
            </h1>
            <p className="mt-5 max-w-lg text-[var(--text-muted)]">
              FinWise-AI streams live crypto, gold, and equity data through a statistical trend engine,
              so you can track your holdings and see where the momentum is pointing — before you decide.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/register" className="rounded-md bg-[var(--mint)] px-5 py-2.5 font-medium text-[#05130D] hover:opacity-90 transition-opacity">
                Start tracking free
              </Link>
              <Link to="/dashboard" className="rounded-md border border-[var(--border)] px-5 py-2.5 font-medium text-[var(--text)] hover:border-[var(--mint)] transition-colors">
                View live markets
              </Link>
            </div>
          </div>

          <div className="glow-mint rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
              <span>XAU/USD · Live</span>
              <span className="text-[var(--mint)]">● streaming</span>
            </div>
            <div className="mt-3 font-mono-data text-4xl text-[var(--text)]">$2,378.72</div>
            <div className="mt-1 text-sm text-[var(--mint)]">▲ 0.79% · 24h</div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <MiniStat label="BTC" value="+2.1%" positive />
              <MiniStat label="ETH" value="-0.4%" positive={false} />
              <MiniStat label="AAPL" value="+0.8%" positive />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--surface)]/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-2xl font-semibold text-[var(--text)]">What FinWise-AI does</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Feature icon={<LineChartIcon size={20} />} title="Live multi-market feed" desc="Real-time crypto prices, gold, and equity quotes in one dashboard." />
            <Feature icon={<TrendingUp size={20} />} title="Trend predictions" desc="A statistical engine surfaces momentum, moving averages, and direction." />
            <Feature icon={<ShieldCheck size={20} />} title="Your portfolio, private" desc="Log holdings manually or import a CSV/JSON transaction history." />
            <Feature icon={<Zap size={20} />} title="Fast by design" desc="Heavy calculations run in the background so the app never stalls." />
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-[var(--text)]">What people are saying</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.submission_id}>
                  <div className="text-[var(--gold)]">{'★'.repeat(t.rating_score)}{'☆'.repeat(5 - t.rating_score)}</div>
                  <p className="mt-3 text-sm text-[var(--text)]">{t.qualitative_feedback}</p>
                  <p className="mt-3 text-xs text-[var(--text-muted)]">— {t.username}, {t.primary_market_focus}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function MiniStat({ label, value, positive }) {
  return (
    <div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className={`font-mono-data text-sm ${positive ? 'text-[var(--mint)]' : 'text-[var(--coral)]'}`}>{value}</div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <Card>
      <div className="text-[var(--mint)]">{icon}</div>
      <h3 className="mt-3 font-display text-base font-semibold text-[var(--text)]">{title}</h3>
      <p className="mt-1.5 text-sm text-[var(--text-muted)]">{desc}</p>
    </Card>
  );
}
