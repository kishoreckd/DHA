# Phase 08 - Review, Approval, and Collaboration

## Goal

Create controlled quality review before baseline, snapshot, or report publication.

## Main outcome

Reviewers can request changes, approve versions, and maintain a clear audit trail.

## Routes

```text
/reviews
/reviews/:reviewId
```

## Page files

```text
src/pages/reviews/
  ReviewsInboxPage.tsx
  ReviewDetailPage.tsx
```

## Feature files

```text
src/features/reviews/
src/features/comments/
src/features/activity/
```

## Main UI

- Review inbox.
- Assigned-to-me filter.
- Waiting-on-me filter.
- Review detail.
- Section/finding comments.
- Change request summary.
- Approval checklist.
- Version comparison.
- Activity timeline.

## Review lifecycle

```text
draft -> submitted -> in_review -> changes_requested -> approved
```

## API contracts needed

- List reviews.
- Get review detail.
- Submit for review.
- Add comment.
- Resolve comment.
- Request changes.
- Approve review.
- Reject review.
- Get version comparison.

## Implementation checklist

1. Define review, comment, checklist, and activity types.
2. Build review inbox.
3. Build review detail page.
4. Build comments and change-request UI.
5. Build approve/reject actions.
6. Add version comparison panel.
7. Add tests for permission-gated approvals.

## User-facing copy rule

- Do not use internal security, compliance, or access-control slogans in visible UI. Use product workflow language instead.
- Do not add descriptions to every page, card, panel, or container by default. Use descriptive copy only when it removes ambiguity or prevents user error.

## Acceptance gate

- Only authorized reviewers can approve.
- Approval records exact baseline, snapshot, report, and methodology versions.
- Changes after approval require a new review.
