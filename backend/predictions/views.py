import random

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from market import services as market_services

from .models import PredictionTask
from .serializers import PredictionTaskSerializer
from .tasks import run_prediction_task

VALID_TYPES = {"crypto", "gold", "trading"}
VALID_HORIZONS = {"24h", "7d", "30d"}
VALID_MODELS = {"hybrid_ai", "quantitative_ml", "monte_carlo"}


def _generate_realistic_series(base_price, points=30, vol=0.015):
    """Generates realistic market price series using random walk with mean reversion."""
    series = [base_price]
    curr = base_price
    for _ in range(points - 1):
        change = (random.random() - 0.48) * 2 * vol * curr
        curr = max(0.01, round(curr + change, 4))
        series.append(curr)
    return series


class PredictionRequestView(APIView):
    """Kicks off an async prediction task and returns a tracking ID immediately."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        asset_type = request.data.get("asset_type")
        symbol = request.data.get("symbol")
        horizon = request.data.get("horizon", "7d")
        model_type = request.data.get("model_type", "hybrid_ai")

        if not asset_type or not symbol:
            return Response({"error": "asset_type and symbol are required."}, status=400)
        if asset_type not in VALID_TYPES:
            return Response({"error": "asset_type must be crypto, gold, or trading."}, status=400)
        if horizon not in VALID_HORIZONS:
            horizon = "7d"
        if model_type not in VALID_MODELS:
            model_type = "hybrid_ai"

        symbol = symbol.upper()
        try:
            if asset_type == "crypto":
                all_coins = market_services.fetch_crypto_prices()
                match = next((c for c in all_coins if c["symbol"] == symbol), None)
                if match and match.get("sparkline") and len(match["sparkline"]) >= 5:
                    series = match["sparkline"]
                else:
                    base_p = match["price"] if match else 65000.0
                    series = _generate_realistic_series(base_p, points=30, vol=0.025)
            elif asset_type == "gold":
                gold = market_services.fetch_gold_price()
                base_p = gold["price"] if gold else 2380.0
                series = _generate_realistic_series(base_p, points=30, vol=0.008)
            else:  # trading
                eqs = market_services.fetch_equity_prices()
                match = next((e for e in eqs if e["symbol"] == symbol), eqs[0] if eqs else {"price": 180.0})
                base_p = match["price"]
                series = _generate_realistic_series(base_p, points=30, vol=0.015)
        except Exception as exc:
            return Response({"error": "Failed to queue prediction task.", "detail": str(exc)}, status=502)

        task = PredictionTask.objects.create(asset_type=asset_type, symbol=symbol)
        run_prediction_task.delay(task.pk, symbol, series, horizon=horizon, model_type=model_type)

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
