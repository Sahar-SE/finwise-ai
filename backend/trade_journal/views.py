"""
AI Trade Journal views with Behavioral Pattern Detection.

Unique feature: analyzes a user's trading decision history to detect
emotional/behavioral patterns and provide personalized behavioral finance coaching.
"""

import json
import os
from collections import Counter

import requests
from django.db.models import Avg, Count, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import JournalEntry
from .serializers import JournalEntrySerializer

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"


class JournalListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        entries = JournalEntry.objects.filter(user=request.user)[:100]
        return Response({"data": JournalEntrySerializer(entries, many=True).data})

    def post(self, request):
        serializer = JournalEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response({"message": "Trade logged.", "entry": serializer.data}, status=201)


class JournalDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, entry_id):
        entry = JournalEntry.objects.filter(entry_id=entry_id, user=request.user).first()
        if not entry:
            return Response({"error": "Entry not found."}, status=404)
        entry.delete()
        return Response({"message": "Entry deleted."})


class JournalInsightsView(APIView):
    """AI Behavioral Intelligence — detects emotional trading patterns and provides coaching."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        entries = JournalEntry.objects.filter(user=request.user)
        total = entries.count()

        if total == 0:
            return Response({
                "total_trades": 0,
                "message": "Log your first trade to unlock AI Behavioral Intelligence insights.",
            })

        # Core metrics
        wins = entries.filter(outcome="profit").count()
        losses = entries.filter(outcome="loss").count()
        breakevens = entries.filter(outcome="breakeven").count()
        open_trades = entries.filter(outcome="open").count()
        closed = wins + losses + breakevens
        win_rate = round((wins / closed) * 100, 1) if closed > 0 else 0

        # Emotion distribution
        emotion_counts = dict(entries.values_list("emotion").annotate(c=Count("id")).values_list("emotion", "c"))
        total_emotions = sum(emotion_counts.values()) or 1
        emotion_distribution = {k: round((v / total_emotions) * 100, 1) for k, v in emotion_counts.items()}

        # Detect dominant emotion
        dominant_emotion = max(emotion_counts, key=emotion_counts.get) if emotion_counts else "disciplined"

        # Emotional bias patterns
        fomo_trades = entries.filter(emotion="fomo").count()
        revenge_trades = entries.filter(emotion="revenge").count()
        fearful_trades = entries.filter(emotion="fearful").count()
        disciplined_trades = entries.filter(emotion="disciplined").count()

        fomo_pct = round((fomo_trades / total) * 100, 1)
        revenge_pct = round((revenge_trades / total) * 100, 1)

        # Win rate by emotion
        emotion_win_rates = {}
        for emo in ["confident", "fearful", "fomo", "revenge", "disciplined", "greedy", "uncertain"]:
            emo_entries = entries.filter(emotion=emo)
            emo_closed = emo_entries.filter(outcome__in=["profit", "loss", "breakeven"]).count()
            emo_wins = emo_entries.filter(outcome="profit").count()
            if emo_closed > 0:
                emotion_win_rates[emo] = round((emo_wins / emo_closed) * 100, 1)

        # Behavioral patterns detected
        patterns = []
        if fomo_pct > 25:
            patterns.append({
                "type": "warning",
                "title": "High FOMO Trading Frequency",
                "detail": f"{fomo_pct}% of your trades are driven by FOMO. These tend to have lower win rates.",
            })
        if revenge_pct > 15:
            patterns.append({
                "type": "danger",
                "title": "Revenge Trading Detected",
                "detail": f"{revenge_pct}% of trades appear to be revenge trades — emotional reactions to prior losses.",
            })
        if emotion_win_rates.get("disciplined", 0) > emotion_win_rates.get("fomo", 100):
            patterns.append({
                "type": "positive",
                "title": "Discipline Pays Off",
                "detail": f"Your disciplined trades win {emotion_win_rates.get('disciplined', 0)}% of the time vs {emotion_win_rates.get('fomo', 0)}% for FOMO trades.",
            })
        if win_rate > 55:
            patterns.append({
                "type": "positive",
                "title": "Above-Average Win Rate",
                "detail": f"Your {win_rate}% win rate exceeds the typical retail trader average of ~45%.",
            })
        elif win_rate < 40 and closed > 3:
            patterns.append({
                "type": "warning",
                "title": "Win Rate Below Benchmark",
                "detail": f"Your {win_rate}% win rate is below average. Focus on higher-conviction, disciplined entries.",
            })

        if not patterns:
            patterns.append({
                "type": "info",
                "title": "Building Your Profile",
                "detail": "Log more trades to unlock detailed behavioral pattern detection and AI coaching.",
            })

        # Emotional discipline score (0-100)
        discipline_score = min(100, max(10, int(
            (disciplined_trades / total) * 60
            + (win_rate / 100) * 30
            + (10 - min(10, fomo_trades + revenge_trades))
        )))

        # AI coaching advice
        coaching = _generate_coaching(dominant_emotion, win_rate, fomo_pct, revenge_pct, discipline_score, patterns)

        return Response({
            "total_trades": total,
            "wins": wins,
            "losses": losses,
            "breakevens": breakevens,
            "open_trades": open_trades,
            "win_rate_pct": win_rate,
            "emotion_distribution": emotion_distribution,
            "dominant_emotion": dominant_emotion,
            "emotion_win_rates": emotion_win_rates,
            "patterns": patterns,
            "discipline_score": discipline_score,
            "coaching": coaching,
        })


def _generate_coaching(dominant_emotion, win_rate, fomo_pct, revenge_pct, discipline_score, patterns):
    """Generate AI coaching advice — LLM with fallback."""
    prompt = (
        f"You are a Behavioral Finance Coach analyzing a trader's journal. "
        f"Dominant emotion: {dominant_emotion}. Win rate: {win_rate}%. "
        f"FOMO trade frequency: {fomo_pct}%. Revenge trade frequency: {revenge_pct}%. "
        f"Emotional discipline score: {discipline_score}/100.\n"
        f"Detected patterns: {json.dumps([p['title'] for p in patterns])}\n\n"
        f"Provide a JSON response with:\n"
        f"1. headline: one-line coaching headline\n"
        f"2. advice: 2-3 sentence personalized coaching advice\n"
        f"3. action_items: array of 2-3 specific behavioral improvements\n"
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
    if discipline_score >= 70:
        headline = "Strong Emotional Discipline — Keep It Up"
        advice = (
            f"Your discipline score of {discipline_score}/100 shows excellent emotional control. "
            f"Continue prioritizing high-conviction, research-backed entries over reactive trades."
        )
        action_items = [
            "Maintain your current pre-trade checklist routine.",
            "Set profit targets BEFORE entering trades to lock in gains.",
            "Review your journal weekly to reinforce positive patterns.",
        ]
    elif fomo_pct > 20:
        headline = "FOMO Is Your Biggest Edge Leak"
        advice = (
            f"FOMO-driven trades account for {fomo_pct}% of your activity and likely hurt your overall win rate. "
            f"Implement a 15-minute cool-down rule: wait 15 minutes after feeling the urge before executing."
        )
        action_items = [
            "Implement a mandatory 15-minute waiting period before FOMO entries.",
            "Write down your thesis BEFORE clicking buy — if you can't, skip the trade.",
            "Track missed FOMO trades separately to see how many would have actually worked.",
        ]
    elif revenge_pct > 10:
        headline = "Revenge Trading Pattern Needs Attention"
        advice = (
            f"Revenge trades ({revenge_pct}% of your history) are emotionally reactive and typically have the "
            f"worst risk/reward profiles. Set a daily loss limit and walk away when triggered."
        )
        action_items = [
            "Set a hard daily loss limit (e.g., -3% of portfolio) and stop trading when hit.",
            "After a loss, log the trade and close your platform for at least 1 hour.",
            "Replace revenge impulses with journal reflection — write what went wrong first.",
        ]
    else:
        headline = "Solid Foundation — Room to Optimize"
        advice = (
            f"Your trading behavior shows a healthy balance. Focus on increasing your win rate "
            f"from {win_rate}% by being more selective with entry points and tightening stop-losses."
        )
        action_items = [
            "Review your best trades and identify what made them work — replicate that setup.",
            "Reduce position sizes on lower-confidence trades.",
            "Aim to log every trade — consistent journaling improves self-awareness significantly.",
        ]

    return {"headline": headline, "advice": advice, "action_items": action_items}
