from django.urls import path
from .views import RagAskView, RagChunksView, RagEvalView, RagSyncView

urlpatterns = [
    path("ask", RagAskView.as_view(), name="rag-ask"),
    path("chunks", RagChunksView.as_view(), name="rag-chunks"),
    path("sync", RagSyncView.as_view(), name="rag-sync"),
    path("eval", RagEvalView.as_view(), name="rag-eval"),
]
