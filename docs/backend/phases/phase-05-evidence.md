# Phase 05 - Evidence Review

## Goal

Convert raw tool outputs and extracted measurements into reviewed evidence.

## Main outcome

Evidence can be accepted, rejected, replaced, or manually created with full provenance.

## Collections

```text
evidence_items
evidence_decisions
manual_evidence
evidence_completeness
audit_events
```

## Required APIs

```text
GET  /workspaces/{workspace_id}/assessments/{assessment_id}/evidence
GET  /workspaces/{workspace_id}/assessments/{assessment_id}/evidence/{evidence_id}
POST /workspaces/{workspace_id}/assessments/{assessment_id}/evidence/{evidence_id}/accept
POST /workspaces/{workspace_id}/assessments/{assessment_id}/evidence/{evidence_id}/reject
POST /workspaces/{workspace_id}/assessments/{assessment_id}/evidence/{evidence_id}/replace
POST /workspaces/{workspace_id}/assessments/{assessment_id}/evidence/manual
GET  /workspaces/{workspace_id}/assessments/{assessment_id}/evidence-completeness
```

## Acceptance gate

- Accepted evidence links to tool run/artifact or manual evidence source.
- Reviewer decisions are auditable.
- Missing required evidence can be computed by metric.
