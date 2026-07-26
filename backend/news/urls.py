from django.urls import path

from .views import NewsletterAnalyzeView, NewsletterAskView, NewsletterListView

urlpatterns = [
    path("", NewsletterListView.as_view(), name="newsletter-list"),
    path("analyze", NewsletterAnalyzeView.as_view(), name="newsletter-analyze"),
    path("ask", NewsletterAskView.as_view(), name="newsletter-ask"),
]
