"""
Live market data feeds.

Crypto uses CoinGecko's free public API (real-time, no key required).
Gold uses a free metals API endpoint.
Equities use Yahoo Finance by default (free, no key required).
"""

import os
import random
import time
from datetime import datetime, timezone

import requests
from django.core.cache import cache

COINGECKO_BASE = os.environ.get("COINGECKO_API_BASE", "https://api.coingecko.com/api/v3")
YAHOO_QUOTE_BASE = "https://query1.finance.yahoo.com/v7/finance/quote?symbols="
METALS_API_BASE = "https://api.metals.live/v1/spot/gold"  # Free metals API
CACHE_TTL = 15  # seconds - provides responsive real-time updates while respecting API rate limits
GOLD_CACHE_TTL = 15  # Use same TTL for all (metals.live has generous free tier)

TOP_CRYPTO_IDS = [
    "bitcoin", "ethereum", "tether", "binancecoin", "solana", "ripple", "usd-coin",
    "cardano", "dogecoin", "tron", "avalanche-2", "chainlink", "polkadot",
    "the-open-network", "shiba-inu", "litecoin", "bitcoin-cash", "near", "uniswap", "internet-computer",
]

EQUITY_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN"]

_seed_state = {
    "XAU": {"price": 4120.50, "vol": 0.0015},
    "AAPL": {"price": 213.38, "vol": 0.010},
    "MSFT": {"price": 443.30, "vol": 0.009},
    "GOOGL": {"price": 186.13, "vol": 0.011},
    "TSLA": {"price": 244.77, "vol": 0.025},
    "AMZN": {"price": 196.34, "vol": 0.012},
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


def fetch_alpha_vantage_prices(symbols):
    api_key = os.environ.get("ALPHA_VANTAGE_API_KEY", "").strip()
    if not api_key:
        raise ValueError("Missing Alpha Vantage API key")

    quotes = []
    for index, symbol in enumerate(symbols):
        url = (
            f"{ALPHA_VANTAGE_BASE}?function=GLOBAL_QUOTE"
            f"&symbol={symbol}&apikey={api_key}"
        )
        resp = requests.get(url, timeout=12)
        resp.raise_for_status()
        data = resp.json()

        if data.get("Note"):
            raise ValueError(f"Alpha Vantage rate limit: {data['Note']}")
        if data.get("Information"):
            raise ValueError(f"Alpha Vantage info: {data['Information']}")
        if data.get("Error Message"):
            raise ValueError(f"Alpha Vantage error: {data['Error Message']}")

        quote = data.get("Global Quote")
        if not quote or not quote.get("05. price"):
            raise ValueError(f"Alpha Vantage returned invalid data for {symbol}")

        change_pct = quote.get("10. change percent", "0%")
        try:
            change_value = float(change_pct.strip().replace("%", ""))
        except ValueError:
            change_value = 0.0

        quotes.append({
            "symbol": symbol,
            "price": float(quote["05. price"]),
            "change24h": change_value,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "simulated": False,
        })

        if index < len(symbols) - 1:
            time.sleep(1.1)

    return quotes


def fetch_gold_price():
    # First try in-memory cache (fast)
    cached = cache.get("gold_price")
    if cached:
        return cached

    api_key = os.environ.get("GOLD_API_KEY", "").strip()
    if api_key:
        try:
            url = "https://www.goldapi.io/api/XAU/USD"
            headers = {"x-access-token": api_key, "Content-Type": "application/json"}
            resp = requests.get(url, headers=headers, timeout=8)
            resp.raise_for_status()
            data = resp.json()
            price = data.get("price")
            if price is None:
                raise ValueError("GoldAPI returned invalid data")

            result = {
                "symbol": "XAU",
                "price": float(price),
                "change24h": data.get("changesPercentage") or 0.0,
                "updatedAt": datetime.now(timezone.utc).isoformat(),
                "simulated": False,
            }
            # Cache for 5 minutes to reduce API quota pressure
            cache.set("gold_price", result, GOLD_CACHE_TTL)
            # Also store as fallback for when API quota is exceeded
            cache.set("gold_price_fallback", result, 86400 * 7)  # Keep for a week
            return result
        except requests.exceptions.HTTPError as e:
            # Check if quota exceeded or other API error
            if e.response.status_code in (403, 429):
                # API quota exceeded or rate limited, try fallback cache
                fallback = cache.get("gold_price_fallback")
                if fallback:
                    return fallback
        except Exception:
            # Try fallback cache on any other error
            fallback = cache.get("gold_price_fallback")
            if fallback:
                return fallback

    # Fall back to simulated data with base from last known value
    fallback = cache.get("gold_price_fallback")
    if fallback:
        # Use last known price as seed
        seed_state = _seed_state.copy()
        seed_state["XAU"]["price"] = fallback["price"]
        now = datetime.now(timezone.utc).isoformat()
        result = {
            "symbol": "XAU",
            "price": _random_walk_step(seed_state["XAU"]["price"], seed_state["XAU"]["vol"]),
            "change24h": round((random.random() - 0.45) * 3, 2),
            "updatedAt": now,
            "simulated": True,
        }
        cache.set("gold_price", result, CACHE_TTL)
        return result

    return _simulated_feed(["XAU"])[0]


def fetch_equity_prices():
    cached = cache.get("equity_prices")
    if cached:
        return cached

    symbols = EQUITY_SYMBOLS
    api_key = os.environ.get("ALPHA_VANTAGE_API_KEY", "").strip()
    if api_key:
        try:
            quotes = fetch_alpha_vantage_prices(symbols)
            cache.set("equity_prices", quotes, CACHE_TTL)
            return quotes
        except Exception:
            pass

    try:
        url = YAHOO_QUOTE_BASE + ",".join(symbols)
        resp = requests.get(url, timeout=8)
        resp.raise_for_status()

        data = resp.json()
        quotes = data.get("quoteResponse", {}).get("result", [])
        if not quotes:
            raise ValueError("Yahoo Finance did not return equity quotes")

        normalized = []
        for symbol in symbols:
            quote = next((q for q in quotes if q.get("symbol") == symbol), None)
            if not quote or quote.get("regularMarketPrice") is None:
                raise ValueError(f"Missing quote data for {symbol}")

            normalized.append({
                "symbol": symbol,
                "price": quote.get("regularMarketPrice"),
                "change24h": quote.get("regularMarketChangePercent") or 0.0,
                "updatedAt": datetime.now(timezone.utc).isoformat(),
                "simulated": False,
            })

        cache.set("equity_prices", normalized, CACHE_TTL)
        return normalized
    except Exception:
        return _simulated_feed(symbols)
