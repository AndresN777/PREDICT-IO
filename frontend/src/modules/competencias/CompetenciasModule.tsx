import { useEffect, useState } from "react";
import {
  CompetitionComparison,
  getJson,
  Competition,
  Summary,
} from "../../api";
import { MetricStrip } from "../../components/MetricStrip";
import { SectionHeading } from "../../components/SectionHeading";

type Props = {
  competitions: Competition[];
  selectedCode: string;
  onSelect: (code: string) => void;
};
export function CompetenciasModule({
  competitions,
  selectedCode,
  onSelect,
}: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [compareCode, setCompareCode] = useState("PD");
  const [comparison, setComparison] = useState<CompetitionComparison | null>(
    null,
  );
  const [isComparing, setIsComparing] = useState(false);
  const selected = competitions.find((item) => item.code === selectedCode);
  useEffect(() => {
    getJson<{ summary: Summary }>(`/competitions/${selectedCode}`).then(
      (result) => setSummary(result.summary),
    );
  }, [selectedCode]);
  const compareCompetitions = async () => {
    setIsComparing(true);
    try {
      const result = await getJson<CompetitionComparison>(
        `/competitions/compare?first_code=${encodeURIComponent(selectedCode)}&second_code=${encodeURIComponent(compareCode)}`,
      );
      setComparison(result);
    } finally {
      setIsComparing(false);
    }
  };
  return (
    <section className="module">
      <SectionHeading
        eyebrow="01 / COMPETENCIAS"
        title="El mapa competitivo"
        description="Lee el pulso de cada torneo por separado. La temporada forma parte de la identidad del dato."
      />
      <div className="moduleGrid">
        <div className="listPanel">
          <div className="panelHeader">
            <span>COMPETENCIAS DISPONIBLES</span>
            <b>{competitions.length.toString().padStart(2, "0")}</b>
          </div>
          {competitions.map((competition) => (
            <button
              className={`listRow ${competition.code === selectedCode ? "active" : ""}`}
              onClick={() => onSelect(competition.code)}
              key={competition.code}
            >
              <span>
                <b>{competition.code}</b>
                {competition.name}
                <small>
                  {competition.area} / {competition.type}
                </small>
              </span>
              <strong>{competition.matches}</strong>
            </button>
          ))}
        </div>
        <div className="detailPanel">
          <div className="panelHeader">
            <span>VISTA GENERAL</span>
            <b>{selected?.code}</b>
          </div>
          <h3>{selected?.name}</h3>
          <p className="muted">
            {selected?.area} · {selected?.seasons.join(" · ")}
          </p>
          {summary && (
            <MetricStrip
              metrics={[
                { label: "Partidos", value: summary.matches },
                { label: "Goles", value: summary.goalsFor },
                { label: "Promedio", value: summary.averageGoals },
                { label: "Empates", value: summary.draws },
              ]}
            />
          )}
          <div className="compareLine">
            <label>
              COMPARAR CON
              <select
                value={compareCode}
                onChange={(event) => setCompareCode(event.target.value)}
              >
                {competitions
                  .filter((item) => item.code !== selectedCode)
                  .map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <button
              className="outlineButton"
              onClick={compareCompetitions}
              disabled={isComparing || !compareCode}
            >
              {isComparing ? "COMPARANDO..." : "VER DIFERENCIAS"} <span>→</span>
            </button>
          </div>
          {comparison && (
            <div className="comparisonResult">
              <div className="comparisonHeader">
                <span>COMPARACIÓN ACTIVA</span>
                <b>
                  {selectedCode} / {compareCode}
                </b>
              </div>
              <div className="comparisonMetrics">
                <span>
                  Partidos{" "}
                  <b>
                    {comparison.metrics.matchesDifference > 0 ? "+" : ""}
                    {comparison.metrics.matchesDifference}
                  </b>
                </span>
                <span>
                  Goles{" "}
                  <b>
                    {comparison.metrics.goalsDifference > 0 ? "+" : ""}
                    {comparison.metrics.goalsDifference}
                  </b>
                </span>
                <span>
                  Promedio{" "}
                  <b>
                    {comparison.metrics.averageGoalsDifference > 0 ? "+" : ""}
                    {comparison.metrics.averageGoalsDifference}
                  </b>
                </span>
                <span>
                  Empates{" "}
                  <b>
                    {(comparison.metrics.drawRateDifference * 100).toFixed(1)}{" "}
                    pp
                  </b>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
