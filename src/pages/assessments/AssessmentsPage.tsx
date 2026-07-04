import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, ClipboardCheck, Plus } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { appToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetailSkeleton, EmptyState, ErrorState, PageHeader } from "@/components/common/product-ui";
import { AssessmentStatusBadge } from "@/features/assessments/components/AssessmentStatusBadge";
import {
  AssessmentSummaryStrip,
  AssessmentWorkflow,
} from "@/features/assessments/components/AssessmentPreviewComponents";
import { useAssessments, useCreateAssessment } from "@/features/assessments/hooks";

export function AssessmentsPage() {
  const { workspaceId = "" } = useParams();
  const navigate = useNavigate();
  const assessmentsQuery = useAssessments(workspaceId);
  const createAssessment = useCreateAssessment(workspaceId);
  const [form, setForm] = useState({
    name: "",
    scope_id: "",
    methodology_version_id: "",
    tool_batch_ids: "",
    notes: "",
  });

  const latestAssessment = useMemo(() => assessmentsQuery.data?.[0], [assessmentsQuery.data]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const assessment = await createAssessment.mutateAsync({
      name: form.name.trim(),
      scope_id: form.scope_id.trim(),
      methodology_version_id: form.methodology_version_id.trim(),
      tool_batch_ids: form.tool_batch_ids
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      notes: form.notes.trim() || undefined,
    });
    appToast.success("Assessment created");
    navigate(`/workspaces/${workspaceId}/assessments/${assessment.id}`);
  }

  if (assessmentsQuery.isLoading) return <DetailSkeleton cards={3} />;
  if (assessmentsQuery.isError) return <ErrorState message="Assessments unavailable." retry={() => assessmentsQuery.refetch()} />;

  const assessments = assessmentsQuery.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="DHA assessments"
        title="Assessment preview workspace"
        description="Create assessment records from approved scopes, then review evidence, generate baseline sections, score metrics, and prepare report publication."
      />

      <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <div className="flex flex-col gap-4">
          <AssessmentWorkflow status={latestAssessment?.status} />

          <Card>
            <CardHeader>
              <CardTitle>Assessments</CardTitle>
              <CardDescription>Workspace assessment records from the updated collection endpoints.</CardDescription>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <EmptyState
                  icon={<ClipboardCheck />}
                  title="No assessments yet"
                  description="Create one after a scope is approved and a methodology version is published."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {assessments.map((assessment) => (
                    <div key={assessment.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-base font-semibold">{assessment.name}</h2>
                            <AssessmentStatusBadge status={assessment.status} />
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {assessment.notes || assessment.target_url || "Assessment detail preview is ready."}
                          </p>
                        </div>
                        <Button asChild variant="outline" className="shrink-0">
                          <Link to={`/workspaces/${workspaceId}/assessments/${assessment.id}`}>
                            Open preview
                            <ArrowRight data-icon="inline-end" />
                          </Link>
                        </Button>
                      </div>
                      <div className="mt-4">
                        <AssessmentSummaryStrip assessment={assessment} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create assessment</CardTitle>
            <CardDescription>Use IDs from approved scope, published methodology, and optional tool batches.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={submit}>
              <Field label="Assessment name" htmlFor="assessment-name">
                <Input
                  id="assessment-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Q2 DHA Assessment"
                  required
                />
              </Field>
              <Field label="Approved scope ID" htmlFor="scope-id">
                <Input
                  id="scope-id"
                  value={form.scope_id}
                  onChange={(event) => setForm((current) => ({ ...current, scope_id: event.target.value }))}
                  placeholder="scope_..."
                  required
                />
              </Field>
              <Field label="Methodology version ID" htmlFor="methodology-version-id">
                <Input
                  id="methodology-version-id"
                  value={form.methodology_version_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, methodology_version_id: event.target.value }))
                  }
                  placeholder="methodology_version_..."
                  required
                />
              </Field>
              <Field label="Tool batch IDs" htmlFor="tool-batch-ids">
                <Input
                  id="tool-batch-ids"
                  value={form.tool_batch_ids}
                  onChange={(event) => setForm((current) => ({ ...current, tool_batch_ids: event.target.value }))}
                  placeholder="batch_1, batch_2"
                />
              </Field>
              <Field label="Notes" htmlFor="assessment-notes">
                <Input
                  id="assessment-notes"
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Initial assessment context"
                />
              </Field>
              <Button
                type="submit"
                disabled={
                  createAssessment.isPending ||
                  !form.name.trim() ||
                  !form.scope_id.trim() ||
                  !form.methodology_version_id.trim()
                }
              >
                <Plus data-icon="inline-start" />
                Create assessment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
