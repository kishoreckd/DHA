# Phase 11 - Hardening, Scale, and Product Analytics

## Goal

Prepare the frontend for real production usage across large clients, large evidence volumes, multiple users, and controlled publication.

## Main outcome

The product is stable, measurable, accessible, and maintainable.

## Scope

- Large table virtualization.
- Saved filters.
- Bulk actions.
- Accessibility review.
- Performance budgets.
- Error telemetry.
- Product analytics.
- Cross-browser testing.
- Responsive testing.
- Degraded-service states.
- Export and archive workflows.

## Frontend areas to improve

```text
src/shared/components/data-table/
src/shared/components/charts/
src/shared/telemetry/
src/shared/accessibility/
src/shared/performance/
src/features/audit/
```

## Implementation checklist

1. Add virtualization to large evidence/tool-run tables.
2. Add saved views for operational queues.
3. Add bulk actions only where backend supports safe batch jobs.
4. Run WCAG 2.1 AA accessibility audit.
5. Add route-level performance measurement.
6. Lazy-load heavy editors and charting libraries.
7. Add frontend telemetry for failed workflows.
8. Add E2E tests for critical journeys.
9. Add degraded-state screens for backend/job outages.
10. Document support playbooks.

## User-facing copy rule

- Do not use internal security, compliance, or access-control slogans in visible UI. Use product workflow language instead.
- Do not add descriptions to every page, card, panel, or container by default. Use descriptive copy only when it removes ambiguity or prevents user error.

## Acceptance gate

- Core flows pass E2E tests.
- Key pages meet agreed performance budgets.
- Accessibility review has no critical violations.
- Telemetry can identify failed workflows and affected users.
