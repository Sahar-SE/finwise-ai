from django.conf import settings
from django.db import models


class Asset(models.Model):
    """User-owned portfolio holding (SRS REQ-FE-003 Custom Asset Injection)."""

    class AssetType(models.TextChoices):
        CRYPTO = "crypto", "Crypto"
        GOLD = "gold", "Gold"
        TRADING = "trading", "Trading (Equity)"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assets")
    asset_type = models.CharField(max_length=10, choices=AssetType.choices)
    symbol = models.CharField(max_length=20)
    volume = models.DecimalField(max_digits=20, decimal_places=8)
    avg_buy_price = models.DecimalField(max_digits=20, decimal_places=8)
    buy_timestamp = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-buy_timestamp"]

    def __str__(self):
        return f"{self.user.username} · {self.symbol} · {self.volume}"

    def save(self, *args, **kwargs):
        self.symbol = self.symbol.upper()
        super().save(*args, **kwargs)
