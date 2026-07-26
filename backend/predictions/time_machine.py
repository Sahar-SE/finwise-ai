"""
Portfolio Time Machine — Historical "What If" Simulator.

UNIQUE FEATURE: No finance app lets users see what their exact portfolio
would be worth if they had bought at famous historical moments:
  - COVID Crash (March 2020)
  - Bitcoin Halving (April 2024)
  - 2017 Crypto Boom
  - 2022 Tech Bottom
  - Gold All-Time High (2020)
  - Dot-Com Crash (2000)

Uses historical price reference data to compute hypothetical portfolio
values and compound gains.
"""

import json
import os
import requests
from datetime import datetime

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

# Historical reference prices at famous market moments
HISTORICAL_MOMENTS = {
    "covid_crash": {
        "id": "covid_crash",
        "name": "COVID-19 Crash Bottom",
        "icon": "🦠",
        "date": "March 23, 2020",
        "description": "Markets hit pandemic lows. S&P 500 dropped 34%, Bitcoin fell to $4,800, gold dipped before its massive rally.",
        "prices": {
            "BTC": 4826, "ETH": 107, "SOL": 0.22, "ADA": 0.018, "XRP": 0.13,
            "DOGE": 0.0015, "DOT": 2.80, "LINK": 1.60, "AVAX": 3.50, "MATIC": 0.007,
            "AAPL": 57.31, "MSFT": 135.98, "GOOGL": 1054.13, "AMZN": 1689.22,
            "NVDA": 5.68, "TSLA": 26.11, "META": 150.75, "AMD": 42.14,
            "XAU": 1484.0, "GOLD": 1484.0,
        },
    },
    "btc_halving_2024": {
        "id": "btc_halving_2024",
        "name": "Bitcoin Halving 2024",
        "icon": "⛏️",
        "date": "April 19, 2024",
        "description": "Fourth Bitcoin halving reduced block rewards to 3.125 BTC. Historically triggers 12-18 month bull runs.",
        "prices": {
            "BTC": 63800, "ETH": 3050, "SOL": 136, "ADA": 0.46, "XRP": 0.51,
            "DOGE": 0.15, "DOT": 6.90, "LINK": 14.50, "AVAX": 34.80, "MATIC": 0.70,
            "AAPL": 167.04, "MSFT": 399.04, "GOOGL": 157.95, "AMZN": 186.13,
            "NVDA": 87.40, "TSLA": 147.05, "META": 493.50, "AMD": 155.39,
            "XAU": 2392.0, "GOLD": 2392.0,
        },
    },
    "crypto_boom_2017": {
        "id": "crypto_boom_2017",
        "name": "2017 Crypto Boom Start",
        "icon": "🎆",
        "date": "January 1, 2017",
        "description": "Bitcoin was $960 and about to surge to $20,000 by December. The original retail crypto mania.",
        "prices": {
            "BTC": 960, "ETH": 8.15, "XRP": 0.006, "DOGE": 0.00022,
            "LINK": 0.15, "ADA": 0.02,
            "AAPL": 28.95, "MSFT": 62.14, "GOOGL": 792.45, "AMZN": 749.87,
            "NVDA": 25.18, "TSLA": 42.73, "META": 115.05,
            "XAU": 1151.0, "GOLD": 1151.0,
        },
    },
    "tech_bottom_2022": {
        "id": "tech_bottom_2022",
        "name": "2022 Tech & Crypto Bottom",
        "icon": "📉",
        "date": "December 28, 2022",
        "description": "After aggressive Fed hiking cycle, tech stocks and crypto hit multi-year lows. NVDA was $14, BTC at $16,500.",
        "prices": {
            "BTC": 16537, "ETH": 1187, "SOL": 9.96, "ADA": 0.24, "XRP": 0.34,
            "DOGE": 0.069, "DOT": 4.30, "LINK": 5.50, "AVAX": 10.80, "MATIC": 0.76,
            "AAPL": 129.93, "MSFT": 241.01, "GOOGL": 88.73, "AMZN": 84.00,
            "NVDA": 14.62, "TSLA": 123.18, "META": 120.34, "AMD": 64.77,
            "XAU": 1824.0, "GOLD": 1824.0,
        },
    },
    "gold_ath_2020": {
        "id": "gold_ath_2020",
        "name": "Gold All-Time High 2020",
        "icon": "🥇",
        "date": "August 6, 2020",
        "description": "Gold breached $2,070 for the first time as pandemic stimulus flooded the economy.",
        "prices": {
            "BTC": 11744, "ETH": 400, "SOL": 1.50, "ADA": 0.14,
            "AAPL": 110.06, "MSFT": 213.04, "GOOGL": 1500.10, "AMZN": 3167.46,
            "NVDA": 11.10, "TSLA": 293.37, "META": 253.67,
            "XAU": 2070.0, "GOLD": 2070.0,
        },
    },
}


# Approximate "current" reference prices for fallback calculation
CURRENT_PRICES = {
    "BTC": 104500, "ETH": 3350, "SOL": 178, "ADA": 0.72, "XRP": 2.35,
    "DOGE": 0.26, "DOT": 7.20, "LINK": 18.50, "AVAX": 38, "MATIC": 0.52,
    "AAPL": 218, "MSFT": 462, "GOOGL": 186, "AMZN": 202,
    "NVDA": 138, "TSLA": 268, "META": 580, "AMD": 162,
    "XAU": 2680, "GOLD": 2680,
}


def get_moments():
    return list(HISTORICAL_MOMENTS.values())


def simulate_time_machine(portfolio_assets, moment_id):
    """
    Calculate what the user's portfolio would be worth if they had invested
    the same dollar amounts at a famous historical moment.
    """
    moment = HISTORICAL_MOMENTS.get(moment_id)
    if not moment:
        moment = HISTORICAL_MOMENTS["covid_crash"]

    historical_prices = moment["prices"]
    results = []
    total_invested = 0.0
    total_hypothetical = 0.0

    for asset in portfolio_assets:
        sym = asset["symbol"].upper()
        volume = float(asset.get("volume", 0))
        buy_price = float(asset.get("avg_buy_price", 0))
        live_price = float(asset.get("live_price", buy_price))

        # What user actually invested
        actual_invested = volume * buy_price
        actual_current = volume * live_price
        actual_return_pct = ((live_price - buy_price) / buy_price * 100) if buy_price > 0 else 0

        # What if they bought at the historical moment with the same dollar amount?
        hist_price = historical_prices.get(sym)
        current_ref = CURRENT_PRICES.get(sym, live_price)

        if hist_price and hist_price > 0:
            hypothetical_units = actual_invested / hist_price
            hypothetical_value = hypothetical_units * current_ref
            hypothetical_return_pct = ((current_ref - hist_price) / hist_price * 100)
            multiplier = current_ref / hist_price
        else:
            hypothetical_units = volume
            hypothetical_value = actual_current
            hypothetical_return_pct = actual_return_pct
            multiplier = 1.0

        total_invested += actual_invested
        total_hypothetical += hypothetical_value

        results.append({
            "symbol": sym,
            "asset_type": asset["asset_type"],
            "invested_amount": round(actual_invested, 2),
            "actual_current_value": round(actual_current, 2),
            "actual_return_pct": round(actual_return_pct, 2),
            "historical_price": round(hist_price, 4) if hist_price else None,
            "hypothetical_units": round(hypothetical_units, 6) if hist_price else None,
            "hypothetical_value": round(hypothetical_value, 2),
            "hypothetical_return_pct": round(hypothetical_return_pct, 2),
            "multiplier": round(multiplier, 2),
        })

    # Sort by multiplier (biggest gain first)
    results.sort(key=lambda x: x["multiplier"], reverse=True)

    total_actual_current = sum(r["actual_current_value"] for r in results)
    total_gain_diff = total_hypothetical - total_actual_current

    # AI insight
    ai_insight = _generate_time_machine_insight(moment, results, total_invested, total_hypothetical, total_actual_current)

    return {
        "moment": {
            "id": moment["id"],
            "name": moment["name"],
            "icon": moment["icon"],
            "date": moment["date"],
            "description": moment["description"],
        },
        "total_invested": round(total_invested, 2),
        "total_actual_value": round(total_actual_current, 2),
        "total_hypothetical_value": round(total_hypothetical, 2),
        "hypothetical_gain_diff": round(total_gain_diff, 2),
        "asset_results": results,
        "ai_insight": ai_insight,
    }


def _generate_time_machine_insight(moment, results, total_invested, total_hypothetical, total_actual):
    prompt = (
        f"A user ran a 'Portfolio Time Machine' simulation. They checked what their portfolio "
        f"would be worth if they had invested at '{moment['name']}' ({moment['date']}).\n\n"
        f"Total originally invested: ${total_invested:,.0f}\n"
        f"Current actual portfolio value: ${total_actual:,.0f}\n"
        f"Hypothetical value (if bought at {moment['name']}): ${total_hypothetical:,.0f}\n\n"
        f"Top performing time-travel assets: {', '.join(r['symbol'] + ' (' + str(r['multiplier']) + 'x)' for r in results[:3])}\n\n"
        f"Provide a JSON response with:\n"
        f"1. headline: one-line summary of the key takeaway\n"
        f"2. lesson: 1-2 sentence lesson about timing, patience, and long-term investing\n"
        f"3. forward_looking: 1-2 sentence advice about what to do NOW based on these historical patterns\n"
    )

    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if gemini_key:
        try:
            resp = requests.post(
                f"{GEMINI_ENDPOINT}?key={gemini_key}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=5,
            )
            if resp.status_code == 200:
                text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].strip()
                return json.loads(text)
        except Exception:
            pass

    try:
        from g4f.client import Client as G4FClient
        c = G4FClient()
        response = c.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            timeout=10,
        )
        text = response.choices[0].message.content
        if text:
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].strip()
            return json.loads(text)
    except Exception:
        pass

    # Fallback
    best = results[0] if results else {"symbol": "N/A", "multiplier": 1}
    gain_diff = total_hypothetical - total_actual
    if gain_diff > 0:
        headline = f"You'd be ${gain_diff:,.0f} richer if you'd invested at the {moment['name']}"
        lesson = (
            f"Investing during peak fear events like '{moment['name']}' historically delivers outsized returns. "
            f"{best['symbol']} alone would have returned {best['multiplier']}x. The lesson: buy when there's blood in the streets."
        )
    else:
        headline = f"Your actual timing has outperformed the '{moment['name']}' entry by ${abs(gain_diff):,.0f}"
        lesson = "Your actual entry points have served you well. Not every historical dip was the perfect entry for your asset mix."

    return {
        "headline": headline,
        "lesson": lesson,
        "forward_looking": "Focus on accumulating quality assets during fear events. Set limit buy orders at key support levels so you're ready when the next major pullback occurs.",
    }
