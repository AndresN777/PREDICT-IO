from fastapi import APIRouter, Query, Request
from app.schemas import ListResponse, PredictRequest, PredictionResponse

router = APIRouter()


def get_services(request: Request):
    return (
        request.app.state.data_service,
        request.app.state.analytics_service,
        request.app.state.prediction_service,
    )


@router.get("/health")
def health(request: Request):
    data_service, _, _ = get_services(request)
    return {"status": "ok", "demo": data_service.demo, "rows": len(data_service.data)}


@router.get("/meta")
def meta(request: Request):
    data_service, _, _ = get_services(request)
    return {
        "columns": list(data_service.data.columns),
        "rows": len(data_service.data),
        "demo": data_service.demo,
    }


@router.get("/competitions", response_model=ListResponse)
def competitions(request: Request):
    data_service, _, _ = get_services(request)
    items = data_service.competitions()
    return {"items": items, "total": len(items), "demo": data_service.demo}


@router.get("/competitions/compare")
def compare_competitions(
    request: Request, first_code: str, second_code: str, season: int | None = None
):
    _, analytics, _ = get_services(request)
    return analytics.compare_competitions(first_code, second_code, season)


@router.get("/competitions/{code}")
def competition(code: str, request: Request, season: int | None = None):
    data_service, analytics, _ = get_services(request)
    summary = analytics.competition_summary(code, season)
    matches = (
        data_service.matches(code, season)
        .loc[
            :,
            [
                "utcDate",
                "homeTeam.name",
                "awayTeam.name",
                "homeGoals",
                "awayGoals",
                "status",
            ],
        ]
        .fillna("")
        .to_dict(orient="records")
    )
    return {"code": code, "summary": summary, "matches": matches}


@router.get("/teams", response_model=ListResponse)
def teams(
    request: Request,
    competition_code: str | None = Query(default=None),
    season: int | None = None,
):
    data_service, _, _ = get_services(request)
    items = data_service.teams(competition_code, season)
    return {"items": items, "total": len(items), "demo": data_service.demo}


@router.get("/teams/compare")
def compare_teams(
    request: Request,
    first_id: int,
    second_id: int,
    competition_code: str | None = None,
    season: int | None = None,
):
    _, analytics, _ = get_services(request)
    return analytics.compare_teams(first_id, second_id, competition_code, season)


@router.get("/teams/{team_id}")
def team(
    team_id: int,
    request: Request,
    competition_code: str | None = None,
    season: int | None = None,
):
    _, analytics, _ = get_services(request)
    return {
        "summary": analytics.team_summary(team_id, competition_code, season),
        "recentMatches": analytics.recent_matches(team_id),
    }


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictRequest, request: Request):
    _, _, prediction = get_services(request)
    return prediction.predict(
        payload.home_team_id,
        payload.away_team_id,
        payload.competition_code,
        payload.season,
    )
