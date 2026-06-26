# Phase 02 - Website Intake and Discovery

## Goal

Convert a submitted website URL into properties, competitors, discovered pages, and an approved assessment scope.

## Main outcome

The backend can discover, normalize, classify, and persist pages for client and competitor websites.

## Collections

```text
properties
competitors
discovery_jobs
discovered_pages
assessment_scopes
audit_events
```

## Required APIs

```text
POST /workspaces/{workspace_id}/properties
GET  /workspaces/{workspace_id}/properties
GET  /workspaces/{workspace_id}/properties/{property_id}
PATCH /workspaces/{workspace_id}/properties/{property_id}

POST /workspaces/{workspace_id}/competitors/suggest
GET  /workspaces/{workspace_id}/competitors
POST /workspaces/{workspace_id}/competitors
PATCH /workspaces/{workspace_id}/competitors/{competitor_id}

POST /workspaces/{workspace_id}/discovery-jobs
GET  /workspaces/{workspace_id}/discovery-jobs/{job_id}
GET  /workspaces/{workspace_id}/discovered-pages
PATCH /workspaces/{workspace_id}/discovered-pages/{page_id}
POST /workspaces/{workspace_id}/discovered-pages/manual

POST /workspaces/{workspace_id}/assessment-scopes
GET  /workspaces/{workspace_id}/assessment-scopes/{scope_id}
```

## Job work

- Normalize URL.
- Fetch sitemap when available.
- Crawl limited page depth.
- Deduplicate canonical URLs.
- Classify page type using approved rules only.
- Suggest competitors only through approved data source/contract.
- Persist discovery results.

## Acceptance gate

- Discovery is asynchronous and resumable.
- Discovered pages are deduplicated.
- Manual page addition is supported.
- Approved scope is immutable/versioned.
