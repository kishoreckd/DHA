import { Navigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Link2, Unlink } from "lucide-react";
import { appToast } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, PageHeader, TableSkeleton } from "@/components/common/product-ui";
import { useAuth } from "@/features/auth/auth-provider";
import {
  useAdminTools,
  useMethodologies,
  useMethodologyMetrics,
  useUpsertMetric,
} from "@/features/methodologies/hooks";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminToolsPage() {
  const { user } = useAuth();
  const toolsQuery = useAdminTools();
  const methodologiesQuery = useMethodologies();
  const [selectedToolKey, setSelectedToolKey] = useState("");
  const [selectedMetricId, setSelectedMetricId] = useState("");
  const canManage = user?.role === "admin" || user?.permissions.includes("methodology.manage");
  const methodology = useMemo(
    () =>
      methodologiesQuery.data?.find((item) => item.status === "draft") ??
      methodologiesQuery.data?.[0],
    [methodologiesQuery.data],
  );
  const metricsQuery = useMethodologyMetrics(methodology?.id);
  const updateMetric = useUpsertMetric(methodology?.id ?? "");

  if (!canManage) return <Navigate to="/dashboard" replace />;

  const tools = toolsQuery.data ?? [];
  const metrics = metricsQuery.data ?? [];
  const activeToolKey = selectedToolKey || tools[0]?.key || "";
  const activeTool = tools.find((tool) => tool.key === activeToolKey);
  const mappedMetrics = metrics.filter((metric) => metric.mapped_tool_keys.includes(activeToolKey));
  const unmappedMetrics = metrics.filter((metric) => !metric.mapped_tool_keys.includes(activeToolKey));

  async function addMapping() {
    const metric = metrics.find((item) => item.id === selectedMetricId);
    if (!metric || !activeToolKey) return;
    await updateMetric.mutateAsync({
      ...metric,
      mapped_tool_keys: [...new Set([...metric.mapped_tool_keys, activeToolKey])],
    });
    setSelectedMetricId("");
    appToast.success("Metric mapped");
  }

  async function removeMapping(metricId: string) {
    const metric = metrics.find((item) => item.id === metricId);
    if (!metric || !activeToolKey) return;
    await updateMetric.mutateAsync({
      ...metric,
      mapped_tool_keys: metric.mapped_tool_keys.filter((key) => key !== activeToolKey),
    });
    appToast.success("Metric unmapped");
  }

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Tool mappings"
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tools</CardTitle>
          </CardHeader>
          <CardContent>
            {toolsQuery.isLoading && <TableSkeleton columns={4} />}
            {toolsQuery.isError && <ErrorState message="Unable to load admin tool catalog." />}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Tool</th>
                    <th className="px-3 py-2 font-semibold">Area</th>
                    <th className="px-3 py-2 font-semibold">Metrics</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tools.map((tool) => (
                    <tr
                      key={tool.key}
                      className={activeToolKey === tool.key ? "bg-accent" : "cursor-pointer hover:bg-accent"}
                      onClick={() => {
                        setSelectedToolKey(tool.key);
                        setSelectedMetricId("");
                      }}
                    >
                      <td className="px-3 py-3">
                        <strong className="block">{tool.name}</strong>
                        <span className="text-xs text-muted-foreground">{tool.key}</span>
                      </td>
                      <td className="px-3 py-3">{tool.metric_area}</td>
                      <td className="px-3 py-3">{tool.mapped_metric_count}</td>
                      <td className="px-3 py-3">
                        <Badge variant={tool.is_enabled ? "success" : "secondary"}>
                          {tool.is_enabled ? "enabled" : "disabled"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{activeTool?.name ?? "Metrics"}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {metricsQuery.isLoading && <TableSkeleton columns={5} />}
            {metricsQuery.isError && <ErrorState message="Unable to load metrics." />}
            <div className="flex gap-2">
              <Select value={selectedMetricId} onValueChange={setSelectedMetricId}>
                <SelectTrigger aria-label="Metric">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {unmappedMetrics.map((metric) => (
                      <SelectItem key={metric.id} value={metric.id}>
                        {metric.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                type="button"
                onClick={addMapping}
                disabled={!selectedMetricId || !activeToolKey || updateMetric.isPending}
              >
                <Link2 data-icon="inline-start" />
                Add
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Metric</th>
                    <th className="px-3 py-2 font-semibold">Dimension</th>
                    <th className="px-3 py-2 font-semibold">Weight</th>
                    <th className="px-3 py-2 font-semibold">Tools</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mappedMetrics.map((metric) => (
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
                      <td className="px-3 py-3">{metric.mapped_tool_keys.join(", ")}</td>
                      <td className="px-3 py-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeMapping(metric.id)}
                          disabled={updateMetric.isPending}
                        >
                          <Unlink data-icon="inline-start" />
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {mappedMetrics.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>
                        No mapped metrics
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
