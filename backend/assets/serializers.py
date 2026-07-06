from rest_framework import serializers

from .models import Asset


class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = ["id", "asset_type", "symbol", "volume", "avg_buy_price", "buy_timestamp", "created_at"]
        read_only_fields = ["id", "created_at"]
