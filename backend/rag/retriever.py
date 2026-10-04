"""
Hybrid Retriever combining Okapi BM25 Lexical Search with Dense Vector Cosine Similarity
fused via Reciprocal Rank Fusion (RRF).

Includes query expansion and full retrieval pipeline inspection metrics.
"""

import time
from . import conf
from .embeddings import dot, embedder_for
from .indexer import get_in_memory_index
from .text import tokenize


def expand_query(query_text):
    """
    Expands the query text with relevant financial terms/synonyms to maximize recall.
    """
    tokens = tokenize(query_text)
    expanded = set(tokens)
    
    q_lower = query_text.lower()
    if any(k in q_lower for k in ["rate", "fed", "powell", "fomc", "interest"]):
        expanded.update(["federal", "reserve", "inflation", "yield", "dxy", "liquidity"])
    if any(k in q_lower for k in ["crypto", "btc", "bitcoin", "eth", "sol"]):
        expanded.update(["etf", "halving", "inflow", "onchain", "derivatives"])
    if any(k in q_lower for k in ["gold", "metal", "xau", "bullion"]):
        expanded.update(["central", "bank", "reserve", "inflation", "debasement"])
    if any(k in q_lower for k in ["fomo", "revenge", "discipline", "emotion", "bias"]):
        expanded.update(["psychology", "stoploss", "journal", "risk", "coaching"])

    return list(expanded)


def retrieve(query_text, category=None, top_k=None, candidate_k=None):
    """
    Executes hybrid retrieval:
    1. Lexical BM25 ranking over expanded query tokens.
    2. Dense vector embedding cosine similarity search over target model space.
    3. Fusion via Reciprocal Rank Fusion (RRF): score = sum(1 / (k + rank)).
    4. Metadata enrichment and inspection telemetry.
    """
    t0 = time.time()
    top_k = top_k or conf.TOP_K
    top_k = min(top_k, conf.MAX_TOP_K)
    candidate_k = candidate_k or conf.CANDIDATE_K

    index = get_in_memory_index()
    if not index.chunks:
        return {
            "passages": [],
            "inspection": {
                "total_chunks_indexed": 0,
                "latency_ms": round((time.time() - t0) * 1000, 2),
                "error": "Index is empty",
            }
        }

    # Optional category filter
    allowed_indices = None
    if category and category != "all":
        allowed_indices = {
            i for i, chunk in enumerate(index.chunks)
            if chunk.category == category or category in chunk.category
        }

    # 1. BM25 Lexical Retrieval
    expanded_tokens = expand_query(query_text)
    bm25_results = index.bm25_index.search(expanded_tokens, k=candidate_k, allowed=allowed_indices)
    bm25_ranks = {doc_idx: rank + 1 for rank, (doc_idx, score) in enumerate(bm25_results)}

    # 2. Dense Vector Retrieval
    embedder = embedder_for(index.embedding_model_name)
    dense_ranks = {}
    dense_scores = {}
    if embedder:
        try:
            q_vec = embedder.embed_query(query_text)
            vector_scores = []
            for doc_idx, chunk in enumerate(index.chunks):
                if allowed_indices is not None and doc_idx not in allowed_indices:
                    continue
                if chunk.embedding and len(chunk.embedding) == len(q_vec):
                    sim = dot(q_vec, chunk.embedding)
                    vector_scores.append((doc_idx, sim))
            
            vector_scores.sort(key=lambda x: x[1], reverse=True)
            for rank, (doc_idx, sim) in enumerate(vector_scores[:candidate_k]):
                dense_ranks[doc_idx] = rank + 1
                dense_scores[doc_idx] = round(float(sim), 4)
        except Exception:
            pass

    # 3. Reciprocal Rank Fusion (RRF)
    # RRF Score = 1 / (60 + BM25_Rank) + 1 / (60 + Dense_Rank)
    rrf_k = conf.RRF_K
    all_candidate_indices = set(bm25_ranks.keys()).union(set(dense_ranks.keys()))
    
    fused = []
    for doc_idx in all_candidate_indices:
        b_rank = bm25_ranks.get(doc_idx)
        d_rank = dense_ranks.get(doc_idx)
        
        rrf_score = 0.0
        if b_rank:
            rrf_score += 1.0 / (rrf_k + b_rank)
        if d_rank:
            rrf_score += 1.0 / (rrf_k + d_rank)
            
        fused.append({
            "doc_idx": doc_idx,
            "rrf_score": rrf_score,
            "bm25_rank": b_rank,
            "dense_rank": d_rank,
            "dense_similarity": dense_scores.get(doc_idx, 0.0),
        })

    fused.sort(key=lambda x: x["rrf_score"], reverse=True)
    top_candidates = fused[:top_k]

    # Build final passages
    passages = []
    for rank, cand in enumerate(top_candidates, 1):
        chunk = index.chunks[cand["doc_idx"]]
        passages.append({
            "citation_id": rank,
            "chunk_id": chunk.id,
            "source_type": chunk.source_type,
            "source_id": chunk.source_id,
            "title": chunk.title,
            "category": chunk.category,
            "source_name": chunk.source_name,
            "published_at": chunk.published_at,
            "text": chunk.text,
            "rrf_score": round(cand["rrf_score"], 5),
            "bm25_rank": cand["bm25_rank"],
            "dense_rank": cand["dense_rank"],
            "dense_similarity": cand["dense_similarity"],
        })

    latency_ms = round((time.time() - t0) * 1000, 2)

    inspection = {
        "query": query_text,
        "expanded_tokens": expanded_tokens,
        "embedding_model": index.embedding_model_name,
        "total_chunks_indexed": len(index.chunks),
        "candidates_evaluated": len(all_candidate_indices),
        "bm25_top_matches": len(bm25_ranks),
        "dense_top_matches": len(dense_ranks),
        "fusion_algorithm": "Reciprocal Rank Fusion (RRF, k=60)",
        "latency_ms": latency_ms,
    }

    return {
        "passages": passages,
        "inspection": inspection,
    }
