"""
FinWise-AI Retrieval-Augmented Generation (RAG) engine.

Pipeline:  news corpus -> sentence-aware chunking -> dual index
           (Okapi BM25 lexical index + dense embedding index)
           -> hybrid retrieval fused with Reciprocal Rank Fusion
           -> relevance gate -> grounded, citation-enforced generation.
"""
