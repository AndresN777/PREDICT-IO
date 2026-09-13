from typing import Any
from pydantic import BaseModel, Field


class PredictRequest(BaseModel):
    home_team_id: int
    away_team_id: int
    competition_code: str = "PL"
    season: int | None = None


class ApiMessage(BaseModel):
    message: str
    demo: bool = False


class PredictionResponse(BaseModel):
    home_team: str
    away_team: str
    probabilities: dict[str, float]
    expected_goals: dict[str, float]
    most_likely_score: str
    markets: dict[str, float]
    method: str
    confidence: str


class ListResponse(BaseModel):
    items: list[dict[str, Any]]
    total: int
    demo: bool = False
