from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()

COOKIE_KWARGS = dict(
    httponly=True,
    secure=settings.COOKIE_SECURE,
    samesite="Lax",
    max_age=60 * 60 * 24 * 7,
)


def _tokens_for(user):
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["username"] = user.username
    access = refresh.access_token
    access["role"] = user.role
    access["username"] = user.username
    return str(access), str(refresh)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        access, refresh = _tokens_for(user)

        resp = Response(
            {"token": access, "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
        resp.set_cookie("access_token", access, **COOKIE_KWARGS)
        return resp


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        if not email or not password:
            return Response({"error": "email and password are required."}, status=400)

        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid credentials."}, status=401)

        user = authenticate(request, username=user_obj.username, password=password)
        if not user:
            return Response({"error": "Invalid credentials."}, status=401)

        access, refresh = _tokens_for(user)
        resp = Response({"token": access, "user": UserSerializer(user).data})
        resp.set_cookie("access_token", access, **COOKIE_KWARGS)
        return resp


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        resp = Response({"message": "Logged out."})
        resp.delete_cookie("access_token")
        return resp


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"user": UserSerializer(request.user).data})
