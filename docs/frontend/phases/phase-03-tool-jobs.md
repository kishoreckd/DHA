# Phase 03 - Persistent Tool Jobs and Evidence Collection

## Goal

Replace temporary/in-memory tool execution with persistent backend jobs, run history, retry, artifacts, and status visibility.

## Main outcome

Users can run selected tools against selected pages and inspect durable results.

## Routes

```text
/workspaces/:workspaceId/tools
/workspaces/:workspaceId/tool-runs
/workspaces/:workspaceId/tool-runs/:runId
```

## Page files

```text
src/pages/tools/
  ToolsCatalogPage.tsx
  ToolRunsPage.tsx
  ToolRunDetailPage.tsx
```

## Feature files

```text
src/features/tools/
  api.ts
  hooks.ts
  types.ts
  components/
    ToolCatalog.tsx
    ToolRunTable.tsx
    ToolRunStatusBadge.tsx
    ToolRunTimeline.tsx
    ToolRunArtifacts.tsx
    ToolBatchDrawer.tsx
```

## Main UI

- Tool catalog grouped by metric area.
- Tool compatibility matrix.
- Batch run configuration drawer.
- Tool run table with filters.
- Live run status.
- Run detail timeline.
- Artifact links.
- Retry failed/stale run action.

## Required statuses

```text
queued
running
completed
partial
failed
cancelled
stale
```

## API contracts needed

- List tool catalog.
- Create tool batch.
- List tool runs.
- Get tool run detail.
- Retry tool run.
- Cancel tool run or batch if supported.
- Get signed artifact URL.
- Get extracted measurements.

## Implementation checklist

1. Define `ToolDefinition`, `ToolRun`, `ToolBatch`, `ArtifactSummary`, and `Measurement` types.
2. Replace local in-memory run state with API-backed query state.
3. Add polling or Server-Sent Events adapter.
4. Add run table filters.
5. Add run detail page.
6. Add retry action with confirmation.
7. Add artifact viewer/link handling.
8. Add tests for polling stop conditions and retry.

## User-facing copy rule

- Do not use internal security, compliance, or access-control slogans in visible UI. Use product workflow language instead.
- Do not add descriptions to every page, card, panel, or container by default. Use descriptive copy only when it removes ambiguity or prevents user error.

## Acceptance gate

- Refreshing the page does not lose run state.
- Failed runs can be retried individually.
- Artifacts are accessible only through authorized URLs.
- Historical runs remain visible after resync.
