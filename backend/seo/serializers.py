from rest_framework import serializers

from .models import SeoMeta


class SeoMetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeoMeta
        fields = ["id", "path", "title", "meta_description", "og_image", "canonical_uri", "updated_at"]
