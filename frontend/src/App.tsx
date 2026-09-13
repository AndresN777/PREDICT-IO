import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Database,
  GitCompareArrows,
  Shield,
  Sparkles,
} from "lucide-react";
import { getJson, Competition, Team } from "./api";
import { IconBlock } from "./components/IconBlock";
import { CompetenciasModule } from "./modules/competencias/CompetenciasModule";
import { EquiposModule } from "./modules/equipos/EquiposModule";
import { VersusModule } from "./modules/versus/VersusModule";

type Module = "competencias" | "equipos" | "versus";
export default function App() {
  const [active, setActive] = useState<Module>("competencias");
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCode, setSelectedCode] = useState("PL");
  const [teams, setTeams] = useState<Team[]>([]);
  const [health, setHealth] = useState({ rows: 0, demo: true });
  const loadTeams = useCallback((next: Team[]) => setTeams(next), []);
  useEffect(() => {
    getJson<{ items: Competition[] }>("/competitions").then((result) => {
      setCompetitions(result.items);
      if (result.items[0]) setSelectedCode(result.items[0].code);
    });
    getJson<{ rows: number; demo: boolean }>("/health").then(setHealth);
  }, []);
  const navigation = [
    { id: "competencias" as Module, label: "Competencias", icon: BarChart3 },
    { id: "equipos" as Module, label: "Equipos", icon: Shield },
    { id: "versus" as Module, label: "Versus", icon: GitCompareArrows },
  ];
  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <IconBlock size="sm" tone="blue" />
          <span>
            PREDICT<em>IO</em>
          </span>
        </div>
        <div className="sideLabel">MÓDULOS</div>
        <nav>
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              className={active === id ? "navItem active" : "navItem"}
              onClick={() => setActive(id)}
              key={id}
            >
              <Icon size={17} />
              <span>{label}</span>
              <small>
                0{id === "competencias" ? 1 : id === "equipos" ? 2 : 3}
              </small>
            </button>
          ))}
        </nav>
        <div className="sideStatus">
          <span>
            <Activity size={14} /> SISTEMA ONLINE
          </span>
          <b>{health.rows.toLocaleString("es-ES")} filas</b>
          <small>
            {health.demo ? "modo demostración" : "parquet conectado"}
          </small>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <span className="breadcrumb">
              ANÁLISIS / {active.toUpperCase()}
            </span>
            <h1>
              Inteligencia de partido <Sparkles size={20} />
            </h1>
          </div>
          <div className="dataBadge">
            <Database size={15} />
            <span>DATASET ACTIVO</span>
            <b>EUROPEAN MATCHES</b>
          </div>
        </header>
        <div className="content">
          {active === "competencias" && (
            <CompetenciasModule
              competitions={competitions}
              selectedCode={selectedCode}
              onSelect={setSelectedCode}
            />
          )}
          {active === "equipos" && (
            <EquiposModule
              competitionCode={selectedCode}
              onTeamsLoaded={loadTeams}
            />
          )}
          {active === "versus" && (
            <VersusModule teams={teams} competitionCode={selectedCode} />
          )}
        </div>
        <footer>
          <span>Predict IO / laboratorio analítico local</span>
          <span>API FastAPI · pandas · scikit-learn</span>
        </footer>
      </main>
    </div>
  );
}
