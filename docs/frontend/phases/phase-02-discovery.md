# Phase 02 - Website Intake, Competitors, and Page Discovery

## Goal

Allow the user to enter a primary URL, discover important pages, identify competitors, and approve the assessment scope.

## Main outcome

The platform can produce a saved, versioned scope containing selected client pages and competitor pages.

## Routes

```text
/workspaces/:workspaceId/properties
/workspaces/:workspaceId/properties/:propertyId
/workspaces/:workspaceId/discovery
/workspaces/:workspaceId/competitors
/workspaces/:workspaceId/scope
```

## Page files

```text
src/pages/properties/
  PropertiesListPage.tsx
  PropertyDetailPage.tsx

src/pages/discovery/
  DiscoveryPage.tsx
  ScopeReviewPage.tsx

src/pages/competitors/
  CompetitorsPage.tsx
```

## Feature files

```text
src/features/properties/
src/features/discovery/
src/features/competitors/
src/features/scope/
```

## Main UI

- Website URL intake form.
- Primary website profile card.
- Competitor suggestion table.
- Competitor approval drawer.
- Page discovery job progress.
- Discovered pages table.
- Page classification editor.
- Scope approval screen.

## Page table columns

- URL
- Title
- Canonical URL
- Page type
- Source
- Depth
- Status
- Selected for assessment
- Last discovered date

## API contracts needed

- Create/update property.
- Start discovery job.
- Get discovery job status.
- List discovered pages.
- Update page classification.
- Add manual page.
- Suggest competitors.
- Approve/reject competitors.
- Save approved assessment scope version.

## Implementation checklist

1. Define `Property`, `Competitor`, `DiscoveredPage`, and `AssessmentScope` types.
2. Build website intake form.
3. Build discovery job progress panel.
4. Build discovered pages table with filters.
5. Build page classification drawer.
6. Build competitor approval UI.
7. Build scope review and approval screen.
8. Add stale/discovery-failed states.
9. Add tests for page selection and scope approval.

## Acceptance gate

- Discovery survives refresh/navigation.
- User can manually add missing pages.
- User can classify homepage, PDP, PLP, landing, article, and other page types.
- Approved scope is saved as a versioned record.

