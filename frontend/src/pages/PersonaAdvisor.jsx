import { useState, useEffect } from 'react';
import client from '../api/client';
import Card from '../components/Card';
import { Users, Sparkles, Star, AlertTriangle, Award, Send, Loader2 } from 'lucide-react';

export default function PersonaAdvisor() {
  const [personas, setPersonas] = useState([]);
  const [selected, setSelected] = useState(null);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/predictions/persona/list').then((res) => {
      setPersonas(res.data.personas || []);
    }).catch(() => {});
  }, []);

  async function askPersona(personaId) {
    setSelected(personaId);
    setResult(null);
    setError('');
    setLoading(true);
    try {
      const res = await client.post('/predictions/persona/ask', {
        persona_id: personaId,
        question: question || undefined,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to consult advisor. Make sure you have portfolio holdings.');
    } finally {
      setLoading(false);
    }
  }

  const gradeColor = (g) => {
    const grade = (g || 'C').charAt(0);
    if (grade === 'A') return 'text-[var(--mint)]';
    if (grade === 'B') return 'text-[var(--azure)]';
    if (grade === 'C') return 'text-[var(--gold)]';
    return 'text-[var(--coral)]';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-bold text-[var(--gold)]">
          <Users size={14} /> World's First — Not Available on Any Other Platform
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
          AI Legendary Investor Advisor
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          What would <strong>Warren Buffett</strong>, <strong>George Soros</strong>, or <strong>Cathie Wood</strong> say about your portfolio? Choose a legendary investor persona and get AI-powered advice in their authentic voice.
        </p>
      </div>

      {/* Optional question */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a specific question (optional) — e.g., 'Should I sell my BTC?' or 'Is my portfolio too risky?'"
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/50 focus:border-[var(--gold)] focus:outline-none"
        />
      </div>

      {/* Persona Selection */}
      <h2 className="mt-8 font-display text-lg font-bold text-[var(--text)]">Choose Your Advisor</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {personas.map((p) => (
          <button
            key={p.id}
            onClick={() => askPersona(p.id)}
            disabled={loading}
            className={`group cursor-pointer rounded-2xl border p-5 text-left transition-all hover:shadow-lg disabled:opacity-50 ${
              selected === p.id
                ? 'border-[var(--gold)] bg-[var(--gold)]/10 shadow-md shadow-[var(--gold)]/10'
                : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--gold)]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl">{p.icon}</span>
              <div>
                <h3 className="font-display text-sm font-bold text-[var(--text)]">{p.name}</h3>
                <div className="text-[10px] text-[var(--text-muted)]">{p.title}</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2">{p.philosophy}</p>
            <div className="mt-2 text-[10px] italic text-[var(--gold)]">"{p.famous_quote}"</div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-[var(--coral)]/40 bg-[var(--coral)]/10 px-4 py-3 text-sm text-[var(--coral)]">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card className="mt-8 py-12 text-center">
          <Loader2 size={40} className="mx-auto text-[var(--gold)] animate-spin" />
          <h3 className="mt-4 font-display text-lg font-bold text-[var(--text)]">
            Consulting {personas.find(p => p.id === selected)?.name || 'Advisor'}…
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Analyzing your actual portfolio through the lens of their investment philosophy and giving you personalized advice.
          </p>
        </Card>
      )}

      {/* Results */}
      {result?.advice && !loading && (
        <div className="mt-8 space-y-6">
          {/* Persona Header + Grade */}
          <Card className="border-2 border-[var(--gold)]/30 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-alt)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-5xl">{personas.find(p => p.id === result.persona_id)?.icon || '🎩'}</span>
                <div>
                  <h3 className="font-display text-lg font-bold text-[var(--text)]">
                    {personas.find(p => p.id === result.persona_id)?.name || 'Advisor'}
                  </h3>
                  <div className="text-xs text-[var(--text-muted)]">
                    {personas.find(p => p.id === result.persona_id)?.title}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Portfolio Grade</div>
                <div className={`font-display text-5xl font-black ${gradeColor(result.advice.portfolio_grade)}`}>
                  {result.advice.portfolio_grade}
                </div>
              </div>
            </div>

            {/* Greeting */}
            <div className="mt-4 rounded-lg bg-[var(--gold)]/10 px-4 py-3 text-sm italic text-[var(--text)]">
              "{result.advice.greeting}"
            </div>

            {/* Grade Reason */}
            <p className="mt-3 text-xs text-[var(--text-muted)]">{result.advice.grade_reason}</p>
          </Card>

          {/* Likes & Concerns side-by-side */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-l-4 border-l-[var(--mint)]">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--mint)]">
                <Award size={16} /> What They Like
              </h3>
              <div className="mt-3 space-y-2">
                {result.advice.likes?.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[var(--text)]">
                    <span className="text-[var(--mint)]">✦</span> {item}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="border-l-4 border-l-[var(--coral)]">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--coral)]">
                <AlertTriangle size={16} /> Their Concerns
              </h3>
              <div className="mt-3 space-y-2">
                {result.advice.concerns?.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[var(--text)]">
                    <span className="text-[var(--coral)]">⚠</span> {item}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Actionable Advice */}
          <Card>
            <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
              <Sparkles size={16} className="text-[var(--azure)]" /> Their Advice For You
            </h3>
            <div className="mt-3 space-y-2">
              {result.advice.advice?.map((item, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-xs text-[var(--text)]">
                  <span className="text-[var(--azure)] font-bold">{i + 1}.</span> {item}
                </div>
              ))}
            </div>
          </Card>

          {/* Signature Move */}
          {result.advice.signature_move && (
            <Card className="border-2 border-[var(--gold)]/40 bg-gradient-to-r from-[var(--gold)]/5 to-transparent">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--gold)]">
                <Star size={16} /> Their Signature Move
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text)]">
                {result.advice.signature_move}
              </p>
            </Card>
          )}

          {/* Closing Wisdom */}
          {result.advice.closing_wisdom && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-center">
              <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Parting Wisdom</div>
              <p className="mt-2 font-display text-sm font-semibold italic text-[var(--gold)]">
                "{result.advice.closing_wisdom}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
