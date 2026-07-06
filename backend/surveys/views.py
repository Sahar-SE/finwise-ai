from django.core.cache import cache
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Survey
from .serializers import SurveyAdminSerializer, SurveyPublicSerializer, SurveySubmitSerializer


class SurveySubmitView(APIView):
    """Public: submit feedback. Always created unpublished, pending moderation."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SurveySubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        survey = serializer.save(is_published=False)
        return Response(
            {"message": "Thank you! Your feedback is pending moderation.", "submission_id": str(survey.submission_id)},
            status=status.HTTP_201_CREATED,
        )


class SurveyPublishedView(APIView):
    """Public: only published testimonials, for homepage rendering. Cached (SRS 5.1)."""

    permission_classes = [AllowAny]

    def get(self, request):
        cached = cache.get("published_surveys")
        if cached is None:
            qs = Survey.objects.filter(is_published=True)[:50]
            cached = SurveyPublicSerializer(qs, many=True).data
            cache.set("published_surveys", cached, 30)
        return Response({"data": cached})


class SurveyAdminListView(APIView):
    """Admin: list surveys filtered by moderation status (mirrors the Django Admin panel for the SPA console)."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get("status")
        qs = Survey.objects.all()
        if status_filter == "pending":
            qs = qs.filter(is_published=False)
        elif status_filter == "published":
            qs = qs.filter(is_published=True)
        return Response({"data": SurveyAdminSerializer(qs, many=True).data})


class SurveyModerateView(APIView):
    permission_classes = [IsAdminUser]

    def _get(self, submission_id):
        return Survey.objects.filter(submission_id=submission_id).first()

    def post(self, request, submission_id, action):
        survey = self._get(submission_id)
        if not survey:
            return Response({"error": "Survey not found."}, status=404)
        if action == "approve":
            survey.is_published = True
            survey.save()
            return Response({"message": "Approved and published. Homepage cache refreshed automatically."})
        elif action == "reject":
            survey.is_published = False
            survey.save()
            return Response({"message": "Flagged inactive."})
        return Response({"error": "Unknown action."}, status=400)

    def delete(self, request, submission_id, action=None):
        survey = self._get(submission_id)
        if not survey:
            return Response({"error": "Survey not found."}, status=404)
        survey.delete()
        cache.delete("published_surveys")
        return Response({"message": "Deleted."})
