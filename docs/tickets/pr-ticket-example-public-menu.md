# [FRONT] PR 1 — Connect Public Menu API

## Branch

```txt
feature/1-connect-public-menu-api
```

---

## Context

The current menu screen uses mock data from the frontend project. The backend Public Menu endpoint is now available and should become the source of truth for the menu shown to customers.

This PR connects the existing menu UI to the real backend endpoint while preserving the current user experience.

---

## User value

As a customer opening the menu from a table QR, I want to see the real menu for my table and branch, so that I can choose products with the correct price and availability.

---

## Frontend screen or flow

```txt
Screen: MenuPage
Route: existing public menu route
User action: customer opens the menu from QR/table context
Backend dependency: BACK PR 1 — Public Menu
```

---

## API contract

```http
GET /v1/public/menu?tableId={tablePublicId}
```

Expected success response summary:

```txt
The response provides restaurant/table context, categories, products, prices, images and availability.
```

Expected errors:

```txt
400: missing or invalid tableId
404: table or active menu not found
409: inactive table
500/network: unexpected or connectivity error
```

---

## Scope

This PR must implement:

```txt
- Update menuService to call the real backend endpoint.
- Keep mock fallback only if explicitly configured.
- Read tableId from the existing session/query flow.
- Render loading state while the menu is being loaded.
- Render categories and products from the backend response.
- Render prices and availability from backend data.
- Show friendly error when the menu is unavailable.
- Preserve product detail modal behavior.
```

---

## Out of scope

This PR must not implement:

```txt
- Place order API integration.
- Cart redesign.
- Payment flow.
- Admin menu management.
- Kitchen or operations screens.
- A full frontend folder refactor.
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
1. Update or add typed Public Menu response types.
2. Update menuService.getPublicMenu(tableId).
3. Update MenuPage to load data from service.
4. Add loading state.
5. Add friendly error state.
6. Add empty state when no products are returned.
7. Keep ProductCard/ProductSection reusable.
8. Add tests if the project test setup exists; otherwise document the test gap.
```

---

## Gherkin scenarios

```gherkin
Feature: Public menu integration

  Scenario: Customer sees the real public menu
    Given a valid table id
    And the backend returns a public menu with categories and products
    When the customer opens the menu page
    Then the frontend shows the returned categories
    And the frontend shows the returned products
    And the frontend shows backend prices and availability

  Scenario: Public menu is unavailable
    Given a valid table id
    And the backend returns that the table is inactive
    When the customer opens the menu page
    Then the frontend shows a friendly unavailable menu message

  Scenario: Public menu is empty
    Given a valid table id
    And the backend returns a menu with no products
    When the customer opens the menu page
    Then the frontend shows an empty menu state
```

---

## Acceptance criteria

```txt
- MenuPage no longer depends directly on hardcoded product/category mocks for the main happy path.
- The frontend calls GET /v1/public/menu?tableId={tablePublicId} through menuService.
- The screen renders categories, products, prices and availability from the response.
- Loading state is visible while data is being fetched.
- Error state is friendly and does not show raw technical errors.
- Product detail modal still works with real product data.
- Existing navigation layout remains intact.
```

---

## Testing requirements

```txt
- Test or manually validate happy path with real/mocked backend response.
- Test or manually validate empty menu state.
- Test or manually validate inactive table/error state.
- Test or manually validate product detail modal still opens.
- Run npm run build.
```

---

## Definition of Done

```txt
1. Code compiles.
2. MenuPage works with the real Public Menu API contract.
3. Loading state is handled.
4. Error state is handled.
5. Empty state is handled.
6. No direct fetch exists inside visual components.
7. No ad hoc modal/toast pattern is introduced.
8. Existing cart/product detail flows are not broken.
9. Build passes.
```
