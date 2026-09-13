import { useState } from "react";
import { getJson, Team } from "../../api";
import { SectionHeading } from "../../components/SectionHeading";
export function VersusModule({
  teams,
  competitionCode,
}: {
  teams: Team[];
  competitionCode: string;
}) {
  const [home, setHome] = useState(teams[0]?.id ?? 1);
  const [away, setAway] = useState(teams[1]?.id ?? 2);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const predict = async () => {
    setLoading(true);
    try {
      setResult(
        await getJson("/predict", {
          method: "POST",
          body: JSON.stringify({
            home_team_id: home,
            away_team_id: away,
            competition_code: competitionCode,
          }),
        }),
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="module versus">
      <SectionHeading
        eyebrow="03 / VERSUS"
        title="Antes del silbato"
        description="Un laboratorio para enfrentar dos perfiles y traducir su historial a probabilidades legibles."
      />
      <div className="versusPick">
        <div>
          <span>LOCAL</span>
          <select
            value={home}
            onChange={(event) => setHome(Number(event.target.value))}
          >
            {teams.map((team) => (
              <option value={team.id} key={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <strong>VS</strong>
        <div>
          <span>VISITANTE</span>
          <select
            value={away}
            onChange={(event) => setAway(Number(event.target.value))}
          >
            {teams.map((team) => (
              <option value={team.id} key={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <button className="solidButton" onClick={predict}>
          {loading ? "CALCULANDO..." : "EJECUTAR MODELO"} <span>→</span>
        </button>
      </div>
      {result && (
        <div className="predictionPanel">
          <div className="predictionScore">
            <span>MARCADOR MÁS PROBABLE</span>
            <strong>{result.most_likely_score}</strong>
            <small>confianza {result.confidence}</small>
          </div>
          <div className="probabilityGrid">
            {Object.entries(result.probabilities).map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <b>{Math.round(Number(value) * 100)}%</b>
                <i>
                  <em style={{ width: `${Number(value) * 100}%` }} />
                </i>
              </div>
            ))}
          </div>
          <div className="predictionFooter">
            <span>
              Goles esperados{" "}
              <b>
                {result.expected_goals.local} -{" "}
                {result.expected_goals.visitante}
              </b>
            </span>
            <span>
              Más de 2.5 <b>{Math.round(result.markets.over25 * 100)}%</b>
            </span>
            <span>
              Ambos marcan <b>{Math.round(result.markets.bothScore * 100)}%</b>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
