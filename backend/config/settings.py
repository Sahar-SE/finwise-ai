"""
Django settings for the FinWise-AI backend (SRS Target Architecture: Django 5.x+).
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "django-insecure-change-me-in-production")
DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"
ALLOWED_HOSTS = [h.strip() for h in os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if h.strip()]

COOKIE_SECURE = os.environ.get("COOKIE_SECURE", "False") == "True"
PUBLIC_SITE_URL = os.environ.get("PUBLIC_SITE_URL", "https://example.com")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    # FinWise-AI apps
    "users",
    "market",
    "assets",
    "predictions",
    "surveys",
    "seo",
    "traffic",
    "adminpanel",
    "news",
    "trade_journal",
    "rag",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "traffic.middleware.TrafficLoggerMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ---------------- Database ----------------
# SQLite by default (zero-config, free-hosting friendly). Set DATABASE_URL
# to a Postgres connection string (e.g. from Render/Neon/Supabase free tier)
# for persistent production storage - see README section 4.
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    import dj_database_url
    DATABASES = {"default": dj_database_url.parse(DATABASE_URL, conn_max_age=600)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "data" / "finwise.sqlite3",
        }
    }
(BASE_DIR / "data").mkdir(exist_ok=True)

AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------- CORS ----------------
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get(
        "CORS_ORIGIN",
        "http://localhost:5173,http://127.0.0.1:5173,http://0.0.0.0:5173",
    ).split(",")
    if o.strip()
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost(:\\d+)?$",
    r"^http://127\\.0\\.0\\.1(:\\d+)?$",
    r"^http://0\\.0\\.0\\.0(:\\d+)?$",
]
CORS_ALLOW_CREDENTIALS = True

# ---------------- Django REST Framework ----------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("users.authentication.CookieOrHeaderJWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticatedOrReadOnly",),
    "DEFAULT_THROTTLE_CLASSES": ("rest_framework.throttling.AnonRateThrottle", "rest_framework.throttling.UserRateThrottle"),
    "DEFAULT_THROTTLE_RATES": {
        # SRS 5.2: max 60 requests/minute/IP on public endpoints
        "anon": os.environ.get("RATE_LIMIT_ANON", "60/min"),
        "user": os.environ.get("RATE_LIMIT_USER", "120/min"),
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=int(os.environ.get("JWT_ACCESS_DAYS", "7"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ---------------- Cache (SRS 5.1: sub-45ms cached public API responses) ----------------
# In-memory by default; point CACHE_URL at a free Redis instance (e.g. Upstash)
# for a multi-process production deployment.
REDIS_URL = os.environ.get("REDIS_URL")
if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
        }
    }
else:
    CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

# ---------------- Celery (SRS REQ-BE-001: AI Processing Layer) ----------------
# Defaults to eager (in-process, synchronous) execution so the whole app runs
# as a single free-tier web service with zero extra infrastructure. Set
# CELERY_TASK_ALWAYS_EAGER=False + CELERY_BROKER_URL=redis://... and run a
# separate `celery -A config worker` process for true async/multi-worker
# scaling - see README section 4.
CELERY_TASK_ALWAYS_EAGER = os.environ.get("CELERY_TASK_ALWAYS_EAGER", "True") == "True"
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", REDIS_URL or "memory://")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"

# ---------------- Admin bootstrap ----------------
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")

# ---------------- Security (SRS 5.2) ----------------
SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "False") == "True"
SESSION_COOKIE_SECURE = COOKIE_SECURE
CSRF_COOKIE_SECURE = COOKIE_SECURE
