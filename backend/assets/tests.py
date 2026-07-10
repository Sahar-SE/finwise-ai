from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient


class AssetApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester",
            email="tester@example.com",
            password="secret123",
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_create_asset_without_trailing_slash(self):
        response = self.client.post(
            "/api/assets",
            {
                "asset_type": "crypto",
                "symbol": "btc",
                "volume": "1",
                "avg_buy_price": "100",
                "buy_timestamp": "2026-07-10",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["symbol"], "BTC")
