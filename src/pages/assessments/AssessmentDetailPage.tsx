import { BarChart3, FileText, Layers3, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { appToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailSkeleton, EmptyState, ErrorState, PageHeader } from "@/components/common/product-ui";
import {
  AssessmentSummaryStrip,
  AssessmentWorkflow,
  BaselineSectionList,
  CompletenessCard,
  EvidenceList,
  MetricScoreGrid,
  ReportReadinessCard,
  ScoreRing,
} from "@/features/assessments/components/AssessmentPreviewComponents";
import { AssessmentStatusBadge } from "@/features/assessments/components/AssessmentStatusBadge";
import {
  useAssessment,
  useAssessmentBaseline,
  useAssessmentEvidence,
  useAssessmentScores,
  useAssessmentSnapshot,
  useAssessmentTrends,
  useBaselineAction,
  useEvidenceAction,
  useScoreAction,
  useEvidenceCompleteness,
  useGenerateBaseline,
  useGenerateSnapshot,
  useWorkspaceReports,
} from "@/features/assessments/hooks";
import { formatAssessmentDate } from "@/features/assessments/utils";

export function AssessmentDetailPage() {
  const { workspaceId = "", assessmentId = "" } = useParams();
  const [evidenceId, setEvidenceId] = useState("");
  const [manualMetricKey, setManualMetricKey] = useState("performance_score");
  const [manualEvidenceValue, setManualEvidenceValue] = useState("92");
  const [sectionId, setSectionId] = useState("");
  const [sectionContent, setSectionContent] = useState("");
  const [metricId, setMetricId] = useState("");
  const [adjustedScore, setAdjustedScore] = useState("88");
  const assessmentQuery = useAssessment(workspaceId, assessmentId);
  const evidenceQuery = useAssessmentEvidence(workspaceId, assessmentId);
  const completenessQuery = useEvidenceCompleteness(workspaceId, assessmentId);
  const baselineQuery = useAssessmentBaseline(workspaceId, assessmentId);
  const scoresQuery = useAssessmentScores(workspaceId, assessmentId);
  const snapshotQuery = useAssessmentSnapshot(workspaceId, assessmentId);
  const trendsQuery = useAssessmentTrends(workspaceId, assessmentId);
  const reportsQuery = useWorkspaceReports(workspaceId);
  const generateBaseline = useGenerateBaseline(workspaceId, assessmentId);
  const generateSnapshot = useGenerateSnapshot(workspaceId, assessmentId);
  const evidenceAction = useEvidenceAction(workspaceId, assessmentId);
  const baselineAction = useBaselineAction(workspaceId, assessmentId);
  const scoreAction = useScoreAction(workspaceId, assessmentId);

  async function onGenerateBaseline() {
    await generateBaseline.mutateAsync();
    appToast.success("Baseline generated");
  }

  async function onGenerateSnapshot() {
    await generateSnapshot.mutateAsync();
    appToast.success("Snapshot generated");
  }

  async function onEvidenceAction(action: "accept" | "reject" | "replace" | "manual") {
    await evidenceAction.mutateAsync({
      action,
      evidenceId,
      payload:
        action === "manual" || action === "replace"
          ? {
              metric_key: manualMetricKey,
              title: "Manual Performance Evidence",
              value: Number(manualEvidenceValue),
              raw_value: manualEvidenceValue,
              notes: "Entered by reviewer.",
              status: "pending",
              metadata: {},
            }
          : { reason: "Incorrect or stale result." },
    });
    appToast.success("Evidence action completed");
  }

  async function onBaselineAction(action: "section" | "version" | "submit") {
    await baselineAction.mutateAsync({
      action,
      sectionId,
      content: sectionContent,
      expectedRevision: baseline?.sections?.find((section) => section.id === sectionId)?.revision ?? 1,
    });
    appToast.success("Baseline action completed");
  }

  async function onScoreAction(action: "adjust" | "reset") {
    await scoreAction.mutateAsync({
      action,
      metricId,
      adjustedScore: Number(adjustedScore),
      rationale: "Reviewer adjustment after validating evidence context.",
    });
    appToast.success("Score action completed");
  }

  if (assessmentQuery.isLoading) return <DetailSkeleton cards={4} />;
  if (assessmentQuery.isError || !assessmentQuery.data) {
    return <ErrorState message="Assessment unavailable." retry={() => assessmentQuery.refetch()} />;
  }

  const assessment = assessmentQuery.data;
  const evidence = evidenceQuery.data ?? [];
  const scores = scoresQuery.data ?? [];
  const baseline = baselineQuery.data;
  const snapshot = snapshotQuery.data;
  const reports = reportsQuery.data ?? [];
  const overallScore = snapshot?.overall_score ?? assessment.score ?? averageScore(scores);

  return (
    <>
      <PageHeader
        eyebrow="Assessment preview"
        title={assessment.name}
        description={assessment.notes || "Review the current DHA assessment state across evidence, baseline, scoring, and publication readiness."}
        actions={
          <>
            <AssessmentStatusBadge status={assessment.status} />
            <Button variant="outline" onClick={onGenerateBaseline} disabled={generateBaseline.isPending}>
              <Layers3 data-icon="inline-start" />
              Generate baseline
            </Button>
            <Button onClick={onGenerateSnapshot} disabled={generateSnapshot.isPending}>
              <BarChart3 data-icon="inline-start" />
              Generate snapshot
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <AssessmentSummaryStrip assessment={assessment} />
        <AssessmentWorkflow status={assessment.status} />

        <div className="grid gap-4 xl:grid-cols-[.75fr_1.25fr]">
          <div className="flex flex-col gap-4">
            <ScoreRing value={overallScore} label="Overall assessment" />
            <CompletenessCard completeness={completenessQuery.data} />
            <ReportReadinessCard reports={reports} assessmentId={assessmentId} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Preview cockpit</CardTitle>
              <CardDescription>Each tab maps to the assessment endpoints from the updated Postman collection.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="evidence">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                  <TabsTrigger value="evidence">Evidence</TabsTrigger>
                  <TabsTrigger value="baseline">Baseline</TabsTrigger>
                  <TabsTrigger value="scores">Scores</TabsTrigger>
                  <TabsTrigger value="snapshot">Snapshot</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="evidence">
                  <div className="mb-4 grid gap-3 rounded-md border p-3 md:grid-cols-4">
                    <FieldControl id="evidence-id" label="Evidence ID" value={evidenceId} onChange={setEvidenceId} />
                    <FieldControl id="manual-metric" label="Metric key" value={manualMetricKey} onChange={setManualMetricKey} />
                    <FieldControl id="manual-value" label="Value" value={manualEvidenceValue} onChange={setManualEvidenceValue} />
                    <div className="flex flex-wrap items-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => void onEvidenceAction("accept")} disabled={!evidenceId}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void onEvidenceAction("reject")} disabled={!evidenceId}>
                        Reject
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void onEvidenceAction("replace")} disabled={!evidenceId}>
                        Replace
                      </Button>
                      <Button size="sm" onClick={() => void onEvidenceAction("manual")}>
                        Manual
                      </Button>
                    </div>
                  </div>
                  {evidenceQuery.isLoading ? (
                    <DetailSkeleton cards={1} />
                  ) : evidence.length === 0 ? (
                    <EmptyState
                      icon={<FileText />}
                      title="No evidence loaded"
                      description="Accepted, rejected, replaced, and manual evidence will appear here."
                    />
                  ) : (
                    <EvidenceList evidence={evidence} />
                  )}
                </TabsContent>

                <TabsContent value="baseline">
                  <div className="mb-4 grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_1.4fr_auto]">
                    <FieldControl id="section-id" label="Section ID" value={sectionId} onChange={setSectionId} />
                    <FieldControl id="section-content" label="Section content" value={sectionContent} onChange={setSectionContent} />
                    <div className="flex flex-wrap items-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => void onBaselineAction("section")} disabled={!sectionId}>
                        Update section
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void onBaselineAction("version")}>
                        New version
                      </Button>
                      <Button size="sm" onClick={() => void onBaselineAction("submit")}>
                        Submit review
                      </Button>
                    </div>
                  </div>
                  {!baseline ? (
                    <EmptyState
                      icon={<Layers3 />}
                      title="No baseline version yet"
                      description="Generate a draft baseline after evidence review is complete."
                      action={
                        <Button variant="outline" onClick={onGenerateBaseline} disabled={generateBaseline.isPending}>
                          <RefreshCw data-icon="inline-start" />
                          Generate baseline
                        </Button>
                      }
                    />
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <AssessmentStatusBadge status={baseline.status || "draft"} />
                        <span className="text-muted-foreground">Version {baseline.version_number ?? 1}</span>
                        <span className="text-muted-foreground">Updated {formatAssessmentDate(baseline.updated_at)}</span>
                      </div>
                      <BaselineSectionList sections={baseline.sections ?? []} />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="scores">
                  <div className="mb-4 grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto]">
                    <FieldControl id="metric-id" label="Metric ID" value={metricId} onChange={setMetricId} />
                    <FieldControl id="adjusted-score" label="Adjusted score" value={adjustedScore} onChange={setAdjustedScore} />
                    <div className="flex flex-wrap items-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => void onScoreAction("adjust")} disabled={!metricId}>
                        Adjust
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void onScoreAction("reset")} disabled={!metricId}>
                        Reset
                      </Button>
                    </div>
                  </div>
                  {scores.length === 0 ? (
                    <EmptyState
                      icon={<BarChart3 />}
                      title="No scores calculated"
                      description="Scores are calculated from accepted evidence and methodology metric weights."
                    />
                  ) : (
                    <MetricScoreGrid scores={scores} />
                  )}
                </TabsContent>

                <TabsContent value="snapshot">
                  <div className="grid gap-4 md:grid-cols-[.45fr_.55fr]">
                    <ScoreRing value={snapshot?.overall_score ?? overallScore} label="Latest snapshot" />
                    <div className="rounded-md border p-4 text-sm">
                      <strong className="block">Snapshot state</strong>
                      <p className="mt-2 text-muted-foreground">
                        {snapshot
                          ? `Generated ${formatAssessmentDate(snapshot.generated_at)} with status ${snapshot.status || "ready"}.`
                          : "No immutable snapshot has been generated yet."}
                      </p>
                      <Button className="mt-4" variant="outline" onClick={onGenerateSnapshot} disabled={generateSnapshot.isPending}>
                        <RefreshCw data-icon="inline-start" />
                        Generate snapshot
                      </Button>
                    </div>
                    <div className="md:col-span-2">
                      <MetricScoreGrid scores={snapshot?.scores ?? scores.slice(0, 6)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reports">
                  <div className="grid gap-3">
                    {reports.length === 0 ? (
                      <EmptyState
                        icon={<FileText />}
                        title="No report drafts"
                        description="Report drafts, rendered HTML/PDF artifacts, and publications will appear after report creation."
                      />
                    ) : (
                      reports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm">
                          <span className="min-w-0">
                            <strong className="block truncate">{report.title || report.id}</strong>
                            <small className="text-muted-foreground">{formatAssessmentDate(report.updated_at || report.published_at)}</small>
                          </span>
                          <AssessmentStatusBadge status={report.status} />
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {trendsQuery.data && trendsQuery.data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Trend signals</CardTitle>
              <CardDescription>Latest trend points filtered by this assessment.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-3">
              {trendsQuery.data.slice(0, 6).map((trend, index) => (
                <div key={`${trend.metric_key}-${index}`} className="rounded-md border px-4 py-3 text-sm">
                  <strong>{trend.label || trend.metric_key || "Trend point"}</strong>
                  <span className="mt-1 block text-muted-foreground">{trend.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

function FieldControl({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function averageScore(scores: Array<{ final_score?: number | null; adjusted_score?: number | null; calculated_score?: number | null }>) {
  const values = scores
    .map((score) => score.final_score ?? score.adjusted_score ?? score.calculated_score)
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}
