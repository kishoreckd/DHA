# Phase 09 - Reports and Publication

## Goal

Create report drafts, render HTML/PDF artifacts, and publish immutable versions.

## Main outcome

The backend can compose report data, render artifacts, and manage publication lifecycle.

## Collections

```text
reports
report_versions
report_sections
render_jobs
publication_records
publication_artifacts
audit_events
```

## Required APIs

```text
GET  /workspaces/{workspace_id}/reports
POST /workspaces/{workspace_id}/reports
GET  /workspaces/{workspace_id}/reports/{report_id}
PATCH /workspaces/{workspace_id}/reports/{report_id}
POST /workspaces/{workspace_id}/reports/{report_id}/render-html
POST /workspaces/{workspace_id}/reports/{report_id}/render-pdf
POST /workspaces/{workspace_id}/reports/{report_id}/publish
POST /workspaces/{workspace_id}/reports/{report_id}/supersede

GET /publications/{publication_id}
```

## Acceptance gate

- Published reports reference frozen source versions.
- HTML and PDF artifacts come from same report version.
- Published versions cannot change in place.
- Publication access is permission-controlled.
