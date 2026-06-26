# Phase 04 - Methodology and Metrics

## Goal

Model the 68-metric methodology as versioned backend configuration.

## Main outcome

Admins can create, validate, and publish immutable methodology versions.

## Collections

```text
methodologies
methodology_versions
metric_definitions
dimension_definitions
tool_metric_mappings
scoring_rules
audit_events
```

## Required APIs

```text
GET  /admin/methodologies
POST /admin/methodologies
GET  /admin/methodologies/{methodology_id}
POST /admin/methodologies/{methodology_id}/clone
PATCH /admin/methodologies/{methodology_id}/draft
POST /admin/methodologies/{methodology_id}/validate
POST /admin/methodologies/{methodology_id}/publish

GET  /admin/metrics
POST /admin/metrics
PATCH /admin/metrics/{metric_id}
```

## Validation rules

- Weight totals must match expected dimension/sub-dimension rules.
- Required evidence mapping must be valid.
- Tool mappings must reference active tools.
- Published methodology versions are immutable.

## Acceptance gate

- Draft methodology can be edited.
- Invalid methodology cannot be published.
- Published methodology cannot be mutated.
- Assessments reference exact methodology version IDs.
