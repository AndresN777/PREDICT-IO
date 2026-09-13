import math
from sklearn.ensemble import RandomForestClassifier


class PredictionService:
    def __init__(self, data_service):
        self.data_service = data_service

    def predict(
        self,
        home_team_id: int,
        away_team_id: int,
        competition_code: str = "PL",
        season: int | None = None,
    ) -> dict:
        analytics = __import__(
            "app.services.analytics_service", fromlist=["AnalyticsService"]
        ).AnalyticsService(self.data_service)
        home = analytics.team_summary(home_team_id, competition_code, season)
        away = analytics.team_summary(away_team_id, competition_code, season)
        home_rate = max(0.15, (home["averageGoals"] or 1.35) * 1.10)
        away_rate = max(0.15, (away["averageGoals"] or 1.05) * 0.92)
        strength = (home["pointsPerMatch"] - away["pointsPerMatch"]) / 3
        home_prob = min(0.82, max(0.18, 0.43 + strength * 0.24))
        away_prob = min(0.62, max(0.12, 0.29 - strength * 0.18))
        draw_prob = max(0.08, 1 - home_prob - away_prob)
        total = home_prob + draw_prob + away_prob
        home_prob, draw_prob, away_prob = [
            round(value / total, 3) for value in (home_prob, draw_prob, away_prob)
        ]
        score = f"{round(home_rate):.0f}-{round(away_rate):.0f}"
        total_goals = home_rate + away_rate
        return {
            "home_team": str(home_team_id),
            "away_team": str(away_team_id),
            "probabilities": {
                "local": home_prob,
                "empate": draw_prob,
                "visitante": away_prob,
            },
            "expected_goals": {
                "local": round(home_rate, 2),
                "visitante": round(away_rate, 2),
                "total": round(total_goals, 2),
            },
            "most_likely_score": score,
            "markets": {
                "over25": round(
                    1 - math.exp(-total_goals) * (1 + total_goals + total_goals**2 / 2),
                    3,
                ),
                "bothScore": round(
                    (1 - math.exp(-home_rate)) * (1 - math.exp(-away_rate)), 3
                ),
            },
            "method": "Heurística de fuerza + promedio de goles (scikit-learn disponible para evolución del modelo)",
            "confidence": "media" if abs(home_prob - away_prob) < 0.2 else "alta",
        }
