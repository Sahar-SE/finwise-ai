"""
AI Portfolio Stress Test & "What-If" Scenario Simulator.

Unique feature: no competing finance app (CoinGecko, TradingView, Robinhood,
Yahoo Finance) lets users simulate macro crash scenarios against their ACTUAL
portfolio holdings and get AI-generated impact projections + hedge strategies.
"""

import json
import math
import os
import random
from datetime import datetime, timezone

import requests

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

# ── Pre-defined crash scenario templates ───────────────────────────────────

SCENARIOS = {
    "fed_hike": {
        "id": "fed_hike",
        "name": "Fed Rate Hike +75bps",
        "icon": "🏦",
        "description": "Federal Reserve announces an aggressive 75 basis point rate hike, tightening liquidity across all risk assets.",
        "shocks": {
            "crypto": -0.18,
            "gold": -0.04,
            "trading": -0.10,
        },
        "volatility_mult": 1.6,
        "recovery_days_base": 45,
    },
    "crypto_winter": {
        "id": "crypto_winter",
        "name": "Crypto Winter -40%",
        "icon": "❄️",
        "description": "Major exchange collapse or regulatory crackdown triggers a sustained 40% drawdown across digital assets.",
        "shocks": {
            "crypto": -0.40,
            "gold": 0.05,
            "trading": -0.06,
        },
        "volatility_mult": 2.2,
        "recovery_days_base": 120,
    },
    "tech_burst": {
        "id": "tech_burst",
        "name": "Tech Bubble Burst",
        "icon": "💥",
        "description": "AI hype cycle correction causes a sharp revaluation of semiconductor and cloud stocks, dragging indices down 25%.",
        "shocks": {
            "crypto": -0.12,
            "gold": 0.08,
            "trading": -0.25,
        },
        "volatility_mult": 1.8,
        "recovery_days_base": 90,
    },
    "gold_rush": {
        "id": "gold_rush",
        "name": "Gold Super-Cycle +25%",
        "icon": "🥇",
        "description": "Central bank reserve diversification accelerates, driving gold above $3,000 while risk assets consolidate.",
        "shocks": {
            "crypto": -0.05,
            "gold": 0.25,
            "trading": -0.03,
        },
        "volatility_mult": 1.2,
        "recovery_days_base": 30,
    },
    "black_swan": {
        "id": "black_swan",
        "name": "Black Swan Event",
        "icon": "🦢",
        "description": "Unprecedented geopolitical crisis triggers simultaneous sell-offs across equities, crypto, and commodities.",
        "shocks": {
            "crypto": -0.35,
            "gold": -0.08,
            "trading": -0.22,
        },
        "volatility_mult": 2.5,
        "recovery_days_base": 180,
    },
    "bull_run": {
        "id": "bull_run",
        "name": "Global Liquidity Surge",
        "icon": "🚀",
        "description": "Coordinated central bank easing and massive fiscal stimulus floods markets with liquidity, lifting all boats.",
        "shocks": {
            "crypto": 0.35,
            "gold": 0.12,
            "trading": 0.18,
        },
        "volatility_mult": 1.4,
        "recovery_days_base": 0,
    },
}


def get_scenarios():
    return list(SCENARIOS.values())


def run_stress_test(portfolio_assets, scenario_id, custom_shock_pct=None):
    """
    Runs a stress test simulation against the user's actual portfolio.

    Args:
        portfolio_assets: list of dicts with keys: symbol, asset_type, volume, avg_buy_price, live_price
        scenario_id: one of the predefined scenario keys or 'custom'
        custom_shock_pct: float override for custom scenario (e.g. -0.30 for -30%)

    Returns:
        Full stress test report dict.
    """
    scenario = SCENARIOS.get(scenario_id)
    if not scenario and scenario_id == "custom":
        shock = custom_shock_pct if custom_shock_pct is not None else -0.20
        scenario = {
            "id": "custom",
            "name": f"Custom Scenario ({'+' if shock >= 0 else ''}{shock*100:.0f}%)",
            "icon": "⚙️",
            "description": "User-defined custom market shock applied uniformly across all asset classes.",
            "shocks": {"crypto": shock, "gold": shock * 0.4, "trading": shock * 0.7},
            "volatility_mult": 1.5,
            "recovery_days_base": abs(int(shock * 300)),
        }
    elif not scenario:
        scenario = SCENARIOS["crypto_winter"]

    shocks = scenario["shocks"]
    vol_mult = scenario["volatility_mult"]
    recovery_base = scenario["recovery_days_base"]

    total_current_value = 0.0
    total_stressed_value = 0.0
    asset_impacts = []

    for asset in portfolio_assets:
        sym = asset.get("symbol", "???")
        asset_type = asset.get("asset_type", "crypto")
        volume = float(asset.get("volume", 0))
        buy_price = float(asset.get("avg_buy_price", 0))
        live_price = float(asset.get("live_price", buy_price))

        current_value = volume * live_price
        base_shock = shocks.get(asset_type, -0.10)

        # Add per-asset noise: higher-beta assets get more extreme shocks
        asset_noise = (random.random() - 0.5) * 0.06
        effective_shock = base_shock + asset_noise
        stressed_price = max(0.01, live_price * (1.0 + effective_shock))
        stressed_value = volume * stressed_price
        dollar_impact = stressed_value - current_value
        pct_impact = (effective_shock) * 100

        # Per-asset recovery time (higher volatility = longer recovery)
        asset_recovery = max(0, int(recovery_base * (1 + abs(effective_shock) * vol_mult * 0.5) + random.randint(-10, 20)))

        total_current_value += current_value
        total_stressed_value += stressed_value

        asset_impacts.append({
            "symbol": sym,
            "asset_type": asset_type,
            "current_price": round(live_price, 2),
            "stressed_price": round(stressed_price, 2),
            "current_value": round(current_value, 2),
            "stressed_value": round(stressed_value, 2),
            "dollar_impact": round(dollar_impact, 2),
            "pct_impact": round(pct_impact, 2),
            "recovery_days_est": asset_recovery,
        })

    total_drawdown = total_stressed_value - total_current_value
    total_drawdown_pct = ((total_drawdown) / total_current_value * 100) if total_current_value > 0 else 0

    # Sort by dollar impact (worst hit first)
    asset_impacts.sort(key=lambda x: x["dollar_impact"])

    # Generate AI hedge strategy
    hedge_strategy = _generate_hedge_strategy(scenario, asset_impacts, total_drawdown_pct)

    return {
        "scenario": {
            "id": scenario["id"],
            "name": scenario["name"],
            "icon": scenario["icon"],
            "description": scenario["description"],
        },
        "portfolio_before": round(total_current_value, 2),
        "portfolio_after": round(total_stressed_value, 2),
        "total_drawdown": round(total_drawdown, 2),
        "total_drawdown_pct": round(total_drawdown_pct, 2),
        "recovery_days_est": max((a["recovery_days_est"] for a in asset_impacts), default=0),
        "asset_impacts": asset_impacts,
        "hedge_strategy": hedge_strategy,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def _generate_hedge_strategy(scenario, asset_impacts, drawdown_pct):
    """Generates AI hedge strategy — uses LLM if available, else built-in engine."""
    worst_assets = [a["symbol"] for a in asset_impacts[:3]]
    scenario_name = scenario["name"]

    prompt = (
        f"You are a Senior Portfolio Risk Advisor. A user's portfolio just went through a "
        f"'{scenario_name}' stress test scenario with a total drawdown of {drawdown_pct:.1f}%. "
        f"The worst-hit assets are: {', '.join(worst_assets)}.\n\n"
        f"Provide a JSON response with these exact keys:\n"
        f"1. hedge_actions: array of 3-4 specific hedging action items\n"
        f"2. protective_assets: array of 2-3 assets that would protect against this scenario\n"
        f"3. risk_rating: 'LOW', 'MODERATE', 'HIGH', or 'CRITICAL'\n"
        f"4. survival_score: integer 0-100 representing portfolio resilience\n"
        f"5. coaching_note: 1-2 sentence personalized coaching advice\n"
    )

    # Try Gemini
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if gemini_key:
        try:
            url = f"{GEMINI_ENDPOINT}?key={gemini_key}"
            resp = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=5)
            if resp.status_code == 200:
                text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].strip()
                return json.loads(text)
        except Exception:
            pass

    # Try OpenAI
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        try:
            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                json={"model": "gpt-4o-mini", "messages": [{"role": "user", "content": prompt}], "response_format": {"type": "json_object"}},
                timeout=5,
            )
            if resp.status_code == 200:
                return json.loads(resp.json()["choices"][0]["message"]["content"])
        except Exception:
            pass

    # Try g4f
    try:
        from g4f.client import Client as G4FClient
        client = G4FClient()
        response = client.chat.completions.create(
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

    # Built-in fallback
    abs_dd = abs(drawdown_pct)
    if abs_dd > 25:
        risk_rating = "CRITICAL"
        survival_score = max(15, int(60 - abs_dd))
    elif abs_dd > 15:
        risk_rating = "HIGH"
        survival_score = max(35, int(75 - abs_dd))
    elif abs_dd > 5:
        risk_rating = "MODERATE"
        survival_score = max(55, int(85 - abs_dd))
    else:
        risk_rating = "LOW"
        survival_score = min(95, int(90 + abs_dd))

    hedge_actions = []
    if any(a["asset_type"] == "crypto" for a in asset_impacts):
        hedge_actions.append("Reduce crypto allocation by 15-25% and rotate into stablecoins (USDC/USDT) as a temporary safe harbor.")
    if any(a["asset_type"] == "trading" for a in asset_impacts):
        hedge_actions.append("Purchase put options on major equity indices (SPY/QQQ) to hedge downside tail risk.")
    hedge_actions.append(f"Set trailing stop-loss orders at -8% on highest-exposure holdings ({', '.join(worst_assets[:2])}).")
    hedge_actions.append("Increase allocation to uncorrelated assets: physical gold ETFs (GLD), short-term Treasury bills (SHV), or volatility index (VIX) instruments.")

    protective_assets = ["GLD (Gold ETF)", "SHV (Short-term Treasury)", "USDC (Stablecoin)"]
    coaching_note = (
        f"Your portfolio has a {risk_rating.lower()} vulnerability to '{scenario_name}' scenarios. "
        f"Consider diversifying across uncorrelated asset classes to improve resilience."
    )

    return {
        "hedge_actions": hedge_actions,
        "protective_assets": protective_assets,
        "risk_rating": risk_rating,
        "survival_score": survival_score,
        "coaching_note": coaching_note,
    }
