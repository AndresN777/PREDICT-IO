from pathlib import Path
import numpy as np
import pandas as pd


class DataService:
    def __init__(self, parquet_path: str):
        self.parquet_path = Path(parquet_path)
        self.demo = False
        self.data = self._load()

    def _load(self) -> pd.DataFrame:
        if self.parquet_path.exists():
            frame = pd.read_parquet(self.parquet_path)
            self.demo = False
            return self._prepare(frame)
        self.demo = True
        return self._prepare(self._demo_data())

    @staticmethod
    def _prepare(frame: pd.DataFrame) -> pd.DataFrame:
        frame = frame.copy()
        for column in ["score.fullTime.home", "score.fullTime.away"]:
            if column not in frame:
                frame[column] = np.nan
        frame["matchDate"] = pd.to_datetime(
            frame.get("utcDate"), errors="coerce", utc=True
        )
        frame["homeGoals"] = pd.to_numeric(
            frame["score.fullTime.home"], errors="coerce"
        )
        frame["awayGoals"] = pd.to_numeric(
            frame["score.fullTime.away"], errors="coerce"
        )
        frame["isFinished"] = (
            frame.get("status", "").eq("FINISHED")
            if hasattr(frame.get("status", ""), "eq")
            else False
        )
        frame["homeTeamId"] = pd.to_numeric(frame.get("homeTeam.id"), errors="coerce")
        frame["awayTeamId"] = pd.to_numeric(frame.get("awayTeam.id"), errors="coerce")
        frame["competitionCode"] = frame.get(
            "competition.code", frame.get("source_competition", "N/D")
        )
        frame["seasonKey"] = frame.get("source_season", frame.get("season.id", "N/D"))
        return frame

    @staticmethod
    def _demo_data() -> pd.DataFrame:
        teams = [
            (1, "Arsenal FC", "ARS"),
            (2, "Manchester City FC", "MCI"),
            (3, "Liverpool FC", "LIV"),
            (4, "Chelsea FC", "CHE"),
            (5, "Real Madrid CF", "RMA"),
            (6, "FC Barcelona", "FCB"),
            (7, "FC Bayern München", "FCB"),
            (8, "Borussia Dortmund", "BVB"),
        ]
        competitions = [
            ("PL", "Premier League", "England"),
            ("PD", "Primera Division", "Spain"),
            ("BL1", "Bundesliga", "Germany"),
        ]
        rows = []
        rng = np.random.default_rng(42)
        match_id = 1
        for season in [2023, 2024, 2025]:
            for code, name, area in competitions:
                league_teams = (
                    teams[:4]
                    if code == "PL"
                    else teams[4:6] if code == "PD" else teams[6:]
                )
                for home_id, home_name, home_tla in league_teams:
                    for away_id, away_name, away_tla in league_teams:
                        if home_id == away_id:
                            continue
                        home_goals = int(rng.poisson(1.5))
                        away_goals = int(rng.poisson(1.1))
                        rows.append(
                            {
                                "id": match_id,
                                "utcDate": f"{season}-09-{(match_id % 27) + 1:02d}T15:00:00Z",
                                "status": "FINISHED",
                                "matchday": match_id % 38 + 1,
                                "stage": "REGULAR_SEASON",
                                "group": None,
                                "lastUpdated": f"{season}-10-01T20:20:00Z",
                                "area.name": area,
                                "area.code": code[:3],
                                "competition.id": {"PL": 2021, "PD": 2014, "BL1": 2002}[
                                    code
                                ],
                                "competition.name": name,
                                "competition.code": code,
                                "competition.type": "LEAGUE",
                                "season.id": season,
                                "season.startDate": f"{season}-08-01",
                                "season.endDate": f"{season + 1}-05-30",
                                "season.currentMatchday": 38,
                                "homeTeam.id": home_id,
                                "homeTeam.name": home_name,
                                "homeTeam.shortName": home_name.replace(" FC", ""),
                                "homeTeam.tla": home_tla,
                                "awayTeam.id": away_id,
                                "awayTeam.name": away_name,
                                "awayTeam.shortName": away_name.replace(" FC", ""),
                                "awayTeam.tla": away_tla,
                                "score.winner": (
                                    "HOME_TEAM"
                                    if home_goals > away_goals
                                    else (
                                        "AWAY_TEAM"
                                        if away_goals > home_goals
                                        else "DRAW"
                                    )
                                ),
                                "score.duration": "REGULAR",
                                "score.fullTime.home": home_goals,
                                "score.fullTime.away": away_goals,
                                "source_competition": code,
                                "source_season": season,
                            }
                        )
                        match_id += 1
        return pd.DataFrame(rows)

    def refresh(self) -> None:
        self.data = self._load()

    def competitions(self) -> list[dict]:
        grouped = self.data.groupby(
            ["competitionCode", "competition.name", "area.name", "competition.type"],
            dropna=False,
        )
        items = []
        for (code, name, area, kind), group in grouped:
            items.append(
                {
                    "code": code,
                    "name": name,
                    "area": area,
                    "type": kind,
                    "matches": int(len(group)),
                    "seasons": sorted(
                        group["seasonKey"].dropna().astype(str).unique().tolist()
                    ),
                }
            )
        return sorted(items, key=lambda item: str(item["name"]))

    def teams(
        self, competition_code: str | None = None, season: int | None = None
    ) -> list[dict]:
        frame = self.data
        if competition_code:
            frame = frame[frame["competitionCode"] == competition_code]
        if season:
            frame = frame[frame["seasonKey"] == season]
        home = frame[
            ["homeTeamId", "homeTeam.name", "homeTeam.shortName", "homeTeam.tla"]
        ].rename(
            columns={
                "homeTeamId": "id",
                "homeTeam.name": "name",
                "homeTeam.shortName": "shortName",
                "homeTeam.tla": "tla",
            }
        )
        away = frame[
            ["awayTeamId", "awayTeam.name", "awayTeam.shortName", "awayTeam.tla"]
        ].rename(
            columns={
                "awayTeamId": "id",
                "awayTeam.name": "name",
                "awayTeam.shortName": "shortName",
                "awayTeam.tla": "tla",
            }
        )
        result = pd.concat([home, away]).drop_duplicates(subset=["id"])
        return result.fillna("").to_dict(orient="records")

    def matches(
        self,
        competition_code: str | None = None,
        season: int | None = None,
        limit: int = 12,
    ) -> pd.DataFrame:
        frame = self.data
        if competition_code:
            frame = frame[frame["competitionCode"] == competition_code]
        if season:
            frame = frame[frame["seasonKey"] == season]
        return frame.sort_values("matchDate", ascending=False).head(limit)

    def explore(
        self,
        search: str | None = None,
        competition_code: str | None = None,
        season: str | None = None,
        status: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
        min_goals: int | None = None,
        max_goals: int | None = None,
        sort_by: str = "matchDate",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 25,
    ) -> dict:
        frame = self.data.copy()
        if search:
            term = search.strip().casefold()
            searchable = (
                frame[
                    [
                        "homeTeam.name",
                        "awayTeam.name",
                        "competition.name",
                        "competitionCode",
                    ]
                ]
                .fillna("")
                .astype(str)
                .agg(" ".join, axis=1)
                .str.casefold()
            )
            frame = frame[searchable.str.contains(term, regex=False)]
        if competition_code:
            frame = frame[frame["competitionCode"].astype(str) == competition_code]
        if season:
            frame = frame[frame["seasonKey"].astype(str) == season]
        if status:
            frame = frame[frame["status"].astype(str) == status]
        if date_from:
            frame = frame[frame["matchDate"] >= pd.to_datetime(date_from, utc=True)]
        if date_to:
            end_date = pd.to_datetime(date_to, utc=True) + pd.Timedelta(days=1)
            frame = frame[frame["matchDate"] < end_date]
        total_goals = frame["homeGoals"].fillna(0) + frame["awayGoals"].fillna(0)
        if min_goals is not None:
            frame = frame[total_goals >= min_goals]
        if max_goals is not None:
            frame = frame[total_goals <= max_goals]

        sort_columns = {
            "matchDate": "matchDate",
            "competition": "competition.name",
            "home": "homeTeam.name",
            "away": "awayTeam.name",
            "goals": "totalGoals",
        }
        frame = frame.assign(totalGoals=total_goals.loc[frame.index])
        frame = frame.sort_values(
            sort_columns.get(sort_by, "matchDate"),
            ascending=sort_order != "desc",
            na_position="last",
        )
        total = len(frame)
        start = (page - 1) * page_size
        visible = frame.iloc[start : start + page_size]
        records = []
        for _, row in visible.iterrows():
            records.append(
                {
                    "id": row.get("id"),
                    "date": (
                        row.get("matchDate").isoformat()
                        if pd.notna(row.get("matchDate"))
                        else None
                    ),
                    "status": row.get("status", "N/D"),
                    "competition": row.get(
                        "competition.name", row.get("competitionCode", "N/D")
                    ),
                    "competitionCode": row.get("competitionCode", "N/D"),
                    "season": str(row.get("seasonKey", "N/D")),
                    "homeTeam": row.get("homeTeam.name", "N/D"),
                    "awayTeam": row.get("awayTeam.name", "N/D"),
                    "homeGoals": (
                        int(row["homeGoals"])
                        if pd.notna(row.get("homeGoals"))
                        else None
                    ),
                    "awayGoals": (
                        int(row["awayGoals"])
                        if pd.notna(row.get("awayGoals"))
                        else None
                    ),
                    "totalGoals": int(row["totalGoals"]),
                    "matchday": row.get("matchday"),
                    "stage": row.get("stage", "N/D"),
                }
            )
        return {
            "items": records,
            "total": total,
            "page": page,
            "pageSize": page_size,
            "pages": max(1, (total + page_size - 1) // page_size),
            "facets": {
                "statuses": sorted(
                    self.data["status"].dropna().astype(str).unique().tolist()
                ),
                "seasons": sorted(
                    self.data["seasonKey"].dropna().astype(str).unique().tolist(),
                    reverse=True,
                ),
            },
            "demo": self.demo,
        }
