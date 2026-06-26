# Phase 05 - Evidence Review and Observations

## Goal

Turn raw tool output into reviewed, traceable evidence that can support baseline findings and metric scores.

## Main outcome

Analysts can accept, reject, replace, or manually add evidence.

## Routes

```text
/workspaces/:workspaceId/assessments/:assessmentId/evidence
/workspaces/:workspaceId/assessments/:assessmentId/evidence/:evidenceId
```

## Page files

```text
src/pages/evidence/
  EvidenceReviewPage.tsx
  EvidenceDetailPage.tsx
```

## Feature files

```text
src/features/evidence/
  api.ts
  hooks.ts
  types.ts
  components/
    EvidenceMatrix.tsx
    EvidenceQueue.tsx
    EvidenceDecisionPanel.tsx
    EvidenceArtifactPanel.tsx
    ManualEvidenceForm.tsx
```

## Main UI

- Evidence completeness matrix.
- Evidence review queue.
- Evidence detail with artifact preview.
- Accept/reject/replace actions.
- Manual evidence form.
- Reviewer decision history.
- Missing evidence warnings.

## API contracts needed

- List evidence items.
- Get evidence detail.
- Accept evidence.
- Reject evidence.
- Replace extracted value.
- Create manual evidence.
- List artifacts for evidence.
- List evidence completeness by metric.

## Implementation checklist

1. Define `EvidenceItem`, `EvidenceDecision`, and `EvidenceCompleteness` types.
2. Build evidence review queue.
3. Build artifact and extracted-value side-by-side view.
4. Build decision actions.
5. Build manual evidence form.
6. Add metric/page/tool filters.
7. Add tests for accept/reject/manual evidence flows.

## User-facing copy rule

- Do not use internal security, compliance, or access-control slogans in visible UI. Use product workflow language instead.
- Do not add descriptions to every page, card, panel, or container by default. Use descriptive copy only when it removes ambiguity or prevents user error.

## Acceptance gate

- Every accepted observation links to evidence or is clearly marked manual.
- Missing required evidence is visible before baseline generation.
- Evidence decisions are recorded with clear reviewer, timestamp, and rationale details.
