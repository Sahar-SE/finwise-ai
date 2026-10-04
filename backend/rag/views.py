"""
RAG API Views.
Exposes endpoints for Grounded RAG Querying, Document Chunk Inspection, Index Syncing, and Offline Retrieval Evaluation.
"""

from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .eval import evaluate_retrieval
from .generator import generate_rag_answer
from .indexer import sync_index
from .models import DocumentChunk
from .retriever import retrieve


class RagAskView(APIView):
    """
    Core RAG Intelligence Q&A endpoint.
    Performs hybrid BM25 + Dense retrieval, fuses with RRF, and generates
    a grounded answer with inline citations and pipeline inspection telemetry.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        question = request.data.get("question")
        category = request.data.get("category", "all")
        top_k = request.data.get("top_k", 5)

        if not question or not question.strip():
            return Response({"error": "question parameter is required."}, status=400)

        # Pull optional user portfolio context if logged in
        user_portfolio = None
        if request.user and request.user.is_authenticated:
            try:
                from assets.models import Asset
                user_assets = Asset.objects.filter(user=request.user)
                if user_assets.exists():
                    user_portfolio = [
                        {"symbol": a.symbol, "volume": float(a.volume), "avg_buy_price": float(a.avg_buy_price)}
                        for a in user_assets
                    ]
            except Exception:
                pass

        # 1. Hybrid Retrieval
        retrieval_res = retrieve(question, category=category, top_k=top_k)
        passages = retrieval_res["passages"]
        inspection = retrieval_res["inspection"]

        # 2. Grounded LLM Generation
        generation_res = generate_rag_answer(question, passages, user_portfolio=user_portfolio)

        return Response({
            "question": question,
            "answer": generation_res["answer"],
            "takeaways": generation_res.get("takeaways", []),
            "market_impact": generation_res.get("market_impact", "NEUTRAL"),
            "confidence": generation_res.get("confidence", "HIGH"),
            "cited_sources": generation_res.get("cited_sources", []),
            "grounded": generation_res.get("grounded", True),
            "passages": passages,
            "inspection": inspection,
        })


class RagChunksView(APIView):
    """Returns list of indexed document chunks for inspection."""
    permission_classes = [AllowAny]

    def get(self, request):
        sync_index()  # Ensure index is populated
        chunks = DocumentChunk.objects.all().order_by("source_type", "source_id", "chunk_index")
        data = [
            {
                "id": c.id,
                "source_type": c.source_type,
                "source_id": c.source_id,
                "chunk_index": c.chunk_index,
                "title": c.title,
                "category": c.category,
                "source_name": c.source_name,
                "published_at": c.published_at,
                "token_count": c.token_count,
                "text": c.text,
                "embedding_model": c.embedding_model,
                "has_embedding": len(c.embedding) > 0,
            }
            for c in chunks
        ]
        return Response({"total_chunks": len(data), "chunks": data})


class RagSyncView(APIView):
    """Admin endpoint to force re-syncing and re-embedding the corpus."""
    permission_classes = [AllowAny]

    def post(self, request):
        force = request.data.get("force", False)
        count = sync_index(force=force)
        return Response({"message": f"Successfully indexed {count} document chunks.", "total_indexed": count})


class RagEvalView(APIView):
    """Returns offline evaluation metrics (Recall@k, MRR, nDCG)."""
    permission_classes = [AllowAny]

    def get(self, request):
        top_k = int(request.query_params.get("top_k", 5))
        sync_index()
        eval_metrics = evaluate_retrieval(top_k=top_k)
        return Response(eval_metrics)
