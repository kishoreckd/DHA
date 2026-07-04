import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailSkeleton, ErrorState, PageHeader, StatusBadge } from "@/components/common/product-ui";
import { useBaseline } from "@/features/baselines/hooks";

export function BaselineDetailPage() {
  const { baselineId = "" } = useParams();
  const baselineQuery = useBaseline(baselineId);

  if (baselineQuery.isLoading) return <DetailSkeleton />;
  if (baselineQuery.isError || !baselineQuery.data) return <ErrorState message="Baseline unavailable." />;

  const baseline = baselineQuery.data;

  return (
    <>
      <PageHeader
        eyebrow="Baseline detail"
        title={baseline.name}
        actions={<StatusBadge value={baseline.status} />}
      />
      <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Detail label="Client" value={baseline.client_name || "—"} />
            <Detail label="Target URL" value={baseline.target_url || "—"} />
            <Detail label="Created" value={baseline.created_at ? new Date(baseline.created_at).toLocaleString() : "—"} />
            <Detail label="Updated" value={baseline.updated_at ? new Date(baseline.updated_at).toLocaleString() : "—"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tool reports</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[520px] overflow-auto rounded-md bg-muted p-4 text-xs">
              {JSON.stringify(baseline.tool_reports ?? [], null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-4 py-3">
      <span className="block text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <strong className="mt-1 block break-all">{value}</strong>
    </div>
  );
}
