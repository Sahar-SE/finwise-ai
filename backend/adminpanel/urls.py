"""
Aggregates the admin-only SPA console endpoints (SEO manager, survey
moderation, traffic dashboard, user list) that mirror the same data as the
Django Admin Moderation Panel described in the SRS, exposed as JSON for the
React admin console.
"""

from django.contrib.auth import get_user_model
from django.urls import path
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from seo.views import SeoMetaDeleteView, SeoMetaListCreateView
from surveys.views import SurveyAdminListView, SurveyModerateView
from traffic.views import TrafficSummaryView
from users.serializers import UserSerializer

User = get_user_model()


class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = User.objects.all().order_by("-date_joined")
        return Response({"data": UserSerializer(qs, many=True).data})


urlpatterns = [
    path("seo", SeoMetaListCreateView.as_view(), name="admin-seo"),
    path("seo/<int:pk>", SeoMetaDeleteView.as_view(), name="admin-seo-delete"),
    path("surveys", SurveyAdminListView.as_view(), name="admin-surveys"),
    path("surveys/<uuid:submission_id>/approve", SurveyModerateView.as_view(), {"action": "approve"}, name="admin-survey-approve"),
    path("surveys/<uuid:submission_id>/reject", SurveyModerateView.as_view(), {"action": "reject"}, name="admin-survey-reject"),
    path("surveys/<uuid:submission_id>", SurveyModerateView.as_view(), name="admin-survey-delete"),
    path("traffic/summary", TrafficSummaryView.as_view(), name="admin-traffic-summary"),
    path("users", AdminUserListView.as_view(), name="admin-users"),
]
