# Phase 06 - Baseline Generation

## Goal

Generate and store structured baseline assessments based on accepted evidence and methodology.

## Main outcome

The backend creates versioned baseline drafts with sections, findings, recommendations, and evidence references.

## Current backend reference

The current application already has `app/api/routes/baseline_routes.py` with `/baselines` APIs that store a named baseline, client name, target URL, owner, status, and captured tool reports.

Do not remove this working baseline API without a migration path. The product backend should evolve it from a simple tool-report container into versioned assessment baselines with sections, findings, recommendations, evidence references, review state, and immutable approved versions.

## Collections

```text
assessments
baseline_versions
baseline_sections
finding_blocks
recommendations
audit_events
```

## Required APIs

```text
POST /workspaces/{workspace_id}/assessments
GET  /workspaces/{workspace_id}/assessments
GET  /workspaces/{workspace_id}/assessments/{assessment_id}

POST /workspaces/{workspace_id}/assessments/{assessment_id}/baseline/generate
GET  /workspaces/{workspace_id}/assessments/{assessment_id}/baseline
GET  /workspaces/{workspace_id}/assessments/{assessment_id}/baseline/sections/{section_id}
PATCH /workspaces/{workspace_id}/assessments/{assessment_id}/baseline/sections/{section_id}
POST /workspaces/{workspace_id}/assessments/{assessment_id}/baseline/new-version
POST /workspaces/{workspace_id}/assessments/{assessment_id}/baseline/submit-review
```

## Acceptance gate

- Baseline generation uses accepted evidence.
- Sections preserve evidence references.
- Revision conflicts are detected.
- Approved baseline versions cannot be mutated.
