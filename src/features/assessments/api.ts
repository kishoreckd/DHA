import { apiRequest, jsonBody } from "@/lib/api/client";
import type {
  Assessment,
  AssessmentBaseline,
  AssessmentCreateInput,
  AssessmentEvidence,
  AssessmentSnapshot,
  AssessmentTrendPoint,
  EvidenceCompleteness,
  MetricScore,
  ReportSummary,
} from "./types";

function normalizeList<T>(value: T[] | { assessments?: T[]; reports?: T[]; items?: T[]; data?: T[] }): T[] {
  if (Array.isArray(value)) return value;
  return value.assessments ?? value.reports ?? value.items ?? value.data ?? [];
}

export const assessmentsApi = {
  list: async (workspaceId: string) =>
    normalizeList<Assessment>(
      await apiRequest<Assessment[] | { assessments?: Assessment[]; items?: Assessment[] }>(
        `/api/gateway/workspaces/${workspaceId}/assessments`,
      ),
    ),
  create: (workspaceId: string, input: AssessmentCreateInput) =>
    apiRequest<Assessment>(`/api/gateway/workspaces/${workspaceId}/assessments`, {
      method: "POST",
      body: jsonBody(input),
    }),
  get: (workspaceId: string, assessmentId: string) =>
    apiRequest<Assessment>(`/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}`),
  evidence: async (workspaceId: string, assessmentId: string) =>
    normalizeList<AssessmentEvidence>(
      await apiRequest<AssessmentEvidence[] | { evidence?: AssessmentEvidence[]; items?: AssessmentEvidence[] }>(
        `/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/evidence`,
      ),
    ),
  evidenceCompleteness: (workspaceId: string, assessmentId: string) =>
    apiRequest<EvidenceCompleteness>(
      `/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/evidence-completeness`,
    ),
  acceptEvidence: (workspaceId: string, assessmentId: string, evidenceId: string, notes = "Evidence verified.") =>
    apiRequest<AssessmentEvidence>(
      `/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/evidence/${evidenceId}/accept`,
      { method: "POST", body: jsonBody({ notes }) },
    ),
  rejectEvidence: (workspaceId: string, assessmentId: string, evidenceId: string, reason: string) =>
    apiRequest<AssessmentEvidence>(
      `/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/evidence/${evidenceId}/reject`,
      { method: "POST", body: jsonBody({ reason, notes: reason }) },
    ),
  replaceEvidence: (workspaceId: string, assessmentId: string, evidenceId: string, input: Record<string, unknown>) =>
    apiRequest<AssessmentEvidence>(
      `/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/evidence/${evidenceId}/replace`,
      { method: "POST", body: jsonBody(input) },
    ),
  createManualEvidence: (workspaceId: string, assessmentId: string, input: Record<string, unknown>) =>
    apiRequest<AssessmentEvidence>(
      `/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/evidence/manual`,
      { method: "POST", body: jsonBody(input) },
    ),
  baseline: (workspaceId: string, assessmentId: string) =>
    apiRequest<AssessmentBaseline>(`/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/baseline`),
  generateBaseline: (workspaceId: string, assessmentId: string) =>
    apiRequest<AssessmentBaseline>(`/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/baseline/generate`, {
      method: "POST",
    }),
  baselineSection: (workspaceId: string, assessmentId: string, sectionId: string) =>
    apiRequest<AssessmentBaseline>(
      `/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/baseline/sections/${sectionId}`,
    ),
  updateBaselineSection: (
    workspaceId: string,
    assessmentId: string,
    sectionId: string,
    input: { expected_revision?: number; content: string; status?: string },
  ) =>
    apiRequest<AssessmentBaseline>(
      `/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/baseline/sections/${sectionId}`,
      { method: "PATCH", body: jsonBody(input) },
    ),
  createBaselineVersion: (workspaceId: string, assessmentId: string, notes = "New working version.") =>
    apiRequest<AssessmentBaseline>(
      `/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/baseline/new-version`,
      { method: "POST", body: jsonBody({ notes }) },
    ),
  submitBaselineReview: (workspaceId: string, assessmentId: string, notes = "Ready for review.") =>
    apiRequest<AssessmentBaseline>(
      `/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/baseline/submit-review`,
      { method: "POST", body: jsonBody({ notes }) },
    ),
  scores: async (workspaceId: string, assessmentId: string) =>
    normalizeList<MetricScore>(
      await apiRequest<MetricScore[] | { scores?: MetricScore[]; items?: MetricScore[] }>(
        `/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/scores`,
      ),
    ),
  score: (workspaceId: string, assessmentId: string, metricId: string) =>
    apiRequest<MetricScore>(`/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/scores/${metricId}`),
  adjustScore: (workspaceId: string, assessmentId: string, metricId: string, adjustedScore: number, rationale: string) =>
    apiRequest<MetricScore>(`/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/scores/${metricId}/adjust`, {
      method: "POST",
      body: jsonBody({ adjusted_score: adjustedScore, rationale }),
    }),
  resetScore: (workspaceId: string, assessmentId: string, metricId: string) =>
    apiRequest<MetricScore>(`/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/scores/${metricId}/reset`, {
      method: "POST",
    }),
  snapshot: (workspaceId: string, assessmentId: string) =>
    apiRequest<AssessmentSnapshot>(`/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/snapshot`),
  generateSnapshot: (workspaceId: string, assessmentId: string) =>
    apiRequest<AssessmentSnapshot>(`/api/gateway/workspaces/${workspaceId}/assessments/${assessmentId}/snapshot/generate`, {
      method: "POST",
    }),
  trends: async (workspaceId: string, assessmentId: string) =>
    normalizeList<AssessmentTrendPoint>(
      await apiRequest<AssessmentTrendPoint[] | { trends?: AssessmentTrendPoint[]; items?: AssessmentTrendPoint[] }>(
        `/api/gateway/workspaces/${workspaceId}/trends?assessment_id=${encodeURIComponent(assessmentId)}`,
      ),
    ),
  reports: async (workspaceId: string) =>
    normalizeList<ReportSummary>(
      await apiRequest<ReportSummary[] | { reports?: ReportSummary[]; items?: ReportSummary[] }>(
        `/api/gateway/workspaces/${workspaceId}/reports`,
      ),
    ),
};
