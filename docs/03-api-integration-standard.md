# API Integration Standard

## Objective

Keep backend communication consistent, typed and easy to swap from mocks to real endpoints.

The frontend should connect to the backend one vertical flow at a time.

---

## Backend API version

All backend HTTP calls must use versioned paths.

Current version:

```txt
/v1
```

Examples:

```http
GET /v1/public/menu?tableId={tablePublicId}
POST /v1/public/tables/{tablePublicId}/orders
GET /v1/public/tables/{tablePublicId}/orders
GET /v1/public/tables/{tablePublicId}/bill
POST /v1/public/tables/{tablePublicId}/waiter-calls
GET /v1/operations/branches/{branchId}/orders
PATCH /v1/operations/orders/{orderId}/status
```

Do not call unversioned routes.

---

## Service layer rule

Do not call `fetch` directly from React pages or components.

Use service files:

```txt
src/services/api.ts
src/services/menuService.ts
src/services/orderService.ts
src/services/waiterService.ts
src/services/sessionService.ts
```

Recommended flow:

```txt
Page -> hook -> service -> api client -> backend
```

For simpler MVP screens, this is acceptable:

```txt
Page -> service -> api client -> backend
```

But avoid:

```txt
Component -> fetch
```

---

## API client responsibilities

`src/services/api.ts` should own common HTTP behavior:

```txt
Base URL
/v1 prefix if useful
Headers
JSON parsing
HTTP error normalization
Timeout/cancellation when needed
```

Feature services should own endpoint-specific functions:

```txt
menuService.getPublicMenu(tableId)
orderService.placeOrder(tablePublicId, request)
waiterService.createWaiterCall(tablePublicId, reason)
```

---

## Environment configuration

The backend base URL should come from environment configuration.

Example:

```txt
VITE_API_BASE_URL=https://api.ffresco.com
```

Local example:

```txt
VITE_API_BASE_URL=http://localhost:3000
```

Do not hardcode production URLs inside components.

---

## Mock-to-real transition

Mocks are allowed while the backend is not ready.

But mocks must be behind services:

```txt
MenuPage -> menuService.getPublicMenu()
```

The page should not care whether data comes from mocks or backend.

When a backend endpoint becomes available:

```txt
1. Keep the same service function name.
2. Replace mock implementation with HTTP call.
3. Keep response mapping stable for the UI.
4. Update mock data to match real response when needed.
5. Add error/loading handling to the screen.
```

---

## DTO and UI model rule

Backend responses should be typed.

Prefer separating:

```txt
DTO = backend contract shape
View model = UI-friendly shape when needed
```

For fast MVP, DTO can be used directly if it already matches the UI well.

Do not duplicate the same response type in many files.

---

## Error handling rule

Every real API integration PR must define UI behavior for:

```txt
loading
success
empty data
400 validation error
404 not found
409 business conflict
500 unexpected error
network failure
```

User-facing messages should be friendly.

Technical error details can be logged, but should not be exposed directly to customers.

---

## Public Menu integration example

Screen:

```txt
MenuPage
```

Endpoint:

```http
GET /v1/public/menu?tableId={tablePublicId}
```

Expected flow:

```txt
1. Read tableId from URL/session.
2. Show loading state.
3. Call menuService.getPublicMenu(tableId).
4. Render context, categories and products.
5. Show empty state if menu has no products.
6. Show friendly error if table is invalid or inactive.
```

---

## Place Order integration example

Screen:

```txt
CartPage
```

Endpoint:

```http
POST /v1/public/tables/{tablePublicId}/orders
```

Expected flow:

```txt
1. User reviews cart.
2. User confirms order.
3. Frontend sends product ids and quantities.
4. Backend calculates prices.
5. On success, clear cart and show order confirmation.
6. On conflict, show unavailable item or changed menu message.
```
