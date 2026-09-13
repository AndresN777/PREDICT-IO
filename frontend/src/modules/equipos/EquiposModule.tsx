import { useEffect, useState } from "react";
import { getJson, Team, Summary } from "../../api";
import { MetricStrip } from "../../components/MetricStrip";
import { SectionHeading } from "../../components/SectionHeading";

type TeamComparison = {
  first: Summary;
  second: Summary;
  metrics: {
    goalsForDifference: number;
    pointsPerMatchDifference: number;
  };
};

export function EquiposModule({
  competitionCode,
  onTeamsLoaded,
}: {
  competitionCode: string;
  onTeamsLoaded: (teams: Team[]) => void;
}) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [secondId, setSecondId] = useState<number>(2);
  const [comparison, setComparison] = useState<TeamComparison | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  useEffect(() => {
    getJson<{ items: Team[] }>(
      `/teams?competition_code=${competitionCode}`,
    ).then((result) => {
      setTeams(result.items);
      onTeamsLoaded(result.items);
      if (result.items[0]) setSelectedId(result.items[0].id);
      if (result.items[1]) setSecondId(result.items[1].id);
    });
  }, [competitionCode, onTeamsLoaded]);
  useEffect(() => {
    if (selectedId)
      getJson<{ summary: Summary }>(
        `/teams/${selectedId}?competition_code=${competitionCode}`,
      ).then((result) => setSummary(result.summary));
  }, [selectedId, competitionCode]);
  const compareTeams = async () => {
    if (!selectedId || !secondId || selectedId === secondId) return;
    setIsComparing(true);
    try {
      const result = await getJson<TeamComparison>(
        `/teams/compare?first_id=${selectedId}&second_id=${secondId}&competition_code=${encodeURIComponent(competitionCode)}`,
      );
      setComparison(result);
    } finally {
      setIsComparing(false);
    }
  };
  return (
    <section className="module">
      <SectionHeading
        eyebrow="02 / EQUIPOS"
        title="Identidad, forma y contexto"
        description="Cada equipo vive dentro de una temporada y una competencia concreta. Cambia el foco para no mezclar universos."
      />
      <div className="toolbar">
        <label>
          EQUIPO ACTIVO
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(Number(event.target.value))}
          >
            {teams.map((team) => (
              <option value={team.id} key={team.id}>
                {team.shortName || team.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          CONTRASTE
          <select
            value={secondId}
            onChange={(event) => setSecondId(Number(event.target.value))}
          >
            {teams.map((team) => (
              <option value={team.id} key={team.id}>
                {team.shortName || team.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="solidButton"
          onClick={compareTeams}
          disabled={isComparing || selectedId === secondId}
        >
          {isComparing ? "COMPARANDO..." : "COMPARAR"} <span>↗</span>
        </button>
      </div>
      <div className="teamCanvas">
        <div className="teamIntro">
          <span className="codeMark">
            {teams.find((team) => team.id === selectedId)?.tla ?? "---"}
          </span>
          <div>
            <h3>
              {teams.find((team) => team.id === selectedId)?.name ??
                "Selecciona un equipo"}
            </h3>
            <p className="muted">Temporada detectada · {competitionCode}</p>
          </div>
        </div>
        {summary && (
          <MetricStrip
            metrics={[
              { label: "Partidos", value: summary.matches },
              { label: "Puntos", value: summary.points },
              { label: "PG", value: summary.pointsPerMatch },
              {
                label: "GF / GC",
                value: `${summary.goalsFor} / ${summary.goalsAgainst}`,
              },
            ]}
          />
        )}
        <div className="formBars">
          <div>
            <span>
              VICTORIAS <b>{summary?.wins ?? 0}</b>
            </span>
            <i
              style={{
                width: `${Math.min(100, ((summary?.wins ?? 0) / Math.max(1, summary?.matches ?? 1)) * 100)}%`,
              }}
            />
          </div>
          <div>
            <span>
              DERROTAS <b>{summary?.losses ?? 0}</b>
            </span>
            <i
              className="darkBar"
              style={{
                width: `${Math.min(100, ((summary?.losses ?? 0) / Math.max(1, summary?.matches ?? 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
        {comparison && (
          <div className="comparisonResult">
            <div className="comparisonHeader">
              <span>COMPARACIÓN ACTIVA</span>
              <b>
                {teams.find((team) => team.id === selectedId)?.shortName} /{" "}
                {teams.find((team) => team.id === secondId)?.shortName}
              </b>
            </div>
            <div className="comparisonMetrics">
              <span>
                DIF. GOLES A FAVOR
                <b>
                  {comparison.metrics.goalsForDifference > 0 ? "+" : ""}
                  {comparison.metrics.goalsForDifference}
                </b>
              </span>
              <span>
                DIF. PUNTOS / PARTIDO
                <b>
                  {comparison.metrics.pointsPerMatchDifference > 0 ? "+" : ""}
                  {comparison.metrics.pointsPerMatchDifference}
                </b>
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
