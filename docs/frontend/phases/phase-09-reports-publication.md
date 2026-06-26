# Phase 09 - Report Composition and Publication

## Goal

Generate client-facing reports from approved structured assessment data.

## Main outcome

Users can compose report drafts, preview HTML/PDF, and publish frozen versions.

## Routes

```text
/workspaces/:workspaceId/reports
/workspaces/:workspaceId/reports/:reportId
/workspaces/:workspaceId/reports/:reportId/edit
/workspaces/:workspaceId/reports/:reportId/preview
/publications/:publicationId
```

## Page files

```text
src/pages/reports/
  ReportsPage.tsx
  ReportDetailPage.tsx
  ReportEditorPage.tsx
  ReportPreviewPage.tsx

src/pages/publications/
  PublicationViewPage.tsx
```

## Feature files

```text
src/features/reports/
src/features/publications/
```

## Main UI

- Report list.
- Report composer.
- Section ordering.
- Executive summary editor.
- Recommendation editor.
- Source visibility controls.
- HTML preview.
- PDF generation status.
- Publish/supersede/unpublish actions.

## Report lifecycle

```text
draft -> in_review -> approved -> published -> superseded
```

## API contracts needed

- List reports.
- Create report draft.
- Get report detail.
- Update report content.
- Reorder sections.
- Request HTML preview.
- Request PDF generation.
- Publish report.
- Supersede report.
- Get publication detail.

## Implementation checklist

1. Define report, report section, publication, and render job types.
2. Build reports list.
3. Build report composer.
4. Build HTML preview route.
5. Build PDF generation progress.
6. Build publication actions with confirmations.
7. Add tests for publication immutability.

## User-facing copy rule

- Do not use internal security, compliance, or access-control slogans in visible UI. Use product workflow language instead.
- Do not add descriptions to every page, card, panel, or container by default. Use descriptive copy only when it removes ambiguity or prevents user error.

## Acceptance gate

- Published output references frozen source versions.
- Published reports cannot change in place.
- HTML and PDF are based on the same report version.
- Unauthorized users cannot view restricted publications.
