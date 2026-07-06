from django.urls import path

from .views import RobotsView, SitemapView

urlpatterns = [
    path("sitemap.xml", SitemapView.as_view(), name="sitemap"),
    path("robots.txt", RobotsView.as_view(), name="robots"),
]
