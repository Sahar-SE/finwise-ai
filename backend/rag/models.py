from django.db import models


class DocumentChunk(models.Model):
    """
    One retrievable passage. Embeddings are stored as JSON so the index works
    identically on SQLite (dev) and Neon Postgres (prod) with no extensions.
    """

    source_type = models.CharField(max_length=32, default="news", db_index=True)
    source_id = models.CharField(max_length=64, db_index=True)
    chunk_index = models.PositiveIntegerField()
    title = models.CharField(max_length=300)
    category = models.CharField(max_length=32, blank=True, db_index=True)
    source_name = models.CharField(max_length=120, blank=True)
    published_at = models.CharField(max_length=64, blank=True)
    text = models.TextField()
    token_count = models.PositiveIntegerField(default=0)
    embedding = models.JSONField(default=list)
    embedding_model = models.CharField(max_length=80)
    content_hash = models.CharField(max_length=64)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["source_type", "source_id", "chunk_index"]
        constraints = [
            models.UniqueConstraint(fields=["source_type", "source_id", "chunk_index"], name="rag_unique_chunk"),
        ]

    def __str__(self):
        return f"{self.source_type}:{self.source_id}#{self.chunk_index}"
