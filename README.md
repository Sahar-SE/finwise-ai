# FinWise-AI

A full-stack AI-assisted market intelligence application for tracking Crypto,
Gold, and Equity ("Trading") markets — built to the FinWise-AI Software
Requirements Specification (SRS v1.1.0).

**Stack:** React (Vite) frontend · Django 6 + Django REST Framework backend ·
Celery-based async prediction layer · SQLite (dev) / Postgres (production).

See `FinWise-AI_User_Guide.pdf` (in the project zip you downloaded) for the
full feature guide, local setup instructions, and free-hosting deployment
steps for both the frontend (Vercel) and backend (Render).

## Quick start

**Backend**
```bash
cd backend
cp .env.example .env
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py bootstrap_admin
python manage.py runserver 0.0.0.0:8000
```

**Frontend**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173 and log in with your bootstrapped admin account (defined in `backend/.env`).

## Project layout

```
finwise-ai/
├── backend/            Django REST Framework API
│   ├── config/                project settings, urls, celery app
│   ├── users/                 custom User model, JWT auth (cookie + header)
│   ├── market/                live crypto/gold/equity data feeds
│   ├── assets/                portfolio holdings + CSV/JSON import
│   ├── predictions/            Celery-backed async AI prediction engine
│   ├── surveys/                public feedback + Django Admin moderation
│   ├── seo/                    SEO meta rules, sitemap.xml, robots.txt
│   ├── traffic/                privacy-friendly traffic logging + dashboard
│   ├── adminpanel/             JSON endpoints for the React admin console
│   ├── render.yaml, Procfile, build.sh   Render deployment config
│   └── requirements.txt
└── frontend/           React (Vite) single-page app
    ├── src/pages/              Landing, Login, Register, Dashboard,
    │                           Portfolio, Predictions, Feedback
    ├── src/pages/admin/        SEO manager, survey moderation,
    │                           traffic dashboard, users
    ├── src/components/         Navbar, PriceTicker, route guards
    ├── src/context/            AuthContext (JWT session state)
    └── vercel.json             SPA rewrite rule for Vercel
```

## Notes

- The **Django Admin** at `/admin/` is fully wired up as the primary survey
  moderation panel (per the SRS's moderation workflow diagram), with
  Approve/Reject bulk actions. The React admin console at `/admin` in the
  frontend calls the same data through JSON endpoints for a unified
  in-app experience.
- Async AI predictions run through **Celery**. By default `CELERY_TASK_ALWAYS_EAGER=True`
  so the whole app runs as a single free-tier web service with no extra
  infrastructure. Set it to `False` with a real Redis broker + a separate
  `celery -A config worker` process to scale to true background workers.
- Crypto prices are live (CoinGecko, no key required). Gold and equities use
  a realistic simulated feed by default — see the PDF guide for connecting
  real providers.

Not financial advice.
