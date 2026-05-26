# Prompt — Create Frontend PR Ticket

Use this prompt to ask ChatGPT or another AI to create a frontend PR ticket using the FFresco frontend standards.

---

## Prompt

```txt
I want to create a frontend PR ticket for FFresco.

Use the following canonical documents as rules:

- docs/01-frontend-architecture-standard.md
- docs/02-ui-component-standard.md
- docs/03-api-integration-standard.md
- docs/04-modal-toast-standard.md
- docs/05-testing-strategy.md
- docs/planning/frontend-masterplan-prs.md
- docs/tickets/pr-ticket-template.md

Do not repeat the full architecture rules in the ticket.
Reference the canonical docs instead.

Create a ticket ready to paste into GitHub Projects/Jira.

The ticket must include:

- Title
- Suggested branch
- Context
- User value
- Frontend screen or flow
- API contract
- Scope
- Out of scope
- Implementation notes
- Gherkin scenarios
- Acceptance criteria
- Testing requirements
- Definition of Done

Feature to create:

[PASTE FEATURE DESCRIPTION HERE]
```

---

## Minimal input example

```txt
Create the ticket for FRONT PR 1 — Connect Public Menu API.

The menu page currently uses mocks. The backend endpoint GET /v1/public/menu?tableId={tablePublicId} is available.
The frontend must call the real endpoint, render categories/products/prices, and handle loading, empty and error states.
```
