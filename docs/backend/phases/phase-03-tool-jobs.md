# Phase 03 - Tool Orchestration and Artifacts

## Goal

Run third-party tools as persistent backend jobs and store outputs, artifacts, and extracted measurements safely.

## Main outcome

The backend owns tool execution, retries, status, raw output storage, and artifact access.

## Current backend reference

The current application already exposes direct tool execution endpoints in `app/api/routes/crawler.py`, including `/crawl/pagespeed`, `/crawl/gtmetrix`, `/crawl/webpage`, `/crawl/pingdom`, `/crawl/ssllabs`, `/crawl/dnschecker`, `/crawl/websitepulse`, `/crawl/beacon`, `/crawl/catchpoint`, `/crawl/httpsecurityheaders`, `/crawl/silktide`, and `/ocr/extract`.

Do not discard these integrations. The next implementation should wrap or migrate them into persistent `tool_batches`, `tool_runs`, artifacts, retries, and evidence extraction.

## Collections

```text
tool_catalog
tool_batches
tool_runs
tool_artifacts
extracted_measurements
job_events
audit_events
```

## Required APIs

```text
GET  /tools
POST /workspaces/{workspace_id}/tool-batches
GET  /workspaces/{workspace_id}/tool-batches/{batch_id}
GET  /workspaces/{workspace_id}/tool-runs
GET  /workspaces/{workspace_id}/tool-runs/{run_id}
POST /workspaces/{workspace_id}/tool-runs/{run_id}/retry
POST /workspaces/{workspace_id}/tool-runs/{run_id}/cancel
GET  /workspaces/{workspace_id}/artifacts/{artifact_id}/signed-url
```

## Job states

```text
queued
running
completed
partial
failed
cancelled
stale
```

## Integration rules

- Third-party secrets stay server-side.
- Raw responses are stored as artifacts or secured raw documents.
- Extracted measurements are normalized separately.
- Retry creates a new attempt or records attempt history.
- Historical runs are never overwritten by resync.

## Acceptance gate

- Tool state survives server/frontend refresh.
- Failed runs can be retried individually.
- Artifacts are access-controlled.
- Tool-run history remains queryable.
