import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Card from '../components/Card';
import { Newspaper, Sparkles, Send, Tag, Clock, ArrowRight, ShieldAlert, Cpu, CheckCircle2, MessageSquare, X } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Newsletters' },
  { id: 'macro', label: 'Macro & Fed Policy' },
  { id: 'crypto', label: 'Crypto & Digital Assets' },
  { id: 'equities', label: 'Tech & Stocks' },
  { id: 'gold', label: 'Gold & Commodities' },
];

export default function Newsletter() {
  const navigate = useNavigate();
  const [newsletters, setNewsletters] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeNews, setActiveNews] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // AI Q&A Chat State
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [asking, setAsking] = useState(false);

  async function loadNews(cat = 'all') {
    setLoading(true);
    try {
      const res = await client.get(`/news${cat !== 'all' ? `?category=${cat}` : ''}`);
      setNewsletters(res.data.data);
    } catch (err) {
      console.error('Failed to load newsletters:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNews(category);
  }, [category]);

  async function openNewsDetail(news) {
    setActiveNews(news);
    setAiAnalysis(null);
    setChatHistory([]);
    setQuestion('');
    setAnalyzing(true);

    try {
      const res = await client.post('/news/analyze', { news_id: news.id });
      setAiAnalysis(res.data.analysis);
    } catch (err) {
      console.error('Failed to analyze newsletter with AI:', err);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleAskQuestion(e) {
    e.preventDefault();
    if (!question.trim() || asking || !activeNews) return;

    const userQ = question;
    setQuestion('');
    setChatHistory((prev) => [...prev, { role: 'user', text: userQ }]);
    setAsking(true);

    try {
      const res = await client.post('/news/ask', {
        news_id: activeNews.id,
        question: userQ,
      });
      setChatHistory((prev) => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: 'ai', text: 'Financial AI unavailable at the moment. Please try again.' }]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-semibold text-[var(--gold)]">
            <Sparkles size={14} /> AI Financial Digest & Intelligence Hub
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
            Fresh Market Newsletters
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Stay ahead with curated market digests. Analyzed by LLM AI to deliver instant market impact metrics & personalized trading advice.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              category === c.id
                ? 'bg-[var(--mint)] text-[#05130D] shadow-md shadow-[var(--mint)]/20'
                : 'bg-[var(--surface-alt)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Featured News Hero Card */}
      {newsletters.length > 0 && category === 'all' && (
        <Card className="mt-6 border-2 border-[var(--mint)]/40 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-alt)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[var(--mint)]">
              <Sparkles size={14} /> Featured Breaking Digest
            </span>
            <span className="flex items-center gap-1"><Clock size={14} /> {newsletters[0].published_at}</span>
          </div>

          <h2 className="mt-3 font-display text-xl font-bold text-[var(--text)] sm:text-2xl">
            {newsletters[0].title}
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            {newsletters[0].summary}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
            <div className="text-xs text-[var(--text-muted)] font-medium">
              Source: <span className="text-[var(--text)]">{newsletters[0].source}</span> · {newsletters[0].author}
            </div>

            <button
              onClick={() => openNewsDetail(newsletters[0])}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--mint)] px-4 py-2 text-xs font-bold text-[#05130D] hover:opacity-90 transition-opacity cursor-pointer"
            >
              Analyze with Financial AI <ArrowRight size={14} />
            </button>
          </div>
        </Card>
      )}

      {/* Newsletter Grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {newsletters.map((n) => (
          <Card key={n.id} className="flex flex-col justify-between hover:border-[var(--mint)]/40 transition-colors">
            <div>
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span className="rounded-full bg-[var(--surface-alt)] px-2.5 py-0.5 font-semibold text-[var(--azure)] capitalize">
                  {n.category}
                </span>
                <span className="flex items-center gap-1"><Clock size={12} /> {n.read_time}</span>
              </div>

              <h3 className="mt-3 font-display text-base font-bold text-[var(--text)] line-clamp-2">
                {n.title}
              </h3>

              <p className="mt-2 text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                {n.summary}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between pt-3 border-t border-[var(--border)]">
              <span className="text-[11px] text-[var(--text-muted)]">{n.published_at}</span>
              <button
                onClick={() => openNewsDetail(n)}
                className="flex items-center gap-1 text-xs font-bold text-[var(--mint)] hover:underline cursor-pointer"
              >
                Read & AI Advice <ChevronRightIcon />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Reader & AI Analysis Modal */}
      {activeNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setActiveNews(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--mint)] uppercase tracking-wider">
              <Newspaper size={16} /> Market Digest & AI Advisor
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-[var(--text)]">
              {activeNews.title}
            </h2>
            <div className="mt-1 text-xs text-[var(--text-muted)]">
              {activeNews.source} · {activeNews.author} · {activeNews.published_at}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Left Column: Full Article Text */}
              <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] p-4 text-xs leading-relaxed text-[var(--text)]">
                <div className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                  Full Newsletter Content
                </div>
                {activeNews.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {/* Right Column: AI Analysis & Personalized Advice */}
              <div className="space-y-4">
                {analyzing ? (
                  <div className="rounded-xl border border-[var(--border)] p-6 text-center">
                    <Cpu size={28} className="mx-auto text-[var(--mint)] animate-spin" />
                    <div className="mt-3 text-sm font-semibold text-[var(--text)]">
                      Analyzing Market News with LLM AI…
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">
                      Extracting sentiment impact scores, affected tickers, and personal advice.
                    </div>
                  </div>
                ) : aiAnalysis ? (
                  <>
                    {/* Impact & Sentiment Banner */}
                    <div className="rounded-xl border border-[var(--mint)]/30 bg-[var(--mint)]/10 p-4">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-[var(--mint)] px-2.5 py-0.5 text-xs font-black text-[#05130D]">
                          {aiAnalysis.sentiment} IMPACT
                        </span>
                        <span className="font-mono-data text-xs font-bold text-[var(--mint)]">
                          Impact Rating: {aiAnalysis.impact_score}%
                        </span>
                      </div>

                      {/* Affected Asset Chips */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-[var(--text-muted)]">Target Assets:</span>
                        {aiAnalysis.affected_assets?.map((sym) => (
                          <button
                            key={sym}
                            onClick={() => {
                              setActiveNews(null);
                              navigate(`/predictions?symbol=${sym}`);
                            }}
                            className="rounded bg-[var(--surface-alt)] px-2 py-0.5 font-mono-data text-xs font-bold text-[var(--gold)] hover:bg-[var(--gold)] hover:text-black transition-colors cursor-pointer"
                          >
                            ${sym}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Key Takeaways */}
                    <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--surface-alt)]">
                      <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={14} className="text-[var(--mint)]" /> AI Executive Summary
                      </div>
                      <ul className="mt-2 space-y-1.5 text-xs text-[var(--text)]">
                        {aiAnalysis.executive_takeaways?.map((t, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[var(--mint)]">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actionable Advice Box */}
                    <div className="rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4">
                      <div className="text-xs font-bold text-[var(--gold)] uppercase tracking-wider flex items-center gap-1">
                        💡 Personalized Advice for You
                      </div>
                      <p className="mt-1 text-xs font-semibold text-[var(--text)] leading-relaxed">
                        {aiAnalysis.actionable_advice}
                      </p>
                    </div>

                    {/* Interactive AI Chat Assistant */}
                    <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--surface)]">
                      <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
                        <MessageSquare size={14} className="text-[var(--azure)]" /> Ask FinWise AI About This News
                      </div>

                      {/* Chat History */}
                      <div className="mt-3 max-h-36 overflow-y-auto space-y-2 pr-1 text-xs">
                        {chatHistory.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-[var(--surface-alt)] text-[var(--text)] text-right font-medium'
                                : 'bg-[var(--azure)]/10 text-[var(--text)] font-normal border border-[var(--azure)]/20'
                            }`}
                          >
                            {msg.text}
                          </div>
                        ))}
                      </div>

                      {/* Ask Input Form */}
                      <form onSubmit={handleAskQuestion} className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder="e.g. How does this affect my ETH holdings?"
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--mint)] focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={asking || !question.trim()}
                          className="rounded-lg bg-[var(--mint)] px-3 py-2 text-xs font-bold text-[#05130D] hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
                        >
                          <Send size={14} />
                        </button>
                      </form>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
    </svg>
  );
}
