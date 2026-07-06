from django.contrib import admin

from .models import TrafficLog


@admin.register(TrafficLog)
class TrafficLogAdmin(admin.ModelAdmin):
    list_display = ("path", "method", "status_code", "latency_ms", "created_at")
    list_filter = ("method", "status_code")
    readonly_fields = [f.name for f in TrafficLog._meta.fields]

    def has_add_permission(self, request):
        return False
