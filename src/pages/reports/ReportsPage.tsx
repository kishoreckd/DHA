import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { appToast } from "@/lib/toast";
import { reportsApi, type Report } from "@/lib/api/collection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState, ErrorState, ListRowsSkeleton, PageHeader } from "@/components/common/product-ui";
import { ActionCard, DataRow, Field, JsonBlock, TextAreaField } from "@/components/common/api-panels";

export function ReportsPage() {
  const { workspaceId = "" } = useParams();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Report | null>(null);
  const [assessmentId, setAssessmentId] = useState("");
  const [title, setTitle] = useState("DHA Assessment Report");
  const [baselineVersionId, setBaselineVersionId] = useState("");
  const [snapshotId, setSnapshotId] = useState("");
  const [notes, setNotes] = useState("");
  const [publicAccess, setPublicAccess] = useState(false);

  const reportsQuery = useQuery({
    queryKey: ["workspaces", workspaceId, "reports"],
    queryFn: () => reportsApi.list(workspaceId),
    enabled: Boolean(workspaceId),
  });
  const publicationsQuery = useQuery({ queryKey: ["publications"], queryFn: reportsApi.publications });

  const createReport = useMutation({
    mutationFn: () =>
      reportsApi.create(workspaceId, {
        assessment_id: assessmentId,
        title,
        source_baseline_version_id: baselineVersionId || undefined,
        source_snapshot_id: snapshotId || undefined,
        sections: [
          { key: "executive-summary", title: "Executive Summary", content: "Initial summary.", order: 1 },
          { key: "findings", title: "Findings", content: "Initial findings.", order: 2 },
        ],
        notes,
      }),
    onSuccess: (report) => {
      appToast.success("Report draft created");
      setSelected(report);
      void queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "reports"] });
    },
  });

  const reportAction = useMutation({
    mutationFn: ({ reportId, action }: { reportId: string; action: "html" | "pdf" | "publish" | "supersede" }) => {
      if (action === "html") return reportsApi.renderHtml(workspaceId, reportId);
      if (action === "pdf") return reportsApi.renderPdf(workspaceId, reportId);
      if (action === "publish") return reportsApi.publish(workspaceId, reportId, publicAccess);
      return reportsApi.supersede(workspaceId, reportId);
    },
    onSuccess: () => {
      appToast.success("Report action completed");
      void queryClient.invalidateQueries({ queryKey: ["workspaces", workspaceId, "reports"] });
      void queryClient.invalidateQueries({ queryKey: ["publications"] });
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Reports and publications"
        title="Report desk"
        description="Create report drafts, render HTML/PDF artifacts, publish approved reports, and inspect public publications."
        actions={
          <Button variant="outline" onClick={() => void reportsQuery.refetch()}>
            <RefreshCw data-icon="inline-start" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <ActionCard
          title="Create report"
          description="Maps to POST /workspaces/{workspace_id}/reports."
          action={{ label: "Create draft", onClick: () => createReport.mutate() }}
          pending={createReport.isPending}
        >
          <Field id="assessment-id" label="Assessment ID" value={assessmentId} onChange={setAssessmentId} />
          <Field id="report-title" label="Title" value={title} onChange={setTitle} />
          <Field id="baseline-version" label="Baseline version ID" value={baselineVersionId} onChange={setBaselineVersionId} />
          <Field id="snapshot-id" label="Snapshot ID" value={snapshotId} onChange={setSnapshotId} />
          <TextAreaField id="report-notes" label="Notes" value={notes} onChange={setNotes} rows={3} />
        </ActionCard>

        <Card>
          <CardHeader>
            <CardTitle>Workspace reports</CardTitle>
            <CardDescription>Render, publish, or supersede existing report drafts.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={publicAccess} onCheckedChange={(checked) => setPublicAccess(checked === true)} />
              Public access when publishing
            </label>
            {reportsQuery.isError && <ErrorState message="Unable to load reports." retry={() => void reportsQuery.refetch()} />}
            {reportsQuery.isLoading ? (
              <ListRowsSkeleton rows={4} />
            ) : (reportsQuery.data ?? []).length === 0 ? (
              <EmptyState icon={<FileText />} title="No reports yet" />
            ) : (
              reportsQuery.data?.map((report) => (
                <DataRow
                  key={report.id}
                  title={report.title || report.id}
                  detail={report.assessment_id || report.current_version_id || report.id}
                  status={report.status}
                  action={
                    <span className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelected(report)}>
                        View
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reportAction.mutate({ reportId: report.id, action: "html" })}>
                        HTML
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reportAction.mutate({ reportId: report.id, action: "pdf" })}>
                        PDF
                      </Button>
                      <Button size="sm" onClick={() => reportAction.mutate({ reportId: report.id, action: "publish" })}>
                        Publish
                      </Button>
                    </span>
                  }
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publications</CardTitle>
            <CardDescription>Maps to GET /publications.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(publicationsQuery.data ?? []).map((publication) => (
              <DataRow
                key={publication.id}
                title={publication.title || publication.id}
                detail={publication.published_at || publication.updated_at || publication.id}
                status={publication.status}
              />
            ))}
            {!publicationsQuery.isLoading && (publicationsQuery.data ?? []).length === 0 && (
              <EmptyState icon={<FileText />} title="No publications" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Selected report</CardTitle>
            <CardDescription>Raw response preview for detail and render actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <JsonBlock value={selected} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
