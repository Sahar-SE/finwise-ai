from celery import shared_task
from django.utils import timezone

from .engine import run_prediction_model
from .models import PredictionTask


@shared_task(name="predictions.run_prediction_task")
def run_prediction_task(task_pk, symbol, price_series, horizon="7d", model_type="hybrid_ai"):
    """
    Celery task: executes the advanced AI prediction model asynchronously.
    """
    task = PredictionTask.objects.get(pk=task_pk)
    try:
        result = run_prediction_model(symbol, price_series, horizon=horizon, model_type=model_type)
        task.status = PredictionTask.Status.COMPLETE
        task.result_json = result
    except Exception as exc:  # pragma: no cover
        task.status = PredictionTask.Status.FAILED
        task.result_json = {"error": str(exc)}
    task.completed_at = timezone.now()
    task.save(update_fields=["status", "result_json", "completed_at"])
    return task.status
