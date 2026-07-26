from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import (
    analyze_newsletter_with_ai,
    ask_ai_about_newsletter,
    get_all_newsletters,
    get_newsletter_by_id,
)


class NewsletterListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        category = request.query_params.get("category")
        items = get_all_newsletters()
        if category and category != "all":
            items = [n for n in items if n["category"] == category]
        return Response({"data": items})


class NewsletterAnalyzeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        news_id = request.data.get("news_id")
        custom_text = request.data.get("custom_text")

        if news_id:
            item = get_newsletter_by_id(news_id)
            if not item:
                return Response({"error": "Newsletter not found."}, status=404)
        elif custom_text:
            item = {"title": "Custom User News Analysis", "content": custom_text, "category": "macro"}
        else:
            return Response({"error": "news_id or custom_text is required."}, status=400)

        analysis = analyze_newsletter_with_ai(item)
        return Response({"news_id": news_id, "analysis": analysis})


class NewsletterAskView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        news_id = request.data.get("news_id")
        user_question = request.data.get("question")

        if not news_id or not user_question:
            return Response({"error": "news_id and question are required."}, status=400)

        item = get_newsletter_by_id(news_id)
        if not item:
            item = {"title": "Market News Analysis", "content": "General market news digest."}

        result = ask_ai_about_newsletter(item, user_question)
        return Response(result)
