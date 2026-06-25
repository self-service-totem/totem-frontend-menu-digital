# ffresco-customer-frontend

Frontend customer-facing para un sistema SaaS de pedidos gastronómicos.
El cliente final accede escaneando un QR en la mesa y desde su celular puede:
ver el menú, buscar productos, navegar por categorías, agregar al carrito,
confirmar pedido, ver y cerrar su cuenta (individual o de mesa), llamar al
mozo, dejar una evaluación y consultar cashback.

## Stack

- React 18 + TypeScript
- Vite 5
- React Router 6
- React Bootstrap + Bootstrap 5 + Bootstrap Icons
- Estado local (Context API) — sin backend todavía
- Datos mockeados centralizados en `src/mocks`
- Servicios stub en `src/services` listos para reemplazar por llamadas REST

## Comandos

```bash
npm install
npm run dev        # arranca Vite en http://localhost:5173
npm run build      # tsc -b && vite build
npm run preview    # sirve el build
npm run lint       # (eslint, opcional)
```

Entry point del flujo: `http://localhost:5173/menu/140`.

## Estructura

```
src/
  app/              App, router y contextos (Session, Cart)
  components/
    common/         Botones, búsqueda, selector de cantidad, vacío
    layout/         AppHeader, TopBar, AppShell
    navigation/     BottomNav (5 tabs, "Pedir" central)
    menu/           CategoryCarousel, PromoBanner, ProductCard, ProductSection
    cart/           CartItemRow
    account/        AccountTabs, OrderSummary
    waiter/         WaiterActionCard
  features/
    menu/           MenuPage
    product-detail/ ProductDetailPage (modal fullscreen)
    cart/           CartPage
    close-account/  CloseAccountPage (tabs Mesa / Individual)
    waiter/         WaiterPage
    rating/         RatingPage
    cashback/       CashbackPage
    account/        AccountPage
  mocks/            business, categories, products, customer,
                    promotions, orders, tableAccount, cashback
  services/         api, menu, order, session, cashback
  styles/           theme.css (paleta, tokens, componentes visuales)
  types/            tipos compartidos (Product, Category, CartItem,
                    Customer, Order, TableAccount, etc.)
  utils/            format (Intl currency)
```

## Rutas

| Ruta                                     | Pantalla                          |
|------------------------------------------|-----------------------------------|
| `/menu/:tableId`                         | Menú principal                    |
| `/menu/:tableId/product/:productId`      | Detalle de producto (fullscreen)  |
| `/cart`                                  | Carrito                           |
| `/close-account`                         | Cerrar cuenta (Mesa / Individual) |
| `/waiter`                                | Llamar mozo                       |
| `/rating`                                | Evaluación                        |
| `/cashback`                              | Cashback                          |
| `/account`                               | Cuenta / perfil                   |

## Conectar el backend REST

Cuando exista el backend:

1. Definir `VITE_API_BASE_URL` en `.env` (por defecto `/api`).
2. Reemplazar las implementaciones en `src/services/*.ts` para usar
   `request<T>(path, init)` de `src/services/api.ts` en lugar de los mocks.
3. Los componentes y páginas no deberían cambiar: consumen los servicios,
   no los mocks.

## Diseño

- Mobile first, contenedor de hasta 480px centrado.
- Color principal `--ff-primary: #e11d2a`.
- Fondo claro, cards con sombra suave, bordes redondeados.
- Barra inferior fija con 5 secciones; "Pedir" como botón central destacado.
- Tipografía del sistema, jerarquía clara.
- Botones grandes (~44px) optimizados para touch.


## Git
para comitear
gh auth logout
---

## Prototype Integration — All App Areas

The prototype now contains **7 integrated app areas** sharing a single
localStorage-backed mock persistence layer (`src/lib/mock-db`).

### Local run

```bash
npm install
npm run dev    # http://localhost:5173
```

Open `http://localhost:5173/` to reach the **Hub** page. From there navigate
to any area.

### Architecture

```
src/lib/mock-db/     ← shared localStorage store (source of truth)
src/lib/types/       ← extended domain types (order/payment/table statuses)
src/lib/services/    ← kitchenService, cashierService, waiterStaffService,
                        kioskService, queueService, adminService
src/lib/notifications/ ← centralized toast/notification hook
src/app/kitchen/     ← Kitchen Screen
src/app/admin/       ← Admin / Backoffice
src/app/kiosk/       ← Kiosk / Self-Service Totem
src/app/queue-display/ ← Queue Display (TV)
src/app/waiter-staff/  ← Waiter / Floor Staff
src/app/cashier/     ← Cashier / Billing
src/app/hub/         ← Prototype navigation hub
```

### Table lifecycle

```
EMPTY → ORDER_IN_PROGRESS → WAITING_FOR_KITCHEN → READY_TO_SERVE
     → WAITING_FOR_PAYMENT → CLOSED → EMPTY (reset)
```

### Order lifecycle

```
CREATED → SENT_TO_KITCHEN → PREPARING → READY → DELIVERED → CLOSED
```

### Payment lifecycle

```
UNPAID → PARTIALLY_PAID → PAID
```

---

## Demo / Integration Test Script

Follow these steps in order, all in the same browser tab (shared mock-db via localStorage).

**1. Create a product in Admin**
- Go to `/admin/products`
- Click "Novo produto"
- Fill in name, price, image URL, select category
- Save → product is now available in the mock-db

**2. See the product in Digital Menu**
- Go to `/menu/branch-1/table/140`
- Scroll or search — the new product appears (reads from mock-db)
- Prices and availability reflect Admin data

**3. Create an order from Digital Menu**
- Add 1–2 products to cart
- Go to `/cart`, enter name, tap "Confirmar pedido"
- Table 140 → status becomes `ORDER_IN_PROGRESS`
- Order is persisted to mock-db

**4. See the order in Kitchen**
- Go to `/kitchen/orders`
- Order appears in the **Novos** column with items and table number
- Tap "Iniciar preparo" → table moves to `WAITING_FOR_KITCHEN`

**5. Move order to READY / DELIVERED**
- Tap "Marcar pronto" → table becomes `READY_TO_SERVE`
  - If a QueueTicket exists it moves to `CALLED` → visible in Queue Display
- Tap "Marcar entregue" → table becomes `WAITING_FOR_PAYMENT`

**6. Request bill from Digital Menu**
- Return to `/menu/branch-1/table/140` → navigate to "Conta" (close-account)
- Tap "Pedir conta" → a pending Payment is created in mock-db
- Table status → `WAITING_FOR_PAYMENT`
- Cashier screen now shows this table

**7. Pay partially in Cashier**
- Go to `/cashier/orders` or `/cashier` (tables tab)
- Find the pending payment for table 140
- Click "Receber" → choose "Valor parcial" → enter 50
- Choose payment method → confirm
- Payment status → `PARTIALLY_PAID`, remaining balance shown

**8. Pay remaining amount**
- Click "Receber" again on the same payment
- Choose "Total restante" → confirm
- Payment status → `PAID`
- Order status → `CLOSED`
- Table status → `CLOSED`

**9. Verify table closes**
- Go to `/waiter-staff/tables`
- Table 140 shows status **Fechada**
- Go to `/admin/orders` → order shows `paymentStatus: PAID`

**10. Reset table**
- Return to `/cashier` (tables tab)
- Click "Liberar mesa" on the closed table
- Table status → `EMPTY`
- Ready for next customer

---

### Additional integration flows

| Action | Source | Effect |
|---|---|---|
| Admin creates/edits product | `/admin/products` | Visible immediately in Menu + Kiosk |
| Admin changes category | `/admin/categories` | Visible in Menu + Kiosk |
| Kiosk order | `/kiosk` | Creates Order + KitchenTicket + QueueTicket |
| Kitchen → READY | `/kitchen/orders` | QueueTicket → CALLED; Queue Display highlights it |
| Kitchen → DELIVERED | `/kitchen/orders` | QueueTicket → COMPLETED; removed from Queue Display |
| Customer calls waiter | Menu → Garçom tab | WaiterCall appears in `/waiter-staff` |
| Waiter resolves call | `/waiter-staff` | Call disappears from pending list |
| Waiter requests bill | `/waiter-staff` | Payment appears in `/cashier` |
| Cashier generates receipt | `/cashier` | Receipt stored; printable modal opens |
