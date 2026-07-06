from django.contrib import admin

from .models import SeoMeta


@admin.register(SeoMeta)
class SeoMetaAdmin(admin.ModelAdmin):
    list_display = ("path", "title", "updated_at")
    search_fields = ("path", "title")
