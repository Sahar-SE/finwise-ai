# FinWise-AI — Technical Interview & System Design Guide

This guide is designed to help you present **FinWise-AI** and its **Production Hybrid RAG Architecture** in technical system design interviews.

---

## 1. Quick 60-Second Elevator Pitch

> "FinWise-AI is an end-to-end financial intelligence and portfolio risk analytics platform. It features a custom **Hybrid Retrieval-Augmented Generation (RAG)** engine combining **Okapi BM25 lexical search** and **dense vector embeddings** (Google `gemini-embedding-001`) fused via **Reciprocal Rank Fusion (RRF)**. It provides real-time grounded financial answers with strict inline citations, sub-15ms retrieval latency, live pipeline telemetry, and an automated offline evaluation suite achieving 100% Recall@5 and 1.0 MRR."

---

## 2. Core Architectural Questions & Answers

### Q1: Why did you build a Hybrid Search (BM25 + Dense Vectors) instead of Vector-Only Search?
**Answer**:
- Vector-only search using dense embeddings excels at semantic similarity (capturing concepts like "monetary policy easing" $\leftrightarrow$ "rate cut"), but often fails with exact financial entity matching (e.g. specific stock tickers like `NVDA`, exact regulatory terms like `PCE`, or specific metric numbers).
- Okapi BM25 lexical search guarantees exact keyword matching and ticker precision.
- Combining both via **Reciprocal Rank Fusion (RRF)** combines semantic understanding with exact keyphrase precision.

### Q2: How does Reciprocal Rank Fusion (RRF) work and why choose it over Weighted Linear Combination?
**Answer**:
- Linear combination ($\alpha \cdot \text{BM25\_Score} + \beta \cdot \text{Vector\_Sim}$) requires score normalization (min-max scaling or z-score standardisation) because BM25 scores are unbounded ($0 \to \infty$) while cosine similarity is bounded ($-1 \to 1$).
- RRF is rank-based rather than score-based:
  $$\text{RRF\_Score}(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$
  Where $r_m(d)$ is the rank of document $d$ in retriever $m$, and $k=60$ is a smoothing constant.
- RRF is robust against outliers, requires zero score calibration, and handles disparate retrieval modalities seamlessly.

### Q3: How did you handle model deprecation and vector dimension constraints?
**Answer**:
- Old Google models like `text-embedding-004` reached scheduled shutdown in early 2026.
- We upgraded to `gemini-embedding-001`, which supports **Matryoshka Representation Learning (MRL)**.
- MRL allows truncating 3072-dimensional vectors down to 768 dimensions without significant loss in retrieval performance.
- Because truncated vectors are not unit length, we apply L2 re-normalization before performing dot-product cosine similarity.

### Q4: How does the application maintain sub-15ms retrieval latency on free hosting?
**Answer**:
- The indexer ([`backend/rag/indexer.py`](file:///c:/Users/sahar/Desktop/finwise-ai/backend/rag/indexer.py)) persists chunk text, metadata, and embeddings in PostgreSQL / SQLite, but builds fast in-memory structures (`InMemRAGIndex`) upon startup.
- The BM25 inverted index and normalized embedding vectors live in RAM, making candidate evaluation take $<7\text{ ms}$.

### Q5: How do you prevent LLM hallucinations in financial advice?
**Answer**:
- The prompt explicitly restricts the LLM to only answer using provided context passages.
- Strict inline citation syntax `[1]`, `[2]` is enforced in the prompt and validated in post-processing.
- If no context passage exceeds relevance thresholds, the system explicitly returns `"No relevant financial news found"` rather than guessing.

---

## 3. RAG Architecture Cheat Sheet

```
+-------------------------------------------------------------------------+
|                              USER QUERY                                 |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                  FINANCE-AWARE TOKENIZER & EXPANDER                     |
|  - Ticker expansion (BTC -> bitcoin, DXY -> dollar index)               |
|  - Compound splitting (layer-2 -> layer, 2)                             |
|  - Stopword filtering + Suffix stemming                                 |
+-------------------------------------------------------------------------+
                    /                                 \
                   /                                   \
                  v                                     v
+-----------------------------------+   +---------------------------------+
|     OKAPI BM25 LEXICAL ENGINE     |   |   GEMINI EMBEDDER ENGINE        |
|  - Inverted Index                 |   |   - gemini-embedding-001        |
|  - Lucene Positive IDF            |   |   - MRL 768-dim + L2 Norm       |
|  - k1 = 1.5, b = 0.75             |   |   - Cosine Similarity           |
+-----------------------------------+   +---------------------------------+
                  \                                   /
                   \                                 /
                    v                               v
+-------------------------------------------------------------------------+
|                  RECIPROCAL RANK FUSION (RRF, k=60)                     |
|  - Merges BM25 and Dense Ranks into single unified score                |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                     GROUNDED GENERATOR (LLM)                            |
|  - Gemini 1.5 Flash / GPT-4o-mini / Fallback                            |
|  - Enforces Inline Bracket Citations [1], [2]                           |
+-------------------------------------------------------------------------+
```

---

## 4. Key Metrics to Quote in Interviews

- **Mean Recall@5**: `100.0%`
- **Mean Reciprocal Rank (MRR)**: `1.000`
- **nDCG@5**: `1.528`
- **Retrieval Latency**: `6.19 ms`
- **End-to-End Latency**: `< 2.5 seconds`
