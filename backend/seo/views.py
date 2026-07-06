from django.conf import settings
from django.http import HttpResponse
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SeoMeta
from .serializers import SeoMetaSerializer


class SeoMetaListCreateView(APIView):
    """Admin CRUD for per-path SEO rules (SRS 3.3.1)."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = SeoMeta.objects.all()
        return Response({"data": SeoMetaSerializer(qs, many=True).data})

    def post(self, request):
        path = request.data.get("path")
        if not path:
            return Response({"error": "path is required."}, status=400)
        obj, _created = SeoMeta.objects.update_or_create(
            path=path,
            defaults={
                "title": request.data.get("title", ""),
                "meta_description": request.data.get("meta_description", ""),
                "og_image": request.data.get("og_image", ""),
                "canonical_uri": request.data.get("canonical_uri", ""),
            },
        )
        return Response({"data": SeoMetaSerializer(obj).data})


class SeoMetaDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        SeoMeta.objects.filter(pk=pk).delete()
        return Response({"message": "Deleted."})


class SitemapView(APIView):
    """Dynamic sitemap.xml generation (SRS 3.3.1 Automatic Sitemaps)."""

    permission_classes = [AllowAny]

    def get(self, request):
        base_url = getattr(settings, "PUBLIC_SITE_URL", "https://example.com")
        rows = SeoMeta.objects.all()
        urls = "".join(
            f"\n  <url>\n    <loc>{base_url}{r.path}</loc>\n    "
            f"<lastmod>{r.updated_at.date().isoformat()}</lastmod>\n  </url>"
            for r in rows
        )
        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            f"{urls}\n</urlset>"
        )
        return HttpResponse(xml, content_type="application/xml")


class RobotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        base_url = getattr(settings, "PUBLIC_SITE_URL", "https://example.com")
        body = f"User-agent: *\nAllow: /\nSitemap: {base_url}/sitemap.xml\n"
        return HttpResponse(body, content_type="text/plain")
