from rest_framework import serializers

from .models import Survey


class SurveySubmitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = ["username", "rating_score", "qualitative_feedback", "primary_market_focus"]

    def validate_rating_score(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("rating_score must be between 1 and 5.")
        return value

    def validate_username(self, value):
        if not (2 <= len(value) <= 50):
            raise serializers.ValidationError("username must be 2-50 characters.")
        return value


class SurveyPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = ["submission_id", "username", "rating_score", "qualitative_feedback", "primary_market_focus", "created_at"]


class SurveyAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Survey
        fields = "__all__"
