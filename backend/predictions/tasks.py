from celery import shared_task
from django.utils import timezone

from .engine import run_prediction_model
from .models import PredictionTask


@shared_task(name="predictions.run_prediction_task")
def run_prediction_task(task_pk, symbol, price_series):
    """
    Celery task: isolates the (potentially expensive) prediction computation
    from the request/response cycle, satisfying the SRS's "Critical
    Architectural Assurance" that any calculation exceeding 200ms must run
    outside the synchronous request lifecycle.
    """
    task = PredictionTask.objects.get(pk=task_pk)
    try:
        result = run_prediction_model(symbol, price_series)
        task.status = PredictionTask.Status.COMPLETE
        task.result_json = result
    except Exception as exc:  # pragma: no cover - defensive
        task.status = PredictionTask.Status.FAILED
        task.result_json = {"error": str(exc)}
    task.completed_at = timezone.now()
    task.save(update_fields=["status", "result_json", "completed_at"])
    return task.status
