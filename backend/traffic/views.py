from django.db.models import Avg, Count
from django.db.models.functions import TruncHour
from django.utils import timezone
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import TrafficLog


class TrafficSummaryView(APIView):
    """Centralized Traffic Dashboard summary (SRS 3.3.2)."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = TrafficLog.objects.all()
        total_requests = qs.count()
        unique_visitors = qs.values("visitor_hash").distinct().count()
        avg_latency = qs.aggregate(a=Avg("latency_ms"))["a"] or 0

        top_paths = list(
            qs.values("path").annotate(hits=Count("id")).order_by("-hits")[:10]
        )
        top_referrers = list(
            qs.exclude(referrer__isnull=True).values("referrer").annotate(hits=Count("id")).order_by("-hits")[:10]
        )
        status_breakdown = list(
            qs.values("status_code").annotate(count=Count("id")).order_by("status_code")
        )

        since = timezone.now() - timezone.timedelta(days=1)
        hourly = list(
            qs.filter(created_at__gte=since)
            .annotate(hour=TruncHour("created_at"))
            .values("hour")
            .annotate(hits=Count("id"))
            .order_by("hour")
        )
        hourly_last_24h = [{"hour": h["hour"].strftime("%H:00"), "hits": h["hits"]} for h in hourly]

        bounce_visitor_ids = (
            qs.values("visitor_hash").annotate(c=Count("id")).filter(c=1).count()
        )
        bounce_rate = round((bounce_visitor_ids / unique_visitors) * 100, 1) if unique_visitors else 0

        return Response({
            "total_requests": total_requests,
            "unique_visitors": unique_visitors,
            "avg_latency_ms": round(avg_latency, 2),
            "bounce_rate_pct": bounce_rate,
            "top_paths": top_paths,
            "top_referrers": [{"referrer": r["referrer"] or "(direct)", "hits": r["hits"]} for r in top_referrers],
            "status_breakdown": status_breakdown,
            "hourly_last_24h": hourly_last_24h,
        })
