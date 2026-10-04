"""
Text processing: finance-aware tokenization and sentence-aware chunking.

The same tokenizer is used for documents and queries, so ticker aliases
("BTC" -> "bitcoin", "Fed" -> "federal reserve") match in both directions.
"""

import re

from . import conf

STOPWORDS = frozenset(
    """
    a about above after again against all am an and any are as at be because been before being below
    between both but by can could did do does doing down during each few for from further had has have
    having he her here hers herself him himself his how i if in into is it its itself just me more most
    my myself no nor not now of off on once only or other our ours ourselves out over own same she should
    so some such than that the their theirs them themselves then there these they this those through to
    too under until up very was we were what when where which while who whom why will with would you your
    yours yourself yourselves also may might must shall via per vs across amid amidst upon within without
    """.split()
)

# Ticker / jargon normalisation. Applied to documents AND queries.
ALIASES = {
    "btc": ("bitcoin",),
    "eth": ("ethereum",),
    "ether": ("ethereum",),
    "sol": ("solana",),
    "bnb": ("binance",),
    "nvda": ("nvidia",),
    "msft": ("microsoft",),
    "googl": ("alphabet",),
    "goog": ("alphabet",),
    "google": ("alphabet",),
    "amzn": ("amazon",),
    "meta": ("meta",),
    "xau": ("gold",),
    "bullion": ("gold",),
    "usd": ("dollar",),
    "dxy": ("dollar", "index"),
    "fed": ("federal", "reserve"),
    "fomc": ("federal", "reserve"),
    "l2": ("layer", "2"),
    "etfs": ("etf",),
    "chips": ("chip",),
    "semis": ("semiconductor",),
    "crypto": ("crypto",),
    "cryptocurrency": ("crypto",),
    "cryptocurrencies": ("crypto",),
}

_TOKEN_RE = re.compile(r"[a-z0-9]+(?:[.\-/][a-z0-9]+)*")
_COMPOUND_SPLIT_RE = re.compile(r"[-/]")
_SENTENCE_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(\[$])")
_PARAGRAPH_RE = re.compile(r"\n\s*\n")


def stem(token):
    """Very light suffix stripping (plural / gerund / past tense). Deterministic and dependency-free."""
    if len(token) <= 3 or not token.isalpha():
        return token
    if token.endswith("ies") and len(token) > 4:
        return token[:-3] + "y"
    for suffix in ("ing", "ed"):
        if token.endswith(suffix) and len(token) - len(suffix) >= 4:
            return token[: -len(suffix)]
    if token.endswith("s") and not token.endswith(("ss", "us", "is")):
        return token[:-1]
    return token


def tokenize(text):
    """Lowercase, split, expand compounds ("layer-2" -> layer-2, layer, 2), alias, drop stopwords, stem."""
    tokens = []
    for raw in _TOKEN_RE.findall((text or "").lower()):
        candidates = [raw]
        if _COMPOUND_SPLIT_RE.search(raw):
            candidates.extend(p for p in _COMPOUND_SPLIT_RE.split(raw) if p)
        for cand in candidates:
            if cand in STOPWORDS or (len(cand) == 1 and not cand.isdigit()):
                continue
            for term in ALIASES.get(cand, (cand,)):
                tokens.append(stem(term))
    return tokens


def split_sentences(text):
    sentences = []
    for paragraph in _PARAGRAPH_RE.split((text or "").strip()):
        paragraph = " ".join(paragraph.split())
        if paragraph:
            sentences.extend(s.strip() for s in _SENTENCE_RE.split(paragraph) if s.strip())
    return sentences


def chunk_text(text, max_words=None, overlap_sentences=None):
    """
    Greedy sentence packing: sentences are never cut in half, chunks stay under
    ``max_words`` (unless a single sentence is longer), and the last
    ``overlap_sentences`` of each chunk are repeated at the start of the next
    one so facts spanning a boundary remain retrievable.
    """
    max_words = max_words or conf.CHUNK_WORDS
    overlap = conf.CHUNK_OVERLAP_SENTENCES if overlap_sentences is None else overlap_sentences

    chunks, current, count = [], [], 0
    for sentence in split_sentences(text):
        n_words = len(sentence.split())
        if current and count + n_words > max_words:
            chunks.append(" ".join(current))
            current = current[-overlap:] if overlap else []
            count = sum(len(s.split()) for s in current)
            # Drop the overlap if it alone would overflow the next chunk.
            if current and count + n_words > max_words:
                current, count = [], 0
        current.append(sentence)
        count += n_words
    if current:
        chunks.append(" ".join(current))
    return chunks
