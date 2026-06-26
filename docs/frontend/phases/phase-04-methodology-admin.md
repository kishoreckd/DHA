# Phase 04 - Methodology and Metric Administration

## Goal

Allow admins to configure metric definitions, dimensions, weights, thresholds, formulas, and tool mappings.

## Main outcome

The 68-metric scoring methodology becomes configurable and versioned.

## Routes

```text
/admin/methodologies
/admin/methodologies/new
/admin/methodologies/:methodologyId
/admin/methodologies/:methodologyId/metrics
/admin/tools
```

## Page files

```text
src/pages/admin/methodologies/
  MethodologiesPage.tsx
  MethodologyCreatePage.tsx
  MethodologyDetailPage.tsx
  MethodologyMetricsPage.tsx

src/pages/admin/tools/
  AdminToolsPage.tsx
```

## Feature files

```text
src/features/methodologies/
src/features/metrics/
src/features/admin-tools/
```

## Main UI

- Methodology list.
- Methodology version detail.
- Metric registry table.
- Metric editor drawer.
- Dimension/sub-dimension manager.
- Tool-to-metric mapping editor.
- Weight validation panel.
- Publish methodology confirmation.

## API contracts needed

- List methodologies.
- Clone methodology.
- Get methodology detail.
- Update draft methodology.
- List metric definitions.
- Create/update metric definition.
- Validate methodology.
- Publish methodology version.
- List admin tool catalog.

## Implementation checklist

1. Define methodology and metric types.
2. Build methodology list.
3. Build read-only methodology detail.
4. Build draft metric editor.
5. Add weight and mapping validation UI.
6. Add methodology comparison view.
7. Add publish flow with warnings.
8. Add tests for validation and immutable published versions.

## Acceptance gate

- Published methodologies cannot be edited.
- Invalid weights or broken mappings block publication.
- Historical assessments display their original methodology version.
- Admin-only actions are permission gated.

