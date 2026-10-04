# FinWise-AI — Product Requirements Document (PRD)

## 1. Executive Summary
**FinWise-AI** is an enterprise-grade financial market intelligence platform for retail investors. It solves information overload and emotional trading bias by integrating real-time market feeds, quantitative indicator forecasting, macroeconomic stress testing, behavioral finance journaling, and a production-grade **Hybrid Retrieval-Augmented Generation (RAG)** engine.

---

## 2. Target Persona & User Stories

### Target User
Retail crypto and equity investors, active swing traders, and self-directed wealth managers seeking grounded data-driven market clarity.

### Primary User Stories
- **US-1 (Market Intelligence Q&A)**: As a trader, I want to ask natural language questions about macro events (e.g., Fed interest rate pivots, Bitcoin halving, semiconductor backlogs) and receive answers grounded *strictly* in verified financial news and knowledge base documents with inline citations (`[1]`, `[2]`).
- **US-2 (Retrieval Transparency & Inspection)**: As an engineer or technical user, I want to inspect the RAG pipeline telemetry (latency, token expansion, BM25 rank vs dense similarity, RRF score) to verify retrieval relevance.
- **US-3 (Offline Benchmark Evaluation)**: As an AI system administrator, I want an offline evaluation harness to measure Recall@k, MRR, and nDCG metrics across standard benchmark query suites.
- **US-4 (Portfolio Stress Testing)**: As a portfolio holder, I want to simulate macroeconomic shock scenarios (e.g., Crypto Winter, Fed 100bps Rate Hike) on my actual holdings to receive actionable AI hedging steps.
- **US-5 (Behavioral Finance Coaching)**: As a trader, I want my trade journal entries analyzed for emotional biases (FOMO, Revenge Trading) and given a quantitative Discipline Score with automated coaching.

---

## 3. Product Features & System Scope

| Feature Module | Description | Technical Implementation |
|---|---|---|
| **1. Hybrid RAG Intelligence** | Dual-retrieval engine combining Okapi BM25 and Dense Vectors fused via Reciprocal Rank Fusion (RRF). | Django REST, Gemini `gemini-embedding-001`, Inverted Index, Local Hashing Embedder fallback. |
| **2. Pipeline Inspection & Telemetry** | Real-time panel exposing retrieval latency, token expansion, BM25 vs Dense scores. | React Inspector Component, JSON metadata payloads. |
| **3. RAG Benchmark Evaluator** | Automated evaluation suite measuring Recall@5, MRR, and nDCG@5. | Django Management Command (`rag_eval`) & API endpoint (`/api/rag/eval`). |
| **4. Multi-Horizon Predictions** | Technical indicator ensemble (RSI, MACD, EMAs, Bollinger) + Monte Carlo forecasts. | Python Quantitative Engine, G4F / Gemini synthesis. |
| **5. AI Newsletter Digest** | Curates fresh digests and generates executive takeaways. | Django News app, structured JSON schemas. |
| **6. AI Macro Stress Test** | Shock simulation on portfolio holdings with drawdown calculations. | Weighted multiplier matrix + AI hedge generator. |
| **7. Behavioral Trade Journal** | Emotional bias detector and discipline scoring engine. | Django DRF models, pattern recognition rules, LLM coaching. |
| **8. Investor Persona Advisor** | Persona-based portfolio review (Buffett, Soros, Wood, Dalio, Lynch). | Dynamic system prompting with user holding injection. |
| **9. Portfolio Time Machine** | Historical entry coordinate simulator (COVID bottom, BTC halving). | Historical price coordinate engine. |

---

## 4. Non-Functional & Technical Requirements

### 4.1 Performance & Latency SLAs
- **RAG Retrieval Latency**: Sub-15 ms for BM25 + Dense vector search in-memory index.
- **End-to-End RAG Q&A**: Sub-2.5 seconds (including LLM generation).
- **Public API Caching**: Sub-45 ms response time for cached public endpoints.

### 4.2 Reliability & Fallbacks
- **Zero-Config Deployment**: Works out of the box without external database or vector search dependencies (uses SQLite in development, Neon Postgres in production, and local feature hashing embedder fallback if API keys are absent).
- **Graceful LLM Degradation**: Multi-tier LLM fallback chain: Google Gemini 1.5 Flash API $\rightarrow$ OpenAI API $\rightarrow$ Keyless G4F client $\rightarrow$ Deterministic Rule-Based Synthesizer.

### 4.3 Data Integrity & Security
- **JWT Authentication**: Secure HttpOnly cookies or Bearer headers.
- **Privacy Boundary**: User trade journals and portfolio holdings are strictly scoped per user and never shared across tenants.

---

## 5. RAG System Specifications

### Chunking Strategy
- **Sentence-Aware Packing**: Sentence boundaries are preserved. Chunks target ~60 words with a 1-sentence overlap between consecutive chunks.

### Lexical Retriever (BM25)
- **Algorithm**: Okapi BM25 with Lucene positive IDF formulation:
  $$\text{IDF}(t) = \ln\left(1 + \frac{N - \text{df}(t) + 0.5}{\text{df}(t) + 0.5}\right)$$
- **Parameters**: $k_1 = 1.5$, $b = 0.75$.
- **Tokenizer**: Lowercasing, compound splitting (`layer-2` $\rightarrow$ `layer`, `2`), ticker expansion (`BTC` $\rightarrow$ `bitcoin`), stopword filtering, and suffix stemming.

### Dense Vector Retriever
- **Embedding Model**: Google `gemini-embedding-001` (Matryoshka representation truncated to 768 dimensions and L2 re-normalized).
- **Similarity Metric**: Cosine similarity ($A \cdot B$ over normalized vectors).

### Fusion (Reciprocal Rank Fusion - RRF)
- **Formula**:
  $$\text{RRF\_Score}(d) = \sum_{m \in \{\text{BM25}, \text{Dense}\}} \frac{1}{k + r_m(d)} \quad (k=60)$$

---

## 6. API Endpoint Contracts

- `POST /api/rag/ask`: Processes user query, runs hybrid retrieval, fuses candidates, and returns grounded answer with citations and inspection telemetry.
- `GET /api/rag/chunks`: Returns list of all indexed document chunks in the knowledge base.
- `GET /api/rag/eval`: Runs the offline evaluation harness and returns Recall@k, MRR, and nDCG@k metrics.
- `POST /api/rag/sync`: Forces re-chunking and re-embedding of the knowledge corpus.
