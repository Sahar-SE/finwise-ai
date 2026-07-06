"""
Statistical trend/prediction model (SRS REQ-BE-003 Market Modeling, SRS 5.3
Data Quality). This is a transparent, explainable statistical model (moving
averages + linear regression trend + z-score outlier filtering) rather than a
black-box deep learning model, so the reference implementation stays fast,
dependency-light, and fully auditable. Swap in a real ML/DL model here
(e.g. via scikit-learn, PyTorch, or a hosted inference API) without touching
the async task plumbing in tasks.py.
"""

from datetime import datetime, timezone


def _moving_average(series, window):
    if len(series) < window:
        return None
    chunk = series[-window:]
    return sum(chunk) / len(chunk)


def _linear_regression_slope(series):
    n = len(series)
    if n < 2:
        return 0.0
    xs = list(range(n))
    x_mean = sum(xs) / n
    y_mean = sum(series) / n
    num = sum((xs[i] - x_mean) * (series[i] - y_mean) for i in range(n))
    den = sum((xs[i] - x_mean) ** 2 for i in range(n))
    return 0.0 if den == 0 else num / den


def _remove_outliers(series):
    mean = sum(series) / len(series)
    variance = sum((v - mean) ** 2 for v in series) / len(series)
    std = variance ** 0.5 or 1
    return [v for v in series if abs((v - mean) / std) <= 3]


def run_prediction_model(symbol, price_series):
    clean = _remove_outliers(price_series) or price_series
    ma5 = _moving_average(clean, min(5, len(clean)))
    ma20 = _moving_average(clean, min(20, len(clean)))
    slope = _linear_regression_slope(clean)
    last_price = clean[-1]

    trend_strength = min(1.0, abs(slope) / (last_price * 0.01 or 1))
    direction = "bullish" if slope > 0 else "bearish" if slope < 0 else "neutral"
    confidence = round(50 + trend_strength * 40, 1)  # 50-90%
    horizon_price = round(last_price + slope * 5, 4)

    return {
        "symbol": symbol,
        "direction": direction,
        "confidence_pct": confidence,
        "moving_average_5": round(ma5, 4) if ma5 else None,
        "moving_average_20": round(ma20, 4) if ma20 else None,
        "trend_slope": round(slope, 6),
        "projected_price_next_period": horizon_price,
        "last_price": last_price,
        "disclaimer": "Statistical projection for informational purposes only. Not financial advice.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
