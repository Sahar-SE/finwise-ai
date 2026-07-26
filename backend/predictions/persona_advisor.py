"""
AI Legendary Investor Persona Advisor.

UNIQUE FEATURE — No finance app lets users ask legendary investor personas
(Warren Buffett, George Soros, Cathie Wood, Ray Dalio, Peter Lynch)
to review their ACTUAL portfolio and give persona-specific advice.

This engine builds a persona-enriched prompt with the user's real holdings,
sends it to LLM, and returns advice in the voice and strategy of the
selected legendary investor.
"""

import json
import os
import requests

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

PERSONAS = {
    "buffett": {
        "id": "buffett",
        "name": "Warren Buffett",
        "title": "The Oracle of Omaha",
        "icon": "🎩",
        "philosophy": "Value investing, margin of safety, economic moats, long-term compounding. Avoids things he doesn't understand. Prefers cash-generating businesses with durable competitive advantages.",
        "famous_quote": "Be fearful when others are greedy and greedy when others are fearful.",
        "style_note": "Speaks in folksy, Midwestern wisdom. Uses simple metaphors. Very skeptical of crypto and speculative assets.",
    },
    "soros": {
        "id": "soros",
        "name": "George Soros",
        "title": "The Man Who Broke the Bank of England",
        "icon": "🦅",
        "philosophy": "Reflexivity theory, macro trading, identifying market mispricing created by feedback loops between perception and reality. Willing to bet big when the thesis is right.",
        "famous_quote": "It's not whether you're right or wrong, but how much money you make when you're right.",
        "style_note": "Speaks with macro-economic depth. Focuses on systemic risks, central bank policy, and currency dynamics.",
    },
    "cathie_wood": {
        "id": "cathie_wood",
        "name": "Cathie Wood",
        "title": "ARK Invest CEO — Disruptive Innovation",
        "icon": "🚀",
        "philosophy": "Invests in disruptive innovation: AI, robotics, genomics, fintech, blockchain. 5-year time horizons. Believes in exponential growth curves and Wright's Law cost deflation.",
        "famous_quote": "Innovation solves problems. The bigger the problem, the bigger the opportunity.",
        "style_note": "Enthusiastic about technology. Uses terms like 'convergence of technologies', 'exponential growth', 'Wright's Law'. Very bullish on Bitcoin and AI.",
    },
    "dalio": {
        "id": "dalio",
        "name": "Ray Dalio",
        "title": "Bridgewater — All Weather Portfolio",
        "icon": "🌊",
        "philosophy": "Risk parity, all-weather portfolio construction, understanding macro debt cycles. Believes in radical transparency and systematic diversification across economic environments.",
        "famous_quote": "He who lives by the crystal ball will eat shattered glass.",
        "style_note": "Speaks about economic machines, debt cycles, and portfolio balance. Uses terms like 'risk parity', 'deleveraging', 'paradigm shifts'.",
    },
    "lynch": {
        "id": "lynch",
        "name": "Peter Lynch",
        "title": "Magellan Fund Legend",
        "icon": "📊",
        "philosophy": "Invest in what you know. Look for 'ten-baggers' (stocks that 10x). PEG ratio analysis. Ordinary people can beat Wall Street by observing consumer trends.",
        "famous_quote": "Know what you own, and know why you own it.",
        "style_note": "Down-to-earth, practical advice. Categorizes stocks as fast growers, stalwarts, turnarounds, and cyclicals. Focuses on fundamentals over hype.",
    },
}


def get_personas():
    return list(PERSONAS.values())


def ask_persona(persona_id, portfolio_assets, user_question=None):
    """
    Ask a legendary investor persona to review the user's portfolio
    and provide advice in their unique voice and strategy.
    """
    persona = PERSONAS.get(persona_id)
    if not persona:
        persona = PERSONAS["buffett"]

    # Build portfolio description
    portfolio_desc = []
    for asset in portfolio_assets:
        line = f"- {asset['symbol']} ({asset['asset_type']}): {asset['volume']} units @ avg ${asset['avg_buy_price']}"
        if asset.get('live_price'):
            pnl_pct = ((float(asset['live_price']) - float(asset['avg_buy_price'])) / float(asset['avg_buy_price'])) * 100
            line += f" (current: ${asset['live_price']}, P&L: {pnl_pct:+.1f}%)"
        portfolio_desc.append(line)

    portfolio_text = "\n".join(portfolio_desc) if portfolio_desc else "No holdings found."

    prompt = (
        f"You are {persona['name']} ({persona['title']}). You must stay completely in character.\n\n"
        f"YOUR INVESTMENT PHILOSOPHY: {persona['philosophy']}\n"
        f"YOUR COMMUNICATION STYLE: {persona['style_note']}\n"
        f"YOUR FAMOUS QUOTE: \"{persona['famous_quote']}\"\n\n"
        f"A user has shared their current portfolio with you:\n{portfolio_text}\n\n"
    )

    if user_question:
        prompt += f"The user asks: \"{user_question}\"\n\n"
    else:
        prompt += "The user wants your overall assessment of their portfolio.\n\n"

    prompt += (
        "Respond AS this legendary investor in their authentic voice. Provide a JSON response with:\n"
        "1. greeting: a one-line in-character greeting\n"
        "2. portfolio_grade: A, B, C, D, or F — how this investor would grade the portfolio\n"
        "3. grade_reason: why you gave this grade (1 sentence, in character)\n"
        "4. likes: array of 1-2 things you LIKE about the portfolio (in character)\n"
        "5. concerns: array of 1-2 things you're CONCERNED about (in character)\n"
        "6. advice: array of 2-3 specific actionable recommendations (in character)\n"
        "7. signature_move: one bold, contrarian suggestion this investor would uniquely make\n"
        "8. closing_wisdom: a parting one-liner of wisdom (in character)\n"
    )

    # Try Gemini
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if gemini_key:
        try:
            resp = requests.post(
                f"{GEMINI_ENDPOINT}?key={gemini_key}",
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=8,
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

    # Try OpenAI
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        try:
            resp = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                json={"model": "gpt-4o-mini", "messages": [{"role": "user", "content": prompt}], "response_format": {"type": "json_object"}},
                timeout=8,
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
            timeout=12,
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

    # ─── Built-in fallback per persona ──────────────────────────────
    has_crypto = any(a["asset_type"] == "crypto" for a in portfolio_assets)
    has_gold = any(a["asset_type"] == "gold" for a in portfolio_assets)
    has_equities = any(a["asset_type"] == "trading" for a in portfolio_assets)
    num_assets = len(portfolio_assets)

    if persona_id == "buffett":
        return {
            "greeting": "Well now, let me put on my reading glasses and take a look at what you've got here.",
            "portfolio_grade": "C+" if has_crypto else "B",
            "grade_reason": "You've got some speculative positions that make me nervous. I prefer businesses I can understand." if has_crypto else "A reasonable collection, though I'd want to see more cash-generating businesses.",
            "likes": ["You're investing rather than sitting on cash — that's step one." if num_assets > 0 else "At least you're thinking about investing."] + (["Gold is a fine store of value, though it doesn't produce anything."] if has_gold else []),
            "concerns": (["Cryptocurrency is essentially gambling on what someone else will pay for a digital token. I wouldn't touch it."] if has_crypto else []) + ["I'd want to understand: do you truly understand each business you own?"],
            "advice": [
                "Focus on companies with durable competitive advantages — what I call economic moats.",
                "Never invest in a business you cannot understand. If you can't explain it to a fifth-grader, don't buy it.",
                "Think of stocks as ownership stakes in real businesses, not lottery tickets.",
            ],
            "signature_move": "I'd sell every speculative position and put it all into a low-cost S&P 500 index fund. For most people, that's the smartest thing you can do.",
            "closing_wisdom": "The stock market is a device for transferring money from the impatient to the patient.",
        }

    elif persona_id == "soros":
        return {
            "greeting": "Interesting. Let me examine the macro landscape surrounding your positions.",
            "portfolio_grade": "B-" if not has_gold else "B+",
            "grade_reason": "Your portfolio lacks sufficient macro hedging against systemic tail risks." if not has_gold else "You have some macro awareness with gold exposure, which shows sophistication.",
            "likes": (["Gold allocation shows awareness of currency debasement risks — very astute."] if has_gold else ["At least you're positioned in the market."]) + (["Crypto exposure gives you optionality on monetary system disruption."] if has_crypto else []),
            "concerns": ["I see insufficient protection against a major deleveraging event.", "Where is your currency hedge? The dollar's trajectory is a critical variable you're ignoring."],
            "advice": [
                "Always think in terms of reflexivity — prices influence fundamentals, which influence prices. Identify the feedback loops.",
                "Size your positions based on conviction. When you see the trade, bet big. When uncertain, stay small.",
                "Monitor central bank balance sheets weekly. They are the single most important variable in all markets.",
            ],
            "signature_move": "I'd establish a significant position in currencies or sovereign bonds of nations diverging from Fed policy. The forex market is where the real macro thesis plays out.",
            "closing_wisdom": "Markets are constantly in a state of uncertainty. It's not about predicting — it's about recognizing when the odds are in your favor.",
        }

    elif persona_id == "cathie_wood":
        return {
            "greeting": "Oh, I love looking at portfolios! Let's see where the innovation exposure is.",
            "portfolio_grade": "A-" if has_crypto else "C+",
            "grade_reason": "Great to see digital asset exposure! Innovation is the key to exponential returns." if has_crypto else "I'm concerned about the lack of disruptive innovation exposure. This portfolio looks too traditional.",
            "likes": (["Bitcoin exposure is excellent — it's a rules-based monetary system that will reach $1M+ per coin."] if has_crypto else []) + ["You're actively managing your portfolio, which shows engagement with the innovation thesis."],
            "concerns": (["Not enough exposure to AI, genomics, and autonomous technology platforms."] if not has_equities else []) + ["Time horizon matters — are you thinking 5 years out? Most investors are too short-term."],
            "advice": [
                "Allocate at least 20% to disruptive innovation: AI infrastructure, autonomous systems, multi-omics, and digital wallets.",
                "Think about convergence — when AI meets robotics meets energy storage, the compounding innovation creates exponential value.",
                "Don't be afraid of volatility. Volatility is the price of admission for transformative returns.",
            ],
            "signature_move": "I'd add significant exposure to companies at the intersection of AI and genomics — that convergence will be the biggest wealth creation event of the next decade.",
            "closing_wisdom": "Innovation solves problems. The bigger the problem, the bigger the opportunity. We are in the largest innovation cycle in history.",
        }

    elif persona_id == "dalio":
        return {
            "greeting": "Let me run this through my mental model of how the economic machine works.",
            "portfolio_grade": "C" if num_assets < 3 else "B",
            "grade_reason": "Insufficient diversification across economic environments. You need assets that perform in each quadrant." if num_assets < 3 else "Reasonable diversification, but I'd optimize the risk parity weighting.",
            "likes": (["Gold provides important inflation protection in the portfolio."] if has_gold else ["You have some asset diversity."]) + ["Active portfolio management shows you're thinking about risk."],
            "concerns": ["This portfolio is not balanced for all economic environments — growth, recession, inflation, and deflation.", "Where are your inflation-linked bonds? Where is your commodity exposure beyond gold?"],
            "advice": [
                "Build an All Weather portfolio: 30% stocks, 40% long-term bonds, 15% intermediate bonds, 7.5% gold, 7.5% commodities.",
                "Think in terms of risk parity — equalize the RISK contribution of each asset class, not the dollar allocation.",
                "Understand where we are in the long-term debt cycle. That determines everything.",
            ],
            "signature_move": "I'd immediately add Treasury Inflation-Protected Securities (TIPS) and a broad commodity index to create true all-weather resilience.",
            "closing_wisdom": "He who lives by the crystal ball will eat shattered glass. Diversify across economic environments, not just assets.",
        }

    else:  # lynch
        return {
            "greeting": "Let's keep this simple. Tell me — do you actually USE the products of the companies you own?",
            "portfolio_grade": "B" if has_equities else "C+",
            "grade_reason": "You've got some direct equity exposure, which tells me you might actually understand what you own." if has_equities else "I'd like to see more investments in companies whose products you use every day.",
            "likes": ["You're investing directly rather than just following the crowd."] + (["Equity positions suggest you understand actual businesses."] if has_equities else []),
            "concerns": ["Do you actually know WHY you own each of these? If not, that's a red flag.", "Have you calculated the PEG ratio for your equity holdings? Growth at a reasonable price is the key."],
            "advice": [
                "Walk through a shopping mall. What stores are packed? What products are people obsessed with? That's your research.",
                "Look for companies growing earnings 20-25% per year that you can buy at reasonable P/E ratios. That's a ten-bagger setup.",
                "Categorize each holding: is it a fast grower, a stalwart, a cyclical, or a turnaround? Your strategy should differ for each.",
            ],
            "signature_move": "I'd look at what your teenagers are buying, what apps they can't live without, what brands they're obsessed with — and invest in THOSE companies before Wall Street catches on.",
            "closing_wisdom": "Know what you own, and know why you own it. A stock is not a lottery ticket — it's part ownership of a business.",
        }
