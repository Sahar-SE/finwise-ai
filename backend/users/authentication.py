from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieOrHeaderJWTAuthentication(JWTAuthentication):
    """
    Accepts a JWT either via the standard 'Authorization: Bearer <token>' header
    (used by the React SPA) or via an HttpOnly 'access_token' cookie, satisfying
    the SRS's requirement (REQ-FE-001) for HTTP-only cookie based session state
    while remaining compatible with a token-in-header SPA client.
    """

    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
        else:
            raw_token = request.COOKIES.get("access_token")

        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
