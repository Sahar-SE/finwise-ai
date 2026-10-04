"""
RAG Offline Retrieval Evaluation Harness.

Evaluates retrieval quality across a benchmark query dataset calculating:
- Recall@k
- Mean Reciprocal Rank (MRR)
- Normalized Discounted Cumulative Gain (nDCG@k)
"""

import math
import time
from .retriever import retrieve

# Benchmark query set with ground-truth relevant source IDs
BENCHMARK_SUITE = [
    {
        "query": "What is the Fed interest rate policy and DXY impact?",
        "relevant_source_ids": ["news-001", "doc-kb-001"],
    },
    {
        "query": "Bitcoin halving cycles and Spot ETF institutional inflows",
        "relevant_source_ids": ["news-002", "doc-kb-002"],
    },
    {
        "query": "Nvidia tech stocks AI chip order backlogs",
        "relevant_source_ids": ["news-003"],
    },
    {
        "query": "Gold central bank reserves and safe haven demand",
        "relevant_source_ids": ["news-004", "doc-kb-004"],
    },
    {
        "query": "FOMO and revenge trading emotional biases coaching",
        "relevant_source_ids": ["doc-kb-003"],
    },
]


def evaluate_retrieval(top_k=5):
    """Runs retrieval over the benchmark suite and calculates performance metrics."""
    t0 = time.time()
    
    recalls = []
    rr_scores = []
    ndcg_scores = []

    test_results = []

    for test in BENCHMARK_SUITE:
        query = test["query"]
        relevant = set(test["relevant_source_ids"])

        res = retrieve(query, top_k=top_k)
        passages = res["passages"]

        retrieved_ids = [p["source_id"] for p in passages]
        retrieved_set = set(retrieved_ids)

        # Recall@k
        hits = len(relevant.intersection(retrieved_set))
        recall = hits / len(relevant) if relevant else 1.0
        recalls.append(recall)

        # Reciprocal Rank (RR)
        rr = 0.0
        for rank, sid in enumerate(retrieved_ids, 1):
            if sid in relevant:
                rr = 1.0 / rank
                break
        rr_scores.append(rr)

        # nDCG@k
        dcg = 0.0
        for rank, sid in enumerate(retrieved_ids, 1):
            if sid in relevant:
                dcg += 1.0 / math.log2(rank + 1)

        idcg = sum(1.0 / math.log2(rank + 1) for rank in range(1, len(relevant) + 1))
        ndcg = (dcg / idcg) if idcg > 0 else 0.0
        ndcg_scores.append(ndcg)

        test_results.append({
            "query": query,
            "relevant_expected": list(relevant),
            "retrieved_source_ids": retrieved_ids,
            "recall": round(recall, 4),
            "mrr": round(rr, 4),
            "ndcg": round(ndcg, 4),
        })

    avg_recall = round(sum(recalls) / len(recalls), 4) if recalls else 0.0
    avg_mrr = round(sum(rr_scores) / len(rr_scores), 4) if rr_scores else 0.0
    avg_ndcg = round(sum(ndcg_scores) / len(ndcg_scores), 4) if ndcg_scores else 0.0

    return {
        "summary": {
            "num_queries": len(BENCHMARK_SUITE),
            "top_k": top_k,
            "mean_recall_at_k": avg_recall,
            "mean_reciprocal_rank_mrr": avg_mrr,
            "ndcg_at_k": avg_ndcg,
            "benchmark_latency_ms": round((time.time() - t0) * 1000, 2),
        },
        "query_details": test_results,
    }
