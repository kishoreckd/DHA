import type { MetricDefinition } from "../types";

export function MetricRegistryTable({ metrics }: { metrics: MetricDefinition[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="border-b text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-semibold">Metric</th>
            <th className="px-3 py-2 font-semibold">Dimension</th>
            <th className="px-3 py-2 font-semibold">Weight</th>
            <th className="px-3 py-2 font-semibold">Threshold</th>
            <th className="px-3 py-2 font-semibold">Mapped tools</th>
            <th className="px-3 py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {metrics.map((metric) => (
            <tr key={metric.id}>
              <td className="px-3 py-3">
                <strong className="block">{metric.name}</strong>
                <span className="text-xs text-muted-foreground">{metric.key}</span>
              </td>
              <td className="px-3 py-3">
                {metric.dimension}
                {metric.sub_dimension && (
                  <span className="block text-xs text-muted-foreground">{metric.sub_dimension}</span>
                )}
              </td>
              <td className="px-3 py-3">{metric.weight}</td>
              <td className="px-3 py-3 text-muted-foreground">{metric.threshold || "-"}</td>
              <td className="px-3 py-3 text-muted-foreground">{metric.mapped_tool_keys.join(", ") || "-"}</td>
              <td className="px-3 py-3 capitalize">{metric.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
