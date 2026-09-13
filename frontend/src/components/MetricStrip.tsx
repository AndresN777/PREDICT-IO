type Metric = { label: string; value: string | number; detail?: string };
export function MetricStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="metricStrip">
      {metrics.map((metric) => (
        <div className="metric" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          {metric.detail && <small>{metric.detail}</small>}
        </div>
      ))}
    </div>
  );
}
