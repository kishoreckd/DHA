# Phase 07 - Scoring, Snapshot, and Trends

## Goal

Recreate the snapshot workbook experience inside the app: 68 metrics, dimensions, sub-dimensions, competitor comparison, trend views, and snapshot versions.

## Main outcome

Analysts can review metric scores, adjust with rationale, and generate a versioned snapshot.

## Routes

```text
/workspaces/:workspaceId/assessments/:assessmentId/scores
/workspaces/:workspaceId/assessments/:assessmentId/snapshot
/workspaces/:workspaceId/trends
```

## Page files

```text
src/pages/scoring/
  ScoresPage.tsx

src/pages/snapshots/
  SnapshotPage.tsx
  TrendsPage.tsx
```

## Feature files

```text
src/features/scoring/
src/features/snapshots/
src/features/trends/
```

## Main UI

- 68-metric score grid.
- Metric filters.
- Score source indicator.
- Score rationale drawer.
- Formula explanation drawer.
- Competitor leaderboard.
- Dimension heatmap.
- Trend charts.
- Snapshot generation action.

## API contracts needed

- Get metric scores.
- Get score detail.
- Adjust score with rationale.
- Reset adjusted score.
- Generate snapshot.
- Get snapshot detail.
- Get trend data.
- Get competitor comparison.

## Implementation checklist

1. Define score, snapshot, and trend types.
2. Build metric scoring grid.
3. Add score detail drawer.
4. Add adjusted score flow.
5. Add competitor comparison.
6. Add snapshot overview.
7. Add trend charts after chart-library spike.
8. Add tests for blank vs zero vs not-applicable states.

## Acceptance gate

- Frontend displays backend-calculated values without recalculating authority.
- Adjusted scores require a reason.
- Blank, zero, and not-applicable are visually distinct.
- Snapshot versions are immutable after approval.

