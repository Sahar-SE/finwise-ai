from django.urls import path

from .views import CryptoView, EquitiesView, GoldView, OverviewView

urlpatterns = [
    path("crypto", CryptoView.as_view(), name="market-crypto"),
    path("gold", GoldView.as_view(), name="market-gold"),
    path("equities", EquitiesView.as_view(), name="market-equities"),
    path("overview", OverviewView.as_view(), name="market-overview"),
]
