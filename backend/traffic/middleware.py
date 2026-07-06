import hashlib
import time

from .models import TrafficLog

EXCLUDED_PREFIXES = ("/static/", "/media/", "/admin/jsi18n/")


class TrafficLoggerMiddleware:
    """
    Lightweight, privacy-friendly traffic tracker (SRS 3.3.2) - no cookies,
    no third-party libraries. Anonymizes IP + User-Agent into a one-way hash
    ("visitor footprint") and records latency for every request.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)

        if not request.path.startswith(EXCLUDED_PREFIXES):
            latency_ms = (time.perf_counter() - start) * 1000
            ip = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip() or request.META.get("REMOTE_ADDR", "")
            ua = request.META.get("HTTP_USER_AGENT", "")
            visitor_hash = hashlib.sha256(f"{ip}{ua}".encode()).hexdigest()[:16]

            try:
                TrafficLog.objects.create(
                    visitor_hash=visitor_hash,
                    path=request.path,
                    referrer=request.META.get("HTTP_REFERER"),
                    method=request.method,
                    status_code=response.status_code,
                    latency_ms=latency_ms,
                )
            except Exception:
                pass  # never let logging break the request lifecycle

        return response
