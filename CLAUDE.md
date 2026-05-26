# FFresco Frontend — Claude Guide

This repository contains the FFresco customer/admin frontend built with React, TypeScript, Vite, React Router and React Bootstrap.

Use this file as the short index for Claude Code. Do not duplicate full rules here. The canonical rules live in `docs/`.

---

## Canonical documents

Read these before implementing frontend PRs:

```txt
docs/00-index.md
docs/01-frontend-architecture-standard.md
docs/02-ui-component-standard.md
docs/03-api-integration-standard.md
docs/04-modal-toast-standard.md
docs/05-testing-strategy.md
docs/planning/frontend-masterplan-prs.md
docs/tickets/pr-ticket-template.md
```

---

## Current stack

```txt
React 18
TypeScript
Vite
React Router
React Bootstrap
Bootstrap Icons
Feature-based pages
Shared components
Service layer currently under src/services
Mocks currently under src/mocks
```

---

## Main implementation rules

```txt
1. Do not create ad hoc UI patterns.
2. Do not call fetch directly from pages or visual components.
3. API calls must live in service/api modules.
4. Pages orchestrate data loading and user flow.
5. Components render UI and receive props.
6. Shared UI patterns belong under shared/common components.
7. Modals and notifications must use a centralized pattern.
8. Do not duplicate API types in multiple places.
9. Keep mocks aligned with backend contracts.
10. Do not rewrite unrelated screens while implementing one PR.
```

---

## API contract

Backend endpoints use path-based versioning.

Current version:

```txt
/v1
```

Examples:

```http
GET /v1/public/menu?tableId={tablePublicId}
POST /v1/public/tables/{tablePublicId}/orders
GET /v1/operations/branches/{branchId}/orders
PATCH /v1/operations/orders/{orderId}/status
```

The frontend must consume the versioned backend contract. Do not call unversioned routes.

---

## PR workflow

Use the ordered frontend roadmap in:

```txt
docs/planning/frontend-masterplan-prs.md
```

Use the ticket template and prompt in:

```txt
docs/tickets/pr-ticket-template.md
docs/tickets/prompt-create-ticket.md
```

Use Claude command:

```txt
/create-pr
```

The command definition lives in:

```txt
.claude/commands/create-pr.md
```
