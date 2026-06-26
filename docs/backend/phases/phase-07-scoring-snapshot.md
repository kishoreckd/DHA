# Phase 07 - Scoring, Snapshots, and Trends

## Goal

Calculate authoritative scores, competitor comparisons, and immutable snapshot versions.

## Main outcome

The backend owns metric scoring, score adjustments, aggregate rollups, trend storage, and snapshot generation.

## Collections

```text
metric_scores
score_adjustments
snapshot_versions
snapshot_rollups
trend_points
audit_events
```

## Required APIs

```text
GET  /workspaces/{workspace_id}/assessments/{assessment_id}/scores
GET  /workspaces/{workspace_id}/assessments/{assessment_id}/scores/{metric_id}
POST /workspaces/{workspace_id}/assessments/{assessment_id}/scores/{metric_id}/adjust
POST /workspaces/{workspace_id}/assessments/{assessment_id}/scores/{metric_id}/reset

POST /workspaces/{workspace_id}/assessments/{assessment_id}/snapshot/generate
GET  /workspaces/{workspace_id}/assessments/{assessment_id}/snapshot
GET  /workspaces/{workspace_id}/trends
```

## Acceptance gate

- Backend calculates authoritative scores.
- Adjustments require rationale.
- Snapshot versions are immutable after approval.
- Trends distinguish blank, zero, and not-applicable values.
