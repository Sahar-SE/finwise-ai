import uuid

from django.db import models


class PredictionTask(models.Model):
    """
    Tracks an asynchronous AI prediction job (SRS REQ-BE-001 / "Critical
    Architectural Assurance"). A Celery task writes its result back into this
    row; the API returns the task_id instantly and the client polls
    GET /api/predictions/<task_id> until status flips to 'complete'.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETE = "complete", "Complete"
        FAILED = "failed", "Failed"

    task_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    asset_type = models.CharField(max_length=10)
    symbol = models.CharField(max_length=20)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    result_json = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.symbol} · {self.status} · {self.task_id}"
