# Phase 08 - Review and Approval

## Goal

Create review workflows for baselines, snapshots, and reports.

## Main outcome

The backend supports submission, assignment, comments, change requests, approvals, and immutable approval records.

## Collections

```text
reviews
review_items
comments
approval_records
activity_events
audit_events
```

## Required APIs

```text
GET  /reviews
GET  /reviews/{review_id}
POST /reviews
POST /reviews/{review_id}/comments
POST /reviews/{review_id}/request-changes
POST /reviews/{review_id}/approve
POST /reviews/{review_id}/reject
GET  /reviews/{review_id}/comparison
```

## Acceptance gate

- Only authorized reviewers can approve.
- Approval records exact source versions.
- Mutating approved content requires a new version/review.
