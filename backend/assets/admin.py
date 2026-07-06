from django.contrib import admin

from .models import Asset


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ("user", "asset_type", "symbol", "volume", "avg_buy_price", "buy_timestamp")
    list_filter = ("asset_type",)
    search_fields = ("symbol", "user__username")
