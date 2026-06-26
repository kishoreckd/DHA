# Phase 00 - Backend Foundation

## Goal

Create a clean Python/FastAPI backend foundation that can support long-running assessment workflows, MongoDB persistence, background jobs, permissions, and audit trails.

## Main outcome

A stable backend structure that every later phase can extend without turning route files into business-logic containers.

## Recommended backend structure

```text
app/
  main.py
  logging_config.py
  api/
    __init__.py
    dependencies.py
    routes/
      auth_routes.py
      user_routes.py
      admin_user_routes.py
      crawler.py
      baseline_routes.py
  core/
    config.py
    db.py
    startup.py
  models/
  schemas/
  services/
    Tools/
  utils/

  # Add these as the product grows
  repositories/
  jobs/
  integrations/
  permissions/
  audit/
  db/
    indexes.py
  tests/
```

## Core work

- FastAPI application setup.
- Environment configuration.
- MongoDB connection lifecycle.
- Health check endpoints.
- Standard API response and error format.
- Request correlation ID.
- Structured logging.
- Pagination conventions.
- Base repository pattern.
- Base service pattern.
- Test setup with isolated test database.

## Required APIs

```text
GET /health       existing
GET /ready        add when readiness checks are separated from health
```

## MongoDB foundation

- Connection pool configured through environment.
- Collection naming convention.
- Index creation script.
- Migration/index version tracking.
- Test database isolation.

## Acceptance gate

- Backend starts cleanly.
- Health and readiness endpoints work.
- MongoDB connection is verified.
- Error responses use one consistent shape.
- Tests run in CI/local environment.
