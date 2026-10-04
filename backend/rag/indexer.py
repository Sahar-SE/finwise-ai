"""
RAG Knowledge Base Indexer.

Indexes source materials (newsletters and static finance docs) into DocumentChunks.
Caches pre-tokenized docs and vectors in memory for sub-10ms retrieval.
"""

import hashlib
import time
from . import conf
from .bm25 import BM25Index
from .embeddings import dot, preferred_embedder
from .models import DocumentChunk
from .text import chunk_text, tokenize


# Static finance knowledge base docs for depth & domain context
STATIC_KNOWLEDGE_DOCS = [
    {
        "id": "doc-kb-001",
        "title": "Macroeconomic Indicators & Interest Rate Cycles",
        "category": "macro",
        "source_name": "FinWise Academy",
        "published_at": "Core Guide",
        "content": (
            "Macroeconomic policy is heavily dictated by central bank interest rate decisions and liquidity metrics. "
            "When the Federal Reserve initiates a dovish rate pivot or quantitative easing (QE), borrowing costs fall, "
            "expanding money supply (M2) and pushing capital from low-yield treasuries into risk-on assets such as "
            "technology equities, Bitcoin, and commodities.\n\n"
            "Conversely, hawkish rate hikes and central bank balance sheet runoff (Quantitative Tightening) restrict "
            "market liquidity. Traders monitor the US Dollar Index (DXY), 2-year vs 10-year Treasury yield curve inversions, "
            "and Core PCE inflation prints to anticipate economic regime shifts."
        ),
    },
    {
        "id": "doc-kb-002",
        "title": "Crypto Market Structure, Halving Cycles & ETF Flows",
        "category": "crypto",
        "source_name": "Digital Asset Intelligence",
        "published_at": "Core Guide",
        "content": (
            "Bitcoin operating cycles are defined by programmatic supply halving events occurring roughly every 4 years. "
            "Halvings reduce block emission rewards by 50%, introducing structural supply illiquidity.\n\n"
            "The approval of Spot Bitcoin and Ethereum ETFs introduced direct institutional custody, connecting traditional wealth management "
            "pipes directly to on-chain liquidity. Key metrics to monitor include Spot ETF net daily inflows, exchange reserve drawdowns, "
            "and derivatives funding rates to evaluate leverage risks."
        ),
    },
    {
        "id": "doc-kb-003",
        "title": "Behavioral Finance & Emotion Management in Trading",
        "category": "coaching",
        "source_name": "Behavioral Edge Research",
        "published_at": "Core Guide",
        "content": (
            "Retail traders frequently fall victim to cognitive biases including FOMO (Fear Of Missing Out) and Revenge Trading. "
            "FOMO entries usually occur at late-stage breakout peaks, leading to poor risk/reward ratios. Revenge trading occurs "
            "immediately after a losing trade when emotional distress overrides pre-defined risk parameters.\n\n"
            "Systematic trading discipline requires pre-defining stop-loss levels, position sizing relative to total portfolio risk (1-2% max), "
            "and maintaining a structured trade journal to identify edge leaks."
        ),
    },
    {
        "id": "doc-kb-004",
        "title": "Precious Metals & Central Bank Reserve Diversification",
        "category": "gold",
        "source_name": "Global Macro Reserve Report",
        "published_at": "Core Guide",
        "content": (
            "Physical gold (XAU/USD) acts as the primary sovereign hedge against fiat currency debasement and geopolitical risks. "
            "Central banks accumulate gold bullion during periods of heightened sovereign debt and currency instability.\n\n"
            "Gold exhibits negative historical correlation with real Treasury yields. When real yields fall or central bank demand surges, "
            "precious metals establish multi-year bull cycles."
        ),
    },
]


class InMemRAGIndex:
    """In-memory search structures refreshed on re-indexing."""

    def __init__(self):
        self.chunks = []            # list of DocumentChunk instances
        self.tokenized_chunks = []  # list of tokenized list of str
        self.bm25_index = None
        self.embedding_model_name = None
        self.last_built = 0

    def build(self, chunks):
        self.chunks = list(chunks)
        self.tokenized_chunks = [tokenize(f"{c.title} {c.text}") for c in self.chunks]
        self.bm25_index = BM25Index(self.tokenized_chunks)
        if self.chunks:
            self.embedding_model_name = self.chunks[0].embedding_model
        self.last_built = time.time()

    def is_valid(self):
        return self.bm25_index is not None and len(self.chunks) > 0


_MEM_INDEX = InMemRAGIndex()


def get_in_memory_index():
    if not _MEM_INDEX.is_valid():
        sync_index()
    return _MEM_INDEX


def _hash_text(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sync_index(force=False):
    """
    Reads newsletters and static docs, chunks them, computes embeddings using preferred embedder,
    persists chunks to database, and builds the in-memory retrieval structures.
    """
    from news.services import get_all_newsletters

    news_items = get_all_newsletters()
    embedder = preferred_embedder()

    raw_sources = []
    for item in news_items:
        raw_sources.append({
            "source_type": "news",
            "source_id": item["id"],
            "title": item["title"],
            "category": item.get("category", "macro"),
            "source_name": item.get("source", "FinWise Digest"),
            "published_at": item.get("published_at", "Today"),
            "content": f"{item.get('summary', '')}\n\n{item.get('content', '')}",
        })

    for item in STATIC_KNOWLEDGE_DOCS:
        raw_sources.append({
            "source_type": "doc",
            "source_id": item["id"],
            "title": item["title"],
            "category": item.get("category", "general"),
            "source_name": item.get("source_name", "FinWise KB"),
            "published_at": item.get("published_at", "Core Guide"),
            "content": item["content"],
        })

    # Prepare chunks to index
    chunks_to_create = []
    for src in raw_sources:
        text_chunks = chunk_text(src["content"])
        for idx, text in enumerate(text_chunks):
            ch_hash = _hash_text(f"{src['title']}|{text}")
            chunks_to_create.append({
                "source_type": src["source_type"],
                "source_id": src["source_id"],
                "chunk_index": idx,
                "title": src["title"],
                "category": src["category"],
                "source_name": src["source_name"],
                "published_at": src["published_at"],
                "text": text,
                "token_count": len(tokenize(text)),
                "content_hash": ch_hash,
            })

    # Check database to see if we need embedding recomputation
    existing_map = {
        (c.source_type, c.source_id, c.chunk_index): c
        for c in DocumentChunk.objects.all()
    }

    pending_texts = []
    pending_items = []
    db_objects = []

    for item in chunks_to_create:
        key = (item["source_type"], item["source_id"], item["chunk_index"])
        existing = existing_map.get(key)
        if (
            not force
            and existing
            and existing.content_hash == item["content_hash"]
            and existing.embedding_model == embedder.name
            and len(existing.embedding) > 0
        ):
            db_objects.append(existing)
        else:
            pending_items.append(item)
            pending_texts.append(f"{item['title']} - {item['text']}")

    if pending_items:
        embeddings = embedder.embed_documents(pending_texts)
        for item, emb in zip(pending_items, embeddings):
            obj, _ = DocumentChunk.objects.update_or_create(
                source_type=item["source_type"],
                source_id=item["source_id"],
                chunk_index=item["chunk_index"],
                defaults={
                    "title": item["title"],
                    "category": item["category"],
                    "source_name": item["source_name"],
                    "published_at": item["published_at"],
                    "text": item["text"],
                    "token_count": item["token_count"],
                    "content_hash": item["content_hash"],
                    "embedding": emb,
                    "embedding_model": embedder.name,
                },
            )
            db_objects.append(obj)

    # Clean up stale chunks
    current_keys = {(c["source_type"], c["source_id"], c["chunk_index"]) for c in chunks_to_create}
    for key, chunk_obj in existing_map.items():
        if key not in current_keys:
            chunk_obj.delete()

    _MEM_INDEX.build(db_objects)
    return len(db_objects)
