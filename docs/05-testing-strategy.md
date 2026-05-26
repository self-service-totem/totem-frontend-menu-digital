# Frontend Testing Strategy

## Objective

Add enough frontend tests to protect critical MVP flows without slowing down development.

The current project does not need a huge testing setup from day one, but each real integration PR should be testable and predictable.

---

## Recommended tools

When adding tests, prefer:

```txt
Vitest
React Testing Library
MSW for API mocking
```

These fit well with Vite and React.

---

## Testing pyramid for this frontend

```txt
1. Unit tests for pure utilities and mapping functions.
2. Component tests for shared/critical UI components.
3. Page tests for important flows using mocked services/API.
4. Optional E2E later for the full MVP demo flow.
```

---

## What to test per PR

Each frontend PR should include tests when the PR adds non-trivial behavior.

Minimum expected coverage for real endpoint integration:

```txt
1. Loading state
2. Success state
3. Empty state when applicable
4. Error state
5. Main user action
```

Example for Public Menu:

```txt
- Shows loading while fetching menu.
- Renders categories and products on success.
- Shows empty state when no products exist.
- Shows friendly error when table is not found.
- Allows opening product detail.
```

Example for Place Order:

```txt
- Submit button is disabled for empty cart.
- Sends correct request payload.
- Clears cart on success.
- Shows error when backend returns conflict.
```

---

## What not to test heavily at MVP stage

Avoid spending too much time testing:

```txt
Bootstrap internals
Visual spacing details
Every small presentational component
Implementation details of React state
```

Focus on user-visible behavior.

---

## Mocking rule

Tests should not hit the real backend.

Use one of:

```txt
Mocked service functions
MSW handlers
Local fixtures aligned with backend contracts
```

Mocks used in tests must reflect real API contracts from backend docs/tickets.

---

## Acceptance-style frontend test idea

For critical screens, write tests that render the page and simulate the user flow.

Example:

```txt
Render MenuPage with tableId.
Mock GET /v1/public/menu.
Wait for products.
Click product.
Add to cart.
Assert cart changed.
```

This style is more valuable than testing internal state variables.

---

## Definition of Done for frontend PRs

A frontend PR is done when:

```txt
1. The screen compiles.
2. The feature works with mock or real API as defined in the ticket.
3. Loading, empty and error states are handled.
4. Components follow the UI standard.
5. No direct fetch exists inside visual components.
6. No ad hoc modal/toast pattern was introduced.
7. Existing flows are not broken.
8. Relevant tests were added or the reason for not adding tests is clear.
```
