A. Core missing features (high value, close to what exists)
        1. Multi-session ordering at the same table
        Right now one table = one order stream. In practice, a group arrives, some people order drinks first, then appetizers, then mains. The model needs:

        TableSession — opens when first customer arrives, closes when table is paid
        Multiple orders per session, grouped for the kitchen
        Running total that updates live as orders arrive
        Partial delivery tracking per person
        2. Product modifiers and options
        Critical for burgers, ice cream, sandwiches, pizzas. Currently a product is a flat item with a note field. You need:

        Option groups — "choose your size", "choose your base", "choose your sauce"
        Required vs optional groups
        Min/max selection per group (choose exactly 1 / choose up to 3)
        Price modifiers per option (+R$ 5 for extra cheese)
        Nested combinations — a combo meal that itself contains configurable sub-items
        3. Combos and bundles
        Define a combo from existing products (burger + fries + drink)
        Each item in the combo can have its own modifiers
        Combo price vs sum of parts
        Kitchen explodes combos into individual kitchen items
        4. Product variants
        For ice cream shops especially:

        Same product, multiple SKUs (small/medium/large cup, cone, cup)
        Each variant has its own price and availability
        Distinct from modifiers — variants are "what you're buying", modifiers are "how you want it"
        5. Opening hours and availability schedules
        Products available only during certain hours (breakfast menu)
        Categories with time windows
        Branch open/closed status
        Automatic menu switching (lunch menu vs dinner menu)
        6. Inventory / stock control (basic)
        Set stock quantity per product
        Auto-disable product when stock reaches zero
        Low-stock alerts in Admin
        Stock adjustments by manager

B. Business-type-specific features
        Restaurants (table service)
        Reservation system — book a table, time slot, party size, deposit
        Cover charge (couvert artístico) per person
        Split bill by seat — each seat at a table is a person, items assigned to seats
        Course pacing — appetizers → mains → desserts with controlled kitchen sequencing
        Allergen/dietary flags per product (gluten-free, vegan, nut-free)
        Wine/beverage pairing suggestions per dish
        Burgers / fast food / QSR
        Build-your-own product flow — step-by-step modifier wizard
        Upsell prompts — "add fries and drink for R$ 8 more?"
        Order ready display prominently on Queue screen (customer picks up)
        Drive-through mode — no table, just order number
        Meal deal recognition — auto-suggest combo when individual items match
        Ice cream / desserts
        Flavor picker — select 1-3 flavors from a visual grid with images
        Topping builder — checkbox grid, priced per topping
        Size selector — visual cup/cone sizes
        Mix-in combinations — track popular combinations for purchasing
        Seasonal/rotating menu — enable/disable products by date range
        Coffee shops / cafeterias
        Loyalty program built-in (stamp card / points)
        Subscription orders — daily coffee, weekly bundle
        Custom drinks builder — espresso shots, milk type, syrup, temperature
        Tab system — customer opens a tab, orders multiple rounds, pays at end
        Barista queue — separate from kitchen, different station routing
        Delivery / online orders
        Delivery zones — polygon on a map, delivery fee per zone
        Delivery time estimate
        Order tracking page for customer (link sent by SMS/WhatsApp)
        Third-party integration (iFood, Rappi, Uber Eats) — receive orders in the same kitchen screen
        Minimum order value per delivery zone
C. Operational features (missing from current prototype)
        Kitchen
        Station routing — different items go to different kitchen stations (grill, salad bar, bar)
        Production time per item — estimate when each item will be ready
        Kitchen Load view — how many items are in-flight at each station
        Item-level status — not just order-level. Each line item can be PREPARING/DONE
        Remake flow — customer complains, kitchen gets a remake ticket without creating a new order
        Allergen warnings highlighted on kitchen ticket
        Waiter
        Section assignment — waiter assigned to tables 1-10, different waiter for 11-20
        Transfer table — move a party to another table mid-service
        Add items to existing order without creating a new order record
        Course fire — waiter tells kitchen "fire the mains now"
        Void item — remove an already-ordered item (requires manager approval)
        Tip tracking per waiter, per shift
        Cashier / Payments
        Fiscal note integration (NF-e, NFC-e for Brazil) — currently mocked
        Split evenly — divide total by N people automatically
        Tip on receipt — suggest tip percentages
        Gift cards / vouchers — redeem against order total
        Open tab — customer pays when they leave, card kept on file
        Cash drawer management — open/close till, cash count, discrepancy report
        Discount types — percentage, fixed amount, item-level, happy hour
        Admin / Manager
        Role-based access with real permissions (currently placeholder)
        Owner: everything
        Manager: most things except billing
        Shift supervisor: floor ops, no product editing
        Cashier: billing screen only
        Kitchen: kitchen screen only
        Waiter: waiter screen only
        Shift management — open/close shifts, assign staff
        Daily close report — totals by category, by payment method, by hour
        Product performance — revenue per product, units sold, margin
        Customer insights — repeat customers, average spend, top items per customer
        Printer/hardware management — assign receipt printers to stations, test print
D. Customer-facing features
        Digital Menu enhancements
        Product images gallery — multiple photos per product
        Nutritional info panel
        Customer reviews/ratings per product
        "Favorites" list persisted to returning customers
        Recommended for you based on past orders
        Real-time wait time indicator on the menu
        Pre-order for a time slot — order at 19:00, pick up at 19:45
        Kiosk enhancements
        Loyalty card scan (QR/barcode) on welcome screen
        Facial recognition for returning customer (future / optional)
        Accessibility mode — larger text, high contrast, audio descriptions
        Multiple languages per kiosk (tourist areas)
        Nutritional panel during product selection
        Dynamic upsell at cart review screen
        Payment terminal integration (SiTef, Stone, Cielo) — currently simulated
        Queue Display
        Estimated wait time per ticket
        TV branding — show restaurant logo, promotions, social media between updates
        Sound profile — different tones for different stations
        Multi-language announcements
E. SaaS platform features (multi-tenant)
        Tenant / subscription management
        Plan tiers — Starter (1 branch, 2 terminals), Pro (5 branches), Enterprise (unlimited)
        Feature flags per plan — loyalty only on Pro+
        Billing portal — subscription, invoice history, payment method
        Usage metrics — orders/month, terminals active, storage
        Onboarding wizard — guided setup for new tenant (restaurant name, first branch, first product)
        White-label — custom domain, custom colors per tenant
        Multi-branch
        Branch selector on hub page
        Centralized menu vs per-branch overrides (price, availability)
        Cross-branch reporting — aggregate revenue across all branches
        Branch-level managers with scoped access
        Menu push — publish a menu change to all branches at once
        Integrations
        WhatsApp Business API — send order confirmation, ready notification
        Email receipts — send receipt to customer email
        Google Maps — branch location on booking
        Accounting export — daily sales CSV to QuickBooks/Contaazul
        Webhook events — order.created, order.paid, table.closed for third-party systems
