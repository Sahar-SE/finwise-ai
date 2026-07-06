from django.contrib import admin

from .models import PredictionTask


@admin.register(PredictionTask)
class PredictionTaskAdmin(admin.ModelAdmin):
    list_display = ("symbol", "asset_type", "status", "created_at", "completed_at")
    list_filter = ("status", "asset_type")
    readonly_fields = ("task_id", "result_json", "created_at", "completed_at")
