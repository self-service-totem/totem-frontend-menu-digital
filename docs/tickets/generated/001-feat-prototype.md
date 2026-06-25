Create a single frontend prototype project for a self-service restaurant ordering SaaS.

The current Digital Menu already exists and should not be redesigned.
Keep its current UI/UX as much as possible.
Only adapt it when needed to integrate functionally with the rest of the prototype.

Main goal:
Create a navigable prototype with multiple app areas that simulate the full product flow using local mock persistence.

The prototype must be structured as if it could later be split into independent frontend applications:

1. Digital Menu
2. Kitchen Screen
3. Admin / Backoffice
4. Kiosk / Self-Service Totem
5. Queue / Order Status Display Screen
6. Waiter / Floor Staff Screen
7. Cashier / Billing Screen

Important architecture rules:
- Keep each app area isolated.
- Shared components must go under shared folders.
- Do not import kitchen components from menu.
- Do not import admin components from kitchen.
- Do not mix app-specific logic between areas.
- Each area must have its own routes, pages, mock services and types when needed.
- Use shared components only for truly reusable UI: buttons, cards, modals, layout, notifications, loading states, empty states.
- Use a common notification/toast/error display mechanism across all apps.
- Use mocked persistence through local JSON files, localStorage, IndexedDB or another simple local mock repository approach.
- The important point is that actions in one app area must be visible in the others.
- Do not implement a real backend.
- Do not implement real authentication.
- Do not implement real payment integration.
- Keep the code easy to later connect to real APIs.

Backend contract direction:
The real backend will be JSON:API first.
Mock service payloads should mimic JSON:API structures where practical:
- data
- type
- id
- attributes
- relationships
- errors
- meta

Recommended folder structure:


app/
  menu/
  kitchen/
  admin/
  kiosk/
  queue-display/
  waiter/
  cashier/

components/
  shared/
  menu/
  kitchen/
  admin/
  kiosk/
  queue-display/
  waiter/
  cashier/

lib/
  mock-data/
  mock-db/
  services/
  types/
  jsonapi/
  notifications/
  utils/

Domain model to use in mocks:
- Tenant
- Branch
- Table
- Category
- Product
- ProductOption / Modifier
- Cart
- Order
- OrderItem
- Payment
- KitchenTicket
- QueueTicket
- Notification
- User
- Role
- WaiterCall
- Invoice
- Receipt
- CashierSession
- PaymentTransaction


Core order statuses:
- DRAFT
- CREATED
- PAID
- SENT_TO_KITCHEN
- PREPARING
- READY
- DELIVERED
- CANCELED

Payment statuses:
- PENDING
- APPROVED
- REJECTED
- REFUNDED
- OFFLINE_PENDING

Kitchen ticket statuses:
- NEW
- PREPARING
- READY
- DELIVERED
- CANCELED

Queue ticket statuses:
- WAITING
- CALLED
- SERVING
- COMPLETED
- CANCELED



WaiterCall statuses:
- PENDING
- ACKNOWLEDGED
- RESOLVED
- CANCELED

Invoice statuses:
- DRAFT
- ISSUED
- PRINTED
- CANCELED

Cashier/payment statuses:
- PENDING_PAYMENT
- PAID
- PARTIALLY_PAID
- REFUNDED
- CANCELED
App areas and required functionality:

1. Digital Menu

The digital menu already exists.
Do not redesign it unless necessary.

It must support:
- Browse restaurant/branch menu.
- Browse categories.
- Browse products.
- View product detail.
- Add products to cart.
- Edit quantities.
- Confirm order.
- Generate an order.
- Show order confirmation.
- Associate order with tenant, branch and table.
- Persist created order in the mock database.
- Created orders must appear in the Kitchen Screen.
- If the order is takeaway or queue-based, it must generate a QueueTicket visible in the Queue Display Screen.

Routes:
- /menu
- /menu/:branchId
- /menu/:branchId/table/:tableId
- /menu/cart
- /menu/order-confirmation/:orderId

2. Kitchen Screen

Create a kitchen operational screen.

It must support:
- See incoming orders created from Digital Menu and Kiosk.
- Show orders grouped by status:
  - NEW
  - PREPARING
  - READY
- Open order detail.
- See items, quantities, notes and table number.
- Change order status:
  - NEW -> PREPARING
  - PREPARING -> READY
  - READY -> DELIVERED
- When an order becomes READY, update the Queue Display Screen.
- Highlight urgent/old orders visually.
- Show elapsed time since order creation.
- Support basic filters:
  - all
  - new
  - preparing
  - ready
- Use mock services, not real APIs.

Routes:
- /kitchen
- /kitchen/orders
- /kitchen/orders/:orderId

3. Admin / Backoffice

Create an admin/backoffice area for the restaurant owner or manager.

It must support:
- Dashboard with basic mock metrics:
  - orders today
  - revenue today
  - pending kitchen orders
  - ready orders
  - most sold products
- Manage products:
  - list products
  - create product
  - edit product
  - enable/disable product
  - assign category
  - set price
  - set image URL
- Manage categories:
  - list categories
  - create category
  - edit category
  - reorder categories
  - enable/disable category
- Manage branches:
  - list branches
  - create/edit branch
  - branch settings
- Manage tables:
  - list tables
  - create table
  - activate/deactivate table
  - show QR value or QR placeholder
  - regenerate table validation code
- Manage orders:
  - see order history
  - filter by status/date/table
  - open order detail
- Manage kiosk devices:
  - list kiosks
  - show kiosk status mock
  - assign kiosk to branch
- Manage queue settings:
  - enable/disable queue mode
  - configure queue display message
  - configure whether orders generate queue ticket
- Basic settings:
  - restaurant name
  - logo URL
  - currency
  - service type:
    - table service
    - takeaway
    - kiosk self-service

Routes:
- /admin
- /admin/dashboard
- /admin/products
- /admin/categories
- /admin/branches
- /admin/tables
- /admin/orders
- /admin/kiosks
- /admin/queue
- /admin/settings

4. Kiosk / Self-Service Totem

Create a kiosk/totem frontend for customers ordering from a physical self-service device.

It must support:
- Welcome screen.
- Select service type:
  - eat in
  - takeaway
- Browse categories.
- Browse products.
- Product detail.
- Add products to cart.
- Edit cart.
- Confirm order.
- Simulate payment step.
- Payment approved/rejected mock.
- Generate order after successful mock payment.
- Send order to kitchen.
- Generate queue ticket number.
- Show final confirmation screen with order number / queue number.
- Optionally show a mock "print ticket" button.
- The order must appear in Kitchen Screen.
- The queue ticket must appear in Queue Display Screen.

Routes:
- /kiosk
- /kiosk/start
- /kiosk/menu
- /kiosk/cart
- /kiosk/payment
- /kiosk/confirmation/:orderId

5. Queue / Order Status Display Screen

Create a public display screen for customers waiting for their orders.

This screen is intended for:
- Restaurant TV display.
- Customers waiting inside or outside.
- Takeaway orders.
- Kiosk orders.
- Queue/ticket-based waiting.

It must support:
- Show currently preparing orders.
- Show ready orders.
- Show recently called orders.
- Display queue ticket number prominently.
- Display order status:
  - WAITING
  - PREPARING
  - READY
  - CALLED
- Automatically reflect changes made from Kitchen Screen.
- When kitchen marks an order as READY, the ticket should move to READY/CALLED area.
- Include a simple visual layout suitable for a large screen.
- Include optional mock sound/notification trigger when an order becomes ready.
- Include a “Now serving” section.
- Include a “Preparing” section.

Routes:
- /queue-display
- /queue-display/:branchId

6. Waiter / Floor Staff Screen

Create a private operational screen for waiters / floor staff.

It must support:
- See active tables.
- See table status:
  - empty
  - occupied
  - waiting for waiter
  - order in progress
  - waiting for payment
- Receive waiter calls created from the Digital Menu.
- Show waiter calls grouped by status:
  - PENDING
  - ACKNOWLEDGED
  - RESOLVED
- Open table detail.
- See current orders by table.
- See kitchen status for each table order.
- Mark waiter call as acknowledged.
- Mark waiter call as resolved.
- Request bill / send table to cashier.
- Optionally add a simple note to a table.

Routes:
- /waiter
- /waiter/tables
- /waiter/tables/:tableId
- /waiter/calls

Interaction requirements:
- When a customer taps “Call waiter” in Digital Menu, create a WaiterCall in mock persistence.
- The WaiterCall must appear in Waiter Screen.
- When the waiter marks the call as resolved, it should disappear from pending alerts.
- When a table requests the bill, it should appear in Cashier Screen as pending payment.

7. Cashier / Billing Screen

Create a private operational screen for cashier / billing.

It must support:
- See orders pending payment.
- See tables waiting for payment.
- Open order/payment detail.
- Mark order as paid.
- Simulate payment method:
  - cash
  - card
  - PIX
  - external terminal
- Generate mock receipt.
- Generate mock invoice.
- Print receipt/invoice mock.
- Reprint receipt/invoice mock.
- Cancel invoice mock.
- See payment status.
- See basic cashier summary:
  - total paid today
  - pending payment amount
  - number of paid orders
  - number of pending orders

Routes:
- /cashier
- /cashier/orders
- /cashier/orders/:orderId
- /cashier/payments
- /cashier/invoices
- /cashier/receipts

Interaction requirements:
- When Kitchen marks an order as DELIVERED or when customer requests bill, the order/table may appear in Cashier Screen as pending payment.
- When Cashier marks an order as PAID, update the order payment status.
- When Cashier generates a receipt or invoice, store it in mock persistence.
- Receipt/invoice print can be simulated with a modal or printable page.
- Do not integrate with real fiscal systems yet.

Mock persistence requirements:
- When a product is created in Admin, it must be visible in Digital Menu and Kiosk.
- When a category is created in Admin, it must be visible in Digital Menu and Kiosk.
- When an order is created in Digital Menu, it must appear in Kitchen Screen.
- When an order is created in Kiosk, it must appear in Kitchen Screen.
- When Kitchen changes order status, it must update the Queue Display.
- When Kitchen marks an order READY, the queue ticket must become visible as ready/called.
- Use a centralized mock repository/service layer so later it can be replaced with real HTTP API calls.
- When a customer taps “Call waiter” in Digital Menu, it must create a WaiterCall visible in Waiter Screen.
- When Waiter resolves a call, the status must update globally.
- When a customer requests the bill, the table/order must appear in Cashier Screen.
- When Cashier marks an order as paid, the order payment status must update globally.
- When Cashier generates or prints a receipt/invoice, it must be stored in mock persistence.

Suggested mock services:
- tenantService
- branchService
- menuService
- productService
- categoryService
- tableService
- orderService
- kitchenService
- queueService
- paymentService
- notificationService
- waiterService
- cashierService
- billingService
- invoiceService
- receiptService

Do not hardcode business data directly inside UI components.
Keep UI components separated from data access.

UX requirements:
- Clean and simple interface.
- Responsive design.
- Digital Menu must be mobile-first.
- Kiosk must be touch-friendly with large buttons.
- Kitchen must work well on tablet/desktop.
- Admin must work well on desktop.
- Queue Display must work well on large screens / TV.
- Use clear empty states.
- Use clear loading states.
- Use clear error states.

Out of scope for this prototype:
- Real backend integration.
- Real login/authentication.
- Real payment provider.
- Real printer integration.
- Real QR generation if it adds complexity; a placeholder is acceptable.
- Real WebSocket integration.
- Production-level permissions.
- Real fiscal invoice integration.
- Real tax calculation.
- Real printer integration.
- Real POS/payment terminal integration.
- Real employee authentication/authorization.

Expected result:
- A single prototype project.
- All app areas navigable.
- Clear route separation.
- Mock data/services working.
- Cross-area interactions working.
- README with local run instructions.
- Short document explaining how this single project could later be split into:
  1. menu digital frontend
  2. kitchen frontend
  3. admin/backoffice frontend
  4. kiosk frontend
  5. queue display frontend


Use these future backend domains as guidance:
- tenant
- branch
- table
- catalog/menu
- product
- order
- kitchen
- payment
- queue
- notification
- user/auth

Roles
    - Private operational areas such as Admin, Kitchen, Waiter and Cashier should be designed as if they will later require login and role-based access control, but do not implement real authentication in this prototype.

The future backend will probably use DynamoDB with tenantId and branchId in the main entities.
For now, include tenantId, branchId, createdAt and updatedAt in the mock data models.
Do not design final DynamoDB keys in this prototype.