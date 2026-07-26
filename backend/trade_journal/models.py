import uuid

from django.conf import settings
from django.db import models


class JournalEntry(models.Model):
    """
    AI Trade Journal entry — logs trading decisions with emotional state tracking
    for behavioral pattern analysis. Unique feature not found in any competing
    finance app.
    """

    class Action(models.TextChoices):
        BUY = "buy", "Buy / Long"
        SELL = "sell", "Sell / Close"
        SHORT = "short", "Short"
        HOLD = "hold", "Hold (Observation)"

    class Emotion(models.TextChoices):
        CONFIDENT = "confident", "😎 Confident"
        FEARFUL = "fearful", "😰 Fearful"
        FOMO = "fomo", "🔥 FOMO"
        REVENGE = "revenge", "😤 Revenge Trade"
        DISCIPLINED = "disciplined", "🧘 Disciplined"
        GREEDY = "greedy", "🤑 Greedy"
        UNCERTAIN = "uncertain", "🤔 Uncertain"

    class Outcome(models.TextChoices):
        PROFIT = "profit", "Profit ✅"
        LOSS = "loss", "Loss ❌"
        BREAKEVEN = "breakeven", "Breakeven ↔️"
        OPEN = "open", "Still Open 🔄"

    entry_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="journal_entries")
    action = models.CharField(max_length=10, choices=Action.choices)
    symbol = models.CharField(max_length=20)
    asset_type = models.CharField(max_length=10, default="crypto")
    entry_price = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    exit_price = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    volume = models.DecimalField(max_digits=20, decimal_places=8, default=0)
    emotion = models.CharField(max_length=15, choices=Emotion.choices, default=Emotion.DISCIPLINED)
    outcome = models.CharField(max_length=12, choices=Outcome.choices, default=Outcome.OPEN)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} · {self.action} {self.symbol} · {self.emotion}"
