import pandas as pd


class AnalyticsService:
    def __init__(self, data_service):
        self.data_service = data_service

    def competition_summary(self, code: str, season: int | None = None) -> dict:
        frame = self.data_service.matches(code, season, 100000)
        return self._summary(frame, "competition", code)

    def compare_competitions(
        self, first_code: str, second_code: str, season: int | None = None
    ) -> dict:
        first = self.competition_summary(first_code, season)
        second = self.competition_summary(second_code, season)
        return {
            "first": first,
            "second": second,
            "metrics": {
                "matchesDifference": first["matches"] - second["matches"],
                "goalsDifference": round(first["goalsFor"] - second["goalsFor"], 2),
                "averageGoalsDifference": round(
                    first["averageGoals"] - second["averageGoals"], 2
                ),
                "drawRateDifference": round(
                    (first["draws"] / first["matches"] if first["matches"] else 0)
                    - (second["draws"] / second["matches"] if second["matches"] else 0),
                    3,
                ),
            },
        }

    def team_summary(
        self,
        team_id: int,
        competition_code: str | None = None,
        season: int | None = None,
    ) -> dict:
        data = self.data_service.data
        mask = (data["homeTeamId"] == team_id) | (data["awayTeamId"] == team_id)
        frame = data[mask]
        if competition_code:
            frame = frame[frame["competitionCode"] == competition_code]
        if season:
            frame = frame[frame["seasonKey"] == season]
        return self._summary(frame, "team", str(team_id), team_id)

    def compare_teams(
        self,
        first_id: int,
        second_id: int,
        competition_code: str | None = None,
        season: int | None = None,
    ) -> dict:
        first = self.team_summary(first_id, competition_code, season)
        second = self.team_summary(second_id, competition_code, season)
        return {
            "first": first,
            "second": second,
            "metrics": {
                "goalsForDifference": round(first["goalsFor"] - second["goalsFor"], 2),
                "pointsPerMatchDifference": round(
                    first["pointsPerMatch"] - second["pointsPerMatch"], 2
                ),
            },
        }

    def _summary(
        self, frame: pd.DataFrame, kind: str, key: str, team_id: int | None = None
    ) -> dict:
        if team_id is not None:
            home = frame[frame["homeTeamId"] == team_id]
            away = frame[frame["awayTeamId"] == team_id]
            goals_for = home["homeGoals"].sum() + away["awayGoals"].sum()
            goals_against = home["awayGoals"].sum() + away["homeGoals"].sum()
            wins = (home["homeGoals"] > home["awayGoals"]).sum() + (
                away["awayGoals"] > away["homeGoals"]
            ).sum()
            draws = (home["homeGoals"] == home["awayGoals"]).sum() + (
                away["awayGoals"] == away["homeGoals"]
            ).sum()
            matches = len(frame)
        else:
            goals_for = frame["homeGoals"].sum() + frame["awayGoals"].sum()
            goals_against = goals_for
            wins = (frame["homeGoals"] > frame["awayGoals"]).sum()
            draws = (frame["homeGoals"] == frame["awayGoals"]).sum()
            matches = len(frame)
        losses = max(matches - wins - draws, 0)
        points = wins * 3 + draws
        return {
            "key": key,
            "kind": kind,
            "matches": int(matches),
            "wins": int(wins),
            "draws": int(draws),
            "losses": int(losses),
            "goalsFor": round(float(goals_for), 2),
            "goalsAgainst": round(float(goals_against), 2),
            "points": int(points),
            "pointsPerMatch": round(points / matches, 2) if matches else 0,
            "averageGoals": round(float(goals_for) / matches, 2) if matches else 0,
        }

    def recent_matches(self, team_id: int, limit: int = 8) -> list[dict]:
        frame = self.data_service.data
        frame = (
            frame[(frame["homeTeamId"] == team_id) | (frame["awayTeamId"] == team_id)]
            .sort_values("matchDate", ascending=False)
            .head(limit)
        )
        return (
            frame[
                [
                    "utcDate",
                    "homeTeam.name",
                    "awayTeam.name",
                    "homeGoals",
                    "awayGoals",
                    "competitionCode",
                ]
            ]
            .fillna("")
            .to_dict(orient="records")
        )
