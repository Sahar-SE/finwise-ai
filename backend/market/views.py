from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services


class CryptoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            return Response({"data": services.fetch_crypto_prices()})
        except Exception as exc:
            return Response({"error": "Failed to fetch live crypto data.", "detail": str(exc)}, status=502)


class GoldView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            return Response({"data": services.fetch_gold_price()})
        except Exception as exc:
            return Response({"error": "Failed to fetch gold data.", "detail": str(exc)}, status=502)


class EquitiesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            return Response({"data": services.fetch_equity_prices()})
        except Exception as exc:
            return Response({"error": "Failed to fetch equity data.", "detail": str(exc)}, status=502)


class OverviewView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            crypto = services.fetch_crypto_prices()
            gold = services.fetch_gold_price()
            equities = services.fetch_equity_prices()
            return Response({"crypto": crypto[:10], "gold": gold, "equities": equities})
        except Exception as exc:
            return Response({"error": "Failed to fetch market overview.", "detail": str(exc)}, status=502)
