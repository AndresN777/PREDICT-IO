const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

export async function getJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}

export type Competition = { code: string; name: string; area: string; type: string; matches: number; seasons: string[] };
export type Team = { id: number; name: string; shortName: string; tla: string };
export type Summary = { matches: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; points: number; pointsPerMatch: number; averageGoals: number };
export type CompetitionComparison = { first: Summary; second: Summary; metrics: { matchesDifference: number; goalsDifference: number; averageGoalsDifference: number; drawRateDifference: number } };
export type ExploreFilters = {
  search: string;
  competition_code: string;
  season: string;
  status: string;
  date_from: string;
  date_to: string;
  min_goals: string;
  max_goals: string;
};
export type ExploreItem = {
  id: number;
  date: string | null;
  status: string;
  competition: string;
  competitionCode: string;
  season: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  totalGoals: number;
  matchday: number | null;
  stage: string;
};
export type ExploreResponse = {
  items: ExploreItem[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  facets: { statuses: string[]; seasons: string[] };
  demo: boolean;
};
