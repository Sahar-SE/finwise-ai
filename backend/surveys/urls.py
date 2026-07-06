from django.urls import path

from .views import SurveyPublishedView, SurveySubmitView

urlpatterns = [
    path("", SurveySubmitView.as_view(), name="survey-submit"),
    path("published", SurveyPublishedView.as_view(), name="survey-published"),
]
