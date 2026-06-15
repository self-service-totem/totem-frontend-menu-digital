# Design System — Component Catalog

The canonical shared components for building screens. **Reuse these before writing custom
markup.** Layout rules live in [UI_STANDARDS.md](./UI_STANDARDS.md).

The app's mature component library uses the `Admin*` naming convention and the `ff-admin-*`
/ `ff-area-*` CSS system in `src/styles/theme.css` + `src/styles/areas.css`. The generic
"standard names" used in design discussions map to these real components as follows.

---

## Standard name → component mapping

| Standard name        | Real component        | Import from                   |
| -------------------- | --------------------- | ----------------------------- |
| AppShell             | `AppShell`            | `@/components/layout`         |
| AdminLayout          | `AdminLayout`         | `@/components/layout`         |
| ResponsiveSidebar    | `ResponsiveSidebar`   | `@/components/layout`         |
| TopBar (admin)       | `AdminTopBar`         | `@/components/layout`         |
| TopBar (customer)    | `TopBar`              | `@/components/layout`         |
| PageHeader           | `AdminPageHeader`     | `@/components/admin`          |
| StickyToolbar        | _composition_: `AdminSearchInput` + `AdminFilterBar` + actions in a sticky bar | `@/components/admin` |
| FilterChips          | `AdminFilterBar`      | `@/components/admin`          |
| SearchInput          | `AdminSearchInput`    | `@/components/admin`          |
| DataTable            | `AdminTable`          | `@/components/admin`          |
| SortableTableHeader  | _built into_ `AdminTable` (`sortable` column + `useSortable`) | `@/components/admin` |
| StatusBadge          | `AdminBadge` (+ `OrderStatusBadge`, `PaymentStatusBadge`, `QueueStatusBadge`, `StatusPill`) | `@/components/admin` |
| MetricChip           | `MetricChip` (compact) / `AdminMetricCard` (full) | `@/components/admin` |
| ActionMenu           | `AdminActionMenu`     | `@/components/admin`          |
| EmptyState           | `AdminEmptyState`     | `@/components/admin`          |
| LoadingSkeleton      | `AdminLoadingSkeleton` (+ `AdminMetricSkeleton`) | `@/components/admin` |
| DirtySaveBar         | `DirtySaveBar`        | `@/components/admin`          |
| PublicDisplayLayout  | `PublicDisplayLayout` (+ `usePageRotation`) | `@/components/layout` |

> **Do not** create parallel `DataTable` / `PageHeader` / etc. components. Use the `Admin*`
> ones above. Do not rename existing components or `ff-admin-*` classes.

---

## Layout components (`@/components/layout`)

### AdminLayout

Canonical shell for all back-office screen types. Fixed sidebar + fixed top bar + single
scrollable content region. Owns the drawer open/close state internally.

```tsx
<AdminLayout
  branding={{ logoUrl, fallbackIcon: 'bi-shop', name: tenantName, role: 'Administração' }}
  groups={navGroups}            // SidebarNavGroup[]
  activeKey={section}
  onSelect={goTo}
  breadcrumb={{ root: tenantName, active: 'Pedidos' }}
  topBarRight={<>{clock}{statusBadge}{avatar}</>}
  sidebarFooter={<button className="ff-nav-item" onClick={…}><i className="bi bi-house" />Hub</button>}
>
  {/* page content */}
</AdminLayout>
```

Reference implementation: `src/app/admin/AdminPage.tsx`.

### ResponsiveSidebar

Presentational sidebar that becomes a mobile drawer. Branding header + grouped nav +
optional footer. Used internally by `AdminLayout`; use directly only for a custom shell.
Types: `SidebarNavGroup`, `SidebarNavItem` (`key`, `label`, `icon`, optional `badge`),
`SidebarBranding`.

### AdminTopBar

Fixed top bar (`ff-area-topbar`): hamburger (mobile), breadcrumb or title, optional `right`
slot. Distinct from the customer `TopBar` (`ff-topbar`, back button).

### PublicDisplayLayout + usePageRotation

Full-screen customer display shell (fixed header/footer, adaptive grid, no scroll).
`usePageRotation(items, pageSize, seconds)` returns `{ pageItems, page, pageCount }` for
auto-rotating long lists.

```tsx
const { pageItems, page, pageCount } = usePageRotation(tickets, 12, 8);
<PublicDisplayLayout header={<Brand/>} footer={<Legend/>}>
  {pageItems.map(t => <TicketCard key={t.id} ticket={t} />)}
</PublicDisplayLayout>
```

### AppShell / TopBar (customer)

`AppShell` wraps customer mobile pages with the bottom nav. `TopBar` is the customer
back-button header.

---

## Admin components (`@/components/admin`)

### AdminPageHeader (PageHeader)
`title`, optional `subtitle`, optional `actions` (primary button slot).

### AdminSearchInput (SearchInput)
Controlled search box with clear button. `value`, `onChange`, `placeholder?`.

### AdminFilterBar (FilterChips)
Single-select filter chips with optional counts. `options: FilterOption[]` (`key`, `label`,
`count?`), `value`, `onChange`. Compose with `AdminSearchInput` in a sticky bar to form the
**StickyToolbar**.

### AdminTable (DataTable)
Sortable, sticky-header table. `columns: AdminTableColumn<T>[]` (`key`, `label`,
`sortable?`, `render`, `width?`, `align?`), `rows`, `sortBy`, `sortDir`, `onSort`,
`onRowClick?`, `selectedId?`, `loading?`, and empty-state props. Pair with the
`useSortable(rows, sortBy, sortDir)` helper for client-side sorting. Loading → skeleton;
no rows → `AdminEmptyState`.

### AdminBadge / StatusPill (StatusBadge)
Standardized status badges. Use the typed helpers for known domains:

| Helper               | Statuses                                                            |
| -------------------- | ------------------------------------------------------------------- |
| `OrderStatusBadge`   | DRAFT, CREATED, SENT_TO_KITCHEN, PREPARING, READY, DELIVERED, CLOSED, CANCELED |
| `PaymentStatusBadge` | UNPAID, PARTIALLY_PAID, PAID, REFUNDED, CANCELED                     |
| `QueueStatusBadge`   | WAITING, CALLED, SERVING, COMPLETED, CANCELED                        |

For other cases use `<AdminBadge variant={…} label={…} />`. Variants include the semantic
state names plus colors `blue | amber | green | purple | red | slate | neutral`.

### AdminMetricCard / MetricChip
`AdminMetricCard` = full KPI card (icon, value, label, optional delta) for dashboards/
reports. `MetricChip` = compact inline counter (`label`, `value`, `icon?`, `color?`) for a
light strip on operational pages. **Do not** duplicate filter-chip counts as metric cards
(see UI_STANDARDS §4).

### AdminActionMenu (ActionMenu)
Row "⋮" menu. `items: ActionMenuItem[]` (`key`, `label`, `icon?`, `variant?` `'default' |
'destructive'`, `onClick`). Closes on outside click; stops row-click propagation.

### AdminEmptyState (EmptyState) / AdminLoadingSkeleton (LoadingSkeleton)
Standard empty and loading states. `AdminTable` renders both automatically.

### AdminFormSection / AdminFormRow
Form sectioning. `AdminFormSection` (`title`, `description?`) wraps `AdminFormRow` (`label`,
`required?`, `hint?`).

### DirtySaveBar
Sticky bottom save bar for forms. `visible`, `onCancel`, `onSave`, `saving?`, with
overridable `message` / `cancelLabel` / `saveLabel`. Renders nothing when not visible.

### AdminButton / AdminIconButton
Buttons. Variants: `primary | secondary | ghost | outline | destructive | success |
warning | icon`; sizes `sm | md | lg`; `icon?`, `loading?`.

### ViewToggle
Card/table view switch (`mode: 'card' | 'table'`, `onChange`) for list pages.

---

## Design tokens

Tokens (colors, spacing, radius, primary) live in `src/styles/theme.css`. Component styles
live in `src/styles/areas.css` (`ff-admin-*`, `ff-area-*`, `ff-public-display-*`). **Do not
hardcode token values** in components — use the CSS classes / variables. New component CSS
goes in `areas.css` following the existing naming.
