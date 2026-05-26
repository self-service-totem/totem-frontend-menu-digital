# FFresco Frontend — Documentation Index

This folder contains the frontend documentation and working framework for the FFresco UI.

The goal is to make frontend implementation predictable for humans, Claude Code and Cursor.

---

## Documents

```txt
docs/01-frontend-architecture-standard.md
docs/02-ui-component-standard.md
docs/03-api-integration-standard.md
docs/04-modal-toast-standard.md
docs/05-testing-strategy.md
docs/planning/frontend-masterplan-prs.md
docs/tickets/pr-ticket-template.md
docs/tickets/prompt-create-ticket.md
docs/tickets/pr-ticket-example-public-menu.md
```

---

## Responsibility of each document

### `01-frontend-architecture-standard.md`

Canonical rules for folder structure, feature organization, page/component boundaries and frontend layering.

### `02-ui-component-standard.md`

Canonical rules for components, Bootstrap usage, styling, naming and UI consistency.

### `03-api-integration-standard.md`

Canonical rules for calling the backend, using `/v1`, mapping DTOs, handling loading/error states and keeping mocks aligned.

### `04-modal-toast-standard.md`

Canonical rules for modals, confirmations, alerts, notifications and avoiding ad hoc dialogs.

### `05-testing-strategy.md`

Testing expectations for pages, components, hooks and API integration.

### `planning/frontend-masterplan-prs.md`

Operational roadmap. It says what frontend PRs exist, their order, which backend PR they depend on, and what each PR should implement and test.

### `tickets/*`

Ticket creation framework. Use these files to create consistent GitHub/Jira tickets and PR descriptions.

---

## Rule of thumb

```txt
This docs folder explains how the frontend should be built.
The planning file explains what to build and in which order.
The ticket template defines the scope of one PR.
Claude Code implements one PR at a time.
```
