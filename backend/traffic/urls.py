from django.urls import path

from .views import TrafficSummaryView

urlpatterns = [
    path("summary", TrafficSummaryView.as_view(), name="traffic-summary"),
]
