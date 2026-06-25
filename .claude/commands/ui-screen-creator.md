---

description: Create or modify a UI screen following the project UI standards
argument-hint: [screen/task description]
----------------------------------------

Before implementing anything, read and follow:

* @CLAUDE.md
* @docs/UI_STANDARDS.md
* @docs/DESIGN_SYSTEM.md

Task:
$ARGUMENTS

Rules:

* Do not create one-off layouts.
* Use existing shared layout components first.
* Follow the correct screen type:

  * operational list
  * CRUD table
  * dashboard/report
  * form/settings
  * public display
* Keep desktop layout optimized.
* Keep mobile responsive.
* Fixed sidebar on desktop when present.
* Fixed topbar.
* Compact page header.
* Unified sticky toolbar when the page has search, filters, chips, or actions.
* Only the main content/list/table should scroll.
* Tables must use sticky sortable headers.
* Tables must become cards or compact list rows on mobile.
* Do not duplicate status information in KPI cards and filter chips.
* Use consistent buttons, badges, cards, tables, forms, spacing, and empty states.
* Preserve business logic unless the task explicitly asks to change it.

Before coding:

1. Identify the screen type.
2. Identify reusable components that already exist.
3. Reuse them.
4. If a component does not exist, create a reusable one instead of duplicating layout code.

After coding:

* Verify responsive behavior.
* Verify sticky header/toolbar behavior.
* Verify no horizontal overflow.
* Verify table sorting if a table exists.
* Verify loading, empty, and error states where applicable.
