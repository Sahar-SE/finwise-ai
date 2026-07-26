# FinWise-AI

**FinWise-AI** is a premium, end-to-end AI-powered financial market intelligence and portfolio risk analytics platform designed for retail investors and traders. 

- **Live Deployed App URL**: [https://finwise-ai-nu.vercel.app](https://finwise-ai-nu.vercel.app)
- **Backend API URL**: [https://finwise-backend.onrender.com](https://finwise-backend.onrender.com)

---

## 💡 Real Problem & Solution

### The Problem
Retail financial investors face information overload from newsletters, news feeds, and technical charts. Standard consumer platforms (like Yahoo Finance, CoinGecko, and TradingView) show raw price data but do not offer interactive tools to simulate how macroeconomic crises impact their *actual holdings*, nor do they evaluate the *emotional/behavioral patterns* behind a trader's journal.

### The Solution
FinWise-AI solves this by combining raw technical data feeds with **Behavioral AI and Macro Stress Simulators**. It lets users:
1. View live charts and run ensembles of quantitative indicator forecasts.
2. Interactively shock their actual portfolios with macro events (rate hikes, crypto winter, black swan) to get AI-generated hedging steps.
3. Track their trading emotional bias (FOMO, Revenge, Discipline) and receive automated behavioral coaching.
4. Consult AI investor personas (Warren Buffett, George Soros, Cathie Wood, Ray Dalio, Peter Lynch) regarding their actual holdings.
5. Travel back in time to simulate entry points at famous historical market crashes.

---

## 🚀 App Features

1. **AI predictions (Multi-Horizon)**: Ensembles technical indicators (RSI, MACD, EMAs, Bollinger Bands, ATR) with Monte Carlo simulations to forecast asset trends over 24h, 7d, and 30d horizons.
2. **AI newsletter & Intelligence Hub**: Aggregates fresh financial newsletter digests and uses AI to summarize executive takeaways, list affected assets, and support an interactive Q&A follow-up assistant.
3. **AI Portfolio Health & Risk Advisor**: Analyzes portfolio diversification, risk indicators, and P&L performance.
4. **AI Portfolio Stress Test (What-If Simulator)**: Simulates market shock multipliers on real portfolio holdings and generates structured hedging strategies.
5. **AI Trade Journal & Behavioral Finance Coaching**: Tracks emotional states during trading and scores the user's emotional discipline (win rate by emotion, fomo warnings).
6. **AI Legendary Investor Persona Advisor**: Delivers personalized advice from Buffett, Soros, Wood, Dalio, or Lynch in their authentic voice and philosophy.
7. **Portfolio Time Machine**: Simulates what the user's portfolio would be worth if invested at historical coordinates (COVID bottom, BTC halving, 2017 boom).
8. **Cross-Asset Correlation Heatmap & Contagion Radar**: Renders interactive SVG correlation matrices for portfolio assets with coupling contagion warnings.

---

## 🤖 AI Features & System Prompts

FinWise-AI leverages advanced AI models (Google Gemini API / OpenAI API / G4F fallback) to drive the intelligence layer. Below are the prompts engineered for these features:

### 1. Advanced Technical & Thesis Predictor
- **What it does**: Analyzes price series, RSI, MACD, EMAs, and Monte Carlo data to write a detailed market catalyst thesis, key trends, and risk factors.
- **System Instructions**:
```
You are a Senior Financial Analyst and Quantitative Trader. Analyze the given price data and indicators, then return a JSON response with:
- market_thesis: a 2-3 sentence overview of the current trend.
- key_catalysts: an array of 2-3 bullish or bearish factors.
- risk_factors: an array of 2-3 primary risks to monitor.
```

### 2. Interactive AI Legendary Investor Persona Advisor
- **What it does**: Reviews user holdings in the authentic voice and strategy of a chosen legend.
- **System Instructions**:
```
You are [Warren Buffett / George Soros / Cathie Wood / Ray Dalio / Peter Lynch]. You must stay completely in character.
Using your famous quote and investment philosophy, grade the user's portfolio (A-F), state the reason, outline what you like and concern about, and give 2-3 specific action items and your closing wisdom. Return a JSON structure.
```

### 3. AI Portfolio Stress Test Hedge Generator
- **What it does**: Projects drawdowns and provides specific hedging recommendations based on the active holdings.
- **System Instructions**:
```
You are a Senior Portfolio Risk Advisor. The user's portfolio went through a [Scenario Name] shock with a drawdown of X%. 
Provide a JSON response with:
- hedge_actions: 3-4 specific hedging steps.
- protective_assets: 2-3 protective assets.
- risk_rating: LOW, MODERATE, HIGH, or CRITICAL.
- coaching_note: 1-2 sentence personalized risk advice.
```

---

## 🛠️ Stack & Tools Used

- **Frontend**: React, Vite, Lucide-React, Axios, TailwindCSS-compliant custom design system.
- **Backend**: Django 6, Django REST Framework, Celery Async Layer.
- **Database**: Neon PostgreSQL (Production), SQLite (Development).
- **AI Models**: Google Gemini 1.5 Flash API, GPT-4o-mini (via G4F keyless client), and local Financial NLP synthesizers for offline/zero-config fallback.
- **Hosting**: Vercel (Frontend), Render (Backend).

---

## 📸 Screenshots in Action

> **Instruction for Grading**: Save your screenshots inside a folder named `screenshots/` in the root of your project using the filenames below.

### 1. Landing Page & Live Market Pulse Widget
*Save screenshot as: `screenshots/landing_page.png`*
![Landing Page](./screenshots/landing_page.png)

### 2. AI Financial Digest & Newsletter Feed
*Save screenshot as: `screenshots/newsletter_feed.png`*
![AI Newsletter Feed](./screenshots/newsletter_feed.png)

### 3. AI Newsletter Impact Analysis & Advice Drawer
*Save screenshot as: `screenshots/newsletter_analysis.png`*
![AI Newsletter Analysis](./screenshots/newsletter_analysis.png)

### 4. AI Predictions & Monte Carlo Corridor Forecast
*Save screenshot as: `screenshots/predictions_chart.png`*
![AI Predictions Chart](./screenshots/predictions_chart.png)

### 5. AI Predictions Market Thesis & Catalyst Report
*Save screenshot as: `screenshots/predictions_thesis.png`*
![AI Predictions Thesis](./screenshots/predictions_thesis.png)

---

## ⚙️ How to Run Locally

### 1. Clone & Set Up Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# or: source venv/bin/activate (macOS/Linux)
pip install -r requirements.txt
python manage.py migrate
python manage.py bootstrap_admin
python manage.py runserver
```
*(Configure your local backend settings inside `backend/.env`)*

### 2. Set Up Frontend
```bash
cd frontend
npm install
npm run dev
```
*(Configure `VITE_API_BASE_URL=http://localhost:8000` inside `frontend/.env`)*
