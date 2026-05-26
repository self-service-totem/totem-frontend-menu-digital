# /create-pr — Implement one frontend PR

Use this command when the user provides a frontend ticket and wants Claude Code to implement it.

---

## Required context

Before implementing, read:

```txt
CLAUDE.md
docs/00-index.md
docs/01-frontend-architecture-standard.md
docs/02-ui-component-standard.md
docs/03-api-integration-standard.md
docs/04-modal-toast-standard.md
docs/05-testing-strategy.md
docs/planning/frontend-masterplan-prs.md
```

---

## Command behavior

Implement only the ticket provided by the user.

Do not implement adjacent PRs.
Do not redesign the whole frontend.
Do not move unrelated files.
Do not introduce a new UI framework.
Do not call fetch directly from visual components.
Do not create ad hoc modal/toast patterns.

---

## Expected implementation shape

For a normal frontend PR, include only what applies:

```txt
1. Route/page update
2. Service/API function update
3. Types/DTOs
4. Hook if useful
5. Component updates
6. Loading state
7. Empty state
8. Error state
9. Modal/toast usage if needed
10. Tests or clear note if test setup does not exist
```

---

## Architecture rules

```txt
Page = orchestrates flow
Hook = manages data/UI state
Service = calls backend/mock source
Component = renders UI
Shared UI = reusable visual pattern
```

Do not put backend calling logic in presentational components.

---

## API rules

All backend routes must use `/v1`.

Examples:

```http
GET /v1/public/menu?tableId={tablePublicId}
POST /v1/public/tables/{tablePublicId}/orders
GET /v1/operations/branches/{branchId}/orders
PATCH /v1/operations/orders/{orderId}/status
```

---

## Done criteria

The PR is done only when:

```txt
1. Code compiles.
2. The requested screen/flow works.
3. Loading state is handled.
4. Error state is handled.
5. Empty state is handled when applicable.
6. API calls are made through services/api layer.
7. No unrelated files were modified.
8. No ad hoc modal/toast implementation was introduced.
9. Build/lint/test command status is reported.
```

---

## Output expected after implementation

After implementing, summarize:

```txt
1. Files created
2. Files modified
3. Main components/services changed
4. API endpoints consumed
5. Tests added or not added with reason
6. Commands run
7. Manual validation steps
```
