from django.db import models


class SeoMeta(models.Model):
    """Per-path SEO metadata rule (SRS 3.3.1 Dynamic Meta Injections)."""

    path = models.CharField(max_length=255, unique=True)
    title = models.CharField(max_length=255, blank=True, default="")
    meta_description = models.CharField(max_length=500, blank=True, default="")
    og_image = models.CharField(max_length=500, blank=True, default="")
    canonical_uri = models.CharField(max_length=255, blank=True, default="")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["path"]
        verbose_name = "SEO meta rule"
        verbose_name_plural = "SEO meta rules"

    def __str__(self):
        return self.path
