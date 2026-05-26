# Modal and Toast Standard

## Objective

Avoid ad hoc modal implementations and inconsistent notifications.

The frontend should have centralized patterns for:

```txt
confirmations
alerts
errors
success notifications
custom detail modals
```

---

## Current context

The project already has a common modal component:

```txt
src/components/common/Modal.tsx
```

This should evolve into a centralized modal pattern instead of creating one-off modal logic in every feature.

---

## Modal vs toast rule

Use a modal when the user must make a decision or focus on a blocking flow.

Examples:

```txt
Confirm cancel order
Confirm close account
Product detail modal
Payment confirmation
Critical error requiring action
```

Use a toast/snackbar when the user only needs feedback.

Examples:

```txt
Order created
Waiter called
Product added to cart
Could not update order status
```

---

## Centralized modal API target

The desired usage pattern is:

```ts
const confirmed = await modal.confirm({
  title: "Cancel order?",
  message: "This action cannot be undone.",
  confirmText: "Cancel order",
  cancelText: "Keep order"
});
```

And:

```ts
modal.alert({
  title: "Menu unavailable",
  message: "This table is currently inactive. Please ask a waiter for help."
});
```

Feature code should not build a new confirm modal from scratch every time.

---

## Suggested structure

```txt
src/components/common/modal/
  ModalProvider.tsx
  useModal.ts
  ConfirmModal.tsx
  AlertModal.tsx
  ModalTypes.ts

src/components/common/toast/
  ToastProvider.tsx
  useToast.ts
  ToastTypes.ts
```

This can be added incrementally. Do not refactor all existing modals in one PR unless that PR is specifically about the modal system.

---

## Product detail modal

Product detail is a feature-specific modal and can keep its own component:

```txt
src/features/product-detail/ProductDetailModal.tsx
```

But opening/closing should still follow a consistent parent state pattern.

---

## Modal rules

```txt
1. Do not create ad hoc confirm modals inside pages.
2. Reuse common modal primitives.
3. Every modal must have a clear title.
4. Confirm actions must use explicit confirm/cancel text.
5. Dangerous actions should require an explicit confirmation.
6. Modals should not call backend directly unless they are a feature container.
7. Keep presentational modals controlled by props.
```

---

## Toast rules

```txt
1. Use toast for non-blocking feedback.
2. Do not use alerts for normal success messages.
3. Use consistent message tone.
4. Avoid showing raw technical errors to customers.
5. Error toasts should include what the user can do next when possible.
```

---

## Example frontend behavior

### Place order success

```txt
Toast: "Pedido enviado para a cozinha."
Cart is cleared.
User is redirected to orders page or confirmation state.
```

### Place order conflict

```txt
Modal or inline error:
"Alguns produtos não estão mais disponíveis. Revise seu carrinho."
```

### Waiter call success

```txt
Toast:
"Chamado enviado. Um atendente irá até a mesa."
```
