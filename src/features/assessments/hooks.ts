import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assessmentsApi } from "./api";
import type { AssessmentCreateInput } from "./types";

export const assessmentKeys = {
  all: (workspaceId: string) => ["workspaces", workspaceId, "assessments"] as const,
  detail: (workspaceId: string, assessmentId: string) =>
    ["workspaces", workspaceId, "assessments", assessmentId] as const,
  evidence: (workspaceId: string, assessmentId: string) =>
    ["workspaces", workspaceId, "assessments", assessmentId, "evidence"] as const,
  completeness: (workspaceId: string, assessmentId: string) =>
    ["workspaces", workspaceId, "assessments", assessmentId, "evidence-completeness"] as const,
  baseline: (workspaceId: string, assessmentId: string) =>
    ["workspaces", workspaceId, "assessments", assessmentId, "baseline"] as const,
  scores: (workspaceId: string, assessmentId: string) =>
    ["workspaces", workspaceId, "assessments", assessmentId, "scores"] as const,
  snapshot: (workspaceId: string, assessmentId: string) =>
    ["workspaces", workspaceId, "assessments", assessmentId, "snapshot"] as const,
  trends: (workspaceId: string, assessmentId: string) =>
    ["workspaces", workspaceId, "assessments", assessmentId, "trends"] as const,
  reports: (workspaceId: string) => ["workspaces", workspaceId, "reports"] as const,
};

export function useAssessments(workspaceId?: string) {
  return useQuery({
    queryKey: assessmentKeys.all(workspaceId ?? ""),
    queryFn: () => assessmentsApi.list(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
  });
}

export function useCreateAssessment(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssessmentCreateInput) => assessmentsApi.create(workspaceId, input),
    onSuccess: (assessment) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.all(workspaceId) });
      queryClient.setQueryData(assessmentKeys.detail(workspaceId, assessment.id), assessment);
    },
  });
}

export function useAssessment(workspaceId?: string, assessmentId?: string) {
  return useQuery({
    queryKey: assessmentKeys.detail(workspaceId ?? "", assessmentId ?? ""),
    queryFn: () => assessmentsApi.get(workspaceId ?? "", assessmentId ?? ""),
    enabled: Boolean(workspaceId && assessmentId),
  });
}

export function useAssessmentEvidence(workspaceId?: string, assessmentId?: string) {
  return useQuery({
    queryKey: assessmentKeys.evidence(workspaceId ?? "", assessmentId ?? ""),
    queryFn: () => assessmentsApi.evidence(workspaceId ?? "", assessmentId ?? ""),
    enabled: Boolean(workspaceId && assessmentId),
  });
}

export function useEvidenceCompleteness(workspaceId?: string, assessmentId?: string) {
  return useQuery({
    queryKey: assessmentKeys.completeness(workspaceId ?? "", assessmentId ?? ""),
    queryFn: () => assessmentsApi.evidenceCompleteness(workspaceId ?? "", assessmentId ?? ""),
    enabled: Boolean(workspaceId && assessmentId),
  });
}

export function useAssessmentBaseline(workspaceId?: string, assessmentId?: string) {
  return useQuery({
    queryKey: assessmentKeys.baseline(workspaceId ?? "", assessmentId ?? ""),
    queryFn: () => assessmentsApi.baseline(workspaceId ?? "", assessmentId ?? ""),
    enabled: Boolean(workspaceId && assessmentId),
    retry: false,
  });
}

export function useGenerateBaseline(workspaceId: string, assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => assessmentsApi.generateBaseline(workspaceId, assessmentId),
    onSuccess: (baseline) => queryClient.setQueryData(assessmentKeys.baseline(workspaceId, assessmentId), baseline),
  });
}

export function useEvidenceAction(workspaceId: string, assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      action: "accept" | "reject" | "replace" | "manual";
      evidenceId?: string;
      payload?: Record<string, unknown>;
    }) => {
      if (input.action === "accept" && input.evidenceId) {
        return assessmentsApi.acceptEvidence(workspaceId, assessmentId, input.evidenceId);
      }
      if (input.action === "reject" && input.evidenceId) {
        return assessmentsApi.rejectEvidence(workspaceId, assessmentId, input.evidenceId, String(input.payload?.reason || "Rejected by reviewer."));
      }
      if (input.action === "replace" && input.evidenceId) {
        return assessmentsApi.replaceEvidence(workspaceId, assessmentId, input.evidenceId, input.payload ?? {});
      }
      return assessmentsApi.createManualEvidence(workspaceId, assessmentId, input.payload ?? {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.evidence(workspaceId, assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.completeness(workspaceId, assessmentId) });
    },
  });
}

export function useBaselineAction(workspaceId: string, assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      action: "section" | "version" | "submit";
      sectionId?: string;
      content?: string;
      expectedRevision?: number;
    }) => {
      if (input.action === "section" && input.sectionId) {
        return assessmentsApi.updateBaselineSection(workspaceId, assessmentId, input.sectionId, {
          expected_revision: input.expectedRevision,
          content: input.content || "",
          status: "draft",
        });
      }
      if (input.action === "version") return assessmentsApi.createBaselineVersion(workspaceId, assessmentId);
      return assessmentsApi.submitBaselineReview(workspaceId, assessmentId);
    },
    onSuccess: (baseline) => queryClient.setQueryData(assessmentKeys.baseline(workspaceId, assessmentId), baseline),
  });
}

export function useAssessmentScores(workspaceId?: string, assessmentId?: string) {
  return useQuery({
    queryKey: assessmentKeys.scores(workspaceId ?? "", assessmentId ?? ""),
    queryFn: () => assessmentsApi.scores(workspaceId ?? "", assessmentId ?? ""),
    enabled: Boolean(workspaceId && assessmentId),
  });
}

export function useAssessmentSnapshot(workspaceId?: string, assessmentId?: string) {
  return useQuery({
    queryKey: assessmentKeys.snapshot(workspaceId ?? "", assessmentId ?? ""),
    queryFn: () => assessmentsApi.snapshot(workspaceId ?? "", assessmentId ?? ""),
    enabled: Boolean(workspaceId && assessmentId),
    retry: false,
  });
}

export function useGenerateSnapshot(workspaceId: string, assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => assessmentsApi.generateSnapshot(workspaceId, assessmentId),
    onSuccess: (snapshot) => queryClient.setQueryData(assessmentKeys.snapshot(workspaceId, assessmentId), snapshot),
  });
}

export function useScoreAction(workspaceId: string, assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { action: "adjust" | "reset"; metricId: string; adjustedScore?: number; rationale?: string }) => {
      if (input.action === "adjust") {
        return assessmentsApi.adjustScore(
          workspaceId,
          assessmentId,
          input.metricId,
          input.adjustedScore ?? 0,
          input.rationale || "Reviewer adjustment.",
        );
      }
      return assessmentsApi.resetScore(workspaceId, assessmentId, input.metricId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.scores(workspaceId, assessmentId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.snapshot(workspaceId, assessmentId) });
    },
  });
}

export function useAssessmentTrends(workspaceId?: string, assessmentId?: string) {
  return useQuery({
    queryKey: assessmentKeys.trends(workspaceId ?? "", assessmentId ?? ""),
    queryFn: () => assessmentsApi.trends(workspaceId ?? "", assessmentId ?? ""),
    enabled: Boolean(workspaceId && assessmentId),
  });
}

export function useWorkspaceReports(workspaceId?: string) {
  return useQuery({
    queryKey: assessmentKeys.reports(workspaceId ?? ""),
    queryFn: () => assessmentsApi.reports(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
  });
}
