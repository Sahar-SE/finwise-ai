import { useState, useEffect } from 'react';
import client from '../api/client';
import Card from '../components/Card';
import {
  BrainCircuit,
  Search,
  Sparkles,
  BookOpen,
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  BarChart2,
  ExternalLink,
  ShieldCheck,
  Zap,
  RefreshCw,
  Loader2,
  HelpCircle
} from 'lucide-react';

const SUGGESTED_QUERIES = [
  "How does the Fed dovish pivot impact crypto and tech equities?",
  "What is the connection between Bitcoin halving and Spot ETF inflows?",
  "How can I manage FOMO and revenge trading emotional biases?",
  "Why are central banks accumulating physical gold reserves?",
];

const CATEGORIES = [
  { id: 'all', label: 'All Knowledge' },
  { id: 'macro', label: 'Macro & Fed' },
  { id: 'crypto', label: 'Crypto & ETFs' },
  { id: 'equities', label: 'Tech & Semis' },
  { id: 'gold', label: 'Gold & Reserves' },
  { id: 'coaching', label: 'Behavioral AI' },
];

export default function RagAdvisor() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Modals & Inspection UI
  const [showInspector, setShowInspector] = useState(true);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [showChunksModal, setShowChunksModal] = useState(false);
  const [evalData, setEvalData] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [chunksData, setChunksData] = useState(null);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);

  async function handleSearch(searchQuery) {
    const q = searchQuery || query;
    if (!q.trim() || loading) return;

    setLoading(true);
    setError('');
    setActiveCitation(null);

    try {
      const res = await client.post('/rag/ask', {
        question: q,
        category: category,
        top_k: 5,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch RAG intelligence. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function loadEvalData() {
    setShowEvalModal(true);
    if (evalData) return;
    setEvalLoading(true);
    try {
      const res = await client.get('/rag/eval?top_k=5');
      setEvalData(res.data);
    } catch (err) {
      console.error('Failed to load eval:', err);
    } finally {
      setEvalLoading(false);
    }
  }

  async function loadChunksData() {
    setShowChunksModal(true);
    if (chunksData) return;
    setChunksLoading(true);
    try {
      const res = await client.get('/rag/chunks');
      setChunksData(res.data);
    } catch (err) {
      console.error('Failed to load chunks:', err);
    } finally {
      setChunksLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--mint)]/40 bg-[var(--mint)]/10 px-3 py-1 text-xs font-bold text-[var(--mint)]">
            <BrainCircuit size={14} /> Production Enterprise RAG Architecture
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
            Hybrid RAG Market Intelligence
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Ask market questions grounded strictly in validated news digests and financial domain knowledge with full inline citations and retrieval inspection.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadEvalData}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--azure)]/40 bg-[var(--azure)]/10 px-3 py-2 text-xs font-semibold text-[var(--azure)] hover:bg-[var(--azure)]/20 transition-colors"
          >
            <BarChart2 size={15} /> Benchmark Metrics
          </button>
          <button
            onClick={loadChunksData}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-2 text-xs font-semibold text-[var(--gold)] hover:bg-[var(--gold)]/20 transition-colors"
          >
            <Layers size={15} /> Inspect Knowledge Index
          </button>
        </div>
      </div>

      {/* Query Bar */}
      <div className="mt-8 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about market catalysts, Fed policy, BTC ETFs, or trade discipline..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] pl-11 pr-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]/50 focus:border-[var(--mint)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[var(--mint)] px-6 py-3 text-sm font-semibold text-[#05130D] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Ask RAG Engine
          </button>
        </form>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat.id
                  ? 'bg-[var(--mint)]/20 text-[var(--mint)] border border-[var(--mint)]/40'
                  : 'bg-[var(--surface-alt)] text-[var(--text-muted)] hover:text-[var(--text)] border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Suggested Queries */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1">
            <Zap size={12} className="text-[var(--gold)]" /> Try asking:
          </span>
          {SUGGESTED_QUERIES.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(sq);
                handleSearch(sq);
              }}
              className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text-muted)] hover:border-[var(--mint)]/50 hover:text-[var(--text)] transition-colors"
            >
              "{sq}"
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-[var(--coral)]/40 bg-[var(--coral)]/10 px-4 py-3 text-sm text-[var(--coral)]">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <Card className="mt-8 py-12 text-center">
          <Loader2 size={36} className="mx-auto text-[var(--mint)] animate-spin" />
          <h3 className="mt-4 font-display text-base font-bold text-[var(--text)]">
            Executing Hybrid RAG Pipeline...
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Tokenizing query → Okapi BM25 Lexical Ranking → Dense Cosine Embedding Search → Reciprocal Rank Fusion (RRF) → Grounded LLM Generation.
          </p>
        </Card>
      )}

      {/* RAG Results Display */}
      {result && !loading && (
        <div className="mt-8 space-y-6">
          {/* Main Answer Card */}
          <Card className="border-2 border-[var(--mint)]/30 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-alt)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[var(--mint)]" />
                <span className="font-display text-sm font-bold text-[var(--text)]">
                  Grounded Intelligence Response
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-[var(--mint)]/10 px-2 py-0.5 font-bold text-[var(--mint)]">
                  Confidence: {result.confidence}
                </span>
                <span className="rounded bg-[var(--azure)]/10 px-2 py-0.5 font-bold text-[var(--azure)]">
                  Impact: {result.market_impact}
                </span>
              </div>
            </div>

            {/* Answer Text with Citation Links */}
            <div className="mt-4 text-sm leading-relaxed text-[var(--text)] whitespace-pre-line font-medium">
              {renderAnswerWithCitations(result.answer, result.passages, setActiveCitation)}
            </div>

            {/* Key Takeaways */}
            {result.takeaways?.length > 0 && (
              <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--gold)] flex items-center gap-1.5">
                  <Sparkles size={14} /> Executive Takeaways
                </h4>
                <ul className="mt-2 space-y-1.5">
                  {result.takeaways.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[var(--text)]">
                      <span className="text-[var(--gold)] font-bold">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Source Passages Grid */}
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--text)] flex items-center gap-2">
              <BookOpen size={18} className="text-[var(--mint)]" /> Retrieved Context Passages ({result.passages.length})
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.passages.map((p) => {
                const isActive = activeCitation === p.citation_id;
                return (
                  <div
                    key={p.citation_id}
                    className={`rounded-xl border p-4 transition-all ${
                      isActive
                        ? 'border-[var(--mint)] bg-[var(--mint)]/10 shadow-lg shadow-[var(--mint)]/10'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border)]/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded bg-[var(--mint)] px-2 py-0.5 font-bold text-[#05130D]">
                        [{p.citation_id}]
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono-data">
                        RRF Score: {p.rrf_score}
                      </span>
                    </div>

                    <h4 className="mt-2.5 font-display text-xs font-bold text-[var(--text)] line-clamp-1">
                      {p.title}
                    </h4>

                    <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                      <span>{p.source_name}</span>
                      <span>•</span>
                      <span>{p.published_at}</span>
                    </div>

                    <p className="mt-2.5 text-xs text-[var(--text-muted)] leading-relaxed line-clamp-4">
                      "{p.text}"
                    </p>

                    <div className="mt-3 border-t border-[var(--border)] pt-2 flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono-data">
                      <span>BM25 Rank: #{p.bm25_rank || 'N/A'}</span>
                      <span>Dense Rank: #{p.dense_rank || 'N/A'} (Sim: {p.dense_similarity})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Retrieval Inspection Telemetry Panel */}
          <Card className="border border-[var(--border)] bg-[var(--surface-alt)]">
            <button
              onClick={() => setShowInspector(!showInspector)}
              className="flex items-center justify-between w-full text-left font-display text-sm font-bold text-[var(--text)]"
            >
              <span className="flex items-center gap-2">
                <Activity size={16} className="text-[var(--azure)]" /> Retrieval Pipeline Inspection Telemetry
              </span>
              {showInspector ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showInspector && result.inspection && (
              <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-4 text-xs font-mono-data">
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                    <div className="text-[10px] text-[var(--text-muted)]">Pipeline Latency</div>
                    <div className="mt-1 text-lg font-bold text-[var(--mint)]">
                      {result.inspection.latency_ms} ms
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                    <div className="text-[10px] text-[var(--text-muted)] font-sans">Indexed Chunks</div>
                    <div className="mt-1 text-lg font-bold text-[var(--text)]">
                      {result.inspection.total_chunks_indexed}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                    <div className="text-[10px] text-[var(--text-muted)] font-sans">BM25 / Dense Matches</div>
                    <div className="mt-1 text-lg font-bold text-[var(--azure)]">
                      {result.inspection.bm25_top_matches} / {result.inspection.dense_top_matches}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                    <div className="text-[10px] text-[var(--text-muted)] font-sans">Embedding Model</div>
                    <div className="mt-1 text-xs font-bold text-[var(--gold)] truncate">
                      {result.inspection.embedding_model}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block mb-1">Expanded Token Vocabulary:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.inspection.expanded_tokens?.map((tok, i) => (
                      <span key={i} className="rounded bg-[var(--surface)] px-2 py-0.5 text-[10px] text-[var(--text)]">
                        {tok}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] text-[var(--text-muted)]">
                  Fusion Algorithm: <strong>{result.inspection.fusion_algorithm}</strong>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Offline Benchmark Evaluation Modal */}
      {showEvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <h3 className="font-display text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <BarChart2 size={20} className="text-[var(--azure)]" /> RAG Retrieval Benchmark Evaluation
              </h3>
              <button
                onClick={() => setShowEvalModal(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Close ✕
              </button>
            </div>

            {evalLoading ? (
              <div className="py-12 text-center">
                <Loader2 size={32} className="mx-auto text-[var(--azure)] animate-spin" />
                <p className="mt-3 text-xs text-[var(--text-muted)]">Computing Recall@5, MRR, and nDCG metrics across benchmark test suite...</p>
              </div>
            ) : evalData ? (
              <div className="mt-4 space-y-6">
                {/* Metrics Summary */}
                <div className="grid gap-3 sm:grid-cols-3 font-mono-data">
                  <div className="rounded-xl border border-[var(--mint)]/40 bg-[var(--mint)]/10 p-4 text-center">
                    <div className="text-[10px] text-[var(--mint)] uppercase font-bold">Mean Recall@5</div>
                    <div className="mt-1 text-3xl font-black text-[var(--mint)]">
                      {(evalData.summary.mean_recall_at_k * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--azure)]/40 bg-[var(--azure)]/10 p-4 text-center">
                    <div className="text-[10px] text-[var(--azure)] uppercase font-bold">Mean Reciprocal Rank (MRR)</div>
                    <div className="mt-1 text-3xl font-black text-[var(--azure)]">
                      {evalData.summary.mean_reciprocal_rank_mrr.toFixed(3)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4 text-center">
                    <div className="text-[10px] text-[var(--gold)] uppercase font-bold font-sans">nDCG@5 Score</div>
                    <div className="mt-1 text-3xl font-black text-[var(--gold)]">
                      {evalData.summary.ndcg_at_k.toFixed(3)}
                    </div>
                  </div>
                </div>

                {/* Benchmark Test Details */}
                <div>
                  <h4 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider mb-2">
                    Query Suite Breakdown ({evalData.summary.num_queries} test cases)
                  </h4>
                  <div className="space-y-2">
                    {evalData.query_details?.map((qd, idx) => (
                      <div key={idx} className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-xs">
                        <div className="font-semibold text-[var(--text)]">{qd.query}</div>
                        <div className="mt-2 flex flex-wrap items-center justify-between text-[10px] text-[var(--text-muted)] font-mono-data">
                          <span>Expected: {qd.relevant_expected.join(', ')}</span>
                          <span className="text-[var(--mint)] font-bold">Recall: {qd.recall} | MRR: {qd.mrr}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Knowledge Index Chunks Modal */}
      {showChunksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <h3 className="font-display text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <Layers size={20} className="text-[var(--gold)]" /> Indexed Knowledge Base Chunks
              </h3>
              <button
                onClick={() => setShowChunksModal(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Close ✕
              </button>
            </div>

            {chunksLoading ? (
              <div className="py-12 text-center">
                <Loader2 size={32} className="mx-auto text-[var(--gold)] animate-spin" />
                <p className="mt-3 text-xs text-[var(--text-muted)]">Fetching document chunks from index...</p>
              </div>
            ) : chunksData ? (
              <div className="mt-4 space-y-3">
                <div className="text-xs text-[var(--text-muted)] mb-2">
                  Total Chunks in Index: <strong>{chunksData.total_chunks}</strong>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                  {chunksData.chunks?.map((c) => (
                    <div key={c.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-alt)] p-3 text-xs">
                      <div className="flex items-center justify-between font-bold text-[var(--text)]">
                        <span>{c.title} (Chunk #{c.chunk_index})</span>
                        <span className="text-[10px] text-[var(--gold)] font-mono-data">{c.source_name}</span>
                      </div>
                      <p className="mt-1.5 text-[var(--text-muted)] leading-relaxed">"{c.text}"</p>
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-mono-data">
                        <span>Tokens: {c.token_count}</span>
                        <span>Model: {c.embedding_model}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function renderAnswerWithCitations(answerText, passages, onHoverCitation) {
  if (!answerText) return null;

  const parts = answerText.split(/(\[\d+\])/g);
  return parts.map((part, index) => {
    const match = part.match(/\[(\d+)\]/);
    if (match) {
      const citId = parseInt(match[1], 10);
      const exists = passages.some((p) => p.citation_id === citId);
      return (
        <sup
          key={index}
          onMouseEnter={() => onHoverCitation(citId)}
          onMouseLeave={() => onHoverCitation(null)}
          className={`inline-block mx-0.5 cursor-pointer rounded px-1.5 py-0.5 text-[10px] font-bold transition-transform hover:scale-110 ${
            exists
              ? 'bg-[var(--mint)] text-[#05130D]'
              : 'bg-[var(--border)] text-[var(--text-muted)]'
          }`}
        >
          [{citId}]
        </sup>
      );
    }
    return part;
  });
}
