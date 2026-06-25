# Plan de mejoras — Pantallas de operación (staff)

**Objetivo**: elevar las pantallas de personal (Cozinha, Painel de Fila, Garçom, Caixa) a calidad de producto final para demo, con un lenguaje de diseño coherente inspirado en Toast, Square for Restaurants, McDonald's KDS y los order-ready boards de QSR.

**Pantallas evaluadas**:
- Cozinha / Kitchen Display — `src/app/kitchen/KitchenOrdersPage.tsx` (246 líneas)
- Painel de Fila / Queue Display — `src/app/queue-display/QueueDisplayPage.tsx` (232 líneas)
- Garçom / Waiter Staff — `src/app/waiter-staff/WaiterTablesPage.tsx` (822) + `WaiterTableDetailPage.tsx` (292)
- Caixa / Cashier — `src/app/cashier/CashierPage.tsx` (892)

**Método**: recorrido real de cada pantalla con navegador headless + lectura de código.

---

## Veredicto por pantalla

| Pantalla | Estado actual | Nivel demo | Prioridad |
|---|---|---|---|
| **Garçom (Waiter)** | Excelente en desktop. Floor view por zonas, colores por estado, alertas, timers, acciones | 8/10 — el mejor del sistema | 🟡 Pulir |
| **Caixa (Cashier)** | Sofisticado: split por persona, pago parcial, KPIs | 7/10 | 🟡 Pulir + 🔴 bug |
| **Cozinha (Kitchen)** | Kanban sólido, dark, sonido, urgencia, advance | 7/10 | 🟡 Pulir |
| **Painel de Fila (Queue)** | Bien diseñado pero **vacío en demo** | 4/10 (por datos) | 🔴 Crítico |

---

## 🔴 Bloqueantes de demo (arreglar primero)

### B1. Painel de Fila vacío
**Síntoma**: las dos secciones ("Pronto para retirar" / "Em preparo") muestran 0 tickets.
**Causa**: `queueTickets: QueueTicket[] = []` en [seed.ts](../../src/lib/mock-db/seed.ts) — colección sembrada vacía.
**Fix**: sembrar 4-6 queue tickets (mix de `WAITING` y `CALLED`/`SERVING`) ligados a pedidos kiosk/takeaway existentes. La fila es para pedidos de mostrador/takeaway, no de mesa — sembrar con `source: 'KIOSK'`.

### B2. Caixa — "A receber R$ 0,00" inconsistente con las mesas
**Síntoma**: el KPI "A receber" muestra R$ 0,00 y "Pendentes" muestra 0, pero la lista de mesas abajo muestra Mesa 1 con "Restante: R$ 226,38".
**Causa**: `getDailySummary()` ([cashierService.ts:289](../../src/lib/services/cashierService.ts)) calcula `pendingAmount` desde la colección `payments` filtrando por `UNPAID`/`PARTIALLY_PAID`. Tras marcar los 6 pagos sembrados como `PAID`, no queda ningún payment pendiente — y los pedidos activos (#1007/#1008/#1009) **no tienen registro en `payments`**, solo existen como `orders`. La vista de mesas, en cambio, calcula desde `orders` directamente → diverge.
**Fix**: dos opciones —
  - (a) sembrar Payment records `UNPAID` para los pedidos activos (#1007/#1008/#1009), o
  - (b) dejar 2 pedidos entregados sin pagar para que el cajero tenga algo real que cobrar en demo.
  Recomendado (b)+(a): una mezcla realista donde el día tiene caja cobrada **y** cuentas abiertas por cobrar.

---

## Fase 1 — Sistema de diseño compartido (base transversal)

> El mayor salto de "prototipo" a "producto" es la **coherencia**. Hoy cada pantalla rueda su propio shell, colores y estilos inline.

### 1. Staff Shell unificado
Crear `src/components/staff/StaffShell.tsx` (topbar + sidebar consistentes) reutilizado por Kitchen, Queue, Waiter, Cashier. Hoy:
- Kitchen y Queue son **dark**; Waiter y Cashier son **light** → decisión de sistema, no accidente: las **pantallas públicas/de pared** (Kitchen KDS, Queue TV) van dark; las **herramientas de gestión** (Waiter, Cashier) van light. Documentar esta regla y aplicarla con tokens, no hex sueltos.

### 2. Tokens de estado consistentes
Reusar los `--ff-status-*` que ya existen en `areas.css` (creados en el admin redesign). Hoy Kitchen y Queue usan hex hardcodeados (`#14532d`, `#3b82f6`, etc.). Unificar para que el mismo estado tenga el mismo color en todas las superficies.

### 3. Eliminar estilos inline
`QueueDisplayPage` es 100% inline styles; Kitchen y Cashier tienen bastante. Migrar a clases en `areas.css`. (Hacer entremezclado al tocar cada pantalla, no big-bang.)

---

## Fase 2 — Cozinha / Kitchen Display

> Referente: Toast KDS, Fresh KDS. Es pantalla de pared — legibilidad a distancia manda.

### 4. Semáforo de antigüedad (SLA tiers)
Hoy solo hay un flag "urgent" binario a los 10 min. Los KDS pro escalan el color del ticket completo:
- 🟢 Verde / neutro: < 5 min
- 🟡 Ámbar: 5–10 min
- 🔴 Rojo (borde + pulse): > 10 min

Da lectura instantánea de qué ticket está atrasado.

### 5. Botón de bump por color de columna
Hoy el botón es `btn-outline-light` genérico. Toast usa botones grandes del color de la columna destino ("Iniciar preparo" azul, "Marcar pronto" ámbar, "Marcar entregue" verde). Aumenta el target táctil y la claridad.

### 6. Timer sin jitter
Hoy muestra "10min 2s" y re-renderiza cada 5s mostrando segundos → parpadeo distractor. Mostrar solo minutos (`10 min`) o `mm:ss` monoespaciado estable.

### 7. Recall / deshacer
No se puede devolver un ticket bumpeado por error. Agregar acción de "voltar" en cada columna (estándar en KDS reales).

### 8. Tipo de pedido visible
Diferenciar dine-in / takeaway / delivery con ícono prominente (hoy solo hay badge delivery). Ayuda a la cocina a priorizar.

---

## Fase 3 — Painel de Fila / Queue Display

> Referente: order-ready board de McDonald's / Chick-fil-A / Panera. TV vista a distancia.

### 9. Layout de dos columnas lado a lado
Hoy las secciones están **apiladas** (Pronto arriba, Preparando abajo). El estándar de QSR es **dos columnas** `PREPARANDO | PRONTO` lado a lado — lectura más rápida en pantalla ancha y el cliente ve su senha "cruzar" de izquierda a derecha.

### 10. Transición + chime al quedar pronto
Cuando una senha pasa a "Pronto", debe animar (flash/escala) y sonar un chime. Es el momento que hace que el cliente mire. Hoy no hay animación ni sonido.

### 11. Número-protagonista + privacidad
La senha (80px) es el héroe — bien. Pero mostrar **nombre del cliente + lista de items** en una pantalla pública es ruido (ilegible a distancia) y un tema de privacidad. McDonald's muestra solo el número. Recomendado: número gigante (120px+), order number chico, sin items ni nombre en el board público.

### 12. Branding
Agregar logo del tenant + barra de marca. Hoy es genérico; los boards reales refuerzan marca.

---

## Fase 4 — Garçom / Waiter Staff

> Referente: Toast floor / tables. Es el más fuerte; las mejoras son de pulido y responsive.

### 13. 🔴 Responsive móvil (importante)
Es una herramienta de piso que se usa en **teléfono/tablet**, pero en 390px el sidebar de escritorio persiste y come ~110px, dejando las cards apretadas (~280px). Colapsar el sidebar a bottom-nav o hamburguesa en mobile. **Esto rompe el caso de uso real del mozo.**

### 14. Resolver chamado desde el detalle
La página de detalle de mesa muestra "Chamados: N" pero no permite accionar. Agregar lista de llamados con botón "Atender / Resolver" inline.

### 15. Detalle de mesa más rico
Debajo del pedido hay mucho espacio vacío. Agregar: timeline del llamado, lista de comensales, acciones rápidas (entregar, pedir conta, dividir).

---

## Fase 5 — Caixa / Cashier

> Referente: Toast / Square payment. Ya es sofisticado (split por persona, parcial).

### 16. Selección de método de pago + troco
El flujo de cobro no pide método (dinheiro / cartão / pix) ni calcula troco. Toast/Square siempre piden método. Agregar selector + cálculo de cambio en el modal de pago — eleva la percepción de "POS real".

### 17. Acción de recibo / impresión
Hay tab "Recibos" pero falta CTA de imprimir/ver recibo tras cobrar. Cerrar el loop visualmente.

---

## Priorización para la demo

| Tiempo | Alcance |
|---|---|
| **2 horas** | B1 + B2 (datos: fila poblada, caixa coherente) — quita los 2 bloqueantes |
| **1 día** | + Fase 3 (fila lado a lado + chime) + Fase 4.13 (responsive mozo) |
| **2-3 días** | + Fase 2 (KDS semáforo + bump) + Fase 5.16 (método de pago) |
| **1 semana** | Todo, con Fase 1 (staff shell + tokens) entremezclada |

**Orden recomendado**: B1 → B2 → 13 (responsive) → 9-10 (fila) → 4-5 (KDS) → 16 (pago) → Fase 1 estructural.

Los bloqueantes B1/B2 y el responsive del mozo son lo que más se nota en una demo en vivo; la Fase 1 paga deuda estructural pero conviene hacerla al tocar cada pantalla, no de entrada.
