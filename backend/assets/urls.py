from django.urls import path

from .views import AssetDetailView, AssetImportView, AssetListCreateView

urlpatterns = [
    path("", AssetListCreateView.as_view(), name="asset-list-create"),
    path("import", AssetImportView.as_view(), name="asset-import"),
    path("<int:pk>", AssetDetailView.as_view(), name="asset-detail"),
]
