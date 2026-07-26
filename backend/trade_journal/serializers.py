from rest_framework import serializers

from .models import JournalEntry


class JournalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = [
            "entry_id", "action", "symbol", "asset_type",
            "entry_price", "exit_price", "volume",
            "emotion", "outcome", "notes", "created_at",
        ]
        read_only_fields = ["entry_id", "created_at"]
