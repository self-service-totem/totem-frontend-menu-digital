# Prototype Improvement Plan — 5 PRs

Generado en 2026-06-16 após revisão completa do protótipo.

Para executar: abra este chat e diga **"executa PR-N do plano de melhorias"**.  
Claude vai ler este arquivo, entender o contexto completo e implementar sem re-análise.

---

## Contexto do review

- **Problema central:** admin back-office segue o design system (`AdminLayout`, `AdminModal`, `AdminButton`, `AdminTable`, `AdminFilterBar`, `AdminBadge`). As telas operacionais (Cashier, Waiter, Reservations, Kitchen, Queue, Delivery) foram construídas antes e nunca migradas — cada uma tem seu próprio shell inline, estilos hardcoded e zero i18n.
- **Dados:** o `src/lib/mock-db` é a source of truth compartilhada. Menu, Kiosk, Admin, Kitchen, Waiter e Cashier todos lêem/escrevem no mesmo store — a integração funciona.
- **Design system canônico:** `src/components/admin/` + `src/components/layout/AdminLayout` + `src/styles/theme.css` + `src/styles/areas.css`. **Não alterar esses componentes.**
- **Documentação de referência:** `docs/UI_STANDARDS.md`, `docs/DESIGN_SYSTEM.md`.

---

## PR-1 — Shared formatting helpers

**Objetivo:** eliminar as ~6 redefinições de `formatBRL` espalhadas pelo código.

**Arquivos afetados:**
- `src/utils/format.ts` — já existe, tem `formatDate`. **Adicionar** `formatCurrency(v: number): string` que formata em BRL.
- `src/app/cashier/CashierPage.tsx:16` — tem `function formatBRL(v)` local. Substituir pelo import.
- `src/app/waiter-staff/WaiterTablesPage.tsx:31` — tem `function formatBRL(v)` local. Substituir.
- `src/app/kiosk/KioskApp.tsx:111` — tem `function formatBRL(v)` local. Substituir.
- `src/app/admin/adminUtils.ts` — já tem `formatBRL`. Substituir pela versão centralizada ou re-exportar daqui.
- `src/app/reservations/ReservationsPage.tsx` — verificar e substituir qualquer formatBRL local.
- `src/app/delivery/DeliveryPage.tsx` — verificar e substituir.

**Regra:** export function `formatCurrency(v: number | undefined | null): string` — retorna `'—'` se null/undefined/NaN. Internamente usa `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`.

**Zero mudança visual. Sem tocar em componentes de UI.**

---

## PR-2 — Route & navigation fixes

**Objetivo:** consertar 4 bugs de roteamento que quebram o demo.

### Fix 1 — `/waiter-staff/calls` não abre a aba Calls
- Arquivo: `src/app/waiter-staff/WaiterTablesPage.tsx`
- O `activeTab` é state interno que começa em `'floor'`. A rota `/waiter-staff/calls` chama o mesmo componente mas não há como passar o tab inicial.
- **Fix:** ler `useLocation().pathname` no init do state: `useState<'floor' | 'calls'>(() => location.pathname.includes('/calls') ? 'calls' : 'floor')`. Usar `useLocation` import de react-router-dom.

### Fix 2 — `/cashier/payments` não mapeia para uma aba existente
- Arquivo: `src/app/cashier/CashierPage.tsx:613` — `tabFromPath` mapeia `/orders`, `/history`, `/receipts`, `/invoices`. `/cashier/payments` cai no default `'tables'` que não existe no `navItems`.
- **Fix no router** (`src/app/router.tsx`): remover a rota `/cashier/payments` (não existe tab correspondente) ou mapeá-la para `/cashier/orders`. Simplificar para: `{ path: '/cashier', element: <Navigate to="/cashier/orders" replace /> }` e manter só `/cashier/orders`, `/cashier/history`, `/cashier/receipts`, `/cashier/invoices`.

### Fix 3 — Admin "Branches" e "Settings" renderizam o mesmo componente
- Arquivo: `src/app/admin/AdminPage.tsx:202-203`
- Ambos `section === 'branches'` e `section === 'settings'` renderizam `<RestaurantSettings />`.
- **Fix:** remover o item `branches` do `NAV_DEF` (linha 61-64 de AdminPage.tsx). Manter só `settings`. Ajustar o type `AdminSection` removendo `'branches'`.

### Fix 4 — Rota 404 / NotFound
- Arquivo: `src/app/router.tsx`
- Adicionar ao final: `{ path: '*', element: <div style={{padding:40,textAlign:'center'}}><h2>404 — Página não encontrada</h2><a href="/">← Voltar ao Hub</a></div> }`.
- Não criar um componente separado para isso ainda — inline suficiente para o demo.

---

## PR-3 — Data fixes: reservation seating + remove fake diners

**Objetivo:** consertar os dois bugs de dados mais impactantes para o demo.

### Fix 1 — `seatReservation` não atualiza status da mesa
- Arquivo: `src/lib/services/reservationService.ts:68-79`
- A função `seatReservation(id, tableId?, tableNumber?)` marca a reserva como `SEATED` mas **não chama `updateOne('tables', tableId, { status: 'OCCUPIED' })`**.
- **Fix:** após o `updateOne` da reserva, se `tableId` foi passado: `updateOne<DbTable>('tables', tableId, { status: 'OCCUPIED', updatedAt: new Date().toISOString() })`. Importar `DbTable` de `@/lib/types`.

### Fix 2 — Remover fake diners do `getBill`
- Arquivo: `src/services/orderService.ts:169-192`
- O bloco `DEMO_TABLEMATES` injeta "Pepe" e "Juan" com produtos hardcoded quando a mesa tem ≤1 cliente real. Isso aparece no Caixa e no Close-Account durante o demo.
- **Fix:** remover completamente as constantes `DEMO_TABLEMATES` e `demoToAdd`. A variável `customers` passa a ser simplesmente `[...realCustomers]`. Ajustar `subtotal` e `serviceFee` para usar `realCustomers` diretamente.
- **Atenção:** após este fix, uma mesa sem pedidos reais mostrará conta vazia. Isso é o comportamento correto.

---

## PR-4 — i18n para CashierPage (template para os outros)

**Objetivo:** adicionar tradução à CashierPage como padrão para as demais telas operacionais.

**Regras de i18n do projeto** (ver `src/i18n/labels.ts`):
- Adicionar keys ao objeto `labels` em `labels.ts` para PT-BR, EN, ES.
- **Nunca** usar dicionários paralelos `isPt ? 'x' : 'y'`.
- Usar `const { t } = useLabels()` no componente. Envolver em `<I18nProvider>` se necessário (ver como `AdminPage` faz).
- Cada string hardcoded em PT vira uma label key no formato `cashier.xxx`.

**Keys a adicionar em `labels.ts`** (seção `cashier`):
```
cashier.title: 'Caixa / Pagamentos' / 'Cashier / Payments' / 'Caja / Pagos'
cashier.tab.orders: 'Mesas / Pedidos' / 'Tables / Orders' / 'Mesas / Pedidos'
cashier.tab.history: 'Histórico' / 'History' / 'Historial'
cashier.tab.receipts: 'Recibos' / 'Receipts' / 'Recibos'
cashier.tab.invoices: 'Notas fiscais' / 'Invoices' / 'Facturas'
cashier.metric.received: 'Recebido hoje' / 'Received today' / 'Recibido hoy'
cashier.metric.paid: 'Pedidos pagos' / 'Paid orders' / 'Pedidos pagados'
cashier.metric.pending: 'A receber' / 'To collect' / 'Por cobrar'
cashier.metric.tables: 'Mesas pendentes' / 'Pending tables' / 'Mesas pendientes'
cashier.filter.all: 'Todos' / 'All' / 'Todos'
cashier.filter.pending: 'Pendentes' / 'Pending' / 'Pendientes'
cashier.filter.partial: 'Parcial' / 'Partial' / 'Parcial'
cashier.filter.paid: 'Pagos' / 'Paid' / 'Pagados'
cashier.pay.title: 'Receber pagamento' / 'Collect payment' / 'Cobrar pago'
cashier.pay.confirm: 'Receber {amount}' / 'Collect {amount}' / 'Cobrar {amount}'
cashier.pay.method.cash: 'Dinheiro' / 'Cash' / 'Efectivo'
cashier.pay.method.card: 'Cartão' / 'Card' / 'Tarjeta'
cashier.pay.method.pix: 'PIX' / 'PIX' / 'PIX'
cashier.empty: 'Nenhuma mesa ativa' / 'No active tables' / 'Sin mesas activas'
```

**No componente:** adicionar `useLabels()` e substituir strings. O CashierPage não tem `I18nProvider` — verificar se precisa envolver (provavelmente sim, como AdminPage faz para o idioma do admin).

**Não traduzir as demais telas neste PR** — este PR estabelece o padrão.

---

## PR-5 — Migrar CashierPage para AdminLayout + AdminModal + AdminButton

**Objetivo:** primeira migração completa de shell — template para as demais telas operacionais.

**Leitura obrigatória antes de implementar:** `docs/UI_STANDARDS.md` §4, `docs/DESIGN_SYSTEM.md` seção AdminLayout.

**Referência de implementação:** `src/app/admin/AdminPage.tsx` — é o modelo exato a seguir.

### Mudanças estruturais:

1. **Substituir o shell manual** pelo `AdminLayout` de `@/components/layout`:
   - Remover o `<aside className="ff-area-sidebar...">` manual e o `<div className="ff-area-main">` manual.
   - Os `navItems` do Cashier viram `SidebarNavGroup[]` passados para `AdminLayout`.
   - O topbar com "Ao vivo" e refresh button vai no slot `topBarRight`.
   - O link "Hub" vai no `sidebarFooter` (botão com `navigate('/')`).

2. **Substituir os 4 modais inline** (`PayModal`, `ReceiptModal`, inline done-screen):
   - Usar `AdminModal` de `@/components/admin` para o wrapper (header, body, footer, close button).
   - Manter a lógica interna de pagamento — só a moldura muda.
   - Footer buttons: usar `AdminButton variant="primary"` e `variant="outline"`. Ordem: Cancel | Confirm (padrão do `AdminModal`).

3. **Substituir `FilterPill` custom** pelos `AdminFilterBar` chips de `@/components/admin`.

4. **Substituir `CashierMetric`** pelos `AdminMetricCard` de `@/components/admin` (ou `MetricChip` se quiser mais compacto — ver UI_STANDARDS §4: não duplicar o que os chips já mostram).

5. **Substituir botões inline** (`btn btn-sm btn-outline-*`) por `AdminButton` nos lugares onde faz sentido (header actions, modal footers). As action buttons nas TableGroupCards (inline payment buttons) podem permanecer como estão por ora — são muito específicas do layout de card.

6. **CSS:** remover os `<style>` inline com `@keyframes cashier-*`. Mover as animações para `src/styles/areas.css` com prefixo `ff-cashier-*`.

7. **Sticky header:** o bloco de métricas + filtros deve usar a estrutura de `ff-products-sticky-bar` (padrão já existente em Products) em vez do scroll manual com `scrolled` state.

### O que NÃO mudar neste PR:
- A lógica de `TableGroupCard` e `CustomerSection` — apenas o wrapper muda.
- O `PayModal` interno (cálculos de troco, partial/full toggle, quick amounts) — apenas a moldura.
- O `tabFromPath` e o state de tabs — já corrigido no PR-2.
- A `cashierService` — nenhuma mudança no service layer.

---

## Status dos PRs

- [ ] PR-1 — Shared formatting helpers
- [ ] PR-2 — Route & navigation fixes
- [ ] PR-3 — Data fixes: seating + fake diners
- [ ] PR-4 — i18n CashierPage
- [ ] PR-5 — Migrar CashierPage para AdminLayout

---

## Arquivos que NÃO devem ser tocados

- `src/components/admin/*` — design system canônico, não alterar
- `src/styles/theme.css`, `src/styles/areas.css` — tokens, só adicionar
- `src/features/menu/*` — já correto
- `src/app/admin/sections/*` — já correto (exceto PR-2 fix 3)
- `src/lib/mock-db/*` — store de dados, não alterar estrutura
- `src/app/kiosk/*` — comportamento bom, só restyle de hero fica para depois
- `src/app/waiter-staff/WaiterTablesPage.tsx` — lógica de floor excelente, migração de shell fica para PR-6+


H. First 5 small PRs/tasks
PR-1 — Shared formatting + status helpers. One formatCurrency in src/utils/format.ts; replace the per-file formatBRL. Zero UX change, pure cleanup. (Smallest, safest, unblocks the rest.)
PR-2 — Route & navigation fixes. Deep-link /waiter-staff/calls to the Calls tab; align /cashier/* paths with tabs; make Branches its own screen or drop the duplicate nav item; add a catch-all NotFound. (Self-contained, fixes visible dead-ends.)
PR-3 — Reservation seating updates table status + remove the getBill fake-diner hack. (Two small service-layer fixes; the highest-value correctness PR for a demo.)
PR-4 — i18n for one screen (Cashier) as the template, adding the missing label keys, following reference_i18n_labels_structure (no parallel isPt dictionaries). Establishes the pattern for Waiter/Reservations/Kitchen/Queue/Delivery.
PR-5 — Migrate Cashier to AdminLayout + AdminModal/AdminButton. The reference migration the other operational screens will copy.