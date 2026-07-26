from django.urls import path

from .views import JournalDeleteView, JournalInsightsView, JournalListCreateView

urlpatterns = [
    path("", JournalListCreateView.as_view(), name="journal-list-create"),
    path("insights", JournalInsightsView.as_view(), name="journal-insights"),
    path("<uuid:entry_id>", JournalDeleteView.as_view(), name="journal-delete"),
]
