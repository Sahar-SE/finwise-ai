"""
Embedding providers.

* ``GeminiEmbedder``  - Google ``gemini-embedding-001`` via REST, asymmetric task
  types (RETRIEVAL_DOCUMENT vs RETRIEVAL_QUERY), Matryoshka-truncated to 768
  dims and re-normalised (truncated MRL vectors are NOT unit length).
* ``HashingEmbedder`` - zero-dependency local fallback: signed feature hashing
  of word unigrams, bigrams and character 4-grams. Char n-grams give it fuzzy
  sub-word matching that BM25 lacks, so hybrid fusion still adds signal.

Vectors from different models live in different spaces, so every stored chunk
records ``embedding_model`` and queries are always embedded with the same model.
"""

import hashlib
import math

import requests

from . import conf
from .text import tokenize


class EmbeddingError(RuntimeError):
    pass


def l2_normalize(vec):
    norm = math.sqrt(sum(v * v for v in vec))
    return [v / norm for v in vec] if norm else vec


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


class HashingEmbedder:
    name = "local-hashing-v1"
    dim = conf.LOCAL_EMBED_DIM
    min_similarity = conf.LOCAL_MIN_SIMILARITY

    def _features(self, text):
        tokens = tokenize(text)
        for tok in tokens:
            yield tok, 1.0
            padded = f"#{tok}#"
            for i in range(len(padded) - 3):
                yield "c:" + padded[i : i + 4], 0.35
        for a, b in zip(tokens, tokens[1:]):
            yield f"b:{a}_{b}", 0.75

    def _embed(self, text):
        vec = [0.0] * self.dim
        for feature, weight in self._features(text):
            # blake2b, not hash(): Python's hash() is salted per process, which would make
            # vectors written by one gunicorn worker unreadable by another.
            h = int.from_bytes(hashlib.blake2b(feature.encode(), digest_size=8).digest(), "big")
            vec[h % self.dim] += weight if (h >> 63) & 1 else -weight
        return l2_normalize(vec)

    def embed_documents(self, texts):
        return [self._embed(t) for t in texts]

    def embed_query(self, text):
        return self._embed(text)


class GeminiEmbedder:
    min_similarity = conf.GEMINI_MIN_SIMILARITY

    def __init__(self, api_key, model=None, dim=None):
        self.api_key = api_key
        self.model = model or conf.GEMINI_EMBED_MODEL
        self.dim = dim or conf.EMBED_DIM
        self.name = f"gemini:{self.model}@{self.dim}"

    def _batch(self, texts, task_type):
        url = f"{conf.GEMINI_API_BASE}/models/{self.model}:batchEmbedContents"
        payload = {
            "requests": [
                {
                    "model": f"models/{self.model}",
                    "content": {"parts": [{"text": t}]},
                    "taskType": task_type,
                    "outputDimensionality": self.dim,
                }
                for t in texts
            ]
        }
        try:
            resp = requests.post(url, json=payload, headers={"x-goog-api-key": self.api_key}, timeout=20)
        except requests.RequestException as exc:
            raise EmbeddingError(f"Gemini embedding request failed: {exc}") from exc
        if resp.status_code != 200:
            raise EmbeddingError(f"Gemini embedding HTTP {resp.status_code}: {resp.text[:200]}")
        try:
            vectors = [e["values"] for e in resp.json()["embeddings"]]
        except (KeyError, ValueError) as exc:
            raise EmbeddingError("Malformed Gemini embedding response") from exc
        if len(vectors) != len(texts):
            raise EmbeddingError("Gemini returned a different number of embeddings than requested")
        return [l2_normalize(v) for v in vectors]

    def embed_documents(self, texts):
        out = []
        for i in range(0, len(texts), conf.EMBED_BATCH_SIZE):
            out.extend(self._batch(texts[i : i + conf.EMBED_BATCH_SIZE], "RETRIEVAL_DOCUMENT"))
        return out

    def embed_query(self, text):
        return self._batch([text], "RETRIEVAL_QUERY")[0]


def preferred_embedder():
    """Gemini when a key is configured, otherwise the local hashing embedder."""
    key = conf.gemini_key()
    return GeminiEmbedder(key) if key else HashingEmbedder()


def embedder_for(model_name):
    """Return an embedder able to produce query vectors compatible with an index built by ``model_name``."""
    if model_name == HashingEmbedder.name:
        return HashingEmbedder()
    key = conf.gemini_key()
    if model_name and model_name.startswith("gemini:") and key:
        model, _, dim = model_name[len("gemini:"):].partition("@")
        return GeminiEmbedder(key, model=model, dim=int(dim) if dim.isdigit() else None)
    return None
