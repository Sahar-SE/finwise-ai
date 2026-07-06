import csv
import io
import json

from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Asset
from .serializers import AssetSerializer

VALID_TYPES = {c[0] for c in Asset.AssetType.choices}


class AssetListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Asset.objects.filter(user=request.user)
        return Response({"data": AssetSerializer(qs, many=True).data})

    def post(self, request):
        serializer = AssetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        asset = serializer.save(user=request.user)
        return Response({"data": AssetSerializer(asset).data}, status=status.HTTP_201_CREATED)


class AssetDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_object(self, request, pk):
        return Asset.objects.filter(pk=pk, user=request.user).first()

    def put(self, request, pk):
        asset = self._get_object(request, pk)
        if not asset:
            return Response({"error": "Asset not found."}, status=404)
        serializer = AssetSerializer(asset, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": serializer.data})

    def delete(self, request, pk):
        asset = self._get_object(request, pk)
        if not asset:
            return Response({"error": "Asset not found."}, status=404)
        asset.delete()
        return Response({"message": "Deleted."})


class AssetImportView(APIView):
    """Bulk CSV/JSON transaction history ingestion (SRS REQ-FE-003)."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": 'A file field named "file" is required.'}, status=400)

        raw = file_obj.read().decode("utf-8").strip()
        rows = []
        try:
            if file_obj.name.endswith(".json") or raw.startswith("["):
                rows = json.loads(raw)
            else:
                reader = csv.DictReader(io.StringIO(raw))
                rows = [{k.strip().lower(): (v or "").strip() for k, v in row.items()} for row in reader]
        except Exception as exc:
            return Response({"error": "Could not parse file. Expected CSV or JSON array.", "detail": str(exc)}, status=400)

        imported, errors = 0, []
        for row in rows:
            required = ["asset_type", "symbol", "volume", "avg_buy_price", "buy_timestamp"]
            if not all(row.get(f) for f in required):
                errors.append({"row": row, "reason": "missing required field(s)"})
                continue
            if row["asset_type"] not in VALID_TYPES:
                errors.append({"row": row, "reason": "invalid asset_type"})
                continue
            try:
                Asset.objects.create(
                    user=request.user,
                    asset_type=row["asset_type"],
                    symbol=str(row["symbol"]).upper(),
                    volume=row["volume"],
                    avg_buy_price=row["avg_buy_price"],
                    buy_timestamp=row["buy_timestamp"],
                )
                imported += 1
            except Exception as exc:
                errors.append({"row": row, "reason": str(exc)})

        return Response({"imported": imported, "failed": len(errors), "errors": errors})
