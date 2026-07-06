from django.urls import path

from .views import PredictionRequestView, PredictionResultView

urlpatterns = [
    path("request", PredictionRequestView.as_view(), name="prediction-request"),
    path("<uuid:task_id>", PredictionResultView.as_view(), name="prediction-result"),
]
