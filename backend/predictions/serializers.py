from rest_framework import serializers

from .models import PredictionTask


class PredictionTaskSerializer(serializers.ModelSerializer):
    task_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = PredictionTask
        fields = ["task_id", "asset_type", "symbol", "status", "result_json", "created_at", "completed_at"]
