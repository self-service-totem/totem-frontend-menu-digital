# UI/UX Standard

This is the canonical layout and interaction standard for **every** screen in the app.
The goal is to eliminate one-off screen designs: each new screen picks a documented
**screen type**, reuses the matching shared layout, and composes shared components.

For the component catalog (names, props, imports), see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

> **Rule of thumb:** if you are about to write page-shell markup (sidebar, topbar, grid
> wrappers) by hand, stop — reuse a layout component instead.

---

## 1. Screen-type taxonomy

Before building a screen, classify it. The type decides the layout and the rules.

| Screen type        | Examples                                             | Layout component        |
| ------------------ | ---------------------------------------------------- | ----------------------- |
| Operational list   | Orders, Queue, Tables (live status)                  | `AdminLayout`           |
| CRUD table         | Products, Categories, Kiosks, Branches, Payments     | `AdminLayout`           |
| Dashboard / report | Dashboard, Reports                                   | `AdminLayout`           |
| Form / settings    | Restaurant settings, Loyalty config, edit forms      | `AdminLayout`           |
| Public display     | Queue display, Kitchen display, menu boards          | `PublicDisplayLayout`   |
| Customer mobile    | Menu, Cart, Account (customer-facing phone flow)     | `AppShell` + `TopBar`   |

The first four (back-office) all share `AdminLayout`; what changes is the **content
structure** inside it (see §4–§7).

---

## 2. Desktop layout rules

* The left sidebar stays **fixed** when present.
* The top header stays **fixed**.
* Only the **main content area** scrolls.
* Never let the whole page scroll when the screen has operational lists, tables, cards, or
  kanban columns. `AdminLayout` enforces this: the shell is fixed and `ff-area-content` is
  the single scroll region.

---

## 3. Mobile layout rules

* Do **not** keep the desktop sidebar permanently visible. `ResponsiveSidebar` collapses
  into a slide-in drawer (hamburger in the top bar opens it).
* Main content uses the full mobile width.
* No horizontal overflow.
* Tables become **readable cards** on small screens (use `ViewToggle` + a card render, or
  the table's responsive card mode).
* Primary actions stay easy to tap.
* Filters and search stay accessible.

---

## 4. Operational & CRUD pages

Structure inside `AdminLayout`:

```
PageHeader        (AdminPageHeader)  — compact, sticky if combined with toolbar
StickyToolbar     (search + filter chips + secondary actions)
Scrollable content (DataTable / cards / kanban)
```

* **PageHeader** = title, optional subtitle (only if it adds value), optional primary
  action button.
* **StickyToolbar** = `AdminSearchInput` + `AdminFilterBar` (chips with counts) + optional
  secondary actions / `ViewToggle`. Keep it sticky to the top of the scroll region (see the
  existing `ff-products-sticky-bar` pattern).
* Tables use `AdminTable` with a **sticky header** (see §5).

> **Do not duplicate information.** If filter chips already show counts and act as filters,
> do **not** also add large KPI cards for the same numbers. Only use metric cards/chips for
> metrics that are genuinely different from the chip counts. For a light counter strip,
> prefer `MetricChip` over full `AdminMetricCard`.

---

## 5. Tables

All admin tables use the shared `AdminTable` (`DataTable`) component. Requirements — all
provided by `AdminTable`:

* Sticky table header.
* Sortable column headers with an asc/desc indicator and an obvious active-sort column.
* Row hover state, consistent row height and cell padding.
* Standardized status badges (`AdminBadge` / `StatusPill`) in status columns.
* Consistent row action menu (`AdminActionMenu`).
* Loading state (`AdminLoadingSkeleton`) and empty state (`AdminEmptyState`).
* Responsive mobile card layout — no horizontal overflow.

**Visual style:**

* Header has a subtly different background from the body.
* Rows separated by subtle borders / alternating background.
* Hover is clear but not noisy.
* Numeric values align consistently (use `align: 'right'` on numeric columns).
* Status columns always use standardized badges, never raw text + color.

---

## 6. Reports & dashboards

Reports differ from operational CRUD pages.

* Keep **only the compact control header** sticky. It may include: date selector, date
  range, refresh, export CSV, branch selector.
* KPI cards, charts, rankings, and analytics widgets **scroll with the content**.
* Do **not** make large KPI cards sticky — they steal chart space.

---

## 7. Forms & settings

* Do **not** make the entire form header sticky unless genuinely needed.
* Use clear sections (`AdminFormSection` / `AdminFormRow`).
* Use consistent form components.
* When there are unsaved changes, show a `DirtySaveBar` (sticky bottom) with:
  * "Você tem alterações não salvas"
  * Cancel / Discard
  * Save changes

---

## 8. Public display screens

For customer-facing display screens (`PublicDisplayLayout`):

* No manual scrolling.
* Fixed header and footer.
* Adaptive grid for content.
* Automatic pagination / rotation when there are many items (`usePageRotation`).
* Optimize for visibility from a distance (large type, high contrast).

---

## 9. Sticky-behavior rule

Before making anything sticky, ask:

> "Does the user need this control while scrolling?"

* **Yes** → make it sticky.
* **No** → let it scroll normally.

Avoid sticky areas that consume too much vertical space.

---

## 10. Implementation rule for new screens

1. Identify the screen type (§1).
2. Choose the matching shared layout. **Do not build a page shell from scratch.**
3. Reuse existing shared components (see [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)).
4. If a needed component does not exist, create it as a **reusable** shared component (not
   inline, one-off markup), and add it to the design system.

---

## 11. Acceptance checklist (every new screen)

* [ ] Uses the correct shared layout for its screen type.
* [ ] Sidebar / topbar behavior is correct (fixed on desktop, drawer on mobile).
* [ ] Responsive behavior works on mobile.
* [ ] Main content scrolls correctly; the shell does not.
* [ ] Filters / search remain accessible when useful.
* [ ] Tables have sortable sticky headers.
* [ ] Mobile tables become cards.
* [ ] Buttons, badges, cards, and forms follow the shared design system.
* [ ] No duplicated header levels.
* [ ] No unnecessary large KPI cards on operational pages.
* [ ] No horizontal overflow.
* [ ] Empty, loading, and error states exist.
* [ ] Screen looks consistent with the rest of the app.

---

## Migration status

The shared shell (`AdminLayout` / `ResponsiveSidebar` / `AdminTopBar`) was extracted from
the previously copy-pasted `ff-area-*` markup. **`AdminPage` is the reference
implementation.** The following screens still inline the old shell and should migrate to
`AdminLayout` opportunistically: `CashierPage`, `ReportsPage`, `ReservationsPage`,
`WaiterTablesPage`, `WaiterTableDetailPage`, `DeliveryPage`. Public screens
(`QueueDisplayPage`, `KitchenOrdersPage`) should migrate to `PublicDisplayLayout`.
