import random

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from market import services as market_services

from .models import PredictionTask
from .serializers import PredictionTaskSerializer
from .tasks import run_prediction_task

VALID_TYPES = {"crypto", "gold", "trading"}


class PredictionRequestView(APIView):
    """Kicks off an async prediction task and returns a tracking ID immediately."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        asset_type = request.data.get("asset_type")
        symbol = request.data.get("symbol")
        if not asset_type or not symbol:
            return Response({"error": "asset_type and symbol are required."}, status=400)
        if asset_type not in VALID_TYPES:
            return Response({"error": "asset_type must be crypto, gold, or trading."}, status=400)

        symbol = symbol.upper()
        try:
            if asset_type == "crypto":
                all_coins = market_services.fetch_crypto_prices()
                match = next((c for c in all_coins if c["symbol"] == symbol), None)
                series = match["sparkline"] if match and match.get("sparkline") else [match["price"] if match else 100]
            elif asset_type == "gold":
                gold = market_services.fetch_gold_price()
                series = [gold["price"] * (1 + (random.random() - 0.5) * 0.01) for _ in range(20)]
            else:  # trading
                eqs = market_services.fetch_equity_prices()
                match = next((e for e in eqs if e["symbol"] == symbol), eqs[0] if eqs else {"price": 100})
                series = [match["price"] * (1 + (random.random() - 0.5) * 0.01) for _ in range(20)]
        except Exception as exc:
            return Response({"error": "Failed to queue prediction task.", "detail": str(exc)}, status=502)

        task = PredictionTask.objects.create(asset_type=asset_type, symbol=symbol)
        run_prediction_task.delay(task.pk, symbol, series)

        return Response(
            {"task_id": str(task.task_id), "status": "pending", "poll_url": f"/api/predictions/{task.task_id}"},
            status=202,
        )


class PredictionResultView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        task = PredictionTask.objects.filter(task_id=task_id).first()
        if not task:
            return Response({"error": "Task not found."}, status=404)
        return Response(PredictionTaskSerializer(task).data)
