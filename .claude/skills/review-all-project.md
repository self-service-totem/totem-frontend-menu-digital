Act as a senior product designer, UX/UI reviewer and software architect.

Review the current restaurant self-service totem prototype.

Do not implement changes yet.

Inspect all available routes, pages, components, mock data and navigation flows.

The system includes:
- Digital Menu
- Kiosk / Self-Service Totem
- Admin / Backoffice
- Kitchen Screen
- Waiter / Floor Staff
- Cashier / Payments
- Queue / Order Status Display
- Reservations
- Tables
- Zones / Areas
- Products
- Categories
- Settings

Goal:
Create a complete improvement report for the prototype so it looks more professional, homogeneous and usable for a client demo.

Review these aspects:

1. Global UX/UI consistency
- layout consistency
- headers
- page titles
- search/filter/toolbars
- buttons
- cards
- tables
- badges
- modals
- empty states
- spacing
- typography
- colors
- responsive behavior

2. Navigation
- admin sidebar organization
- public/customer flows
- kiosk flow
- waiter flow
- cashier flow
- kitchen flow
- reservation flow
- queue flow
- broken or confusing routes

3. Admin pages
Review:
- Dashboard
- Products
- Categories
- Tables
- Zones / Areas
- Branches
- Kiosks
- Queue settings
- Reservations
- Settings

Check if each page follows a consistent CRUD pattern:
- compact header
- toolbar
- search
- filters
- main table/list
- create button
- detail/edit modal
- clear actions

4. Operational screens
Review:
- Kitchen
- Waiter Tables
- Waiter Calls
- Cashier Payments
- Queue

Check if they are usable in a real restaurant during service:
- clear status visibility
- icon/badge clarity
- grouping by table/zone/status
- fast actions
- minimal scrolling
- table detail
- payment detail
- queue action priority

5. Kiosk / tablet demo
Review:
- welcome screen
- language selector
- touch target sizes
- hero/icon/branding
- service type selection
- categories
- product cards
- stepper/menu/review/payment/confirmation
- tablet responsiveness
- browser kiosk mode usability

6. Digital Menu
Review:
- category visibility
- product card size
- cart flow
- waiter call
- request bill
- order confirmation
- table context
- language/currency/restaurant name consistency

7. Data and mock integration
Check if:
- Admin is the source of truth for products/categories/tables/settings
- Digital Menu reads from shared services
- Kiosk reads from shared services
- Orders created from Menu/Kiosk appear in Kitchen
- Kitchen status updates affect Waiter/Cashier/Queue
- Cashier payments update table/session status
- Reservations can seat customers and affect tables
- Queue updates when orders are ready

8. Specific things to verify
- Tables page should focus on tables; Zones should probably be a separate CRUD page.
- Table create/edit should include zone, waiter, capacity, status and validation code.
- Waiter Tables should have strong status icons, grouping by zone and assigned waiter.
- Cashier should group by table and then customer/person, with collapsible sections and quick search.
- Reservations should keep Agenda view but also support Table/List and By Table views.
- Queue screen should be more compact and operational.
- Kiosk welcome screen should have large language buttons and a stronger hero/icon.
- Menu category and stepper sizes should be tablet-friendly.
- Broken routes or exceptions should be listed.

Return the result as a structured report:

A. Executive summary
B. Top 10 most important improvements
C. Critical bugs or broken routes
D. UX/UI inconsistencies
E. Module-by-module review
F. Data/model integration problems
G. Recommended implementation order
H. First 5 small PRs/tasks
I. What should not be changed yet

Do not implement anything until I approve.