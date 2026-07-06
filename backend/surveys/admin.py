from django.contrib import admin
from django.utils.html import format_html

from .models import Survey


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    """
    Implements the SRS 3.3.3 Survey Moderation Workflow directly in the
    Django Admin Moderation Panel: every submission lands here with
    is_published=False, and staff triage it with the Approve/Reject actions
    below (Survey.save() clears the published-surveys cache automatically).
    """

    list_display = ("username", "rating_score", "primary_market_focus", "status_badge", "created_at")
    list_filter = ("is_published", "primary_market_focus", "rating_score")
    search_fields = ("username", "qualitative_feedback")
    readonly_fields = ("submission_id", "created_at")
    actions = ["approve_surveys", "reject_surveys"]

    @admin.display(description="Status")
    def status_badge(self, obj):
        color = "#0F9D6B" if obj.is_published else "#B9862E"
        label = "Published" if obj.is_published else "Pending review"
        return format_html('<span style="color:{}; font-weight:600;">{}</span>', color, label)

    @admin.action(description="Approve & publish selected submissions")
    def approve_surveys(self, request, queryset):
        updated = queryset.update(is_published=True)
        for survey in queryset:
            survey.save()  # trigger cache clear per submission
        self.message_user(request, f"{updated} submission(s) approved and published.")

    @admin.action(description="Reject (flag inactive) selected submissions")
    def reject_surveys(self, request, queryset):
        updated = queryset.update(is_published=False)
        for survey in queryset:
            survey.save()
        self.message_user(request, f"{updated} submission(s) flagged inactive.")
