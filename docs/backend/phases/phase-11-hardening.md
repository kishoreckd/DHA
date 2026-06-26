# Phase 11 - Hardening and Scale

## Goal

Prepare the backend for production scale, reliability, observability, retention, and recovery.

## Main outcome

The backend is operationally safe for larger clients, more tool jobs, larger evidence sets, and more publication artifacts.

## Scope

- MongoDB indexes and query profiling.
- Job retry/backoff and dead-letter handling.
- Rate limiting.
- Artifact retention.
- Archive policies.
- Structured telemetry.
- Alerting.
- Backup and restore procedures.
- Load testing.
- Security review.

## Acceptance gate

- Slow queries are indexed or redesigned.
- Failed jobs are visible and recoverable.
- Audit trail is complete for sensitive actions.
- Backups and artifact retention are documented.
- Production incidents can be traced with correlation IDs.

