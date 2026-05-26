# Frontend Architecture Standard

## Objective

Keep the React frontend easy to evolve while building the MVP quickly.

The frontend should be organized around user-facing features, not around technical file types only.

---

## Current project context

The project currently uses:

```txt
React
TypeScript
Vite
React Router
React Bootstrap
Bootstrap Icons
src/features
src/components
src/services
src/mocks
src/app
src/styles
```

This standard keeps the current structure but defines how to evolve it without chaos.

---

## Recommended structure

Use a feature-first structure while keeping shared UI and shared services centralized.

```txt
src/
  app/
    App.tsx
    router.tsx
    providers.tsx
    SessionContext.tsx
    CartContext.tsx

  features/
    menu/
      MenuPage.tsx
      components/
      hooks/
      types.ts

    cart/
      CartPage.tsx
      components/
      hooks/
      types.ts

    account/
      AccountPage.tsx
      components/
      hooks/
      types.ts

    waiter/
      WaiterPage.tsx
      components/
      hooks/
      types.ts

    kitchen/
      KitchenOrdersPage.tsx
      components/
      hooks/
      types.ts

  components/
    common/
    layout/
    navigation/

  services/
    api.ts
    menuService.ts
    orderService.ts
    waiterService.ts
    sessionService.ts

  mocks/

  styles/
    theme.css

  types/

  utils/
```

As the project grows, prefer moving feature-specific components from `src/components/<feature>` into `src/features/<feature>/components`.

Do not do a massive refactor in unrelated PRs. Move files only when the PR benefits directly from that change.

---

## Layer responsibilities

### `app/`

Application bootstrap and wiring.

Allowed:

```txt
Router
Providers
Global contexts
Global layout composition
```

Not allowed:

```txt
Backend fetch logic
Business-specific rendering logic
Large feature-specific components
```

---

### `features/`

Feature entry points and user flows.

A feature page can:

```txt
1. Read route/query params.
2. Call hooks or services.
3. Coordinate loading/error/empty/success states.
4. Compose UI components.
5. Trigger modals/toasts.
```

A feature page should not:

```txt
1. Contain raw fetch calls.
2. Contain duplicated DTO mapping.
3. Contain large reusable visual components inline.
4. Define ad hoc modal implementations.
```

---

### `components/`

Reusable UI components.

Use this folder for generic components shared across features:

```txt
Button
TextField
Modal
EmptyState
TopBar
AppShell
BottomNav
QuantitySelector
SearchBar
```

Feature-specific UI should live close to the feature when it is not reused.

---

### `services/`

Backend communication and data access abstraction.

Allowed:

```txt
HTTP client wrapper
API functions
Mock/real data switching
DTO mapping
Error normalization
```

Not allowed:

```txt
React component rendering
Modal logic
DOM logic
```

---

### `mocks/`

Temporary mock data aligned with backend contracts.

Mocks must not become a second source of truth. Whenever a backend endpoint becomes available, the corresponding frontend PR should replace or isolate the mock behind a service boundary.

---

## Page/component rule

Use this mental model:

```txt
Page = orchestrates the user flow
Hook = manages data and UI state
Service = calls backend or mock source
Component = renders UI
Shared UI = reusable visual pattern
```

Example:

```txt
MenuPage
-> usePublicMenu(tableId)
-> menuService.getPublicMenu(tableId)
-> ProductSection / ProductCard / CategoryCarousel
```

---

## Feature PR rule

Each frontend PR must answer:

```txt
1. Which screen or flow is changed?
2. Which backend endpoint does it consume?
3. Which components are reused?
4. Which components are created?
5. What happens on loading?
6. What happens on error?
7. What happens on empty data?
8. What happens on success?
```

---

## Migration rule

The current project already has useful structure. Do not rewrite the whole frontend to match an ideal structure in one PR.

Prefer incremental migration:

```txt
1. Keep existing screens working.
2. Add service boundaries first.
3. Move components only when needed.
4. Replace mocks one endpoint at a time.
5. Keep UI consistent while moving fast.
```
