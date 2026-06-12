# Admin Redesign — Demo/MVP Plan

**Objetivo**: Elevar la pantalla de administración de prototipo funcional a producto profesional atractivo para demo a clientes. Referentes de diseño: Toast Dashboard, Square for Restaurants, iFood Portal do Parceiro, Stripe Dashboard.

**Archivo principal**: `src/app/admin/AdminPage.tsx` (1.274 líneas, monolito con 11 secciones)
**CSS compartido**: `src/styles/areas.css`
**Componentes admin vacíos**: `src/components/admin/` (directorio existe, sin archivos)

---

## Fase 1 — Shell e identidad

> Impacto: "primer segundo" de la demo. Lo primero que ve el cliente es el marco.

### 1. Topbar con contexto real
- Breadcrumb `Restaurante > Sección` a la izquierda
- Selector de filial al centro (aunque haya una sola — vende multi-sucursal)
- Reloj/fecha, badge "● Operando", avatar con nombre de usuario y rol a la derecha

### 2. Sidebar mejorado
- Logo del tenant (existe `logoUrl` en Settings) en vez del ícono genérico "Admin"
- Agrupar las 11 entradas en secciones con encabezados:
  - **Operação**: Dashboard, Pedidos, Fila
  - **Catálogo**: Produtos, Categorias
  - **Estabelecimento**: Mesas, Filiais, Kiosks
  - **Crescimento**: Fidelidade, Agregadores
  - **Configurações**
- Indicador activo con barra lateral de acento (no solo background)
- Badge con contador de pedidos pendientes junto a "Pedidos"

### 3. Tokens de color semánticos
Agregar a `areas.css`:
```css
--ff-status-new: ...
--ff-status-preparing: ...
--ff-status-ready: ...
--ff-status-delivered: ...
--ff-status-paid: ...
```
Usados igual en Admin, Kitchen y Queue para consistencia de sistema.

---

## Fase 2 — Dashboard

> Impacto: es la pantalla que más se muestra en demo — debe contar una historia de negocio.

### 4. Metric cards v2
- Ícono con fondo tintado + valor grande + **delta vs. ayer** ("↑ 12% vs ontem")
- Métricas: Pedidos hoy, Receita hoy, Ticket médio (receita/pedidos), Na cozinha, Tempo médio de preparo

### 5. Gráfico de ventas por hora
- Barras simples del día actual (CSS puro o SVG inline, ~80 líneas, sin librería externa)
- Es el elemento que transforma la percepción de "prototipo" a "producto"

### 6. Feed de actividad en vivo
- Columna derecha con últimos eventos ("Pedido #042 — Mesa 5 — agora", "Pedido #041 pronto — 2 min")
- Auto-refresh cada pocos segundos → efecto "está vivo" en demo

### 7. Top produtos mejorado
- Barra de proporción horizontal por fila (no solo el número)
- Mini imagen del producto

---

## Fase 3 — Pedidos

> Impacto: cierra el flujo end-to-end de la demo (cliente pide en kiosk → restaurante lo ve).

### 8. Estados humanizados + color semántico
- Mapa de labels: `SENT_TO_KITCHEN` → "Na cozinha", etc.
- Pills de color usando tokens de Fase 1
- Dot animado (pulse) en estados activos

### 9. Filtros como tabs con contadores
- `Todos (24) · Na cozinha (3) · Prontos (2) ...`
- Reemplaza los botones grises con enums crudos

### 10. Drawer de detalle de pedido
- Click en fila → panel lateral con items, cantidades, totales, timeline de estados
- **Botón de avance de estado** (`PATCH /v1/operations/orders/{orderId}/status`)
- Que el admin pueda actuar sobre el pedido, no solo verlo

### 11. Auto-refresh con highlight
- Pedidos nuevos entran con animación de flash sutil
- Efecto "momento wow" en demo: hacer un pedido en kiosk y que aparezca solo en el admin

---

## Fase 4 — Catálogo

### 12. Productos: vista de cards con imagen
- Grid tipo iFood Portal en vez de tabla
- Toggle disponible/agotado inline en la card
- Búsqueda + filtro por categoría

### 13. Modales centralizados
- Reemplazar los 5+ modales hechos a mano (`div fixed inset-0` con estilos inline)
- Componente `AdminModal` compartido en `src/components/admin/`
- Cumple `docs/04-modal-toast-standard.md`: transición de entrada, focus en primer campo, cierre con Escape

### 14. Estados vacíos con propósito
- Ícono + texto + CTA ("Nenhum produto ainda — Criar primeiro produto") en todas las secciones

---

## Fase 5 — Refactor estructural

> Hacer en paralelo mientras se toca cada sección, no en big-bang.

### 15. Partir el monolito
- Extraer cada sección a `src/app/admin/sections/*.tsx`
- Componentes compartidos a `src/components/admin/`:
  - `MetricCard`
  - `StatusPill`
  - `AdminModal`
  - `DataTable`
  - `EmptyState`
  - `SectionHeader`
- Eliminar estilos inline → clases en `areas.css`

### 16. i18n del admin
- Extender `src/i18n/labels.ts` con namespace admin
- Coherente con lo ya hecho en kiosk/menu

---

## Priorización para la demo

| Tiempo disponible | Alcance |
|---|---|
| 1 día | Fase 1 + items 4-5 (shell + dashboard con gráfico) |
| 2-3 días | + Fase 3 completa (pedidos con drawer y auto-refresh) |
| 1 semana | Todo, con Fase 5 entremezclada |

**Orden estricto recomendado**: 1 → 2 → 3 → 4 → 5.
Las fases 1-3 representan el 80% de la percepción en demo.
La Fase 5 conviene pagarla mientras se toca cada sección (extraer el componente al modificarlo).
