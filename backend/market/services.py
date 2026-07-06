"""
Live market data feeds.

Crypto uses CoinGecko's free public API (real-time, no key required).
Gold and equities use a realistic simulated random-walk feed by default so the
app is fully functional with zero third-party signups; swap in GoldAPI /
Alpha Vantage by following README section 6 once you have free API keys.
"""

import os
import random
import time
from datetime import datetime, timezone

import requests
from django.core.cache import cache

COINGECKO_BASE = os.environ.get("COINGECKO_API_BASE", "https://api.coingecko.com/api/v3")
CACHE_TTL = 30  # seconds - keeps public endpoint latency low (SRS 5.1)

TOP_CRYPTO_IDS = [
    "bitcoin", "ethereum", "tether", "binancecoin", "solana", "ripple", "usd-coin",
    "cardano", "dogecoin", "tron", "avalanche-2", "chainlink", "polkadot",
    "the-open-network", "shiba-inu", "litecoin", "bitcoin-cash", "near", "uniswap", "internet-computer",
]

_seed_state = {
    "XAU": {"price": 2380.50, "vol": 0.0015},
    "AAPL": {"price": 213.40, "vol": 0.010},
    "MSFT": {"price": 452.10, "vol": 0.009},
    "GOOGL": {"price": 178.30, "vol": 0.011},
    "TSLA": {"price": 248.70, "vol": 0.025},
    "AMZN": {"price": 198.90, "vol": 0.012},
}


def fetch_crypto_prices():
    cached = cache.get("crypto_prices")
    if cached:
        return cached

    ids = ",".join(TOP_CRYPTO_IDS)
    url = (
        f"{COINGECKO_BASE}/coins/markets?vs_currency=usd&ids={ids}"
        f"&order=market_cap_desc&sparkline=true&price_change_percentage=1h,24h,7d"
    )
    resp = requests.get(url, timeout=8)
    resp.raise_for_status()
    data = resp.json()

    normalized = [
        {
            "symbol": c["symbol"].upper(),
            "name": c["name"],
            "price": c["current_price"],
            "change1h": c.get("price_change_percentage_1h_in_currency"),
            "change24h": c.get("price_change_percentage_24h_in_currency"),
            "change7d": c.get("price_change_percentage_7d_in_currency"),
            "marketCap": c.get("market_cap"),
            "sparkline": (c.get("sparkline_in_7d") or {}).get("price", [])[::6],
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }
        for c in data
    ]
    cache.set("crypto_prices", normalized, CACHE_TTL)
    return normalized


def _random_walk_step(prev, vol):
    shock = (random.random() - 0.5) * 2 * vol
    return round(prev * (1 + shock), 2)


def _simulated_feed(symbols):
    now = datetime.now(timezone.utc).isoformat()
    out = []
    for sym in symbols:
        state = _seed_state.get(sym)
        if not state:
            continue
        state["price"] = _random_walk_step(state["price"], state["vol"])
        out.append({
            "symbol": sym,
            "price": state["price"],
            "change24h": round((random.random() - 0.45) * 3, 2),
            "updatedAt": now,
            "simulated": True,
        })
    return out


def fetch_gold_price():
    gold_key = os.environ.get("GOLD_API_KEY")
    if gold_key:
        # Placeholder for a real integration - see README section 6.
        # resp = requests.get("https://www.goldapi.io/api/XAU/USD",
        #                      headers={"x-access-token": gold_key}, timeout=8)
        # return resp.json()
        pass
    return _simulated_feed(["XAU"])[0]


def fetch_equity_prices():
    return _simulated_feed(["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN"])
