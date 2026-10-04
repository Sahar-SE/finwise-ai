"""Okapi BM25 over an inverted index. Pure Python, no dependencies."""

import math
from collections import Counter, defaultdict

from . import conf


class BM25Index:
    """
    score(D, Q) = sum_{t in Q} IDF(t) * tf(t,D) * (k1 + 1) / (tf(t,D) + k1 * (1 - b + b * |D| / avgdl))
    IDF(t)      = ln(1 + (N - df(t) + 0.5) / (df(t) + 0.5))      # always positive (Lucene variant)
    """

    def __init__(self, tokenized_docs, k1=None, b=None):
        self.k1 = conf.BM25_K1 if k1 is None else k1
        self.b = conf.BM25_B if b is None else b
        self.n_docs = len(tokenized_docs)
        self.doc_len = [len(tokens) for tokens in tokenized_docs]
        self.avgdl = (sum(self.doc_len) / self.n_docs) if self.n_docs else 1.0

        self.postings = defaultdict(list)  # term -> [(doc_idx, term_freq)]
        for doc_idx, tokens in enumerate(tokenized_docs):
            for term, freq in Counter(tokens).items():
                self.postings[term].append((doc_idx, freq))

        self.idf = {
            term: math.log(1 + (self.n_docs - len(plist) + 0.5) / (len(plist) + 0.5))
            for term, plist in self.postings.items()
        }

    def search(self, query_tokens, k=10, allowed=None):
        """Return ``[(doc_idx, score), ...]`` best-first. Only documents sharing a term with the query score > 0."""
        scores = defaultdict(float)
        for term in set(query_tokens):
            idf = self.idf.get(term)
            if idf is None:
                continue
            for doc_idx, freq in self.postings[term]:
                if allowed is not None and doc_idx not in allowed:
                    continue
                norm = self.k1 * (1 - self.b + self.b * self.doc_len[doc_idx] / self.avgdl)
                scores[doc_idx] += idf * freq * (self.k1 + 1) / (freq + norm)
        return sorted(scores.items(), key=lambda kv: kv[1], reverse=True)[:k]
