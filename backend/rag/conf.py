"""Central RAG configuration. Every knob can be overridden through environment variables."""

import os


def _int(name, default):
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _float(name, default):
    try:
        return float(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


# --- Chunking ---
CHUNK_WORDS = _int("RAG_CHUNK_WORDS", 60)               # soft max words per chunk
CHUNK_OVERLAP_SENTENCES = _int("RAG_CHUNK_OVERLAP", 1)  # sentences carried into the next chunk

# --- Retrieval ---
CANDIDATE_K = _int("RAG_CANDIDATE_K", 20)  # candidates pulled from EACH retriever before fusion
TOP_K = _int("RAG_TOP_K", 5)               # passages handed to the generator
MAX_TOP_K = 8
RRF_K = _int("RAG_RRF_K", 60)              # RRF damping constant (Cormack et al., 2009)
BM25_K1 = _float("RAG_BM25_K1", 1.5)
BM25_B = _float("RAG_BM25_B", 0.75)

# --- Embeddings ---
GEMINI_EMBED_MODEL = os.environ.get("RAG_GEMINI_EMBED_MODEL", "gemini-embedding-001")
EMBED_DIM = _int("RAG_EMBED_DIM", 768)     # Matryoshka-truncated dimension
EMBED_BATCH_SIZE = 100                     # Gemini batchEmbedContents limit
GEMINI_MIN_SIMILARITY = _float("RAG_GEMINI_MIN_SIM", 0.55)
LOCAL_EMBED_DIM = 1024
LOCAL_MIN_SIMILARITY = _float("RAG_LOCAL_MIN_SIM", 0.12)

# --- Generation ---
GEMINI_CHAT_MODEL = os.environ.get("RAG_GEMINI_CHAT_MODEL", "gemini-2.5-flash")
OPENAI_CHAT_MODEL = os.environ.get("RAG_OPENAI_CHAT_MODEL", "gpt-4o-mini")
ENABLE_G4F = os.environ.get("RAG_ENABLE_G4F", "True") == "True"
LLM_TIMEOUT = _int("RAG_LLM_TIMEOUT", 12)
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"


def gemini_key():
    return os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")


def openai_key():
    return os.environ.get("OPENAI_API_KEY")
