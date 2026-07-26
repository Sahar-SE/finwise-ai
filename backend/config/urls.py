from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.utils import timezone


def health(request):
    return JsonResponse({"status": "ok", "service": "FinWise-AI Backend (Django)", "time": timezone.now().isoformat()})


urlpatterns = [
    path("admin/", admin.site.urls),  # Django Admin Moderation Panel (SRS 3.3.3)
    path("api/health", health),
    path("api/auth/", include("users.urls")),
    path("api/market/", include("market.urls")),
    path("api/assets", include("assets.urls")),
    path("api/assets/", include("assets.urls")),
    path("api/predictions/", include("predictions.urls")),
    path("api/surveys/", include("surveys.urls")),
    path("api/admin/", include("adminpanel.urls")),
    path("api/news/", include("news.urls")),
    path("", include("seo.urls")),  # exposes /sitemap.xml and /robots.txt at root
]

admin.site.site_header = "FinWise-AI Administration"
admin.site.site_title = "FinWise-AI Admin"
admin.site.index_title = "Moderation & Platform Controls"
