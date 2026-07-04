import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  Layers3,
  SearchCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AssessmentStatusBadge } from "./AssessmentStatusBadge";
import { formatAssessmentDate } from "../utils";
import type {
  Assessment,
  AssessmentEvidence,
  BaselineSection,
  EvidenceCompleteness,
  MetricScore,
  ReportSummary,
} from "../types";

const workflow = [
  { key: "scope", label: "Scope", icon: SearchCheck },
  { key: "evidence", label: "Evidence", icon: ClipboardCheck },
  { key: "baseline", label: "Baseline", icon: Layers3 },
  { key: "scoring", label: "Scoring", icon: Gauge },
  { key: "snapshot", label: "Snapshot", icon: BarChart3 },
  { key: "report", label: "Report", icon: FileText },
];

const activeIndexByStatus: Record<string, number> = {
  draft: 0,
  evidence_review: 1,
  baseline_draft: 2,
  baseline_review: 2,
  scored: 3,
  snapshot_ready: 4,
  report_draft: 5,
  approved: 5,
  published: 5,
};

export function AssessmentSummaryStrip({ assessment }: { assessment: Assessment }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <SummaryTile label="Target" value={assessment.target_url || assessment.property_name || "Not linked"} />
      <SummaryTile label="Methodology" value={assessment.methodology_name || assessment.methodology_version_id || "Unassigned"} />
      <SummaryTile label="Evidence" value={assessment.evidence_complete ? "Complete" : "Needs review"} />
      <SummaryTile label="Updated" value={formatAssessmentDate(assessment.updated_at)} />
    </div>
  );
}

export function AssessmentWorkflow({ status }: { status?: string | null }) {
  const activeIndex = activeIndexByStatus[status || "draft"] ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment flow</CardTitle>
        <CardDescription>From approved scope to publishable DHA report.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 md:grid-cols-6">
          {workflow.map(({ key, label, icon: Icon }, index) => {
            const complete = index < activeIndex;
            const active = index === activeIndex;
            return (
              <div
                key={key}
                className={cn(
                  "flex min-h-[86px] flex-col justify-between rounded-md border p-3",
                  active && "border-primary bg-primary/5",
                  complete && "bg-muted/45",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Icon className="text-primary" />
                  {complete && <CheckCircle2 className="text-primary" />}
                </div>
                <span className="text-sm font-semibold">{label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function CompletenessCard({ completeness }: { completeness?: EvidenceCompleteness }) {
  const total = completeness?.total_count || completeness?.items?.length || 0;
  const complete =
    completeness?.complete_count ?? completeness?.items?.filter((item) => item.is_complete).length ?? 0;
  const percent = total > 0 ? Math.round((complete / total) * 100) : completeness?.is_complete ? 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence completeness</CardTitle>
        <CardDescription>{complete} of {total} required metric mappings ready.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <strong>{percent}% complete</strong>
            <AssessmentStatusBadge status={completeness?.is_complete ? "approved" : "evidence_review"} />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {(completeness?.items ?? []).slice(0, 6).map((item) => (
            <div key={item.metric_key} className="rounded-md border px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <strong className="truncate">{item.label || item.metric_key}</strong>
                <AssessmentStatusBadge status={item.is_complete ? "approved" : "pending"} />
              </div>
              <span className="mt-1 block text-xs text-muted-foreground">
                {item.accepted_count ?? 0}/{item.required_count ?? 1} accepted evidence items
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ScoreRing({ value, label }: { value?: number | null; label: string }) {
  const score = normalizeScore(value);
  const display = score === null ? "--" : String(score);
  return (
    <div className="flex items-center gap-4 rounded-md border p-4">
      <div
        className="grid size-20 shrink-0 place-items-center rounded-full text-lg font-bold text-foreground"
        style={{
          background: `conic-gradient(hsl(var(--primary)) ${score ?? 0}%, hsl(var(--muted)) 0)`,
        }}
      >
        <span className="grid size-[58px] place-items-center rounded-full bg-card">{display}</span>
      </div>
      <div className="min-w-0">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <strong className="mt-1 block text-sm">Weighted DHA score</strong>
      </div>
    </div>
  );
}

export function MetricScoreGrid({ scores }: { scores: MetricScore[] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {scores.map((score) => {
        const finalScore = score.final_score ?? score.adjusted_score ?? score.calculated_score;
        return (
          <div key={score.id || score.metric_key} className="rounded-md border px-4 py-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <strong className="block truncate">{score.label || score.metric_key}</strong>
                <span className="mt-1 block text-xs text-muted-foreground">{score.dimension || "Assessment metric"}</span>
              </div>
              <Badge variant="outline">{normalizeScore(finalScore) ?? "--"}</Badge>
            </div>
            {score.rationale && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{score.rationale}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function EvidenceList({ evidence }: { evidence: AssessmentEvidence[] }) {
  return (
    <div className="flex flex-col gap-2">
      {evidence.map((item) => (
        <div key={item.id} className="rounded-md border px-4 py-3 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <strong className="block truncate">{item.title || item.metric_key || "Evidence item"}</strong>
              <span className="mt-1 block text-xs text-muted-foreground">
                {[item.tool_key, item.source_type, item.metric_key].filter(Boolean).join(" / ") || "Manual evidence"}
              </span>
            </div>
            <AssessmentStatusBadge status={item.status} />
          </div>
          {(item.value ?? item.raw_value ?? item.source_url) && (
            <p className="mt-2 break-all text-xs text-muted-foreground">
              {String(item.value ?? item.raw_value ?? item.source_url)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function BaselineSectionList({ sections }: { sections: BaselineSection[] }) {
  return (
    <div className="grid gap-3">
      {sections.map((section) => (
        <div key={section.id} className="rounded-md border px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-sm">{section.title}</strong>
            <AssessmentStatusBadge status={section.status || "draft"} />
          </div>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {section.summary || section.content || "Section content will appear after baseline generation."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="secondary">{section.findings?.length ?? 0} findings</Badge>
            <Badge variant="secondary">{section.recommendations?.length ?? 0} recommendations</Badge>
            {section.revision != null && <Badge variant="outline">Rev {section.revision}</Badge>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportReadinessCard({ reports, assessmentId }: { reports: ReportSummary[]; assessmentId: string }) {
  const relatedReports = reports.filter((report) => !report.assessment_id || report.assessment_id === assessmentId);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Report readiness</CardTitle>
        <CardDescription>Drafts, render artifacts, approvals, and publications use the report endpoints.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {relatedReports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No report draft has been linked to this assessment yet.</p>
        ) : (
          relatedReports.slice(0, 4).map((report) => (
            <div key={report.id} className="flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm">
              <span className="min-w-0">
                <strong className="block truncate">{report.title || report.id}</strong>
                <small className="text-muted-foreground">{formatAssessmentDate(report.updated_at || report.published_at)}</small>
              </span>
              <AssessmentStatusBadge status={report.status} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <strong className="mt-1 block truncate text-sm">{value}</strong>
    </div>
  );
}

function normalizeScore(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.round(value <= 1 ? value * 100 : value);
}
