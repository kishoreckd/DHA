# Phase 06 - Baseline Creation and Authoring

## Goal

Build the detailed assessment authoring workflow represented by the current 40-section baseline workbook.

## Main outcome

Analysts can generate, edit, version, and prepare a baseline for review.

## Routes

```text
/workspaces/:workspaceId/assessments
/workspaces/:workspaceId/assessments/new
/workspaces/:workspaceId/assessments/:assessmentId
/workspaces/:workspaceId/assessments/:assessmentId/baseline
/workspaces/:workspaceId/assessments/:assessmentId/baseline/sections/:sectionId
```

## Page files

```text
src/pages/assessments/
  AssessmentsPage.tsx
  AssessmentCreatePage.tsx
  AssessmentOverviewPage.tsx

src/pages/baseline/
  BaselinePage.tsx
  BaselineSectionPage.tsx
```

## Feature files

```text
src/features/assessments/
src/features/baseline/
  components/
    BaselineSectionNav.tsx
    BaselineEditor.tsx
    FindingBlockEditor.tsx
    EvidencePicker.tsx
    BaselineCompletenessPanel.tsx
```

## Main UI

- Assessment creation wizard.
- Baseline generation action.
- Baseline section navigation.
- Structured finding editor.
- Evidence picker.
- Section assignment/status.
- Completeness warnings.
- Version history.

## Baseline lifecycle

```text
draft -> ready_for_review -> in_review -> approved -> archived
```

## API contracts needed

- Create assessment.
- Get assessment detail.
- Generate baseline draft.
- List baseline sections.
- Get baseline section.
- Update baseline section.
- Assign section.
- Update section status.
- Create new baseline version.
- Submit baseline for review.

## Implementation checklist

1. Define assessment, baseline, section, finding, and recommendation types.
2. Build assessment create wizard.
3. Build baseline overview.
4. Build section navigation.
5. Build structured section editor.
6. Build evidence reference picker.
7. Add autosave with revision conflict handling.
8. Add version history.
9. Add tests for autosave, conflict, and evidence linking.

## User-facing copy rule

- Do not use internal security, compliance, or access-control slogans in visible UI. Use product workflow language instead.
- Do not add descriptions to every page, card, panel, or container by default. Use descriptive copy only when it removes ambiguity or prevents user error.

## Acceptance gate

- Baseline can be generated from accepted evidence.
- Analysts can edit without losing evidence provenance.
- Approved versions cannot be mutated.
- A new version can be created from an older approved baseline.
