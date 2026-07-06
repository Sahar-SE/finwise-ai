import uuid

from django.core.cache import cache
from django.db import models


class Survey(models.Model):
    """
    Public testimonial / feedback submission (SRS Section 4.1 Survey Entity
    Data Contract + Section 3.3.3 Survey Moderation Workflow Engine).
    """

    class MarketFocus(models.TextChoices):
        CRYPTO = "crypto", "Crypto"
        GOLD = "gold", "Gold"
        TRADING = "trading", "Trading"

    submission_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    username = models.CharField(max_length=50)
    rating_score = models.PositiveSmallIntegerField()
    qualitative_feedback = models.CharField(max_length=1000)
    primary_market_focus = models.CharField(max_length=10, choices=MarketFocus.choices)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.username} · {self.rating_score}★ · {'published' if self.is_published else 'pending'}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # "Cache Cleared Automatically" step in the SRS moderation workflow diagram.
        cache.delete("published_surveys")
