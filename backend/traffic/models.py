from django.db import models


class TrafficLog(models.Model):
    """
    A single request log entry for the Centralized Traffic Dashboard
    (SRS 3.3.2). No cookies, no third-party scripts - visitor_hash is a
    one-way hash of IP + User-Agent.
    """

    visitor_hash = models.CharField(max_length=32, db_index=True)
    path = models.CharField(max_length=500)
    referrer = models.CharField(max_length=500, null=True, blank=True)
    method = models.CharField(max_length=10)
    status_code = models.PositiveSmallIntegerField()
    latency_ms = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
