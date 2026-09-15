import { useEffect, useState } from "react";
import {
  Download,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  Competition,
  ExploreResponse,
  ExploreFilters,
  getJson,
} from "../../api";
import { MetricStrip } from "../../components/MetricStrip";
import { SectionHeading } from "../../components/SectionHeading";

type SortKey = "matchDate" | "competition" | "home" | "away" | "goals";

const defaultFilters: ExploreFilters = {
  search: "",
  competition_code: "",
  season: "",
  status: "",
  date_from: "",
  date_to: "",
  min_goals: "",
  max_goals: "",
};

function formatDate(value: string | null) {
  if (!value) return "N/D";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function downloadCsv(items: ExploreResponse["items"]) {
  const headers = [
    "fecha",
    "competencia",
    "temporada",
    "local",
    "visitante",
    "marcador",
    "estado",
  ];
  const rows = items.map((item) => [
    formatDate(item.date),
    item.competition,
    item.season,
    item.homeTeam,
    item.awayTeam,
    item.homeGoals === null ? "-" : `${item.homeGoals}-${item.awayGoals}`,
    item.status,
  ]);
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "predict-io-exploracion.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function ExplorarDataModule({
  competitions,
}: {
  competitions: Competition[];
}) {
  const [filters, setFilters] = useState<ExploreFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ExploreFilters>(defaultFilters);
  const [data, setData] = useState<ExploreResponse | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("matchDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      page_size: "25",
      sort_by: sortBy,
      sort_order: sortOrder,
    });
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setLoading(true);
    setError("");
    getJson<ExploreResponse>(`/explore?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(setData)
      .catch((requestError: Error) => {
        if (requestError.name !== "AbortError")
          setError("No se pudo cargar la exploración de datos.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [appliedFilters, page, sortBy, sortOrder]);

  const updateFilter = (key: keyof ExploreFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
  };
  const resetFilters = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
  };
  const changeSort = (nextSort: SortKey) => {
    if (nextSort === sortBy)
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortBy(nextSort);
      setSortOrder(nextSort === "goals" ? "desc" : "asc");
    }
    setPage(1);
  };
  const pageLabel =
    data && data.total > 0
      ? `${(page - 1) * data.pageSize + 1}-${Math.min(page * data.pageSize, data.total)}`
      : "0-0";

  return (
    <section className="module exploreModule">
      <SectionHeading
        eyebrow="04 / EXPLORAR DATA"
        title="Lee el dataset sin perder el contexto"
        description="Filtra, inspecciona y exporta los partidos disponibles. Cada fila conserva competencia, temporada, estado y marcador."
      />
      <div className="exploreControls">
        <div className="exploreSearch">
          <Search size={17} />
          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && applyFilters()}
            placeholder="Buscar equipo o competencia..."
            aria-label="Buscar en la data"
          />
        </div>
        <div className="exploreSelects">
          <label>
            COMPETENCIA
            <select
              value={filters.competition_code}
              onChange={(event) =>
                updateFilter("competition_code", event.target.value)
              }
            >
              <option value="">Todas</option>
              {competitions.map((competition) => (
                <option value={competition.code} key={competition.code}>
                  {competition.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            TEMPORADA
            <select
              value={filters.season}
              onChange={(event) => updateFilter("season", event.target.value)}
            >
              <option value="">Todas</option>
              {data?.facets.seasons.map((season) => (
                <option value={season} key={season}>
                  {season}
                </option>
              ))}
            </select>
          </label>
          <label>
            ESTADO
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            >
              <option value="">Todos</option>
              {data?.facets.statuses.map((status) => (
                <option value={status} key={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="exploreAdvanced">
          <label>
            DESDE
            <input
              type="date"
              value={filters.date_from}
              onChange={(event) =>
                updateFilter("date_from", event.target.value)
              }
            />
          </label>
          <label>
            HASTA
            <input
              type="date"
              value={filters.date_to}
              onChange={(event) => updateFilter("date_to", event.target.value)}
            />
          </label>
          <label>
            GOLES MIN.
            <input
              type="number"
              min="0"
              max="30"
              value={filters.min_goals}
              onChange={(event) =>
                updateFilter("min_goals", event.target.value)
              }
              placeholder="0"
            />
          </label>
          <label>
            GOLES MAX.
            <input
              type="number"
              min="0"
              max="30"
              value={filters.max_goals}
              onChange={(event) =>
                updateFilter("max_goals", event.target.value)
              }
              placeholder="-"
            />
          </label>
        </div>
        <div className="exploreActions">
          <button className="solidButton" onClick={applyFilters}>
            <Filter size={15} /> APLICAR FILTROS
          </button>
          <button className="outlineButton" onClick={resetFilters}>
            <RotateCcw size={15} /> LIMPIAR
          </button>
        </div>
      </div>
      <div className="exploreToolbar">
        <span>
          <SlidersHorizontal size={15} />{" "}
          {data?.total.toLocaleString("es-ES") ?? "-"} registros encontrados
        </span>
        <button
          className="outlineButton"
          onClick={() => data && downloadCsv(data.items)}
          disabled={!data?.items.length || loading}
        >
          <Download size={15} /> EXPORTAR CSV
        </button>
      </div>
      <MetricStrip
        metrics={[
          {
            label: "REGISTROS",
            value: data?.total.toLocaleString("es-ES") ?? "-",
          },
          { label: "PÁGINA", value: data ? `${page} / ${data.pages}` : "-" },
          { label: "MOSTRANDO", value: pageLabel },
          { label: "MODO", value: data?.demo ? "DEMO" : "PARQUET" },
        ]}
      />
      <div className="dataTableWrap">
        {loading && (
          <div className="tableState">Actualizando resultados...</div>
        )}
        {!loading && error && (
          <div className="tableState errorState">{error}</div>
        )}
        {!loading && !error && data?.items.length === 0 && (
          <div className="tableState">No hay partidos con estos filtros.</div>
        )}
        {!loading && !error && data?.items.length ? (
          <table className="dataTable">
            <thead>
              <tr>
                <th>
                  <button onClick={() => changeSort("matchDate")}>
                    FECHA{" "}
                    {sortBy === "matchDate" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </button>
                </th>
                <th>
                  <button onClick={() => changeSort("competition")}>
                    COMPETENCIA{" "}
                    {sortBy === "competition" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </button>
                </th>
                <th>TEMP.</th>
                <th>
                  <button onClick={() => changeSort("home")}>
                    LOCAL{" "}
                    {sortBy === "home" && (sortOrder === "asc" ? "↑" : "↓")}
                  </button>
                </th>
                <th>
                  <button onClick={() => changeSort("away")}>
                    VISITANTE{" "}
                    {sortBy === "away" && (sortOrder === "asc" ? "↑" : "↓")}
                  </button>
                </th>
                <th>
                  <button onClick={() => changeSort("goals")}>
                    MARCADOR{" "}
                    {sortBy === "goals" && (sortOrder === "asc" ? "↑" : "↓")}
                  </button>
                </th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={`${item.id}-${item.date}`}>
                  <td className="dateCell">{formatDate(item.date)}</td>
                  <td>
                    <b>{item.competition}</b>
                    <small>{item.competitionCode}</small>
                  </td>
                  <td>{item.season}</td>
                  <td>{item.homeTeam}</td>
                  <td>{item.awayTeam}</td>
                  <td className="scoreCell">
                    {item.homeGoals === null
                      ? "-"
                      : `${item.homeGoals} - ${item.awayGoals}`}
                  </td>
                  <td>
                    <span
                      className={`statusTag ${item.status === "FINISHED" ? "finished" : ""}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
      <div className="pagination">
        <span>
          {data
            ? `Mostrando ${pageLabel} de ${data.total.toLocaleString("es-ES")}`
            : ""}
        </span>
        <div>
          <button
            className="outlineButton"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || loading}
          >
            ← ANTERIOR
          </button>
          <button
            className="solidButton"
            onClick={() =>
              setPage((current) =>
                Math.min(data?.pages ?? current, current + 1),
              )
            }
            disabled={!data || page >= data.pages || loading}
          >
            SIGUIENTE →
          </button>
        </div>
      </div>
    </section>
  );
}
