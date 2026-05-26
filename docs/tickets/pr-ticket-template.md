# [FRONT] PR X — Feature Name

## Branch

```txt
feature/<ticket-number>-<short-description>
```

---

## Context

Explain the current frontend state and why this PR is needed.

Mention whether the screen currently uses mocks and which backend endpoint is now available.

---

## User value

Explain the feature in human language.

```txt
As a user/customer/operator,
I want to...
So that...
```

---

## Frontend screen or flow

```txt
Screen:
Route:
User action:
Backend dependency:
```

---

## API contract

```http
METHOD /v1/...
```

Expected success response summary:

```txt
Describe only what the frontend needs to render.
```

Expected errors:

```txt
400:
404:
409:
500/network:
```

---

## Scope

This PR must implement:

```txt
-
-
-
```

---

## Out of scope

This PR must not implement:

```txt
-
-
-
```

---

## Implementation notes

Follow:

```txt
docs/01-frontend-architecture-standard.md
docs/02-ui-component-standard.md
docs/03-api-integration-standard.md
docs/04-modal-toast-standard.md
docs/05-testing-strategy.md
```

Expected implementation shape:

```txt
1. Page or feature entrypoint update
2. Service function update/addition
3. Types/DTOs if needed
4. Loading state
5. Success state
6. Empty state if applicable
7. Error state
8. Component updates
9. Tests if applicable
```

---

## Gherkin scenarios

```gherkin
Feature: [Feature name]

  Scenario: Happy path
    Given ...
    When ...
    Then ...

  Scenario: Error state
    Given ...
    When ...
    Then ...
```

---

## Acceptance criteria

```txt
-
-
-
```

---

## Testing requirements

```txt
-
-
-
```

---

## Definition of Done

```txt
1. Code compiles.
2. Feature works with the expected API/mock source.
3. Loading state is handled.
4. Error state is handled.
5. Empty state is handled when applicable.
6. No direct fetch exists inside visual components.
7. No ad hoc modal/toast pattern is introduced.
8. Existing UI flows are not broken.
9. Relevant tests are added or explicitly deferred with reason.
```
