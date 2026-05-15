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
