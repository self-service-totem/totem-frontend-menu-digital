# UI Component Standard

## Objective

Keep the UI consistent while allowing fast MVP delivery.

The project uses React Bootstrap and Bootstrap Icons, so prefer those primitives before creating custom UI from scratch.

---

## Component categories

### Page components

Examples:

```txt
MenuPage
CartPage
AccountPage
WaiterPage
KitchenOrdersPage
```

Responsibilities:

```txt
Read route/query params
Call hooks/services
Compose UI sections
Handle page-level loading/error/empty states
Trigger modal/toast actions
```

---

### Feature components

Examples:

```txt
ProductCard
ProductSection
CategoryCarousel
CartItemRow
OrderSummary
WaiterActionCard
```

Responsibilities:

```txt
Render a specific part of one feature
Receive data through props
Emit events through callbacks
Avoid direct API calls
```

---

### Shared components

Examples:

```txt
PrimaryButton
SecondaryButton
TextField
Modal
EmptyState
SearchBar
QuantitySelector
AppShell
TopBar
BottomNav
```

Responsibilities:

```txt
Be reusable
Be visually consistent
Hide common Bootstrap composition
Avoid feature-specific business rules
```

---

## Component extraction rule

Extract a component when at least one is true:

```txt
1. It is reused in more than one place.
2. It makes the page easier to read.
3. It has a clear UI responsibility.
4. It contains enough markup to deserve a name.
5. It will likely be tested independently.
```

Do not extract components only to create artificial layers.

---

## Props rule

Prefer explicit props.

Good:

```txt
<ProductCard
  product={product}
  onAddToCart={handleAddToCart}
  onOpenDetails={handleOpenDetails}
/>
```

Avoid:

```txt
<ProductCard data={everything} context={everythingElse} />
```

---

## API rule for components

Components must not call backend services directly.

Allowed:

```txt
Component receives props and callbacks.
Page or hook calls service.
```

Not allowed:

```txt
ProductCard calls fetch or menuService directly.
```

---

## Styling rule

The project currently uses Bootstrap and `src/styles/theme.css`.

Use this hierarchy:

```txt
1. Bootstrap / React Bootstrap components first.
2. Shared theme variables in src/styles/theme.css.
3. Small local class names for specific layout needs.
4. Avoid large global CSS files with unrelated component rules.
```

---

## CSS organization

For the current MVP, prefer:

```txt
src/styles/theme.css        -> global theme/tokens/base layout
component className props   -> specific Bootstrap-compatible styling
```

If a component grows too much, create a local CSS module next to it:

```txt
ProductCard.tsx
ProductCard.module.css
```

Do not create one giant stylesheet containing all feature-specific styles.

---

## Naming conventions

```txt
Components: PascalCase.tsx
Hooks: useSomething.ts
Services: somethingService.ts
Types: Something, SomethingDto, SomethingResponse
CSS classes: kebab-case
```

Examples:

```txt
ProductCard.tsx
usePublicMenu.ts
menuService.ts
PublicMenuResponse
product-card
```

---

## Visual consistency rules

```txt
1. Use existing PrimaryButton and SecondaryButton before creating new buttons.
2. Use EmptyState for empty lists.
3. Use the centralized Modal pattern for confirmations and details.
4. Use consistent loading and error states.
5. Do not introduce a new design style in one isolated PR.
6. Avoid one-off inline styles unless they are tiny and temporary.
```

---

## Accessibility baseline

Every PR should preserve basic accessibility:

```txt
Buttons must be buttons, not clickable divs.
Inputs must have labels or accessible labels.
Modals must have titles.
Images should have alt text when meaningful.
Do not rely only on color to communicate state.
```
