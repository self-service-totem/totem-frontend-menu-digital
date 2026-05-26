# FFresco Frontend — Masterplan diario de PRs

## Objetivo

Este documento organiza la construcción del frontend de FFresco en PRs pequeños, conectados al avance del backend.

La estrategia recomendada es trabajar por vertical slices:

```txt
1. Backend PR expone una capacidad.
2. Frontend PR consume esa capacidad.
3. Se valida el flujo usuario-pantalla-endpoint.
4. Se ajusta el contrato si hace falta.
```

Este documento dice **qué construir y en qué orden**. Las reglas canónicas viven en `docs/`.

---

## Documentos canónicos

```txt
docs/01-frontend-architecture-standard.md
docs/02-ui-component-standard.md
docs/03-api-integration-standard.md
docs/04-modal-toast-standard.md
docs/05-testing-strategy.md
docs/tickets/pr-ticket-template.md
docs/tickets/prompt-create-ticket.md
```

---

## Orden recomendado para MVP

```txt
FRONT PR 1  — Connect Public Menu API
FRONT PR 2  — Connect Place Order API
FRONT PR 3  — Connect Customer Orders API
FRONT PR 4  — Connect Bill API
FRONT PR 5  — Connect Waiter Call API
FRONT PR 6  — Kitchen Orders Board
FRONT PR 7  — Kitchen Update Order Status
FRONT PR 8  — Operations Waiter Calls
FRONT PR 9  — Bill Close Requests
FRONT PR 10 — Error, Loading and Empty State Polish
FRONT PR 11 — Central Modal and Toast Pattern
FRONT PR 12 — Frontend API Client Hardening
```

---

# PR 1 — Connect Public Menu API

## Depends on backend

```txt
BACK PR 1 — Public Menu
```

## Endpoint

```http
GET /v1/public/menu?tableId={tablePublicId}
```

## User functionality

The customer opens the menu from a QR/table URL. The frontend reads the table id, calls the backend, and renders real categories, products, prices and availability instead of mock data.

In human language:

```txt
The customer opens the menu.
The frontend asks the backend for the menu of that table.
The menu screen shows the real products and prices.
```

## Implement

```txt
- Update menuService to call the real backend endpoint.
- Keep mock fallback only if explicitly configured.
- Read tableId from session, query param or existing app flow.
- Render loading state.
- Render friendly error when table/menu is unavailable.
- Render categories and products from backend response.
- Ensure ProductCard and ProductSection use real availability and prices.
```

## Test

```txt
- Loading state while request is pending.
- Success renders categories/products/prices.
- Empty menu renders EmptyState.
- 404/409 renders friendly unavailable message.
- Product detail still opens with real data.
```

---

# PR 2 — Connect Place Order API

## Depends on backend

```txt
BACK PR 2 — Place Order
```

## Endpoint

```http
POST /v1/public/tables/{tablePublicId}/orders
```

## User functionality

The customer reviews the cart and submits the order to the backend. The backend calculates the final prices and creates the order.

In human language:

```txt
The customer adds products to the cart.
The customer confirms the order.
The frontend sends product ids and quantities.
The backend creates the order.
The frontend confirms the order was sent.
```

## Implement

```txt
- Update orderService.placeOrder.
- Map cart items to backend request payload.
- Do not send trusted prices as source of truth.
- Show submitting state.
- Clear cart on success.
- Show success toast or confirmation state.
- Show conflict message if products changed/unavailable.
```

## Test

```txt
- Cannot submit empty cart.
- Sends correct payload.
- Clears cart on success.
- Shows error on 400/409.
- Does not lose cart on failed request.
```

---

# PR 3 — Connect Customer Orders API

## Depends on backend

```txt
BACK PR 3 — Customer Orders
```

## Endpoint

```http
GET /v1/public/tables/{tablePublicId}/orders
```

## User functionality

The customer can see orders already placed for the current table/session.

In human language:

```txt
The customer opens the account/orders page.
The frontend asks the backend for orders of this table.
The screen shows order history and status.
```

## Implement

```txt
- Update account/order service to call real endpoint.
- Render order status from backend.
- Keep existing OrderSummary components if possible.
- Add loading/empty/error states.
```

## Test

```txt
- Success renders orders.
- Empty state when no orders exist.
- Status labels render correctly.
- 404 table/session renders friendly message.
```

---

# PR 4 — Connect Bill API

## Depends on backend

```txt
BACK PR 4 — Bill
```

## Endpoints

```http
GET /v1/public/tables/{tablePublicId}/bill
POST /v1/public/tables/{tablePublicId}/bill/close-request
```

## User functionality

The customer can see the bill and request account closing.

In human language:

```txt
The customer taps account/bill.
The frontend loads the calculated bill.
The customer can request closing the bill.
Operations will see the request later.
```

## Implement

```txt
- Add bill service functions.
- Connect AccountPage / CloseAccountPage to real bill endpoint.
- Support total table bill and customer-specific bill if available.
- Trigger close request endpoint.
- Show success/error feedback.
```

## Test

```txt
- Renders bill totals.
- Excludes canceled orders if backend response does.
- Sends close request.
- Shows success feedback.
- Handles 404/409 errors.
```

---

# PR 5 — Connect Waiter Call API

## Depends on backend

```txt
BACK PR 5 — Waiter Calls
```

## Endpoint

```http
POST /v1/public/tables/{tablePublicId}/waiter-calls
```

## User functionality

The customer can call the waiter from the menu.

In human language:

```txt
The customer chooses a waiter call reason.
The frontend sends the call to the backend.
The customer sees confirmation.
```

## Implement

```txt
- Update waiterService to call real endpoint.
- Preserve WaiterPage UI.
- Add submitting state.
- Add success toast.
- Add error feedback.
```

## Test

```txt
- Sends selected reason.
- Shows success state.
- Handles validation error.
- Prevents duplicate submissions while loading.
```

---

# PR 6 — Kitchen Orders Board

## Depends on backend

```txt
BACK PR 6 — Kitchen Orders List
```

## Endpoint

```http
GET /v1/operations/branches/{branchId}/orders
```

## User functionality

Kitchen staff can see pending and preparing orders for a branch.

In human language:

```txt
Kitchen opens the board.
The frontend loads orders by branch.
Kitchen sees what needs to be prepared.
```

## Implement

```txt
- Add kitchen feature/page.
- Add kitchenOrdersService.
- Render columns or grouped sections by status.
- Show loading/empty/error states.
- Use branchId from config/session/dev selector.
```

## Test

```txt
- Renders pending/preparing orders.
- Empty state for no orders.
- Does not crash on unknown status.
```

---

# PR 7 — Kitchen Update Order Status

## Depends on backend

```txt
BACK PR 7 — Update Order Status
```

## Endpoint

```http
PATCH /v1/operations/orders/{orderId}/status
```

## User functionality

Kitchen can move an order through the preparation flow.

In human language:

```txt
Kitchen clicks start/preparing/ready/delivered.
The frontend sends a status update.
The board refreshes or updates locally.
```

## Implement

```txt
- Add status action buttons.
- Call update status endpoint.
- Disable buttons while submitting.
- Refresh list or update state after success.
- Show error toast on conflict.
```

## Test

```txt
- Sends correct status.
- Updates UI on success.
- Handles 409 invalid transition.
- Prevents double submit.
```

---

# PR 8 — Operations Waiter Calls

## Depends on backend

```txt
BACK PR 9 — Operations Waiter Calls
```

## Endpoints

```http
GET /v1/operations/branches/{branchId}/waiter-calls
PATCH /v1/operations/waiter-calls/{waiterCallId}/status
```

## User functionality

Operations can see waiter calls and mark them as in progress or done.

## Implement

```txt
- Add operations waiter calls page or section.
- List open calls.
- Add status actions.
- Show loading/empty/error states.
```

## Test

```txt
- Renders calls.
- Updates status.
- Handles empty state.
- Handles failed update.
```

---

# PR 9 — Bill Close Requests

## Depends on backend

```txt
BACK PR 10 — Bill Close Requests
```

## Endpoints

```http
GET /v1/operations/branches/{branchId}/bill-close-requests
PATCH /v1/operations/bill-close-requests/{requestId}/status
```

## User functionality

Cashier/operations can see bill close requests and process them.

## Implement

```txt
- Add bill close requests page or section.
- List open requests.
- Add status actions.
- Show success/error feedback.
```

## Test

```txt
- Renders requests.
- Updates status.
- Handles empty state.
- Handles failed update.
```

---

# PR 10 — Error, Loading and Empty State Polish

## Objective

Standardize user feedback across the main customer flows.

## Implement

```txt
- Review MenuPage, CartPage, AccountPage, WaiterPage.
- Use common EmptyState.
- Use consistent loading indicators.
- Use friendly errors.
- Avoid raw technical messages.
```

## Test

```txt
- Main screens show correct loading/error/empty states.
- Existing happy paths still work.
```

---

# PR 11 — Central Modal and Toast Pattern

## Objective

Create or consolidate a centralized modal/toast pattern.

## Implement

```txt
- Add ModalProvider/useModal if needed.
- Add ToastProvider/useToast if needed.
- Migrate one or two flows only.
- Document usage in code comments or docs.
```

## Test

```txt
- Confirm modal resolves true/false.
- Toast appears for success/error.
- Existing modal behavior still works.
```

---

# PR 12 — Frontend API Client Hardening

## Objective

Make API integration more robust before deploying the MVP.

## Implement

```txt
- Centralize base URL.
- Normalize HTTP errors.
- Add common request helper.
- Add optional request timeout/cancellation if useful.
- Ensure all services use the same API client.
```

## Test

```txt
- API client parses success responses.
- API client normalizes error responses.
- Services use shared client.
```
