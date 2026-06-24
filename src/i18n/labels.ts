// Catálogo de etiquetas por idioma. La estructura está armada para que más
// adelante se pueda reemplazar por una librería (react-intl / i18next) sin tocar
// las páginas: cada componente lee de `useLabels()` por clave.

export type LanguageCode = 'pt-BR' | 'es' | 'en';

export type LabelKey =
  | 'nav.menu'
  | 'nav.waiter'
  | 'nav.language'
  | 'nav.order'
  | 'nav.cashback'
  | 'nav.bill'
  | 'lang.es'
  | 'lang.pt'
  | 'lang.en'
  | 'lang.selector'
  | 'menu.searchPlaceholder'
  | 'menu.allCategories'
  | 'menu.featured'
  | 'menu.empty'
  | 'menu.emptyDesc'
  | 'menu.results'
  | 'menu.greeting'
  | 'menu.addedToCart'
  | 'menu.viewCart'
  | 'menu.loadError'
  | 'menu.retry'
  | 'menu.categoryEmpty'
  | 'product.quantity'
  | 'product.notes'
  | 'product.notesPlaceholder'
  | 'product.add'
  | 'product.required'
  | 'product.upTo'
  | 'product.selectRequired'
  | 'product.from'
  | 'cart.title'
  | 'cart.continue'
  | 'cart.empty'
  | 'cart.emptyDesc'
  | 'cart.viewMenu'
  | 'cart.phone'
  | 'cart.name'
  | 'cart.namePlaceholder'
  | 'cart.changeName'
  | 'cart.addMore'
  | 'cart.placeOrder'
  | 'cart.placingOrder'
  | 'cart.namePromptTitle'
  | 'cart.namePromptDesc'
  | 'cart.confirmName'
  | 'cart.items'
  | 'cart.increase'
  | 'cart.decrease'
  | 'cart.removeItem'
  | 'cart.each'
  | 'summary.subtotal'
  | 'summary.serviceFee'
  | 'summary.total'
  | 'bill.title'
  | 'bill.tabTable'
  | 'bill.tabIndividual'
  | 'bill.closeTable'
  | 'bill.closeMine'
  | 'bill.empty'
  | 'bill.requestSent'
  | 'bill.you'
  | 'waiter.title'
  | 'waiter.help'
  | 'waiter.helpDesc'
  | 'waiter.formTitle'
  | 'waiter.formDesc'
  | 'waiter.phone'
  | 'waiter.name'
  | 'waiter.namePlaceholder'
  | 'waiter.phonePlaceholder'
  | 'waiter.cancel'
  | 'waiter.send'
  | 'waiter.sent'
  | 'waiter.action.call'
  | 'waiter.action.bill'
  | 'waiter.action.order'
  | 'waiter.action.other'
  | 'waiter.status.pending'
  | 'waiter.status.acknowledged'
  | 'waiter.status.resolved'
  | 'waiter.status.canceled'
  | 'waiter.activeTitle'
  | 'waiter.historyTitle'
  | 'waiter.cancelRequest'
  | 'waiter.resolveRequest'
  | 'waiter.dupeActive'
  | 'waiter.tableUnknown'
  | 'waiter.billError'
  | 'waiter.requestCanceled'
  | 'waiter.requestResolved'
  | 'rating.title'
  | 'rating.question'
  | 'rating.tapStars'
  | 'rating.commentPlaceholder'
  | 'rating.send'
  | 'rating.thanks'
  | 'rating.thanksDesc'
  | 'rating.starLabel'
  | 'rating.score1'
  | 'rating.score2'
  | 'rating.score3'
  | 'rating.score4'
  | 'rating.score5'
  | 'account.title'
  | 'account.loyaltyTitle'
  | 'account.stamps'
  | 'account.rewardEarned'
  | 'account.stampsLeft'
  | 'account.ordersTitle'
  | 'account.noOrders'
  | 'account.items'
  | 'account.actionsTitle'
  | 'account.closeBill'
  | 'account.myCashback'
  | 'account.status.pending'
  | 'account.status.preparing'
  | 'account.status.delivered'
  | 'account.status.closed'
  | 'cashback.title'
  | 'cashback.balance'
  | 'cashback.note'
  | 'cashback.history'
  | 'cashback.signup'
  | 'cashback.empty'
  | 'cashback.signupToast'
  | 'common.back'
  | 'common.close'
  | 'common.loading'
  | 'common.required'
  | 'common.optional'
  | 'confirmation.title'
  | 'confirmation.subtitle'
  | 'confirmation.orderNumber'
  | 'confirmation.customer'
  | 'confirmation.table'
  | 'confirmation.items'
  | 'confirmation.note'
  | 'confirmation.backToMenu'
  | 'confirmation.rate'
  | 'confirmation.print'
  | 'kiosk.welcome.title'
  | 'kiosk.welcome.subtitle'
  | 'kiosk.welcome.eatIn'
  | 'kiosk.welcome.takeaway'
  | 'kiosk.steps.menu'
  | 'kiosk.steps.review'
  | 'kiosk.steps.payment'
  | 'kiosk.steps.done'
  | 'kiosk.menu.all'
  | 'kiosk.menu.emptyCategory'
  | 'kiosk.order.label'
  | 'kiosk.order.item'
  | 'kiosk.order.items'
  | 'kiosk.order.tax'
  | 'kiosk.order.emptyTitle'
  | 'kiosk.order.emptyHint'
  | 'kiosk.order.review'
  | 'kiosk.cart.title'
  | 'kiosk.cart.reviewSubtitle'
  | 'kiosk.cart.empty'
  | 'kiosk.cart.remove'
  | 'kiosk.cart.addMore'
  | 'kiosk.cart.confirmPay'
  | 'kiosk.cart.serviceFee'
  | 'kiosk.payment.title'
  | 'kiosk.payment.totalLabel'
  | 'kiosk.payment.how'
  | 'kiosk.payment.card'
  | 'kiosk.payment.cardDesc'
  | 'kiosk.payment.pix'
  | 'kiosk.payment.pixDesc'
  | 'kiosk.payment.cash'
  | 'kiosk.payment.cashDesc'
  | 'kiosk.payment.mercadoPago'
  | 'kiosk.payment.mercadoPagoDesc'
  | 'kiosk.payment.cardInstrTitle'
  | 'kiosk.payment.cardInstrDesc'
  | 'kiosk.payment.qrTitle'
  | 'kiosk.payment.qrDesc'
  | 'kiosk.payment.waiting'
  | 'kiosk.payment.cashTitle'
  | 'kiosk.payment.cashSubtitle'
  | 'kiosk.payment.cashInstr'
  | 'kiosk.payment.orderLabel'
  | 'kiosk.payment.itemsLabel'
  | 'kiosk.payment.confirm'
  | 'kiosk.payment.processing'
  | 'kiosk.payment.approved'
  | 'kiosk.payment.rejected'
  | 'kiosk.payment.rejectedDesc'
  | 'kiosk.payment.retry'
  | 'kiosk.confirm.title'
  | 'kiosk.confirm.subtitle'
  | 'kiosk.confirm.ticketLabel'
  | 'kiosk.confirm.hint'
  | 'kiosk.confirm.restarting'
  | 'kiosk.confirm.newOrder'
  | 'kiosk.confirm.print'
  | 'kiosk.confirm.orderLabel'
  | 'kiosk.confirm.photoHint'
  | 'kiosk.confirm.printOk'
  | 'kiosk.confirm.printing'
  | 'kiosk.confirm.reprintBtn'
  | 'kiosk.confirm.helpBtn'
  | 'kiosk.confirm.helpSent'
  | 'kiosk.confirm.qrHint'
  | 'kiosk.confirm.queueLabel'
  | 'kiosk.menu.categories'
  | 'kiosk.menu.added'
  | 'kiosk.menu.featured'
  | 'kiosk.menu.featuredSub'
  | 'kiosk.menu.bestseller'
  | 'kiosk.menu.upsellHint'
  | 'kiosk.idle.title'
  | 'kiosk.idle.subtitle'
  | 'kiosk.idle.continue'
  | 'kiosk.idle.restart'
  | 'kiosk.attract.cta'
  | 'receipt.notFound'
  | 'receipt.autoUpdate'
  | 'receipt.order'
  | 'receipt.status.draft'
  | 'receipt.status.created'
  | 'receipt.status.sentToKitchen'
  | 'receipt.status.preparing'
  | 'receipt.status.ready'
  | 'receipt.status.delivered'
  | 'receipt.status.closed'
  | 'receipt.status.canceled'
  | 'receipt.payment.unpaid'
  | 'receipt.payment.partiallyPaid'
  | 'receipt.payment.paid'
  | 'receipt.payment.refunded'
  | 'receipt.payment.canceled'
  | 'admin.nav.group.operation'
  | 'admin.nav.group.catalog'
  | 'admin.nav.group.establishment'
  | 'admin.nav.group.growth'
  | 'admin.nav.group.analytics'
  | 'admin.nav.group.settings'
  | 'admin.nav.dashboard'
  | 'admin.nav.orders'
  | 'admin.nav.queue'
  | 'admin.nav.products'
  | 'admin.nav.categories'
  | 'admin.nav.tables'
  | 'admin.nav.zones'
  | 'admin.nav.branches'
  | 'admin.nav.kiosks'
  | 'admin.nav.loyalty'
  | 'admin.nav.aggregator'
  | 'admin.nav.reports'
  | 'admin.nav.settings'
  | 'admin.status.operating'
  | 'admin.role'
  | 'admin.backToHub'
  // ── Common admin actions ──
  | 'common.cancel'
  | 'common.save'
  | 'common.edit'
  | 'common.create'
  | 'common.enable'
  | 'common.disable'
  | 'common.all'
  | 'common.active'
  | 'common.inactive'
  | 'common.clearFilters'
  | 'common.customer'
  | 'common.order'
  | 'common.now'
  | 'common.updated'
  // ── Shared status labels ──
  | 'status.draft'
  | 'status.created'
  | 'status.inKitchen'
  | 'status.preparing'
  | 'status.ready'
  | 'status.delivered'
  | 'status.closed'
  | 'status.canceled'
  | 'status.online'
  | 'status.offline'
  | 'status.maintenance'
  // ── Dashboard ──
  | 'dash.subtitle'
  | 'dash.ordersToday'
  | 'dash.revenueToday'
  | 'dash.avgTicket'
  | 'dash.inKitchen'
  | 'dash.avgPrepTime'
  | 'dash.ordersPerHour'
  | 'dash.today'
  | 'dash.orderSingular'
  | 'dash.orderPlural'
  | 'dash.activity'
  | 'dash.live'
  | 'dash.noOrders'
  | 'dash.noOrdersDesc'
  | 'dash.bestSellers'
  | 'dash.minAgo'
  | 'dash.tableLabel'
  // ── Queue section ──
  | 'adminQueue.title'
  | 'adminQueue.subtitle'
  | 'adminQueue.enabled'
  | 'adminQueue.disabled'
  | 'adminQueue.settings'
  | 'adminQueue.enabledDesc'
  | 'adminQueue.disabledDesc'
  | 'adminQueue.messageLabel'
  | 'adminQueue.messagePlaceholder'
  | 'adminQueue.waiting'
  | 'adminQueue.serving'
  | 'adminQueue.completed'
  | 'adminQueue.callNextBtn'
  | 'adminQueue.openTickets'
  | 'adminQueue.noOpenTickets'
  | 'adminQueue.empty'
  | 'adminQueue.ticket'
  | 'adminQueue.orderLabel'
  | 'adminQueue.callBtn'
  | 'adminQueue.attendBtn'
  | 'adminQueue.completeBtn'
  | 'adminQueue.activatedToast'
  | 'adminQueue.deactivatedToast'
  | 'adminQueue.enableBtn'
  | 'adminQueue.callingToast'
  | 'adminQueue.msgSavedToast'
  | 'adminQueue.waitTime'
  | 'adminQueue.cancelBtn'
  | 'adminQueue.configure'
  | 'adminQueue.cancelledToast'
  // ── Restaurant settings ──
  | 'adminSettings.title'
  | 'adminSettings.subtitle'
  | 'adminSettings.identity'
  | 'adminSettings.identityDesc'
  | 'adminSettings.restaurantName'
  | 'adminSettings.restaurantNamePlaceholder'
  | 'adminSettings.logoUrl'
  | 'adminSettings.logoUrlDesc'
  | 'adminSettings.logoPreview'
  | 'adminSettings.defaultLanguage'
  | 'adminSettings.defaultLanguageDesc'
  | 'adminSettings.branch'
  | 'adminSettings.branchDesc'
  | 'adminSettings.branchName'
  | 'adminSettings.branchNamePlaceholder'
  | 'adminSettings.address'
  | 'adminSettings.addressPlaceholder'
  | 'adminSettings.serviceType'
  | 'adminSettings.serviceTable'
  | 'adminSettings.serviceTakeaway'
  | 'adminSettings.serviceKiosk'
  | 'adminSettings.financial'
  | 'adminSettings.financialDesc'
  | 'adminSettings.currency'
  | 'adminSettings.serviceFee'
  | 'adminSettings.serviceFeeHint'
  | 'adminSettings.payments'
  | 'adminSettings.paymentsDesc'
  | 'adminSettings.payCard'
  | 'adminSettings.payPix'
  | 'adminSettings.payMercadoPago'
  | 'adminSettings.payCash'
  | 'adminSettings.paymentOn'
  | 'adminSettings.paymentOff'
  | 'adminSettings.queueSection'
  | 'adminSettings.queueDesc'
  | 'adminSettings.queueEnabledLabel'
  | 'adminSettings.queueDisabledLabel'
  | 'adminSettings.queueMessage'
  | 'adminSettings.queueMessageDesc'
  | 'adminSettings.queueMessagePlaceholder'
  | 'adminSettings.saveSuccess'
  | 'adminSettings.saveError'
  // ── Loyalty ──
  | 'adminLoyalty.title'
  | 'adminLoyalty.subtitle'
  | 'adminLoyalty.customerSingular'
  | 'adminLoyalty.customerPlural'
  | 'adminLoyalty.noCustomers'
  | 'adminLoyalty.noCustomersDesc'
  | 'adminLoyalty.stamps'
  | 'adminLoyalty.totalEarned'
  | 'adminLoyalty.discountsUsed'
  | 'adminLoyalty.noCard'
  // ── Tables ──
  | 'adminTables.title'
  | 'adminTables.tableSingular'
  | 'adminTables.tablePlural'
  | 'adminTables.registered'
  | 'adminTables.registeredPlural'
  | 'adminTables.newTable'
  | 'adminTables.searchPlaceholder'
  | 'adminTables.filterAll'
  | 'adminTables.filterActive'
  | 'adminTables.filterInactive'
  | 'adminTables.filterAllZones'
  | 'adminTables.ofCount'
  | 'adminTables.noTablesFound'
  | 'adminTables.noTablesFoundDesc'
  | 'adminTables.colZone'
  | 'adminTables.colWaiter'
  | 'adminTables.colSeats'
  | 'adminTables.colValidation'
  | 'adminTables.tableActive'
  | 'adminTables.tableInactive'
  | 'adminTables.editTitle'
  | 'adminTables.newTitle'
  | 'adminTables.number'
  | 'adminTables.numberPlaceholder'
  | 'adminTables.capacity'
  | 'adminTables.capacityPlaceholder'
  | 'adminTables.zone'
  | 'adminTables.noZone'
  | 'adminTables.waiter'
  | 'adminTables.noWaiter'
  | 'adminTables.notes'
  | 'adminTables.notesPlaceholder'
  | 'adminTables.isActive'
  | 'adminTables.saveChanges'
  | 'adminTables.createTable'
  | 'adminTables.colZones'
  | 'adminTables.noZones'
  | 'adminTables.noZonesDesc'
  | 'adminTables.newZonePlaceholder'
  | 'adminTables.addZone'
  | 'adminTables.removeZone'
  | 'adminTables.updatedToast'
  | 'adminTables.createdToast'
  | 'adminTables.disabledToast'
  | 'adminTables.enabledToast'
  | 'adminTables.codeRegeneratedToast'
  | 'adminTables.regenerateCode'
  // ── Aggregator ──
  | 'adminAggregator.title'
  | 'adminAggregator.subtitle'
  | 'adminAggregator.noAggregators'
  | 'adminAggregator.noAggregatorsDesc'
  | 'adminAggregator.simulateOrder'
  | 'adminAggregator.activatedToast'
  | 'adminAggregator.deactivatedToast'
  | 'adminAggregator.simulatedToast'
  // ── Orders ──
  | 'adminOrders.title'
  | 'adminOrders.searchPlaceholder'
  | 'adminOrders.filterAll'
  | 'adminOrders.filterInKitchen'
  | 'adminOrders.filterPreparing'
  | 'adminOrders.filterReady'
  | 'adminOrders.filterDelivered'
  | 'adminOrders.filterPaid'
  | 'adminOrders.filterUnpaid'
  | 'adminOrders.noOrders'
  | 'adminOrders.noOrdersDesc'
  | 'adminOrders.colOrder'
  | 'adminOrders.colTable'
  | 'adminOrders.colPayment'
  | 'adminOrders.colOrigin'
  | 'adminOrders.colTime'
  | 'adminOrders.sectionCustomer'
  | 'adminOrders.sectionItems'
  | 'adminOrders.sectionHistory'
  | 'adminOrders.tableLabel'
  | 'adminOrders.itemNote'
  | 'adminOrders.subtotal'
  | 'adminOrders.serviceFee'
  | 'adminOrders.actionSendKitchen'
  | 'adminOrders.actionPreparing'
  | 'adminOrders.actionReady'
  | 'adminOrders.actionDelivered'
  | 'adminOrders.actionClose'
  | 'adminOrders.updatedToast'
  // ── Products ──
  | 'adminProducts.title'
  | 'adminProducts.productSingular'
  | 'adminProducts.productPlural'
  | 'adminProducts.inCatalog'
  | 'adminProducts.newProduct'
  | 'adminProducts.searchPlaceholder'
  | 'adminProducts.noProducts'
  | 'adminProducts.noProductsDesc'
  | 'adminProducts.createFirst'
  | 'adminProducts.colProduct'
  | 'adminProducts.colCategory'
  | 'adminProducts.colPrice'
  | 'adminProducts.colFeatured'
  | 'adminProducts.featured'
  | 'adminProducts.removeFeatured'
  | 'adminProducts.addFeatured'
  | 'adminProducts.editProduct'
  | 'adminProducts.editTitle'
  | 'adminProducts.newTitle'
  | 'adminProducts.name'
  | 'adminProducts.price'
  | 'adminProducts.imageUrl'
  | 'adminProducts.description'
  | 'adminProducts.category'
  | 'adminProducts.kitchenStation'
  | 'adminProducts.stationGeneral'
  | 'adminProducts.stationGrill'
  | 'adminProducts.stationBar'
  | 'adminProducts.stationColdFood'
  | 'adminProducts.stationDesserts'
  | 'adminProducts.stationFried'
  | 'adminProducts.available'
  | 'adminProducts.updatedToast'
  | 'adminProducts.createdToast'
  | 'adminProducts.disabledToast'
  | 'adminProducts.enabledToast'
  | 'adminProducts.removedFeaturedToast'
  | 'adminProducts.addedFeaturedToast'
  // ── Categories ──
  | 'adminCategories.title'
  | 'adminCategories.catSingular'
  | 'adminCategories.catPlural'
  | 'adminCategories.inCatalog'
  | 'adminCategories.newCategory'
  | 'adminCategories.noCategories'
  | 'adminCategories.noCategoriesDesc'
  | 'adminCategories.createFirst'
  | 'adminCategories.colCategory'
  | 'adminCategories.colOrder'
  | 'adminCategories.statusActive'
  | 'adminCategories.statusInactive'
  | 'adminCategories.editTitle'
  | 'adminCategories.newTitle'
  | 'adminCategories.name'
  | 'adminCategories.imageUrl'
  | 'adminCategories.isActive'
  | 'adminCategories.updatedToast'
  | 'adminCategories.createdToast'
  | 'adminCategories.disabledToast'
  | 'adminCategories.enabledToast'
  // ── Image upload ──
  | 'imageUpload.urlPlaceholder'
  | 'imageUpload.uploadButton'
  // ── Kiosks ──
  | 'adminKiosks.title'
  | 'adminKiosks.addKiosk'
  | 'adminKiosks.searchPlaceholder'
  | 'adminKiosks.filterAll'
  | 'adminKiosks.filterOnline'
  | 'adminKiosks.filterOffline'
  | 'adminKiosks.filterMaintenance'
  | 'adminKiosks.tabDevices'
  | 'adminKiosks.tabAttractScreen'
  | 'adminKiosks.tabBranding'
  | 'adminKiosks.tabMedia'
  | 'adminKiosks.tabBehavior'
  | 'adminKiosks.colDevice'
  | 'adminKiosks.colLastActivity'
  | 'adminKiosks.noDevices'
  | 'adminKiosks.noDevicesDesc'
  | 'adminKiosks.colId'
  | 'adminKiosks.colBranch'
  | 'adminKiosks.colRegistered'
  | 'adminKiosks.attractConfig'
  | 'adminKiosks.attractConfigDesc'
  | 'adminKiosks.enableAttractScreen'
  | 'adminKiosks.attractEnabled'
  | 'adminKiosks.attractDisabled'
  | 'adminKiosks.restaurantNameLabel'
  | 'adminKiosks.slogan'
  | 'adminKiosks.sloganDesc'
  | 'adminKiosks.sloganPlaceholder'
  | 'adminKiosks.videoUrl'
  | 'adminKiosks.videoUrlDesc'
  | 'adminKiosks.idleTimeout'
  | 'adminKiosks.idleTimeoutDesc'
  | 'adminKiosks.sliderMin'
  | 'adminKiosks.sliderMax'
  | 'adminKiosks.previewLabel'
  | 'adminKiosks.touchToStart'
  | 'adminKiosks.attractDisabledPreview'
  | 'adminKiosks.attractPreviewNote'
  | 'adminKiosks.sectionSoon'
  | 'adminKiosks.nowAgo'
  | 'adminKiosks.minAgo'
  | 'adminKiosks.hourAgo'
  | 'adminKiosks.dayAgo'
  | 'adminKiosks.viewDetails'
  | 'adminKiosks.reloadConfig'
  | 'adminKiosks.removeDevice'
  | 'adminKiosks.editBtn'
  | 'adminKiosks.reloadBtn'
  | 'adminKiosks.previewBtn'
  | 'adminKiosks.removeBtn'
  | 'cashier.title'
  | 'cashier.live'
  | 'cashier.hub'
  | 'cashier.tab.orders'
  | 'cashier.tab.history'
  | 'cashier.tab.receipts'
  | 'cashier.tab.invoices'
  | 'cashier.metric.received'
  | 'cashier.metric.paid'
  | 'cashier.metric.pending'
  | 'cashier.metric.tables'
  | 'cashier.filter.all'
  | 'cashier.filter.pending'
  | 'cashier.filter.partial'
  | 'cashier.filter.paid'
  | 'cashier.filter.search'
  | 'cashier.collapse'
  | 'cashier.expand'
  | 'cashier.pay.totalDue'
  | 'cashier.pay.alreadyPaid'
  | 'cashier.pay.amountDue'
  | 'cashier.pay.chargeMode'
  | 'cashier.pay.remaining'
  | 'cashier.pay.partial'
  | 'cashier.pay.method'
  | 'cashier.pay.receive'
  | 'cashier.pay.processing'
  | 'cashier.pay.cancel'
  | 'cashier.pay.done'
  | 'cashier.pay.change'
  | 'cashier.pay.print'
  | 'cashier.pay.close'
  | 'cashier.pay.cashGiven'
  | 'cashier.pay.remainingAfter'
  | 'cashier.method.cash'
  | 'cashier.method.card'
  | 'cashier.method.pix'
  | 'cashier.method.terminal'
  | 'cashier.receipt.title'
  | 'cashier.receipt.subtotal'
  | 'cashier.receipt.fee'
  | 'cashier.receipt.total'
  | 'cashier.receipt.method'
  | 'cashier.receipt.print'
  | 'cashier.receipt.close'
  | 'cashier.customer.subtotal'
  | 'cashier.customer.fee'
  | 'cashier.customer.total'
  | 'cashier.customer.paid'
  | 'cashier.customer.due'
  | 'cashier.customer.receive'
  | 'cashier.customer.partial'
  | 'cashier.table.due'
  | 'cashier.table.receive'
  | 'cashier.table.total'
  | 'cashier.table.paid'
  | 'cashier.table.remaining'
  | 'cashier.table.partialBtn'
  | 'cashier.table.allPaid'
  | 'cashier.empty.tables'
  | 'cashier.empty.tablesDesc'
  | 'cashier.empty.history'
  | 'cashier.empty.receipts'
  | 'cashier.empty.invoices'
  | 'cashier.empty.pendingTables'
  | 'cashier.col.order'
  | 'cashier.col.customer'
  | 'cashier.col.table'
  | 'cashier.col.total'
  | 'cashier.col.paid'
  | 'cashier.col.method'
  | 'cashier.col.status'
  | 'cashier.col.actions'
  | 'cashier.col.number'
  | 'cashier.col.date'
  | 'cashier.status.paid'
  | 'cashier.status.partial'
  | 'cashier.status.pending'
  | 'cashier.kiosk.alerts'
  | 'cashier.kiosk.resolve'
  | 'cashier.kiosk.needsHelp'
  | 'cashier.kiosk.printFailed'
  | 'cashier.kiosk.totemN'
  | 'cashier.kiosk.noAlerts'
  | 'queue.nowCalling'
  | 'queue.pickupAtCounter'
  | 'queue.ticketLabel'
  | 'queue.preparingTitle'
  | 'queue.preparingSub'
  | 'queue.allReady'
  | 'queue.noActiveTitle'
  | 'queue.noActiveSub'
  | 'queue.headerTitle'
  | 'queue.readyColumn'
  | 'queue.preparingColumn'
  | 'queue.pageOf'
  | 'queue.refreshNote'
  | 'queue.checkPrintedTicket'
  | 'queue.restaurantFallback'
  | 'kitchen.title'
  | 'kitchen.priority.urgent'
  | 'kitchen.priority.vip'
  | 'kitchen.action.start'
  | 'kitchen.action.ready'
  | 'kitchen.action.deliver'
  | 'kitchen.col.new'
  | 'kitchen.col.preparing'
  | 'kitchen.col.ready'
  | 'kitchen.empty.new'
  | 'kitchen.empty.preparing'
  | 'kitchen.empty.ready'
  | 'kitchen.empty.generic'
  | 'kitchen.notify.preparing'
  | 'kitchen.notify.ready'
  | 'kitchen.notify.delivered'
  | 'kitchen.notify.statusUpdated'
  | 'kitchen.filter.all'
  | 'kitchen.meta.table'
  | 'kitchen.meta.delivery'
  | 'kitchen.meta.counter'
  | 'kitchen.stat.delivered'
  | 'kitchen.stat.avgTime'
  | 'kitchen.stat.longestWait'
  | 'kitchen.live'
  | 'kitchen.tooltip.hub'
  | 'kitchen.tooltip.mute'
  | 'kitchen.tooltip.unmute'
  | 'kitchen.tooltip.fullscreen'
  | 'kitchen.tooltip.exitFullscreen'
  | 'reports.title'
  | 'reports.role'
  | 'reports.section.dashboard'
  | 'reports.section.fechamento'
  | 'reports.section.vendas'
  | 'reports.section.pagamentos'
  | 'reports.section.produtos'
  | 'reports.section.mesas'
  | 'reports.section.garcons'
  | 'reports.section.cozinha'
  | 'reports.section.ocupacao'
  | 'reports.section.reservas'
  | 'reports.section.exportacoes'
  | 'reports.navGroup.overview'
  | 'reports.navGroup.financial'
  | 'reports.navGroup.performance'
  | 'reports.nav.ocupacao'
  | 'reports.method.cash'
  | 'reports.method.card'
  | 'reports.method.pix'
  | 'reports.method.terminal'
  | 'reports.method.other'
  | 'reports.today'
  | 'reports.yesterday'
  | 'reports.refresh'
  | 'reports.csv'
  | 'reports.exportCsv'
  | 'reports.csvExported'
  | 'reports.admin'
  | 'reports.kpi.revenue'
  | 'reports.kpi.totalOrders'
  | 'reports.kpi.paidOrders'
  | 'reports.kpi.avgTicket'
  | 'reports.kpi.serviceFee'
  | 'reports.kpi.canceled'
  | 'reports.noData.title'
  | 'reports.noData.desc'
  | 'reports.notFound.title'
  | 'reports.notFound.desc'
  | 'reports.empty.byHour'
  | 'reports.empty.payments'
  | 'reports.empty.products'
  | 'reports.empty.tables'
  | 'reports.empty.waiters'
  | 'reports.ordersN'
  | 'reports.ordersAbbrN'
  | 'reports.unitsN'
  | 'reports.peakHour'
  | 'reports.topRevenueHour'
  | 'reports.ordersInDay'
  | 'reports.paid'
  | 'reports.sortRevenue'
  | 'reports.sortQty'
  | 'reports.tableN'
  | 'reports.details'
  | 'reports.waiter.name'
  | 'reports.waiter.orders'
  | 'reports.waiter.tables'
  | 'reports.waiter.grossSales'
  | 'reports.insights.title'
  | 'reports.insights.quietHour'
  | 'reports.promoOpportunity'
  | 'reports.insights.topTable'
  | 'reports.insights.topProduct'
  | 'reports.insights.bestWaiter'
  | 'reports.insights.payRate'
  | 'reports.insights.payRateSub'
  | 'reports.insights.grossSalesSub'
  | 'reports.card.ordersByHour'
  | 'reports.card.hoursActive'
  | 'reports.card.paymentMethods'
  | 'reports.card.byRevenue'
  | 'reports.card.topItems'
  | 'reports.card.tablesActive'
  | 'reports.card.waiterPerf'
  | 'reports.card.byRevenueGenerated'
  | 'reports.card.financialSummary'
  | 'reports.fin.totalRevenue'
  | 'reports.dateByRevenue'
  | 'reports.dateTopItems'
  | 'reports.dateTablesActive'
  | 'reports.dateWaiterRanked'
  | 'reports.dateHoursActive'
  | 'reports.exports.subtitle'
  | 'reports.exports.closingReport'
  | 'reports.exports.closingDesc'
  | 'reports.ph.vendasTitle'
  | 'reports.ph.vendasDesc'
  | 'reports.ph.cozinhaTitle'
  | 'reports.ph.cozinhaDesc'
  | 'reports.ph.reservasTitle'
  | 'reports.ph.reservasDesc'
  | 'res.title'
  | 'res.today'
  | 'res.noTable'
  | 'res.guestsN'
  | 'res.tableN'
  | 'res.seatsN'
  | 'res.conflict'
  | 'res.free'
  | 'res.available'
  | 'res.reserve'
  | 'res.back'
  | 'res.view'
  | 'res.hub'
  | 'res.confirm'
  | 'res.minN'
  | 'res.hoursN'
  | 'res.timeNow'
  | 'res.status.pending'
  | 'res.status.confirmed'
  | 'res.status.seated'
  | 'res.status.completed'
  | 'res.status.canceled'
  | 'res.status.noShow'
  | 'res.tag.birthday'
  | 'res.tag.vip'
  | 'res.tag.allergy'
  | 'res.tag.anniversary'
  | 'res.tag.late'
  | 'res.source.phone'
  | 'res.source.walkIn'
  | 'res.source.online'
  | 'res.urgency.overdue'
  | 'res.urgency.now'
  | 'res.urgency.inMin'
  | 'res.urgency.vip'
  | 'res.metrics.total'
  | 'res.metrics.confirmed'
  | 'res.metrics.pending'
  | 'res.metrics.seated'
  | 'res.metrics.canceled'
  | 'res.metrics.noShow'
  | 'res.action.confirm'
  | 'res.action.seat'
  | 'res.action.complete'
  | 'res.action.seatDirect'
  | 'res.action.editReservation'
  | 'res.action.noShow'
  | 'res.action.cancelReservation'
  | 'res.action.reopenPending'
  | 'res.action.viewDetails'
  | 'res.action.edit'
  | 'res.action.cancel'
  | 'res.action.reopen'
  | 'res.empty.title'
  | 'res.empty.desc'
  | 'res.emptyTable.title'
  | 'res.reservationsCountN'
  | 'res.col.dateTime'
  | 'res.col.customer'
  | 'res.col.phone'
  | 'res.col.guests'
  | 'res.col.table'
  | 'res.col.status'
  | 'res.col.channel'
  | 'res.col.notes'
  | 'res.walkin.queue'
  | 'res.walkin.add'
  | 'res.walkin.emptyTitle'
  | 'res.walkin.emptyDesc'
  | 'res.walkin.waitingSince'
  | 'res.walkin.since'
  | 'res.walkin.estWait'
  | 'res.walkin.seat'
  | 'res.walkin.remove'
  | 'res.walkin.historyToday'
  | 'res.walkin.seated'
  | 'res.walkin.removed'
  | 'res.walkin.nameOrGroup'
  | 'res.walkin.nameOrGroupPlaceholder'
  | 'res.walkin.estWaitMin'
  | 'res.settings.title'
  | 'res.settings.hours'
  | 'res.settings.opening'
  | 'res.settings.closing'
  | 'res.settings.params'
  | 'res.settings.defaultDuration'
  | 'res.settings.defaultDurationHint'
  | 'res.settings.lateTolerance'
  | 'res.settings.lateToleranceHint'
  | 'res.settings.slotInterval'
  | 'res.settings.slotIntervalHint'
  | 'res.settings.maxParty'
  | 'res.settings.save'
  | 'res.settings.saved'
  | 'res.modal.customerData'
  | 'res.modal.name'
  | 'res.modal.namePlaceholder'
  | 'res.modal.phone'
  | 'res.modal.guests'
  | 'res.modal.details'
  | 'res.modal.date'
  | 'res.modal.time'
  | 'res.modal.duration'
  | 'res.modal.source'
  | 'res.modal.tableOptional'
  | 'res.modal.noTableOption'
  | 'res.modal.notesTags'
  | 'res.modal.notes'
  | 'res.modal.notesPlaceholder'
  | 'res.modal.tags'
  | 'res.modal.saveReservation'
  | 'res.modal.cancel'
  | 'res.modal.close'
  | 'res.occ.allTables'
  | 'res.occ.week'
  | 'res.occ.day'
  | 'res.occ.month'
  | 'res.occ.viewDayDetails'
  | 'res.occ.noSlots'
  | 'res.occ.occupiedShort'
  | 'res.occ.freeShortN'
  | 'res.occ.freeLower'
  | 'res.occ.maxOccTitle'
  | 'res.occ.occupied'
  | 'res.occ.free2'
  | 'res.occ.occ'
  | 'res.occ.noActiveTables'
  | 'res.occ.available'
  | 'res.occ.cancelConfirm'
  | 'res.occ.capacityUndefined'
  | 'res.newReservationTable'
  | 'res.notif.canceled'
  | 'res.notif.created'
  | 'res.notif.createdShort'
  | 'res.notif.updated'
  | 'res.notif.status'
  | 'res.notif.customerSeated'
  | 'res.notif.removedFromQueue'
  | 'res.notif.addedToQueue'
  | 'res.notif.settingsSaved'
  | 'res.tab.queue'
  | 'res.tab.occupancy'
  | 'res.tab.settings'
  | 'res.view.agenda'
  | 'res.view.table'
  | 'res.view.byTable'
  | 'res.scope.date'
  | 'res.scope.all'
  | 'res.topbar.occupancy'
  | 'res.topbar.settings'
  | 'res.newReservation'
  | 'res.searchPlaceholder'
  | 'res.allStatuses'
  | 'res.openMenu'
  | 'res.closeMenu'
  | 'hub.loggedAs'
  | 'hub.chooseArea'
  | 'hub.logout'
  | 'hub.resetConfirm'
  | 'hub.resetBtn'
  | 'hub.printCard'
  | 'hub.cardPreviewTitle'
  | 'hub.printTableQr'
  | 'hub.tableQrTitle'
  | 'hub.sectionCustomer'
  | 'hub.sectionOps'
  | 'hub.sectionNew'
  | 'hub.area.menu.title'
  | 'hub.area.menu.desc'
  | 'hub.area.kiosk.title'
  | 'hub.area.kiosk.desc'
  | 'hub.area.queue.title'
  | 'hub.area.queue.desc'
  | 'hub.area.kitchen.title'
  | 'hub.area.kitchen.desc'
  | 'hub.area.waiter.title'
  | 'hub.area.waiter.desc'
  | 'hub.area.cashier.title'
  | 'hub.area.cashier.desc'
  | 'hub.area.admin.title'
  | 'hub.area.admin.desc'
  | 'hub.area.delivery.title'
  | 'hub.area.delivery.desc'
  | 'hub.area.reservations.title'
  | 'hub.area.reservations.desc'
  | 'hub.area.reports.title'
  | 'hub.area.reports.desc'
  | 'hub.area.login.title'
  | 'hub.area.login.desc'
  | 'login.greeting'
  | 'login.loggedAs'
  | 'login.goToArea'
  | 'login.switchUser'
  | 'login.hub'
  | 'login.title'
  | 'login.subtitle'
  | 'login.submit'
  | 'login.continueDemo'
  | 'login.role.owner'
  | 'login.role.manager'
  | 'login.role.cashier'
  | 'login.role.waiter'
  | 'login.role.kitchen'
  | 'login.role.support'
  | 'login.emailLabel'
  | 'login.emailPlaceholder'
  | 'login.passwordLabel'
  | 'login.error.invalidCredentials'
  | 'login.error.generic';

type LabelMap = Record<LabelKey, string>;

const ptBR: LabelMap = {
  'nav.menu': 'Cardápio',
  'nav.waiter': 'Garçom',
  'nav.language': 'Idioma',
  'nav.order': 'Pedir',
  'lang.es': 'Español',
  'lang.pt': 'Português',
  'lang.en': 'English',
  'lang.selector': 'Idioma',
  'nav.cashback': 'Cashback',
  'nav.bill': 'Conta',
  'menu.searchPlaceholder': 'Buscar produto',
  'menu.allCategories': 'Tudo',
  'menu.featured': 'Destaques',
  'menu.empty': 'Sem resultados',
  'menu.emptyDesc': 'Tente outra busca ou categoria.',
  'menu.results': 'Resultados',
  'menu.greeting': 'Olá',
  'menu.addedToCart': 'Adicionado ao carrinho',
  'menu.viewCart': 'Ver carrinho',
  'menu.loadError': 'Não foi possível carregar o cardápio.',
  'menu.retry': 'Tentar novamente',
  'menu.categoryEmpty': 'Nenhum produto disponível.',
  'product.quantity': 'Quantidade',
  'product.notes': 'Observação',
  'product.notesPlaceholder': 'Ex: Tirar item "X"',
  'product.add': 'Adicionar',
  'product.required': 'obrigatório',
  'product.upTo': 'até {max}',
  'product.selectRequired': 'Selecione as opções obrigatórias.',
  'product.from': 'A partir de',
  'cart.title': 'Carrinho',
  'cart.continue': 'Seguir',
  'cart.empty': 'Seu carrinho está vazio',
  'cart.emptyDesc': 'Volte ao menu e escolha seus pratos preferidos.',
  'cart.viewMenu': 'Ver menu',
  'cart.phone': 'Telefone',
  'cart.name': 'Nome',
  'cart.namePlaceholder': 'Seu nome',
  'cart.changeName': 'Alterar',
  'cart.addMore': 'Adicionar mais itens',
  'cart.placeOrder': 'Fazer pedido',
  'cart.placingOrder': 'Enviando...',
  'cart.namePromptTitle': 'Antes de continuar',
  'cart.namePromptDesc': 'Informe seu nome para identificar seu pedido na mesa.',
  'cart.confirmName': 'Continuar',
  'cart.items': 'Seus itens',
  'cart.increase': 'Aumentar',
  'cart.decrease': 'Diminuir',
  'cart.removeItem': 'Remover',
  'cart.each': 'cada',
  'summary.subtotal': 'Subtotal',
  'summary.serviceFee': 'Taxa de serviço',
  'summary.total': 'Total',
  'bill.title': 'Conta',
  'bill.tabTable': 'Mesa',
  'bill.tabIndividual': 'Individual',
  'bill.closeTable': 'Fechar a conta da mesa',
  'bill.closeMine': 'Fechar minha conta',
  'bill.empty': 'Você ainda não tem pedidos nesta mesa.',
  'bill.requestSent': 'Pedido de fechamento enviado ao garçom.',
  'bill.you': 'Você',
  'waiter.title': 'Garçom',
  'waiter.help': 'Necessita ajuda?',
  'waiter.helpDesc': 'Toque numa das opções abaixo e um garçom irá até a sua mesa.',
  'waiter.formTitle': 'Solicitar ajuda do garçom',
  'waiter.formDesc': 'Preencha seus dados para facilitar o atendimento.',
  'waiter.phone': 'Telefone',
  'waiter.name': 'Nome',
  'waiter.namePlaceholder': 'Seu nome',
  'waiter.phonePlaceholder': '(00) 0000-0000',
  'waiter.cancel': 'Cancelar',
  'waiter.send': 'Continuar',
  'waiter.sent': 'Solicitação enviada. Um garçom irá até a sua mesa.',
  'waiter.action.call': 'Chamar garçom',
  'waiter.action.bill': 'Pedir a conta',
  'waiter.action.order': 'Meus pedidos',
  'waiter.action.other': 'Outro motivo',
  'waiter.status.pending': 'Aguardando',
  'waiter.status.acknowledged': 'Reconhecido',
  'waiter.status.resolved': 'Resolvido',
  'waiter.status.canceled': 'Cancelado',
  'waiter.activeTitle': 'Solicitação em curso',
  'waiter.historyTitle': 'Histórico',
  'waiter.cancelRequest': 'Cancelar solicitação',
  'waiter.resolveRequest': 'Marcar como resolvida',
  'waiter.dupeActive': 'Você já tem uma solicitação ativa. Aguarde o atendimento.',
  'waiter.tableUnknown': 'Mesa não identificada.',
  'waiter.billError': 'Não foi possível solicitar a conta. Tente novamente.',
  'waiter.requestCanceled': 'Solicitação cancelada.',
  'waiter.requestResolved': 'Solicitação marcada como resolvida.',
  'rating.title': 'Avaliar',
  'rating.question': 'Como foi sua experiência?',
  'rating.tapStars': 'Toque nas estrelas para avaliar.',
  'rating.commentPlaceholder': 'Deixe um comentário (opcional)',
  'rating.send': 'Enviar avaliação',
  'rating.thanks': 'Obrigado pela sua avaliação!',
  'rating.thanksDesc': 'Sua opinião nos ajuda a melhorar.',
  'rating.starLabel': '{n} estrelas',
  'rating.score1': 'Ruim',
  'rating.score2': 'Regular',
  'rating.score3': 'Bom',
  'rating.score4': 'Muito bom',
  'rating.score5': 'Excelente',
  'account.title': 'Minha conta',
  'account.loyaltyTitle': 'Cartão Fidelidade',
  'account.stamps': '{current}/{total} selos',
  'account.rewardEarned': '🎉 Parabéns! Você ganhou um desconto!',
  'account.stampsLeft': 'Faltam {n} selos para seu próximo desconto.',
  'account.ordersTitle': 'Histórico de pedidos',
  'account.noOrders': 'Nenhum pedido ainda.',
  'account.items': '{n} item(ns)',
  'account.actionsTitle': 'Ações',
  'account.closeBill': 'Fechar conta',
  'account.myCashback': 'Meu cashback',
  'account.status.pending': 'Enviado',
  'account.status.preparing': 'Em preparo',
  'account.status.delivered': 'Entregue',
  'account.status.closed': 'Fechado',
  'cashback.title': 'Cashback',
  'cashback.balance': 'Saldo disponível',
  'cashback.note': 'Você ganha {rate}% de volta em cada pedido.',
  'cashback.history': 'Histórico',
  'cashback.signup': 'Cadastrar para receber cashback',
  'cashback.empty': 'Você ainda não tem cashback. Faça um pedido para começar!',
  'cashback.signupToast': 'Em breve você poderá se cadastrar para receber cashback.',
  'common.back': 'Voltar',
  'common.close': 'Fechar',
  'common.loading': 'Carregando...',
  'common.required': 'Obrigatório',
  'common.optional': 'Opcional',
  'confirmation.title': 'Pedido confirmado!',
  'confirmation.subtitle': 'Seu pedido foi enviado para a cozinha.',
  'confirmation.orderNumber': 'Número do pedido',
  'confirmation.customer': 'Nome',
  'confirmation.table': 'Mesa',
  'confirmation.items': 'Itens',
  'confirmation.note': 'Acompanhe o status pelo painel ou aguarde ser chamado.',
  'confirmation.backToMenu': 'Voltar ao menu',
  'confirmation.rate': 'Avaliar experiência',
  'confirmation.print': 'Imprimir comprovante',
  'kiosk.welcome.title': 'Bem-vindo!',
  'kiosk.welcome.subtitle': 'Como você deseja pedir?',
  'kiosk.welcome.eatIn': 'Comer aqui',
  'kiosk.welcome.takeaway': 'Para levar',
  'kiosk.steps.menu': 'Cardápio',
  'kiosk.steps.review': 'Revisão',
  'kiosk.steps.payment': 'Pagamento',
  'kiosk.steps.done': 'Confirmação',
  'kiosk.menu.all': 'Todos',
  'kiosk.menu.emptyCategory': 'Nenhum produto nesta categoria',
  'kiosk.order.label': 'Meu pedido',
  'kiosk.order.item': 'item',
  'kiosk.order.items': 'itens',
  'kiosk.order.tax': 'Taxa',
  'kiosk.order.emptyTitle': 'Seu carrinho está vazio',
  'kiosk.order.emptyHint': 'Adicione itens ao carrinho para continuar',
  'kiosk.order.review': 'Revisar pedido',
  'kiosk.cart.title': 'Revisão do pedido',
  'kiosk.cart.reviewSubtitle': 'Confirme os itens antes de pagar',
  'kiosk.cart.empty': 'Carrinho vazio',
  'kiosk.cart.remove': 'Remover',
  'kiosk.cart.addMore': 'Adicionar mais',
  'kiosk.cart.confirmPay': 'Confirmar e pagar',
  'kiosk.cart.serviceFee': 'Taxa de serviço',
  'kiosk.payment.title': 'Pagamento',
  'kiosk.payment.totalLabel': 'Total a pagar',
  'kiosk.payment.how': 'Como deseja pagar?',
  'kiosk.payment.card': 'Cartão',
  'kiosk.payment.cardDesc': 'Débito ou crédito',
  'kiosk.payment.pix': 'PIX',
  'kiosk.payment.pixDesc': 'Escaneie o QR Code',
  'kiosk.payment.cash': 'Dinheiro',
  'kiosk.payment.cashDesc': 'Pague no caixa',
  'kiosk.payment.mercadoPago': 'Mercado Pago',
  'kiosk.payment.mercadoPagoDesc': 'Escaneie o QR Code',
  'kiosk.payment.cardInstrTitle': 'Use a maquininha',
  'kiosk.payment.cardInstrDesc': 'Insira, aproxime ou passe seu cartão na maquininha ao lado.',
  'kiosk.payment.qrTitle': 'Escaneie para pagar',
  'kiosk.payment.qrDesc': 'Abra o app e escaneie o QR Code abaixo.',
  'kiosk.payment.waiting': 'Aguardando confirmação do pagamento…',
  'kiosk.payment.cashTitle': 'Pague no caixa',
  'kiosk.payment.cashSubtitle': 'Apresente este ticket no caixa para finalizar o pagamento',
  'kiosk.payment.cashInstr': 'Seu pedido foi registrado. Dirija-se ao caixa com o número abaixo.',
  'kiosk.payment.orderLabel': 'Pedido',
  'kiosk.payment.itemsLabel': 'Itens',
  'kiosk.payment.confirm': 'Confirmar pagamento',
  'kiosk.payment.processing': 'Processando pagamento…',
  'kiosk.payment.approved': 'Pagamento aprovado!',
  'kiosk.payment.rejected': 'Pagamento recusado',
  'kiosk.payment.rejectedDesc': 'Por favor, tente outro método de pagamento.',
  'kiosk.payment.retry': 'Tentar novamente',
  'kiosk.confirm.title': 'Pedido confirmado!',
  'kiosk.confirm.subtitle': 'Guarde o número abaixo e aguarde ser chamado',
  'kiosk.confirm.ticketLabel': 'Sua senha',
  'kiosk.confirm.hint': 'Acompanhe pelo painel de fila ou aguarde ser chamado pelo número acima',
  'kiosk.confirm.restarting': 'Reiniciando em {s}s…',
  'kiosk.confirm.newOrder': 'Novo pedido',
  'kiosk.confirm.print': 'Imprimir comprovante',
  'kiosk.confirm.orderLabel': 'Comprovante',
  'kiosk.confirm.photoHint': 'Tire uma foto ou mostre este número ao caixa.',
  'kiosk.confirm.printOk': 'Ticket impresso ✓',
  'kiosk.confirm.printing': 'Imprimindo…',
  'kiosk.confirm.reprintBtn': 'Imprimir novamente',
  'kiosk.confirm.helpBtn': 'Pedir assistência',
  'kiosk.confirm.helpSent': 'Assistência a caminho!',
  'kiosk.confirm.qrHint': 'Escaneie para ver seu pedido no celular',
  'kiosk.confirm.queueLabel': 'Senha',
  'kiosk.menu.categories': 'Categorias',
  'kiosk.menu.added': 'Adicionado',
  'kiosk.menu.featured': 'Mais pedidos',
  'kiosk.menu.featuredSub': 'os favoritos da casa',
  'kiosk.menu.bestseller': 'Mais vendido',
  'kiosk.menu.upsellHint': 'Que tal acompanhar com',
  'kiosk.idle.title': 'Você ainda está aí?',
  'kiosk.idle.subtitle': 'Sua sessão será reiniciada em {s}s',
  'kiosk.idle.continue': 'Sim, continuar',
  'kiosk.idle.restart': 'Começar de novo',
  'kiosk.attract.cta': 'Toque para começar',
  'receipt.notFound': 'Pedido não encontrado.',
  'receipt.autoUpdate': 'Atualiza automaticamente',
  'receipt.order': 'Pedido',
  'receipt.status.draft': 'Rascunho',
  'receipt.status.created': 'Recebido',
  'receipt.status.sentToKitchen': 'Na cozinha',
  'receipt.status.preparing': 'Preparando',
  'receipt.status.ready': 'Pronto',
  'receipt.status.delivered': 'Entregue',
  'receipt.status.closed': 'Fechado',
  'receipt.status.canceled': 'Cancelado',
  'receipt.payment.unpaid': 'Pendente',
  'receipt.payment.partiallyPaid': 'Pago parcial',
  'receipt.payment.paid': 'Pago',
  'receipt.payment.refunded': 'Reembolsado',
  'receipt.payment.canceled': 'Cancelado',
  'admin.nav.group.operation': 'Operação',
  'admin.nav.group.catalog': 'Catálogo',
  'admin.nav.group.establishment': 'Estabelecimento',
  'admin.nav.group.growth': 'Crescimento',
  'admin.nav.group.analytics': 'Análise',
  'admin.nav.group.settings': 'Configurações',
  'admin.nav.dashboard': 'Dashboard',
  'admin.nav.orders': 'Pedidos',
  'admin.nav.queue': 'Fila',
  'admin.nav.products': 'Produtos',
  'admin.nav.categories': 'Categorias',
  'admin.nav.tables': 'Mesas',
  'admin.nav.zones': 'Zonas / Áreas',
  'admin.nav.branches': 'Filiais',
  'admin.nav.kiosks': 'Kiosks',
  'admin.nav.loyalty': 'Fidelidade',
  'admin.nav.aggregator': 'Agregadores',
  'admin.nav.reports': 'Relatórios',
  'admin.nav.settings': 'Configurações',
  'admin.status.operating': 'Operando',
  'admin.role': 'Administração',
  'admin.backToHub': 'Hub',
  'common.cancel': 'Cancelar',
  'common.save': 'Salvar',
  'common.edit': 'Editar',
  'common.create': 'Criar',
  'common.enable': 'Ativar',
  'common.disable': 'Desativar',
  'common.all': 'Todos',
  'common.active': 'Ativo',
  'common.inactive': 'Inativo',
  'common.clearFilters': 'Limpar filtros',
  'common.customer': 'Cliente',
  'common.order': 'Pedido',
  'common.now': 'agora',
  'common.updated': 'Atualizado',
  'status.draft': 'Rascunho',
  'status.created': 'Criado',
  'status.inKitchen': 'Na cozinha',
  'status.preparing': 'Preparando',
  'status.ready': 'Pronto',
  'status.delivered': 'Entregue',
  'status.closed': 'Encerrado',
  'status.canceled': 'Cancelado',
  'status.online': 'Online',
  'status.offline': 'Offline',
  'status.maintenance': 'Manutenção',
  'dash.subtitle': 'Visão geral da operação em tempo real',
  'dash.ordersToday': 'Pedidos hoje',
  'dash.revenueToday': 'Receita hoje',
  'dash.avgTicket': 'Ticket médio',
  'dash.inKitchen': 'Na cozinha',
  'dash.avgPrepTime': 'Tempo médio preparo',
  'dash.ordersPerHour': 'Pedidos por hora',
  'dash.today': 'Hoje',
  'dash.orderSingular': 'pedido',
  'dash.orderPlural': 'pedidos',
  'dash.activity': 'Atividade',
  'dash.live': 'ao vivo',
  'dash.noOrders': 'Nenhum pedido ainda',
  'dash.noOrdersDesc': 'Os pedidos aparecerão aqui em tempo real.',
  'dash.bestSellers': 'Produtos mais vendidos',
  'dash.minAgo': 'min',
  'dash.tableLabel': 'Mesa',
  'adminQueue.title': 'Fila de espera',
  'adminQueue.subtitle': 'Gestão da fila de atendimento presencial',
  'adminQueue.enabled': 'Fila ativa',
  'adminQueue.disabled': 'Fila inativa',
  'adminQueue.settings': 'Configurações da fila',
  'adminQueue.enabledDesc': 'Fila habilitada — visível no Menu Digital',
  'adminQueue.disabledDesc': 'Fila desabilitada',
  'adminQueue.messageLabel': 'Mensagem exibida aos clientes',
  'adminQueue.messagePlaceholder': 'ex: Acompanhe seu pedido aqui!',
  'adminQueue.waiting': 'Aguardando',
  'adminQueue.serving': 'Sendo atendido',
  'adminQueue.completed': 'Concluídos',
  'adminQueue.callNextBtn': 'Chamar próxima',
  'adminQueue.openTickets': 'Senhas em aberto',
  'adminQueue.noOpenTickets': 'Nenhuma senha em aberto',
  'adminQueue.empty': 'A fila está vazia no momento.',
  'adminQueue.ticket': 'Senha',
  'adminQueue.orderLabel': 'Pedido',
  'adminQueue.callBtn': 'Chamar',
  'adminQueue.attendBtn': 'Atender',
  'adminQueue.completeBtn': 'Concluir',
  'adminQueue.activatedToast': 'Fila ativada — visível no Menu Digital',
  'adminQueue.deactivatedToast': 'Fila desativada',
  'adminQueue.enableBtn': 'Habilitar fila',
  'adminQueue.callingToast': 'Chamando senha #{ticket} — {name}',
  'adminQueue.msgSavedToast': 'Mensagem da fila atualizada',
  'adminQueue.waitTime': 'Espera',
  'adminQueue.cancelBtn': 'Cancelar',
  'adminQueue.configure': 'Configurar',
  'adminQueue.cancelledToast': 'Senha cancelada',
  'adminSettings.title': 'Configurações',
  'adminSettings.subtitle': 'Identidade, filial, operação e integração',
  'adminSettings.identity': 'Identidade do restaurante',
  'adminSettings.identityDesc': 'Nome e logo exibidos no Menu Digital e no Kiosk.',
  'adminSettings.restaurantName': 'Nome do restaurante',
  'adminSettings.restaurantNamePlaceholder': 'Nome do estabelecimento',
  'adminSettings.logoUrl': 'URL do logotipo',
  'adminSettings.logoUrlDesc': 'Cole a URL pública da imagem (PNG, SVG ou JPG).',
  'adminSettings.logoPreview': 'Preview do logo',
  'adminSettings.defaultLanguage': 'Idioma padrão',
  'adminSettings.defaultLanguageDesc': 'Idioma inicial para o Menu Digital e Kiosk deste tenant.',
  'adminSettings.branch': 'Filial / Unidade',
  'adminSettings.branchDesc': 'Informações da unidade física e tipo de operação.',
  'adminSettings.branchName': 'Nome da filial',
  'adminSettings.branchNamePlaceholder': 'Nome da unidade',
  'adminSettings.address': 'Endereço',
  'adminSettings.addressPlaceholder': 'Rua, número, cidade...',
  'adminSettings.serviceType': 'Tipo de serviço',
  'adminSettings.serviceTable': 'Serviço de mesa',
  'adminSettings.serviceTakeaway': 'Takeaway',
  'adminSettings.serviceKiosk': 'Kiosk / Autoatendimento',
  'adminSettings.financial': 'Financeiro',
  'adminSettings.financialDesc': 'Moeda e taxa de serviço aplicadas aos pedidos.',
  'adminSettings.currency': 'Moeda',
  'adminSettings.serviceFee': 'Taxa de serviço',
  'adminSettings.serviceFeeHint': 'Ex: 0.1 = 10%',
  'adminSettings.payments': 'Formas de pagamento',
  'adminSettings.paymentsDesc': 'Escolha quais formas de pagamento o totem oferece ao cliente.',
  'adminSettings.payCard': 'Cartão',
  'adminSettings.payPix': 'PIX',
  'adminSettings.payMercadoPago': 'Mercado Pago',
  'adminSettings.payCash': 'Dinheiro',
  'adminSettings.paymentOn': 'Habilitado',
  'adminSettings.paymentOff': 'Desabilitado',
  'adminSettings.queueSection': 'Fila de espera',
  'adminSettings.queueDesc': 'Configuração da fila visível no Menu Digital.',
  'adminSettings.queueEnabledLabel': 'Fila habilitada',
  'adminSettings.queueDisabledLabel': 'Fila desabilitada',
  'adminSettings.queueMessage': 'Mensagem da fila',
  'adminSettings.queueMessageDesc': 'Exibida aos clientes na tela de fila do Menu Digital.',
  'adminSettings.queueMessagePlaceholder': 'ex: Acompanhe seu pedido aqui!',
  'adminSettings.saveSuccess': 'Configurações salvas com sucesso',
  'adminSettings.saveError': 'Erro ao salvar — tente novamente',
  'adminLoyalty.title': 'Fidelidade',
  'adminLoyalty.subtitle': 'Cartões de fidelidade dos clientes',
  'adminLoyalty.customerSingular': 'cliente',
  'adminLoyalty.customerPlural': 'clientes',
  'adminLoyalty.noCustomers': 'Nenhum cliente cadastrado',
  'adminLoyalty.noCustomersDesc': 'Os clientes que usarem o programa de fidelidade aparecerão aqui.',
  'adminLoyalty.stamps': 'Selos',
  'adminLoyalty.totalEarned': 'Total ganho',
  'adminLoyalty.discountsUsed': 'Descontos usados',
  'adminLoyalty.noCard': 'Nenhum cartão encontrado',
  'adminTables.title': 'Mesas',
  'adminTables.tableSingular': 'mesa',
  'adminTables.tablePlural': 'mesas',
  'adminTables.registered': 'cadastrada',
  'adminTables.registeredPlural': 'cadastradas',
  'adminTables.newTable': 'Nova mesa',
  'adminTables.searchPlaceholder': 'Buscar mesa, zona, garçom...',
  'adminTables.filterAll': 'Todas',
  'adminTables.filterActive': 'Ativas',
  'adminTables.filterInactive': 'Inativas',
  'adminTables.filterAllZones': 'Todas as zonas',
  'adminTables.ofCount': 'de',
  'adminTables.noTablesFound': 'Nenhuma mesa encontrada',
  'adminTables.noTablesFoundDesc': 'Tente ajustar os filtros ou criar uma nova mesa.',
  'adminTables.colZone': 'Zona',
  'adminTables.colWaiter': 'Garçom',
  'adminTables.colSeats': 'Lugares',
  'adminTables.colValidation': 'Validação',
  'adminTables.tableActive': 'Ativa',
  'adminTables.tableInactive': 'Inativa',
  'adminTables.editTitle': 'Editar Mesa {n}',
  'adminTables.newTitle': 'Nova mesa',
  'adminTables.number': 'Número / Nome',
  'adminTables.numberPlaceholder': 'ex: 1, A3, VIP-1',
  'adminTables.capacity': 'Capacidade (lugares)',
  'adminTables.capacityPlaceholder': 'ex: 4',
  'adminTables.zone': 'Zona / Área',
  'adminTables.noZone': '— Sem zona —',
  'adminTables.waiter': 'Garçom responsável',
  'adminTables.noWaiter': '— Sem atribuição —',
  'adminTables.notes': 'Observações',
  'adminTables.notesPlaceholder': 'ex: próxima à janela, acessível, reservada para VIP...',
  'adminTables.isActive': 'Mesa ativa',
  'adminTables.saveChanges': 'Salvar alterações',
  'adminTables.createTable': 'Criar mesa',
  'adminTables.colZones': 'Zonas / Áreas',
  'adminTables.noZones': 'Nenhuma zona',
  'adminTables.noZonesDesc': 'Crie zonas para organizar suas mesas.',
  'adminTables.newZonePlaceholder': 'Nova zona...',
  'adminTables.addZone': 'Adicionar zona',
  'adminTables.removeZone': 'Remover zona',
  'adminTables.updatedToast': 'Mesa {n} atualizada',
  'adminTables.createdToast': 'Mesa {n} criada',
  'adminTables.disabledToast': 'Mesa desativada',
  'adminTables.enabledToast': 'Mesa ativada',
  'adminTables.codeRegeneratedToast': 'Código regenerado',
  'adminTables.regenerateCode': 'Regenerar código',
  'adminAggregator.title': 'Agregadores',
  'adminAggregator.subtitle': 'Integrações com plataformas de delivery externas',
  'adminAggregator.noAggregators': 'Nenhum agregador configurado',
  'adminAggregator.noAggregatorsDesc': 'Configure integrações com iFood, Rappi e outras plataformas.',
  'adminAggregator.simulateOrder': 'Simular pedido',
  'adminAggregator.activatedToast': '{platform} ativado',
  'adminAggregator.deactivatedToast': '{platform} desativado',
  'adminAggregator.simulatedToast': 'Pedido simulado de {platform} enviado à cozinha',
  'adminOrders.title': 'Pedidos',
  'adminOrders.searchPlaceholder': 'Buscar pedido, cliente ou mesa...',
  'adminOrders.filterAll': 'Todos',
  'adminOrders.filterInKitchen': 'Na cozinha',
  'adminOrders.filterPreparing': 'Preparando',
  'adminOrders.filterReady': 'Prontos',
  'adminOrders.filterDelivered': 'Entregues',
  'adminOrders.filterPaid': 'Pagos',
  'adminOrders.filterUnpaid': 'Não pagos',
  'adminOrders.noOrders': 'Nenhum pedido encontrado',
  'adminOrders.noOrdersDesc': 'Nenhum pedido corresponde aos filtros selecionados.',
  'adminOrders.colOrder': 'Pedido',
  'adminOrders.colTable': 'Mesa',
  'adminOrders.colPayment': 'Pagamento',
  'adminOrders.colOrigin': 'Origem',
  'adminOrders.colTime': 'Hora',
  'adminOrders.sectionCustomer': 'Cliente',
  'adminOrders.sectionItems': 'Itens',
  'adminOrders.sectionHistory': 'Histórico',
  'adminOrders.tableLabel': 'Mesa',
  'adminOrders.itemNote': 'Obs: {note}',
  'adminOrders.subtotal': 'Subtotal',
  'adminOrders.serviceFee': 'Taxa de serviço',
  'adminOrders.actionSendKitchen': 'Enviar p/ cozinha',
  'adminOrders.actionPreparing': 'Marcar como preparando',
  'adminOrders.actionReady': 'Marcar como pronto',
  'adminOrders.actionDelivered': 'Marcar como entregue',
  'adminOrders.actionClose': 'Encerrar pedido',
  'adminOrders.updatedToast': 'Pedido atualizado → {status}',
  'adminProducts.title': 'Produtos',
  'adminProducts.productSingular': 'produto',
  'adminProducts.productPlural': 'produtos',
  'adminProducts.inCatalog': 'no catálogo',
  'adminProducts.newProduct': 'Novo produto',
  'adminProducts.searchPlaceholder': 'Buscar produto...',
  'adminProducts.noProducts': 'Nenhum produto encontrado',
  'adminProducts.noProductsDesc': 'Tente mudar os filtros ou crie um novo produto.',
  'adminProducts.createFirst': 'Criar primeiro produto',
  'adminProducts.colProduct': 'Produto',
  'adminProducts.colCategory': 'Categoria',
  'adminProducts.colPrice': 'Preço',
  'adminProducts.colFeatured': 'Destaque',
  'adminProducts.featured': 'Destaque',
  'adminProducts.removeFeatured': 'Remover destaque',
  'adminProducts.addFeatured': 'Marcar como destaque',
  'adminProducts.editProduct': 'Editar produto',
  'adminProducts.editTitle': 'Editar produto',
  'adminProducts.newTitle': 'Novo produto',
  'adminProducts.name': 'Nome',
  'adminProducts.price': 'Preço (R$)',
  'adminProducts.imageUrl': 'URL da imagem',
  'adminProducts.description': 'Descrição',
  'adminProducts.category': 'Categoria',
  'adminProducts.kitchenStation': 'Estação da cozinha',
  'adminProducts.stationGeneral': 'Geral',
  'adminProducts.stationGrill': 'Churrasqueira / Grill',
  'adminProducts.stationBar': 'Bar / Bebidas',
  'adminProducts.stationColdFood': 'Frios / Saladas',
  'adminProducts.stationDesserts': 'Sobremesas',
  'adminProducts.stationFried': 'Frituras',
  'adminProducts.available': 'Disponível',
  'adminProducts.updatedToast': 'Produto atualizado',
  'adminProducts.createdToast': 'Produto criado',
  'adminProducts.disabledToast': 'Produto desativado',
  'adminProducts.enabledToast': 'Produto ativado',
  'adminProducts.removedFeaturedToast': 'Destaque removido',
  'adminProducts.addedFeaturedToast': 'Marcado como destaque',
  'adminCategories.title': 'Categorias',
  'adminCategories.catSingular': 'categoria',
  'adminCategories.catPlural': 'categorias',
  'adminCategories.inCatalog': 'no catálogo',
  'adminCategories.newCategory': 'Nova categoria',
  'adminCategories.noCategories': 'Nenhuma categoria ainda',
  'adminCategories.noCategoriesDesc': 'Crie categorias para organizar seu cardápio.',
  'adminCategories.createFirst': 'Criar primeira categoria',
  'adminCategories.colCategory': 'Categoria',
  'adminCategories.colOrder': 'Ordem',
  'adminCategories.statusActive': 'Ativa',
  'adminCategories.statusInactive': 'Inativa',
  'adminCategories.editTitle': 'Editar categoria',
  'adminCategories.newTitle': 'Nova categoria',
  'adminCategories.name': 'Nome',
  'adminCategories.imageUrl': 'URL da imagem',
  'adminCategories.isActive': 'Ativa',
  'adminCategories.updatedToast': 'Categoria atualizada',
  'adminCategories.createdToast': 'Categoria criada',
  'adminCategories.disabledToast': 'Categoria desativada',
  'adminCategories.enabledToast': 'Categoria ativada',
  'imageUpload.urlPlaceholder': 'Cole uma URL de imagem',
  'imageUpload.uploadButton': 'Enviar arquivo',
  'adminKiosks.title': 'Kiosks',
  'adminKiosks.addKiosk': 'Adicionar kiosk',
  'adminKiosks.searchPlaceholder': 'Buscar dispositivo...',
  'adminKiosks.filterAll': 'Todos',
  'adminKiosks.filterOnline': 'Online',
  'adminKiosks.filterOffline': 'Offline',
  'adminKiosks.filterMaintenance': 'Manutenção',
  'adminKiosks.tabDevices': 'Dispositivos',
  'adminKiosks.tabAttractScreen': 'Tela de Atração',
  'adminKiosks.tabBranding': 'Marca',
  'adminKiosks.tabMedia': 'Mídia',
  'adminKiosks.tabBehavior': 'Comportamento',
  'adminKiosks.colDevice': 'Dispositivo',
  'adminKiosks.colLastActivity': 'Última atividade',
  'adminKiosks.noDevices': 'Nenhum dispositivo',
  'adminKiosks.noDevicesDesc': 'Nenhum kiosk registrado ainda.',
  'adminKiosks.colId': 'ID',
  'adminKiosks.colBranch': 'Branch',
  'adminKiosks.colRegistered': 'Cadastrado',
  'adminKiosks.attractConfig': 'Configuração geral',
  'adminKiosks.attractConfigDesc': 'Exibida quando o kiosk está sem uso. As alterações entram em vigor na próxima vez que a tela for carregada.',
  'adminKiosks.enableAttractScreen': 'Ativar tela de atração',
  'adminKiosks.attractEnabled': 'Ativada',
  'adminKiosks.attractDisabled': 'Desativada',
  'adminKiosks.restaurantNameLabel': 'Nome do restaurante',
  'adminKiosks.slogan': 'Slogan',
  'adminKiosks.sloganDesc': 'Exibido abaixo do nome (opcional).',
  'adminKiosks.sloganPlaceholder': 'Ex: O melhor da cidade',
  'adminKiosks.videoUrl': 'URL do vídeo',
  'adminKiosks.videoUrlDesc': 'Sem vídeo, é usado fundo com gradiente (opcional).',
  'adminKiosks.idleTimeout': 'Timeout de inatividade: {s}s',
  'adminKiosks.idleTimeoutDesc': "Após esse tempo sem toque, aparece o aviso 'Você ainda está aí?'.",
  'adminKiosks.sliderMin': '30s',
  'adminKiosks.sliderMax': '300s',
  'adminKiosks.previewLabel': 'Preview',
  'adminKiosks.touchToStart': 'Toque para começar',
  'adminKiosks.attractDisabledPreview': 'Tela de atração desativada',
  'adminKiosks.attractPreviewNote': 'Tela exibida quando o kiosk está sem uso',
  'adminKiosks.sectionSoon': 'Esta seção será configurada em breve.',
  'adminKiosks.nowAgo': 'Agora mesmo',
  'adminKiosks.minAgo': 'min atrás',
  'adminKiosks.hourAgo': 'h atrás',
  'adminKiosks.dayAgo': 'd atrás',
  'adminKiosks.viewDetails': 'Ver detalhes',
  'adminKiosks.reloadConfig': 'Recarregar configuração',
  'adminKiosks.removeDevice': 'Remover dispositivo',
  'adminKiosks.editBtn': 'Editar',
  'adminKiosks.reloadBtn': 'Recarregar',
  'adminKiosks.previewBtn': 'Preview',
  'adminKiosks.removeBtn': 'Remover',
  'cashier.title': 'Caixa / Pagamentos',
  'cashier.live': 'Ao vivo',
  'cashier.hub': 'Hub',
  'cashier.tab.orders': 'Mesas / Pedidos',
  'cashier.tab.history': 'Histórico',
  'cashier.tab.receipts': 'Recibos',
  'cashier.tab.invoices': 'Notas fiscais',
  'cashier.metric.received': 'Recebido hoje',
  'cashier.metric.paid': 'Pedidos pagos',
  'cashier.metric.pending': 'A receber',
  'cashier.metric.tables': 'Mesas pendentes',
  'cashier.filter.all': 'Todos',
  'cashier.filter.pending': 'Pendentes',
  'cashier.filter.partial': 'Parcial',
  'cashier.filter.paid': 'Pagos',
  'cashier.filter.search': 'Buscar mesa...',
  'cashier.collapse': 'Recolher',
  'cashier.expand': 'Expandir',
  'cashier.pay.totalDue': 'Total da conta',
  'cashier.pay.alreadyPaid': 'Já pago',
  'cashier.pay.amountDue': 'Valor a cobrar',
  'cashier.pay.chargeMode': 'Forma de cobrança',
  'cashier.pay.remaining': 'Total restante',
  'cashier.pay.partial': 'Valor parcial',
  'cashier.pay.method': 'Forma de pagamento',
  'cashier.pay.receive': 'Receber {amount}',
  'cashier.pay.processing': 'Processando...',
  'cashier.pay.cancel': 'Cancelar',
  'cashier.pay.done': 'Pagamento recebido!',
  'cashier.pay.change': 'Troco',
  'cashier.pay.print': 'Recibo',
  'cashier.pay.close': 'Fechar',
  'cashier.pay.cashGiven': 'Valor entregue pelo cliente',
  'cashier.pay.remainingAfter': 'Restante após pagamento:',
  'cashier.method.cash': 'Dinheiro',
  'cashier.method.card': 'Cartão',
  'cashier.method.pix': 'PIX',
  'cashier.method.terminal': 'Terminal',
  'cashier.receipt.title': 'Recibo',
  'cashier.receipt.subtotal': 'Subtotal',
  'cashier.receipt.fee': 'Taxa de serviço',
  'cashier.receipt.total': 'TOTAL',
  'cashier.receipt.method': 'Forma:',
  'cashier.receipt.print': 'Imprimir',
  'cashier.receipt.close': 'Fechar',
  'cashier.customer.subtotal': 'Subtotal',
  'cashier.customer.fee': 'Taxa de serviço (10%)',
  'cashier.customer.total': 'Total',
  'cashier.customer.paid': 'Já pago',
  'cashier.customer.due': 'A receber',
  'cashier.customer.receive': 'Receber {amount}',
  'cashier.customer.partial': 'Parcial',
  'cashier.table.due': 'A receber',
  'cashier.table.receive': 'Receber mesa',
  'cashier.table.total': 'Total conta:',
  'cashier.table.paid': 'Pago:',
  'cashier.table.remaining': 'Restante:',
  'cashier.table.partialBtn': 'Valor parcial',
  'cashier.table.allPaid': 'Mesa totalmente paga',
  'cashier.empty.tables': 'Nenhuma mesa ativa',
  'cashier.empty.tablesDesc': 'Quando houver pedidos em andamento, as mesas aparecerão aqui.',
  'cashier.empty.history': 'Nenhum pagamento',
  'cashier.empty.receipts': 'Nenhum recibo gerado',
  'cashier.empty.invoices': 'Nenhuma nota fiscal gerada',
  'cashier.empty.pendingTables': 'Nenhuma mesa aguardando pagamento.',
  'cashier.col.order': 'Pedido',
  'cashier.col.customer': 'Cliente',
  'cashier.col.table': 'Mesa',
  'cashier.col.total': 'Total',
  'cashier.col.paid': 'Pago',
  'cashier.col.method': 'Forma',
  'cashier.col.status': 'Status',
  'cashier.col.actions': 'Ações',
  'cashier.col.number': 'Número',
  'cashier.col.date': 'Data',
  'cashier.status.paid': 'Pago',
  'cashier.status.partial': 'Parcial',
  'cashier.status.pending': 'Pendente',
  'cashier.kiosk.alerts': 'Alertas do Totem',
  'cashier.kiosk.resolve': 'Resolver',
  'cashier.kiosk.needsHelp': 'Precisa de ajuda',
  'cashier.kiosk.printFailed': 'Ticket não impresso',
  'cashier.kiosk.totemN': 'Totem {n}',
  'cashier.kiosk.noAlerts': 'Sem alertas ativos',
  'queue.nowCalling': 'CHAMANDO AGORA',
  'queue.pickupAtCounter': 'Retire seu pedido no balcão',
  'queue.ticketLabel': 'SENHA',
  'queue.preparingTitle': 'Preparando seus pedidos',
  'queue.preparingSub': 'Você será chamado assim que estiver pronto',
  'queue.allReady': 'Todos os pedidos prontos',
  'queue.noActiveTitle': 'Nenhum pedido ativo',
  'queue.noActiveSub': 'Faça seu pedido para aparecer aqui',
  'queue.headerTitle': 'Acompanhe seu pedido',
  'queue.readyColumn': 'Pronto — Retire!',
  'queue.preparingColumn': 'Em preparo',
  'queue.pageOf': 'Pág. {page} de {total}',
  'queue.refreshNote': 'Atualiza a cada 3 segundos',
  'queue.checkPrintedTicket': 'Confira o número na senha impressa',
  'queue.restaurantFallback': 'Restaurante',
  'kitchen.title': 'Cozinha',
  'kitchen.priority.urgent': 'URGENTE',
  'kitchen.priority.vip': 'VIP',
  'kitchen.action.start': 'Iniciar preparo',
  'kitchen.action.ready': 'Marcar pronto',
  'kitchen.action.deliver': 'Marcar entregue',
  'kitchen.col.new': 'Novos',
  'kitchen.col.preparing': 'Preparando',
  'kitchen.col.ready': 'Prontos',
  'kitchen.empty.new': 'Nenhum pedido novo',
  'kitchen.empty.preparing': 'Nenhum pedido em preparo',
  'kitchen.empty.ready': 'Nenhum pedido pronto',
  'kitchen.empty.generic': 'Nenhum pedido',
  'kitchen.notify.preparing': 'Preparo iniciado',
  'kitchen.notify.ready': '✅ Pedido pronto!',
  'kitchen.notify.delivered': 'Entregue ao cliente',
  'kitchen.notify.statusUpdated': 'Status atualizado',
  'kitchen.filter.all': 'Todas as filas',
  'kitchen.meta.table': 'Mesa {n}',
  'kitchen.meta.delivery': 'Delivery',
  'kitchen.meta.counter': 'Balcão',
  'kitchen.stat.delivered': 'Entregues',
  'kitchen.stat.avgTime': 'Tempo médio',
  'kitchen.stat.longestWait': 'Maior espera',
  'kitchen.live': 'AO VIVO',
  'kitchen.tooltip.hub': 'Hub',
  'kitchen.tooltip.mute': 'Silenciar',
  'kitchen.tooltip.unmute': 'Ativar som',
  'kitchen.tooltip.fullscreen': 'Tela cheia',
  'kitchen.tooltip.exitFullscreen': 'Sair do fullscreen',
  'reports.title': 'Relatórios',
  'reports.role': 'Análise',
  'reports.section.dashboard': 'Dashboard geral',
  'reports.section.fechamento': 'Fechamento diário',
  'reports.section.vendas': 'Vendas',
  'reports.section.pagamentos': 'Pagamentos',
  'reports.section.produtos': 'Produtos mais vendidos',
  'reports.section.mesas': 'Receita por mesa',
  'reports.section.garcons': 'Receita por garçom',
  'reports.section.cozinha': 'Desempenho da cozinha',
  'reports.section.ocupacao': 'Ocupação / horários ociosos',
  'reports.section.reservas': 'Reservas',
  'reports.section.exportacoes': 'Exportações',
  'reports.navGroup.overview': 'Visão geral',
  'reports.navGroup.financial': 'Financeiro',
  'reports.navGroup.performance': 'Desempenho',
  'reports.nav.ocupacao': 'Ocupação / horários',
  'reports.method.cash': 'Dinheiro',
  'reports.method.card': 'Cartão',
  'reports.method.pix': 'PIX',
  'reports.method.terminal': 'Terminal',
  'reports.method.other': 'Outros',
  'reports.today': 'Hoje',
  'reports.yesterday': 'Ontem',
  'reports.refresh': 'Atualizar',
  'reports.csv': 'CSV',
  'reports.exportCsv': 'Exportar CSV',
  'reports.csvExported': 'CSV exportado',
  'reports.admin': 'Administração',
  'reports.kpi.revenue': 'Faturamento',
  'reports.kpi.totalOrders': 'Total de pedidos',
  'reports.kpi.paidOrders': 'Pedidos pagos',
  'reports.kpi.avgTicket': 'Ticket médio',
  'reports.kpi.serviceFee': 'Taxa de serviço',
  'reports.kpi.canceled': 'Cancelados',
  'reports.noData.title': 'Sem dados para este período',
  'reports.noData.desc': 'Nenhuma venda registrada em {date}. Tente selecionar outra data.',
  'reports.notFound.title': 'Seção não encontrada',
  'reports.notFound.desc': 'Selecione uma seção válida no menu lateral.',
  'reports.empty.byHour': 'Sem dados por hora',
  'reports.empty.payments': 'Sem pagamentos registrados',
  'reports.empty.products': 'Sem produtos vendidos',
  'reports.empty.tables': 'Sem dados de mesas',
  'reports.empty.waiters': 'Sem dados de garçons',
  'reports.ordersN': '{n} pedidos',
  'reports.ordersAbbrN': '{n} ped.',
  'reports.unitsN': '{n} un.',
  'reports.peakHour': 'Hora de pico',
  'reports.topRevenueHour': 'Hora mais lucrativa',
  'reports.ordersInDay': 'pedidos no dia',
  'reports.paid': 'pagos',
  'reports.sortRevenue': 'Receita',
  'reports.sortQty': 'Qtd',
  'reports.tableN': 'Mesa {n}',
  'reports.details': 'Detalhes',
  'reports.waiter.name': 'Garçom',
  'reports.waiter.orders': 'Pedidos',
  'reports.waiter.tables': 'Mesas',
  'reports.waiter.grossSales': 'Vendas brutas',
  'reports.insights.title': 'Destaques do dia',
  'reports.insights.quietHour': 'Hora mais calma',
  'reports.promoOpportunity': 'oportunidade de promoção',
  'reports.insights.topTable': 'Mesa mais lucrativa',
  'reports.insights.topProduct': 'Produto destaque',
  'reports.insights.bestWaiter': 'Melhor garçom',
  'reports.insights.payRate': 'Taxa de pagamento',
  'reports.insights.payRateSub': '{paid} de {total} pedidos',
  'reports.insights.grossSalesSub': '+ {fee} em taxa de serviço',
  'reports.card.ordersByHour': 'Pedidos por hora',
  'reports.card.hoursActive': '{n} horas com atividade',
  'reports.card.paymentMethods': 'Formas de pagamento',
  'reports.card.byRevenue': 'Distribuição por receita',
  'reports.card.topItems': 'Top {n} itens do dia',
  'reports.card.tablesActive': '{n} mesas com movimentação',
  'reports.card.waiterPerf': 'Performance dos garçons',
  'reports.card.byRevenueGenerated': 'Classificado por faturamento gerado',
  'reports.card.financialSummary': 'Resumo financeiro',
  'reports.fin.totalRevenue': 'Faturamento total',
  'reports.dateByRevenue': '{date} — distribuição por receita',
  'reports.dateTopItems': '{date} — top {n} itens',
  'reports.dateTablesActive': '{date} — {n} mesas com movimentação',
  'reports.dateWaiterRanked': '{date} — classificado por faturamento gerado',
  'reports.dateHoursActive': '{date} — {n} horas com atividade',
  'reports.exports.subtitle': 'Exportar dados do período selecionado',
  'reports.exports.closingReport': 'Relatório de fechamento (CSV)',
  'reports.exports.closingDesc': '{date} — pedidos, pagamentos, produtos, mesas e garçons',
  'reports.ph.vendasTitle': 'Análise de vendas em desenvolvimento',
  'reports.ph.vendasDesc': 'Relatório de tendências e comparativos de vendas. Em breve disponível.',
  'reports.ph.cozinhaTitle': 'Desempenho da cozinha em desenvolvimento',
  'reports.ph.cozinhaDesc': 'Tempo médio de preparo e eficiência da cozinha. Em breve disponível.',
  'reports.ph.reservasTitle': 'Relatório de reservas em desenvolvimento',
  'reports.ph.reservasDesc': 'Ocupação e análise de reservas. Em breve disponível.',
  'res.title': 'Reservas',
  'res.today': 'Hoje',
  'res.noTable': 'Sem mesa',
  'res.guestsN': '{n} pessoas',
  'res.tableN': 'Mesa {n}',
  'res.seatsN': '{n} lugares',
  'res.conflict': 'Conflito',
  'res.free': 'Livre',
  'res.available': 'Disponível',
  'res.reserve': 'Reservar',
  'res.back': 'Voltar',
  'res.view': 'Ver',
  'res.hub': 'Hub',
  'res.confirm': 'Confirmar',
  'res.minN': '{n} min',
  'res.hoursN': '{n}h',
  'res.timeNow': 'agora',
  'res.status.pending': 'Pendente',
  'res.status.confirmed': 'Confirmada',
  'res.status.seated': 'Sentado',
  'res.status.completed': 'Concluída',
  'res.status.canceled': 'Cancelada',
  'res.status.noShow': 'Não veio',
  'res.tag.birthday': '🎂 Aniversário',
  'res.tag.vip': '⭐ VIP',
  'res.tag.allergy': '⚠️ Alergia',
  'res.tag.anniversary': '💍 Casal',
  'res.tag.late': '⏰ Atraso',
  'res.source.phone': 'Telefone',
  'res.source.walkIn': 'Presencial',
  'res.source.online': 'Online',
  'res.urgency.overdue': 'Atrasada {n}min',
  'res.urgency.now': 'Em agora',
  'res.urgency.inMin': 'Em {n}min',
  'res.urgency.vip': 'VIP',
  'res.metrics.total': 'Total',
  'res.metrics.confirmed': 'Confirmadas',
  'res.metrics.pending': 'Pendentes',
  'res.metrics.seated': 'Sentados',
  'res.metrics.canceled': 'Canceladas',
  'res.metrics.noShow': 'Não vieram',
  'res.action.confirm': 'Confirmar',
  'res.action.seat': 'Sentar',
  'res.action.complete': 'Concluir',
  'res.action.seatDirect': 'Sentar diretamente',
  'res.action.editReservation': 'Editar reserva',
  'res.action.noShow': 'Não compareceu',
  'res.action.cancelReservation': 'Cancelar reserva',
  'res.action.reopenPending': 'Reabrir como pendente',
  'res.action.viewDetails': 'Ver detalhes',
  'res.action.edit': 'Editar',
  'res.action.cancel': 'Cancelar',
  'res.action.reopen': 'Reabrir',
  'res.empty.title': 'Sem reservas',
  'res.empty.desc': 'Nenhuma reserva encontrada com os filtros selecionados.',
  'res.emptyTable.title': 'Nenhuma reserva',
  'res.reservationsCountN': '{n} reservas',
  'res.col.dateTime': 'Data / Hora',
  'res.col.customer': 'Cliente',
  'res.col.phone': 'Telefone',
  'res.col.guests': 'Pessoas',
  'res.col.table': 'Mesa',
  'res.col.status': 'Status',
  'res.col.channel': 'Canal',
  'res.col.notes': 'Obs.',
  'res.walkin.queue': 'Fila de espera',
  'res.walkin.add': 'Adicionar à fila',
  'res.walkin.emptyTitle': 'Fila vazia',
  'res.walkin.emptyDesc': 'Nenhum cliente aguardando no momento.',
  'res.walkin.waitingSince': 'Aguardando há ',
  'res.walkin.since': 'Há ',
  'res.walkin.estWait': 'Espera estimada: ~{n}min',
  'res.walkin.seat': 'Sentar',
  'res.walkin.remove': 'Remover',
  'res.walkin.historyToday': 'Histórico de hoje ({n})',
  'res.walkin.seated': 'Sentado',
  'res.walkin.removed': 'Removido',
  'res.walkin.nameOrGroup': 'Nome ou grupo *',
  'res.walkin.nameOrGroupPlaceholder': 'Ex: Família Silva',
  'res.walkin.estWaitMin': 'Espera estimada (min)',
  'res.settings.title': 'Configurações de reservas',
  'res.settings.hours': 'Horários de funcionamento',
  'res.settings.opening': 'Abertura',
  'res.settings.closing': 'Fechamento',
  'res.settings.params': 'Parâmetros',
  'res.settings.defaultDuration': 'Duração padrão (min)',
  'res.settings.defaultDurationHint': 'Duração padrão de cada reserva',
  'res.settings.lateTolerance': 'Tolerância de atraso (min)',
  'res.settings.lateToleranceHint': 'Antes de marcar como não compareceu',
  'res.settings.slotInterval': 'Intervalo entre horários (min)',
  'res.settings.slotIntervalHint': 'Granularidade no mapa de ocupação',
  'res.settings.maxParty': 'Máximo de pessoas por reserva',
  'res.settings.save': 'Salvar configurações',
  'res.settings.saved': 'Salvo!',
  'res.modal.customerData': 'Dados do cliente',
  'res.modal.name': 'Nome *',
  'res.modal.namePlaceholder': 'Nome do cliente',
  'res.modal.phone': 'Telefone',
  'res.modal.guests': 'Nº de pessoas',
  'res.modal.details': 'Detalhes da reserva',
  'res.modal.date': 'Data',
  'res.modal.time': 'Horário',
  'res.modal.duration': 'Duração (min)',
  'res.modal.source': 'Origem',
  'res.modal.tableOptional': '(opcional)',
  'res.modal.noTableOption': '— Sem mesa definida —',
  'res.modal.notesTags': 'Observações e tags',
  'res.modal.notes': 'Observações',
  'res.modal.notesPlaceholder': 'Ex: janela, cadeirão para bebê...',
  'res.modal.tags': 'Tags',
  'res.modal.saveReservation': 'Salvar reserva',
  'res.modal.cancel': 'Cancelar',
  'res.modal.close': 'Fechar',
  'res.occ.allTables': 'Todas',
  'res.occ.week': 'Semana',
  'res.occ.day': 'Dia',
  'res.occ.month': 'Mês',
  'res.occ.viewDayDetails': 'Ver detalhes do dia',
  'res.occ.noSlots': 'Sem horários configurados',
  'res.occ.occupiedShort': '{n} ocup.',
  'res.occ.freeShortN': '{n} livres',
  'res.occ.freeLower': 'livre',
  'res.occ.maxOccTitle': '{date} — Ocupação máx: {pct}%',
  'res.occ.occupied': 'Ocupadas',
  'res.occ.free2': 'Livres',
  'res.occ.occ': 'Ocup.',
  'res.occ.noActiveTables': 'Nenhuma mesa ativa',
  'res.occ.available': 'Disponíveis',
  'res.occ.cancelConfirm': 'Cancelar reserva de {name}?',
  'res.occ.capacityUndefined': 'Capacidade não definida',
  'res.newReservationTable': 'Nova reserva — Mesa {n}',
  'res.notif.canceled': 'Reserva cancelada',
  'res.notif.created': 'Reserva criada com sucesso',
  'res.notif.createdShort': 'Reserva criada',
  'res.notif.updated': 'Reserva atualizada',
  'res.notif.status': 'Reserva: {status}',
  'res.notif.customerSeated': 'Cliente sentado',
  'res.notif.removedFromQueue': 'Removido da fila',
  'res.notif.addedToQueue': 'Adicionado à fila',
  'res.notif.settingsSaved': 'Configurações salvas',
  'res.tab.queue': 'Fila',
  'res.tab.occupancy': 'Ocupação',
  'res.tab.settings': 'Config.',
  'res.view.agenda': 'Agenda',
  'res.view.table': 'Tabela',
  'res.view.byTable': 'Por mesa',
  'res.scope.date': 'Data',
  'res.scope.all': 'Todos',
  'res.topbar.occupancy': 'Mapa de ocupação',
  'res.topbar.settings': 'Configurações',
  'res.newReservation': 'Nova reserva',
  'res.searchPlaceholder': 'Buscar cliente ou telefone...',
  'res.allStatuses': 'Todos os status',
  'res.openMenu': 'Abrir menu',
  'res.closeMenu': 'Fechar menu',
  'hub.loggedAs': 'Logado como {name} ({role})',
  'hub.chooseArea': 'Prototype — escolha uma área para entrar',
  'hub.logout': 'Sair',
  'hub.resetConfirm': 'Resetar dados de demonstração? Todas as interações serão apagadas.',
  'hub.resetBtn': 'Resetar dados de demonstração',
  'hub.printCard': 'Imprimir cartão',
  'hub.cardPreviewTitle': 'Prévia do cartão',
  'hub.printTableQr': 'Imprimir QR da Mesa',
  'hub.tableQrTitle': 'QR da Mesa',
  'hub.sectionCustomer': 'Áreas do cliente',
  'hub.sectionOps': 'Operação',
  'hub.sectionNew': 'Novas funcionalidades',
  'hub.area.menu.title': 'Menu Digital',
  'hub.area.menu.desc': 'Cliente – mesa / takeaway',
  'hub.area.kiosk.title': 'Kiosk / Totem',
  'hub.area.kiosk.desc': 'Autoatendimento',
  'hub.area.queue.title': 'Painel de Fila',
  'hub.area.queue.desc': 'TV / display público',
  'hub.area.kitchen.title': 'Cozinha',
  'hub.area.kitchen.desc': 'Operação da cozinha',
  'hub.area.waiter.title': 'Garçom',
  'hub.area.waiter.desc': 'Atendimento de piso',
  'hub.area.cashier.title': 'Caixa',
  'hub.area.cashier.desc': 'Pagamentos e notas',
  'hub.area.admin.title': 'Admin',
  'hub.area.admin.desc': 'Gestão do restaurante',
  'hub.area.delivery.title': 'Delivery',
  'hub.area.delivery.desc': 'Gestão de entregas + Agregadores',
  'hub.area.reservations.title': 'Reservas',
  'hub.area.reservations.desc': 'Gestão de reservas',
  'hub.area.reports.title': 'Relatórios',
  'hub.area.reports.desc': 'Fechamento e métricas',
  'hub.area.login.title': 'Login / Perfis',
  'hub.area.login.desc': 'Trocar usuário e papel',
  'login.greeting': '👋 Olá, {name}',
  'login.loggedAs': 'Logado como',
  'login.goToArea': 'Ir para minha área',
  'login.switchUser': 'Trocar usuário',
  'login.hub': 'Hub',
  'login.title': 'Entrar no sistema',
  'login.subtitle': 'Selecione seu perfil (demonstração)',
  'login.submit': 'Entrar',
  'login.continueDemo': 'Continuar sem login (modo demo)',
  'login.role.owner': 'Proprietário',
  'login.role.manager': 'Gerente',
  'login.role.cashier': 'Caixa',
  'login.role.waiter': 'Garçom',
  'login.role.kitchen': 'Cozinha',
  'login.role.support': 'Suporte',
  'login.emailLabel': 'Email',
  'login.emailPlaceholder': 'seu@email.com',
  'login.passwordLabel': 'Senha',
  'login.error.invalidCredentials': 'Email ou senha incorretos.',
  'login.error.generic': 'Erro ao fazer login. Tente novamente.',
};

const es: LabelMap = {
  'nav.menu': 'Menú',
  'nav.waiter': 'Mozo',
  'nav.language': 'Idioma',
  'nav.order': 'Pedir',
  'lang.es': 'Español',
  'lang.pt': 'Português',
  'lang.en': 'English',
  'lang.selector': 'Idioma',
  'nav.cashback': 'Cashback',
  'nav.bill': 'Cuenta',
  'menu.searchPlaceholder': 'Buscar producto',
  'menu.allCategories': 'Todo',
  'menu.featured': 'Destacados',
  'menu.empty': 'Sin resultados',
  'menu.emptyDesc': 'Probá con otra búsqueda o categoría.',
  'menu.results': 'Resultados',
  'menu.greeting': 'Hola',
  'menu.addedToCart': 'Agregado al carrito',
  'menu.viewCart': 'Ver carrito',
  'menu.loadError': 'No pudimos cargar el menú.',
  'menu.retry': 'Reintentar',
  'menu.categoryEmpty': 'No hay productos disponibles.',
  'product.quantity': 'Cantidad',
  'product.notes': 'Observación',
  'product.notesPlaceholder': 'Ej: Sin "X"',
  'product.add': 'Agregar',
  'product.required': 'obligatorio',
  'product.upTo': 'hasta {max}',
  'product.selectRequired': 'Elegí las opciones obligatorias.',
  'product.from': 'Desde',
  'cart.title': 'Carrito',
  'cart.continue': 'Seguir',
  'cart.empty': 'Tu carrito está vacío',
  'cart.emptyDesc': 'Volvé al menú y elegí tus platos favoritos.',
  'cart.viewMenu': 'Ver menú',
  'cart.phone': 'Teléfono',
  'cart.name': 'Nombre',
  'cart.namePlaceholder': 'Tu nombre',
  'cart.changeName': 'Cambiar',
  'cart.addMore': 'Agregar más ítems',
  'cart.placeOrder': 'Hacer pedido',
  'cart.placingOrder': 'Enviando...',
  'cart.namePromptTitle': 'Antes de continuar',
  'cart.namePromptDesc': 'Ingresá tu nombre para identificar tu pedido en la mesa.',
  'cart.confirmName': 'Continuar',
  'cart.items': 'Tus ítems',
  'cart.increase': 'Aumentar',
  'cart.decrease': 'Disminuir',
  'cart.removeItem': 'Quitar',
  'cart.each': 'c/u',
  'summary.subtotal': 'Subtotal',
  'summary.serviceFee': 'Servicio',
  'summary.total': 'Total',
  'bill.title': 'Cuenta',
  'bill.tabTable': 'Mesa',
  'bill.tabIndividual': 'Individual',
  'bill.closeTable': 'Pedir cierre de la cuenta',
  'bill.closeMine': 'Cerrar mi cuenta',
  'bill.empty': 'Todavía no pediste nada en esta mesa.',
  'bill.requestSent': 'Solicitud de cierre enviada al mozo.',
  'bill.you': 'Tú',
  'waiter.title': 'Mozo',
  'waiter.help': '¿Necesitás ayuda?',
  'waiter.helpDesc': 'Tocá una opción y un mozo se acercará a tu mesa.',
  'waiter.formTitle': 'Llamar al mozo',
  'waiter.formDesc': 'Ingresá tus datos para facilitar la atención.',
  'waiter.phone': 'Teléfono',
  'waiter.name': 'Nombre',
  'waiter.namePlaceholder': 'Tu nombre',
  'waiter.phonePlaceholder': '(00) 0000-0000',
  'waiter.cancel': 'Cancelar',
  'waiter.send': 'Continuar',
  'waiter.sent': 'Solicitud enviada. Un mozo va para tu mesa.',
  'waiter.action.call': 'Llamar al mozo',
  'waiter.action.bill': 'Pedir la cuenta',
  'waiter.action.order': 'Mis pedidos',
  'waiter.action.other': 'Otro motivo',
  'waiter.status.pending': 'Pendiente',
  'waiter.status.acknowledged': 'Reconocida',
  'waiter.status.resolved': 'Resuelta',
  'waiter.status.canceled': 'Cancelada',
  'waiter.activeTitle': 'Solicitud en curso',
  'waiter.historyTitle': 'Historial',
  'waiter.cancelRequest': 'Cancelar solicitud',
  'waiter.resolveRequest': 'Marcar como resuelta',
  'waiter.dupeActive': 'Ya tienes una solicitud activa. Por favor espera atención.',
  'waiter.tableUnknown': 'Mesa no identificada.',
  'waiter.billError': 'No se pudo solicitar la cuenta. Intenta de nuevo.',
  'waiter.requestCanceled': 'Solicitud cancelada.',
  'waiter.requestResolved': 'Solicitud marcada como resuelta.',
  'rating.title': 'Evaluar',
  'rating.question': '¿Cómo fue tu experiencia?',
  'rating.tapStars': 'Tocá las estrellas para puntuar.',
  'rating.commentPlaceholder': 'Dejá un comentario (opcional)',
  'rating.send': 'Enviar evaluación',
  'rating.thanks': '¡Gracias por tu evaluación!',
  'rating.thanksDesc': 'Tu opinión nos ayuda a mejorar.',
  'rating.starLabel': '{n} estrellas',
  'rating.score1': 'Malo',
  'rating.score2': 'Regular',
  'rating.score3': 'Bueno',
  'rating.score4': 'Muy bueno',
  'rating.score5': 'Excelente',
  'account.title': 'Mi cuenta',
  'account.loyaltyTitle': 'Tarjeta de fidelidad',
  'account.stamps': '{current}/{total} sellos',
  'account.rewardEarned': '🎉 ¡Felicidades! Ganaste un descuento.',
  'account.stampsLeft': 'Te faltan {n} sellos para tu próximo descuento.',
  'account.ordersTitle': 'Historial de pedidos',
  'account.noOrders': 'Todavía no tenés pedidos.',
  'account.items': '{n} ítem(s)',
  'account.actionsTitle': 'Acciones',
  'account.closeBill': 'Cerrar cuenta',
  'account.myCashback': 'Mi cashback',
  'account.status.pending': 'Enviado',
  'account.status.preparing': 'En preparación',
  'account.status.delivered': 'Entregado',
  'account.status.closed': 'Cerrado',
  'cashback.title': 'Cashback',
  'cashback.balance': 'Saldo disponible',
  'cashback.note': 'Recibís {rate}% de vuelta en cada pedido.',
  'cashback.history': 'Historial',
  'cashback.signup': 'Registrarme para cashback',
  'cashback.empty': 'Todavía no tenés cashback. ¡Hacé un pedido para empezar!',
  'cashback.signupToast': 'Pronto vas a poder registrarte para recibir cashback.',
  'common.back': 'Volver',
  'common.close': 'Cerrar',
  'common.loading': 'Cargando...',
  'common.required': 'Requerido',
  'common.optional': 'Opcional',
  'confirmation.title': '¡Pedido confirmado!',
  'confirmation.subtitle': 'Tu pedido fue enviado a la cocina.',
  'confirmation.orderNumber': 'Número de pedido',
  'confirmation.customer': 'Nombre',
  'confirmation.table': 'Mesa',
  'confirmation.items': 'Ítems',
  'confirmation.note': 'Seguí el estado en el panel o esperá que te llamen.',
  'confirmation.backToMenu': 'Volver al menú',
  'confirmation.rate': 'Calificar experiencia',
  'confirmation.print': 'Imprimir ticket',
  'kiosk.welcome.title': '¡Bienvenido!',
  'kiosk.welcome.subtitle': '¿Cómo querés pedir?',
  'kiosk.welcome.eatIn': 'Comer acá',
  'kiosk.welcome.takeaway': 'Para llevar',
  'kiosk.steps.menu': 'Menú',
  'kiosk.steps.review': 'Revisión',
  'kiosk.steps.payment': 'Pago',
  'kiosk.steps.done': 'Confirmación',
  'kiosk.menu.all': 'Todos',
  'kiosk.menu.emptyCategory': 'No hay productos en esta categoría',
  'kiosk.order.label': 'Mi pedido',
  'kiosk.order.item': 'ítem',
  'kiosk.order.items': 'ítems',
  'kiosk.order.tax': 'Servicio',
  'kiosk.order.emptyTitle': 'Tu carrito está vacío',
  'kiosk.order.emptyHint': 'Agregá ítems al carrito para continuar',
  'kiosk.order.review': 'Revisar pedido',
  'kiosk.cart.title': 'Revisión del pedido',
  'kiosk.cart.reviewSubtitle': 'Confirmá los ítems antes de pagar',
  'kiosk.cart.empty': 'Carrito vacío',
  'kiosk.cart.remove': 'Quitar',
  'kiosk.cart.addMore': 'Agregar más',
  'kiosk.cart.confirmPay': 'Confirmar y pagar',
  'kiosk.cart.serviceFee': 'Cargo por servicio',
  'kiosk.payment.title': 'Pago',
  'kiosk.payment.totalLabel': 'Total a pagar',
  'kiosk.payment.how': '¿Cómo querés pagar?',
  'kiosk.payment.card': 'Tarjeta',
  'kiosk.payment.cardDesc': 'Débito o crédito',
  'kiosk.payment.pix': 'PIX',
  'kiosk.payment.pixDesc': 'Escaneá el código QR',
  'kiosk.payment.cash': 'Efectivo',
  'kiosk.payment.cashDesc': 'Pagá en la caja',
  'kiosk.payment.mercadoPago': 'Mercado Pago',
  'kiosk.payment.mercadoPagoDesc': 'Escaneá el código QR',
  'kiosk.payment.cardInstrTitle': 'Usá el posnet',
  'kiosk.payment.cardInstrDesc': 'Insertá, acercá o pasá tu tarjeta en el posnet de al lado.',
  'kiosk.payment.qrTitle': 'Escaneá para pagar',
  'kiosk.payment.qrDesc': 'Abrí la app y escaneá el código QR de abajo.',
  'kiosk.payment.waiting': 'Esperando la confirmación del pago…',
  'kiosk.payment.cashTitle': 'Pagá en la caja',
  'kiosk.payment.cashSubtitle': 'Presentá este ticket en la caja para finalizar el pago',
  'kiosk.payment.cashInstr': 'Tu pedido fue registrado. Acercate a la caja con el número de abajo.',
  'kiosk.payment.orderLabel': 'Pedido',
  'kiosk.payment.itemsLabel': 'Ítems',
  'kiosk.payment.confirm': 'Confirmar pago',
  'kiosk.payment.processing': 'Procesando pago…',
  'kiosk.payment.approved': '¡Pago aprobado!',
  'kiosk.payment.rejected': 'Pago rechazado',
  'kiosk.payment.rejectedDesc': 'Por favor, probá con otro método de pago.',
  'kiosk.payment.retry': 'Intentar de nuevo',
  'kiosk.confirm.title': '¡Pedido confirmado!',
  'kiosk.confirm.subtitle': 'Guardá el número de abajo y esperá a que te llamen',
  'kiosk.confirm.ticketLabel': 'Tu número',
  'kiosk.confirm.hint': 'Seguilo en el panel de turnos o esperá a que te llamen por el número de arriba',
  'kiosk.confirm.restarting': 'Reiniciando en {s}s…',
  'kiosk.confirm.newOrder': 'Nuevo pedido',
  'kiosk.confirm.print': 'Imprimir ticket',
  'kiosk.confirm.orderLabel': 'Comprobante',
  'kiosk.confirm.photoHint': 'Sacá una foto o mostrale este número al cajero.',
  'kiosk.confirm.printOk': 'Ticket impreso ✓',
  'kiosk.confirm.printing': 'Imprimiendo…',
  'kiosk.confirm.reprintBtn': 'Imprimir nuevamente',
  'kiosk.confirm.helpBtn': 'Pedir asistencia',
  'kiosk.confirm.helpSent': '¡Asistencia en camino!',
  'kiosk.confirm.qrHint': 'Escaneá para ver tu pedido en el teléfono',
  'kiosk.confirm.queueLabel': 'Turno',
  'kiosk.menu.categories': 'Categorías',
  'kiosk.menu.added': 'Agregado',
  'kiosk.menu.featured': 'Más pedidos',
  'kiosk.menu.featuredSub': 'los favoritos de la casa',
  'kiosk.menu.bestseller': 'Más vendido',
  'kiosk.menu.upsellHint': '¿Qué tal acompañar con',
  'kiosk.idle.title': '¿Seguís ahí?',
  'kiosk.idle.subtitle': 'Tu sesión se reiniciará en {s}s',
  'kiosk.idle.continue': 'Sí, continuar',
  'kiosk.idle.restart': 'Empezar de nuevo',
  'kiosk.attract.cta': 'Toca para comenzar',
  'receipt.notFound': 'Pedido no encontrado.',
  'receipt.autoUpdate': 'Actualiza automáticamente',
  'receipt.order': 'Pedido',
  'receipt.status.draft': 'Borrador',
  'receipt.status.created': 'Recibido',
  'receipt.status.sentToKitchen': 'En cocina',
  'receipt.status.preparing': 'Preparando',
  'receipt.status.ready': 'Listo',
  'receipt.status.delivered': 'Entregado',
  'receipt.status.closed': 'Cerrado',
  'receipt.status.canceled': 'Cancelado',
  'receipt.payment.unpaid': 'Pendiente',
  'receipt.payment.partiallyPaid': 'Pago parcial',
  'receipt.payment.paid': 'Pagado',
  'receipt.payment.refunded': 'Reembolsado',
  'receipt.payment.canceled': 'Cancelado',
  'admin.nav.group.operation': 'Operación',
  'admin.nav.group.catalog': 'Catálogo',
  'admin.nav.group.establishment': 'Establecimiento',
  'admin.nav.group.growth': 'Crecimiento',
  'admin.nav.group.analytics': 'Análisis',
  'admin.nav.group.settings': 'Configuración',
  'admin.nav.dashboard': 'Dashboard',
  'admin.nav.orders': 'Pedidos',
  'admin.nav.queue': 'Cola',
  'admin.nav.products': 'Productos',
  'admin.nav.categories': 'Categorías',
  'admin.nav.tables': 'Mesas',
  'admin.nav.zones': 'Zonas / Áreas',
  'admin.nav.branches': 'Sucursales',
  'admin.nav.kiosks': 'Kiosks',
  'admin.nav.loyalty': 'Fidelidad',
  'admin.nav.aggregator': 'Agregadores',
  'admin.nav.reports': 'Reportes',
  'admin.nav.settings': 'Configuración',
  'admin.status.operating': 'Operando',
  'admin.role': 'Administración',
  'admin.backToHub': 'Hub',
  'common.cancel': 'Cancelar',
  'common.save': 'Guardar',
  'common.edit': 'Editar',
  'common.create': 'Crear',
  'common.enable': 'Activar',
  'common.disable': 'Desactivar',
  'common.all': 'Todos',
  'common.active': 'Activo',
  'common.inactive': 'Inactivo',
  'common.clearFilters': 'Limpiar filtros',
  'common.customer': 'Cliente',
  'common.order': 'Pedido',
  'common.now': 'ahora',
  'common.updated': 'Actualizado',
  'status.draft': 'Borrador',
  'status.created': 'Creado',
  'status.inKitchen': 'En cocina',
  'status.preparing': 'Preparando',
  'status.ready': 'Listo',
  'status.delivered': 'Entregado',
  'status.closed': 'Cerrado',
  'status.canceled': 'Cancelado',
  'status.online': 'Online',
  'status.offline': 'Offline',
  'status.maintenance': 'Mantenimiento',
  'dash.subtitle': 'Vista general de la operación en tiempo real',
  'dash.ordersToday': 'Pedidos hoy',
  'dash.revenueToday': 'Ingresos hoy',
  'dash.avgTicket': 'Ticket promedio',
  'dash.inKitchen': 'En cocina',
  'dash.avgPrepTime': 'Tiempo prom. prep.',
  'dash.ordersPerHour': 'Pedidos por hora',
  'dash.today': 'Hoy',
  'dash.orderSingular': 'pedido',
  'dash.orderPlural': 'pedidos',
  'dash.activity': 'Actividad',
  'dash.live': 'en vivo',
  'dash.noOrders': 'Sin pedidos aún',
  'dash.noOrdersDesc': 'Los pedidos aparecerán aquí en tiempo real.',
  'dash.bestSellers': 'Productos más vendidos',
  'dash.minAgo': 'min',
  'dash.tableLabel': 'Mesa',
  'adminQueue.title': 'Fila de espera',
  'adminQueue.subtitle': 'Gestión de la fila de atención presencial',
  'adminQueue.enabled': 'Fila activa',
  'adminQueue.disabled': 'Fila inactiva',
  'adminQueue.settings': 'Configuración de la fila',
  'adminQueue.enabledDesc': 'Fila habilitada — visible en el Menú Digital',
  'adminQueue.disabledDesc': 'Fila deshabilitada',
  'adminQueue.messageLabel': 'Mensaje mostrado a los clientes',
  'adminQueue.messagePlaceholder': 'ej: ¡Sigue tu pedido aquí!',
  'adminQueue.waiting': 'Esperando',
  'adminQueue.serving': 'Siendo atendido',
  'adminQueue.completed': 'Completados',
  'adminQueue.callNextBtn': 'Llamar siguiente',
  'adminQueue.openTickets': 'Tickets abiertos',
  'adminQueue.noOpenTickets': 'Sin tickets abiertos',
  'adminQueue.empty': 'La fila está vacía por ahora.',
  'adminQueue.ticket': 'Ticket',
  'adminQueue.orderLabel': 'Pedido',
  'adminQueue.callBtn': 'Llamar',
  'adminQueue.attendBtn': 'Atender',
  'adminQueue.completeBtn': 'Completar',
  'adminQueue.activatedToast': 'Fila activada — visible en el Menú Digital',
  'adminQueue.deactivatedToast': 'Fila desactivada',
  'adminQueue.enableBtn': 'Habilitar fila',
  'adminQueue.callingToast': 'Llamando ticket #{ticket} — {name}',
  'adminQueue.msgSavedToast': 'Mensaje de la fila actualizado',
  'adminQueue.waitTime': 'Espera',
  'adminQueue.cancelBtn': 'Cancelar',
  'adminQueue.configure': 'Configurar',
  'adminQueue.cancelledToast': 'Ticket cancelado',
  'adminSettings.title': 'Configuración',
  'adminSettings.subtitle': 'Identidad, sucursal, operación e integración',
  'adminSettings.identity': 'Identidad del restaurante',
  'adminSettings.identityDesc': 'Nombre y logo mostrados en el Menú Digital y el Kiosk.',
  'adminSettings.restaurantName': 'Nombre del restaurante',
  'adminSettings.restaurantNamePlaceholder': 'Nombre del establecimiento',
  'adminSettings.logoUrl': 'URL del logotipo',
  'adminSettings.logoUrlDesc': 'Pega la URL pública de la imagen (PNG, SVG o JPG).',
  'adminSettings.logoPreview': 'Vista previa del logo',
  'adminSettings.defaultLanguage': 'Idioma predeterminado',
  'adminSettings.defaultLanguageDesc': 'Idioma inicial para el Menú Digital y Kiosk de este tenant.',
  'adminSettings.branch': 'Sucursal / Unidad',
  'adminSettings.branchDesc': 'Información de la unidad física y tipo de operación.',
  'adminSettings.branchName': 'Nombre de la sucursal',
  'adminSettings.branchNamePlaceholder': 'Nombre de la unidad',
  'adminSettings.address': 'Dirección',
  'adminSettings.addressPlaceholder': 'Calle, número, ciudad...',
  'adminSettings.serviceType': 'Tipo de servicio',
  'adminSettings.serviceTable': 'Servicio de mesa',
  'adminSettings.serviceTakeaway': 'Takeaway',
  'adminSettings.serviceKiosk': 'Kiosk / Autoservicio',
  'adminSettings.financial': 'Financiero',
  'adminSettings.financialDesc': 'Moneda y cargo por servicio aplicados a los pedidos.',
  'adminSettings.currency': 'Moneda',
  'adminSettings.serviceFee': 'Cargo por servicio',
  'adminSettings.serviceFeeHint': 'Ej: 0.1 = 10%',
  'adminSettings.payments': 'Formas de pago',
  'adminSettings.paymentsDesc': 'Elegí qué formas de pago ofrece el tótem al cliente.',
  'adminSettings.payCard': 'Tarjeta',
  'adminSettings.payPix': 'PIX',
  'adminSettings.payMercadoPago': 'Mercado Pago',
  'adminSettings.payCash': 'Efectivo',
  'adminSettings.paymentOn': 'Habilitado',
  'adminSettings.paymentOff': 'Deshabilitado',
  'adminSettings.queueSection': 'Fila de espera',
  'adminSettings.queueDesc': 'Configuración de la fila visible en el Menú Digital.',
  'adminSettings.queueEnabledLabel': 'Fila habilitada',
  'adminSettings.queueDisabledLabel': 'Fila deshabilitada',
  'adminSettings.queueMessage': 'Mensaje de la fila',
  'adminSettings.queueMessageDesc': 'Mostrado a los clientes en la pantalla de fila del Menú Digital.',
  'adminSettings.queueMessagePlaceholder': 'ej: ¡Sigue tu pedido aquí!',
  'adminSettings.saveSuccess': 'Configuración guardada con éxito',
  'adminSettings.saveError': 'Error al guardar — intenta de nuevo',
  'adminLoyalty.title': 'Fidelidad',
  'adminLoyalty.subtitle': 'Tarjetas de fidelidad de los clientes',
  'adminLoyalty.customerSingular': 'cliente',
  'adminLoyalty.customerPlural': 'clientes',
  'adminLoyalty.noCustomers': 'Sin clientes registrados',
  'adminLoyalty.noCustomersDesc': 'Los clientes que usen el programa de fidelidad aparecerán aquí.',
  'adminLoyalty.stamps': 'Sellos',
  'adminLoyalty.totalEarned': 'Total ganado',
  'adminLoyalty.discountsUsed': 'Descuentos usados',
  'adminLoyalty.noCard': 'Sin tarjeta encontrada',
  'adminTables.title': 'Mesas',
  'adminTables.tableSingular': 'mesa',
  'adminTables.tablePlural': 'mesas',
  'adminTables.registered': 'registrada',
  'adminTables.registeredPlural': 'registradas',
  'adminTables.newTable': 'Nueva mesa',
  'adminTables.searchPlaceholder': 'Buscar mesa, zona, mozo...',
  'adminTables.filterAll': 'Todas',
  'adminTables.filterActive': 'Activas',
  'adminTables.filterInactive': 'Inactivas',
  'adminTables.filterAllZones': 'Todas las zonas',
  'adminTables.ofCount': 'de',
  'adminTables.noTablesFound': 'No se encontraron mesas',
  'adminTables.noTablesFoundDesc': 'Intenta ajustar los filtros o crear una nueva mesa.',
  'adminTables.colZone': 'Zona',
  'adminTables.colWaiter': 'Mozo',
  'adminTables.colSeats': 'Lugares',
  'adminTables.colValidation': 'Validación',
  'adminTables.tableActive': 'Activa',
  'adminTables.tableInactive': 'Inactiva',
  'adminTables.editTitle': 'Editar Mesa {n}',
  'adminTables.newTitle': 'Nueva mesa',
  'adminTables.number': 'Número / Nombre',
  'adminTables.numberPlaceholder': 'ej: 1, A3, VIP-1',
  'adminTables.capacity': 'Capacidad (lugares)',
  'adminTables.capacityPlaceholder': 'ej: 4',
  'adminTables.zone': 'Zona / Área',
  'adminTables.noZone': '— Sin zona —',
  'adminTables.waiter': 'Mozo responsable',
  'adminTables.noWaiter': '— Sin asignación —',
  'adminTables.notes': 'Observaciones',
  'adminTables.notesPlaceholder': 'ej: junto a la ventana, accesible, reservada para VIP...',
  'adminTables.isActive': 'Mesa activa',
  'adminTables.saveChanges': 'Guardar cambios',
  'adminTables.createTable': 'Crear mesa',
  'adminTables.colZones': 'Zonas / Áreas',
  'adminTables.noZones': 'Sin zonas',
  'adminTables.noZonesDesc': 'Crea zonas para organizar tus mesas.',
  'adminTables.newZonePlaceholder': 'Nueva zona...',
  'adminTables.addZone': 'Agregar zona',
  'adminTables.removeZone': 'Eliminar zona',
  'adminTables.updatedToast': 'Mesa {n} actualizada',
  'adminTables.createdToast': 'Mesa {n} creada',
  'adminTables.disabledToast': 'Mesa desactivada',
  'adminTables.enabledToast': 'Mesa activada',
  'adminTables.codeRegeneratedToast': 'Código regenerado',
  'adminTables.regenerateCode': 'Regenerar código',
  'adminAggregator.title': 'Agregadores',
  'adminAggregator.subtitle': 'Integraciones con plataformas de delivery externas',
  'adminAggregator.noAggregators': 'Sin agregadores configurados',
  'adminAggregator.noAggregatorsDesc': 'Configura integraciones con iFood, Rappi y otras plataformas.',
  'adminAggregator.simulateOrder': 'Simular pedido',
  'adminAggregator.activatedToast': '{platform} activado',
  'adminAggregator.deactivatedToast': '{platform} desactivado',
  'adminAggregator.simulatedToast': 'Pedido simulado de {platform} enviado a cocina',
  'adminOrders.title': 'Pedidos',
  'adminOrders.searchPlaceholder': 'Buscar pedido, cliente o mesa...',
  'adminOrders.filterAll': 'Todos',
  'adminOrders.filterInKitchen': 'En cocina',
  'adminOrders.filterPreparing': 'Preparando',
  'adminOrders.filterReady': 'Listos',
  'adminOrders.filterDelivered': 'Entregados',
  'adminOrders.filterPaid': 'Pagados',
  'adminOrders.filterUnpaid': 'No pagados',
  'adminOrders.noOrders': 'No se encontraron pedidos',
  'adminOrders.noOrdersDesc': 'Ningún pedido coincide con los filtros seleccionados.',
  'adminOrders.colOrder': 'Pedido',
  'adminOrders.colTable': 'Mesa',
  'adminOrders.colPayment': 'Pago',
  'adminOrders.colOrigin': 'Origen',
  'adminOrders.colTime': 'Hora',
  'adminOrders.sectionCustomer': 'Cliente',
  'adminOrders.sectionItems': 'Ítems',
  'adminOrders.sectionHistory': 'Historial',
  'adminOrders.tableLabel': 'Mesa',
  'adminOrders.itemNote': 'Obs: {note}',
  'adminOrders.subtotal': 'Subtotal',
  'adminOrders.serviceFee': 'Cargo por servicio',
  'adminOrders.actionSendKitchen': 'Enviar a cocina',
  'adminOrders.actionPreparing': 'Marcar como preparando',
  'adminOrders.actionReady': 'Marcar como listo',
  'adminOrders.actionDelivered': 'Marcar como entregado',
  'adminOrders.actionClose': 'Cerrar pedido',
  'adminOrders.updatedToast': 'Pedido actualizado → {status}',
  'adminProducts.title': 'Productos',
  'adminProducts.productSingular': 'producto',
  'adminProducts.productPlural': 'productos',
  'adminProducts.inCatalog': 'en el catálogo',
  'adminProducts.newProduct': 'Nuevo producto',
  'adminProducts.searchPlaceholder': 'Buscar producto...',
  'adminProducts.noProducts': 'No se encontraron productos',
  'adminProducts.noProductsDesc': 'Intenta cambiar los filtros o crea un nuevo producto.',
  'adminProducts.createFirst': 'Crear primer producto',
  'adminProducts.colProduct': 'Producto',
  'adminProducts.colCategory': 'Categoría',
  'adminProducts.colPrice': 'Precio',
  'adminProducts.colFeatured': 'Destacado',
  'adminProducts.featured': 'Destacado',
  'adminProducts.removeFeatured': 'Quitar destacado',
  'adminProducts.addFeatured': 'Marcar como destacado',
  'adminProducts.editProduct': 'Editar producto',
  'adminProducts.editTitle': 'Editar producto',
  'adminProducts.newTitle': 'Nuevo producto',
  'adminProducts.name': 'Nombre',
  'adminProducts.price': 'Precio',
  'adminProducts.imageUrl': 'URL de imagen',
  'adminProducts.description': 'Descripción',
  'adminProducts.category': 'Categoría',
  'adminProducts.kitchenStation': 'Estación de cocina',
  'adminProducts.stationGeneral': 'General',
  'adminProducts.stationGrill': 'Parrilla / Grill',
  'adminProducts.stationBar': 'Bar / Bebidas',
  'adminProducts.stationColdFood': 'Fríos / Ensaladas',
  'adminProducts.stationDesserts': 'Postres',
  'adminProducts.stationFried': 'Fritos',
  'adminProducts.available': 'Disponible',
  'adminProducts.updatedToast': 'Producto actualizado',
  'adminProducts.createdToast': 'Producto creado',
  'adminProducts.disabledToast': 'Producto desactivado',
  'adminProducts.enabledToast': 'Producto activado',
  'adminProducts.removedFeaturedToast': 'Destacado eliminado',
  'adminProducts.addedFeaturedToast': 'Marcado como destacado',
  'adminCategories.title': 'Categorías',
  'adminCategories.catSingular': 'categoría',
  'adminCategories.catPlural': 'categorías',
  'adminCategories.inCatalog': 'en el catálogo',
  'adminCategories.newCategory': 'Nueva categoría',
  'adminCategories.noCategories': 'Sin categorías aún',
  'adminCategories.noCategoriesDesc': 'Crea categorías para organizar tu menú.',
  'adminCategories.createFirst': 'Crear primera categoría',
  'adminCategories.colCategory': 'Categoría',
  'adminCategories.colOrder': 'Orden',
  'adminCategories.statusActive': 'Activa',
  'adminCategories.statusInactive': 'Inactiva',
  'adminCategories.editTitle': 'Editar categoría',
  'adminCategories.newTitle': 'Nueva categoría',
  'adminCategories.name': 'Nombre',
  'adminCategories.imageUrl': 'URL de imagen',
  'adminCategories.isActive': 'Activa',
  'adminCategories.updatedToast': 'Categoría actualizada',
  'adminCategories.createdToast': 'Categoría creada',
  'adminCategories.disabledToast': 'Categoría desactivada',
  'adminCategories.enabledToast': 'Categoría activada',
  'imageUpload.urlPlaceholder': 'Pegar una URL de imagen',
  'imageUpload.uploadButton': 'Subir archivo',
  'adminKiosks.title': 'Kiosks',
  'adminKiosks.addKiosk': 'Agregar kiosk',
  'adminKiosks.searchPlaceholder': 'Buscar dispositivo...',
  'adminKiosks.filterAll': 'Todos',
  'adminKiosks.filterOnline': 'Online',
  'adminKiosks.filterOffline': 'Offline',
  'adminKiosks.filterMaintenance': 'Mantenimiento',
  'adminKiosks.tabDevices': 'Dispositivos',
  'adminKiosks.tabAttractScreen': 'Pantalla de Atracción',
  'adminKiosks.tabBranding': 'Marca',
  'adminKiosks.tabMedia': 'Medios',
  'adminKiosks.tabBehavior': 'Comportamiento',
  'adminKiosks.colDevice': 'Dispositivo',
  'adminKiosks.colLastActivity': 'Última actividad',
  'adminKiosks.noDevices': 'Sin dispositivos',
  'adminKiosks.noDevicesDesc': 'No hay kiosks registrados aún.',
  'adminKiosks.colId': 'ID',
  'adminKiosks.colBranch': 'Sucursal',
  'adminKiosks.colRegistered': 'Registrado',
  'adminKiosks.attractConfig': 'Configuración general',
  'adminKiosks.attractConfigDesc': 'Mostrada cuando el kiosk está sin uso. Los cambios entran en vigor la próxima vez que la pantalla se cargue.',
  'adminKiosks.enableAttractScreen': 'Activar pantalla de atracción',
  'adminKiosks.attractEnabled': 'Activada',
  'adminKiosks.attractDisabled': 'Desactivada',
  'adminKiosks.restaurantNameLabel': 'Nombre del restaurante',
  'adminKiosks.slogan': 'Slogan',
  'adminKiosks.sloganDesc': 'Mostrado debajo del nombre (opcional).',
  'adminKiosks.sloganPlaceholder': 'Ej: Lo mejor de la ciudad',
  'adminKiosks.videoUrl': 'URL del video',
  'adminKiosks.videoUrlDesc': 'Sin video, se usa fondo con degradado (opcional).',
  'adminKiosks.idleTimeout': 'Tiempo de inactividad: {s}s',
  'adminKiosks.idleTimeoutDesc': "Tras ese tiempo sin toque, aparece el aviso '¿Sigues ahí?'.",
  'adminKiosks.sliderMin': '30s',
  'adminKiosks.sliderMax': '300s',
  'adminKiosks.previewLabel': 'Vista previa',
  'adminKiosks.touchToStart': 'Toca para comenzar',
  'adminKiosks.attractDisabledPreview': 'Pantalla de atracción desactivada',
  'adminKiosks.attractPreviewNote': 'Pantalla mostrada cuando el kiosk está sin uso',
  'adminKiosks.sectionSoon': 'Esta sección se configurará próximamente.',
  'adminKiosks.nowAgo': 'Ahora mismo',
  'adminKiosks.minAgo': 'min atrás',
  'adminKiosks.hourAgo': 'h atrás',
  'adminKiosks.dayAgo': 'd atrás',
  'adminKiosks.viewDetails': 'Ver detalles',
  'adminKiosks.reloadConfig': 'Recargar configuración',
  'adminKiosks.removeDevice': 'Eliminar dispositivo',
  'adminKiosks.editBtn': 'Editar',
  'adminKiosks.reloadBtn': 'Recargar',
  'adminKiosks.previewBtn': 'Vista previa',
  'adminKiosks.removeBtn': 'Eliminar',
  'cashier.title': 'Caja / Pagos',
  'cashier.live': 'En vivo',
  'cashier.hub': 'Hub',
  'cashier.tab.orders': 'Mesas / Pedidos',
  'cashier.tab.history': 'Historial',
  'cashier.tab.receipts': 'Recibos',
  'cashier.tab.invoices': 'Facturas',
  'cashier.metric.received': 'Cobrado hoy',
  'cashier.metric.paid': 'Pedidos pagados',
  'cashier.metric.pending': 'Por cobrar',
  'cashier.metric.tables': 'Mesas pendientes',
  'cashier.filter.all': 'Todos',
  'cashier.filter.pending': 'Pendientes',
  'cashier.filter.partial': 'Parcial',
  'cashier.filter.paid': 'Pagados',
  'cashier.filter.search': 'Buscar mesa...',
  'cashier.collapse': 'Contraer',
  'cashier.expand': 'Expandir',
  'cashier.pay.totalDue': 'Total de la cuenta',
  'cashier.pay.alreadyPaid': 'Ya pagado',
  'cashier.pay.amountDue': 'Monto a cobrar',
  'cashier.pay.chargeMode': 'Forma de cobro',
  'cashier.pay.remaining': 'Total restante',
  'cashier.pay.partial': 'Monto parcial',
  'cashier.pay.method': 'Forma de pago',
  'cashier.pay.receive': 'Cobrar {amount}',
  'cashier.pay.processing': 'Procesando...',
  'cashier.pay.cancel': 'Cancelar',
  'cashier.pay.done': '¡Pago recibido!',
  'cashier.pay.change': 'Vuelto',
  'cashier.pay.print': 'Recibo',
  'cashier.pay.close': 'Cerrar',
  'cashier.pay.cashGiven': 'Monto entregado por el cliente',
  'cashier.pay.remainingAfter': 'Restante tras el pago:',
  'cashier.method.cash': 'Efectivo',
  'cashier.method.card': 'Tarjeta',
  'cashier.method.pix': 'PIX',
  'cashier.method.terminal': 'Terminal',
  'cashier.receipt.title': 'Recibo',
  'cashier.receipt.subtotal': 'Subtotal',
  'cashier.receipt.fee': 'Cargo por servicio',
  'cashier.receipt.total': 'TOTAL',
  'cashier.receipt.method': 'Forma:',
  'cashier.receipt.print': 'Imprimir',
  'cashier.receipt.close': 'Cerrar',
  'cashier.customer.subtotal': 'Subtotal',
  'cashier.customer.fee': 'Cargo por servicio (10%)',
  'cashier.customer.total': 'Total',
  'cashier.customer.paid': 'Ya pagado',
  'cashier.customer.due': 'Por cobrar',
  'cashier.customer.receive': 'Cobrar {amount}',
  'cashier.customer.partial': 'Parcial',
  'cashier.table.due': 'Por cobrar',
  'cashier.table.receive': 'Cobrar mesa',
  'cashier.table.total': 'Total cuenta:',
  'cashier.table.paid': 'Pagado:',
  'cashier.table.remaining': 'Restante:',
  'cashier.table.partialBtn': 'Monto parcial',
  'cashier.table.allPaid': 'Mesa totalmente pagada',
  'cashier.empty.tables': 'Sin mesas activas',
  'cashier.empty.tablesDesc': 'Cuando haya pedidos en curso, las mesas aparecerán aquí.',
  'cashier.empty.history': 'Sin pagos',
  'cashier.empty.receipts': 'Sin recibos generados',
  'cashier.empty.invoices': 'Sin facturas generadas',
  'cashier.empty.pendingTables': 'Sin mesas esperando pago.',
  'cashier.col.order': 'Pedido',
  'cashier.col.customer': 'Cliente',
  'cashier.col.table': 'Mesa',
  'cashier.col.total': 'Total',
  'cashier.col.paid': 'Pagado',
  'cashier.col.method': 'Forma',
  'cashier.col.status': 'Estado',
  'cashier.col.actions': 'Acciones',
  'cashier.col.number': 'Número',
  'cashier.col.date': 'Fecha',
  'cashier.status.paid': 'Pagado',
  'cashier.status.partial': 'Parcial',
  'cashier.status.pending': 'Pendiente',
  'cashier.kiosk.alerts': 'Alertas de Totem',
  'cashier.kiosk.resolve': 'Resolver',
  'cashier.kiosk.needsHelp': 'Necesita ayuda',
  'cashier.kiosk.printFailed': 'Ticket no impreso',
  'cashier.kiosk.totemN': 'Totem {n}',
  'cashier.kiosk.noAlerts': 'Sin alertas activas',
  'queue.nowCalling': 'LLAMANDO AHORA',
  'queue.pickupAtCounter': 'Retire su pedido en el mostrador',
  'queue.ticketLabel': 'TURNO',
  'queue.preparingTitle': 'Preparando sus pedidos',
  'queue.preparingSub': 'Lo llamaremos en cuanto esté listo',
  'queue.allReady': 'Todos los pedidos listos',
  'queue.noActiveTitle': 'Ningún pedido activo',
  'queue.noActiveSub': 'Haga su pedido para aparecer aquí',
  'queue.headerTitle': 'Siga su pedido',
  'queue.readyColumn': '¡Listo — Retire!',
  'queue.preparingColumn': 'En preparación',
  'queue.pageOf': 'Pág. {page} de {total}',
  'queue.refreshNote': 'Se actualiza cada 3 segundos',
  'queue.checkPrintedTicket': 'Verifique el número en el ticket impreso',
  'queue.restaurantFallback': 'Restaurante',
  'kitchen.title': 'Cocina',
  'kitchen.priority.urgent': 'URGENTE',
  'kitchen.priority.vip': 'VIP',
  'kitchen.action.start': 'Iniciar preparación',
  'kitchen.action.ready': 'Marcar listo',
  'kitchen.action.deliver': 'Marcar entregado',
  'kitchen.col.new': 'Nuevos',
  'kitchen.col.preparing': 'Preparando',
  'kitchen.col.ready': 'Listos',
  'kitchen.empty.new': 'Ningún pedido nuevo',
  'kitchen.empty.preparing': 'Ningún pedido en preparación',
  'kitchen.empty.ready': 'Ningún pedido listo',
  'kitchen.empty.generic': 'Ningún pedido',
  'kitchen.notify.preparing': 'Preparación iniciada',
  'kitchen.notify.ready': '✅ ¡Pedido listo!',
  'kitchen.notify.delivered': 'Entregado al cliente',
  'kitchen.notify.statusUpdated': 'Estado actualizado',
  'kitchen.filter.all': 'Todas las filas',
  'kitchen.meta.table': 'Mesa {n}',
  'kitchen.meta.delivery': 'Delivery',
  'kitchen.meta.counter': 'Mostrador',
  'kitchen.stat.delivered': 'Entregados',
  'kitchen.stat.avgTime': 'Tiempo promedio',
  'kitchen.stat.longestWait': 'Mayor espera',
  'kitchen.live': 'EN VIVO',
  'kitchen.tooltip.hub': 'Hub',
  'kitchen.tooltip.mute': 'Silenciar',
  'kitchen.tooltip.unmute': 'Activar sonido',
  'kitchen.tooltip.fullscreen': 'Pantalla completa',
  'kitchen.tooltip.exitFullscreen': 'Salir de pantalla completa',
  'reports.title': 'Reportes',
  'reports.role': 'Análisis',
  'reports.section.dashboard': 'Panel general',
  'reports.section.fechamento': 'Cierre diario',
  'reports.section.vendas': 'Ventas',
  'reports.section.pagamentos': 'Pagos',
  'reports.section.produtos': 'Productos más vendidos',
  'reports.section.mesas': 'Ingresos por mesa',
  'reports.section.garcons': 'Ingresos por mozo',
  'reports.section.cozinha': 'Desempeño de la cocina',
  'reports.section.ocupacao': 'Ocupación / horarios ociosos',
  'reports.section.reservas': 'Reservas',
  'reports.section.exportacoes': 'Exportaciones',
  'reports.navGroup.overview': 'Visión general',
  'reports.navGroup.financial': 'Finanzas',
  'reports.navGroup.performance': 'Desempeño',
  'reports.nav.ocupacao': 'Ocupación / horarios',
  'reports.method.cash': 'Efectivo',
  'reports.method.card': 'Tarjeta',
  'reports.method.pix': 'PIX',
  'reports.method.terminal': 'Terminal',
  'reports.method.other': 'Otros',
  'reports.today': 'Hoy',
  'reports.yesterday': 'Ayer',
  'reports.refresh': 'Actualizar',
  'reports.csv': 'CSV',
  'reports.exportCsv': 'Exportar CSV',
  'reports.csvExported': 'CSV exportado',
  'reports.admin': 'Administración',
  'reports.kpi.revenue': 'Facturación',
  'reports.kpi.totalOrders': 'Total de pedidos',
  'reports.kpi.paidOrders': 'Pedidos pagados',
  'reports.kpi.avgTicket': 'Ticket promedio',
  'reports.kpi.serviceFee': 'Tarifa de servicio',
  'reports.kpi.canceled': 'Cancelados',
  'reports.noData.title': 'Sin datos para este período',
  'reports.noData.desc': 'No se registraron ventas en {date}. Intente seleccionar otra fecha.',
  'reports.notFound.title': 'Sección no encontrada',
  'reports.notFound.desc': 'Seleccione una sección válida en el menú lateral.',
  'reports.empty.byHour': 'Sin datos por hora',
  'reports.empty.payments': 'Sin pagos registrados',
  'reports.empty.products': 'Sin productos vendidos',
  'reports.empty.tables': 'Sin datos de mesas',
  'reports.empty.waiters': 'Sin datos de mozos',
  'reports.ordersN': '{n} pedidos',
  'reports.ordersAbbrN': '{n} ped.',
  'reports.unitsN': '{n} un.',
  'reports.peakHour': 'Hora pico',
  'reports.topRevenueHour': 'Hora más rentable',
  'reports.ordersInDay': 'pedidos en el día',
  'reports.paid': 'pagados',
  'reports.sortRevenue': 'Ingresos',
  'reports.sortQty': 'Cant.',
  'reports.tableN': 'Mesa {n}',
  'reports.details': 'Detalles',
  'reports.waiter.name': 'Mozo',
  'reports.waiter.orders': 'Pedidos',
  'reports.waiter.tables': 'Mesas',
  'reports.waiter.grossSales': 'Ventas brutas',
  'reports.insights.title': 'Destacados del día',
  'reports.insights.quietHour': 'Hora más tranquila',
  'reports.promoOpportunity': 'oportunidad de promoción',
  'reports.insights.topTable': 'Mesa más rentable',
  'reports.insights.topProduct': 'Producto destacado',
  'reports.insights.bestWaiter': 'Mejor mozo',
  'reports.insights.payRate': 'Tasa de pago',
  'reports.insights.payRateSub': '{paid} de {total} pedidos',
  'reports.insights.grossSalesSub': '+ {fee} en tarifa de servicio',
  'reports.card.ordersByHour': 'Pedidos por hora',
  'reports.card.hoursActive': '{n} horas con actividad',
  'reports.card.paymentMethods': 'Formas de pago',
  'reports.card.byRevenue': 'Distribución por ingresos',
  'reports.card.topItems': 'Top {n} ítems del día',
  'reports.card.tablesActive': '{n} mesas con movimiento',
  'reports.card.waiterPerf': 'Rendimiento de los mozos',
  'reports.card.byRevenueGenerated': 'Clasificado por ingresos generados',
  'reports.card.financialSummary': 'Resumen financiero',
  'reports.fin.totalRevenue': 'Facturación total',
  'reports.dateByRevenue': '{date} — distribución por ingresos',
  'reports.dateTopItems': '{date} — top {n} ítems',
  'reports.dateTablesActive': '{date} — {n} mesas con movimiento',
  'reports.dateWaiterRanked': '{date} — clasificado por ingresos generados',
  'reports.dateHoursActive': '{date} — {n} horas con actividad',
  'reports.exports.subtitle': 'Exportar datos del período seleccionado',
  'reports.exports.closingReport': 'Reporte de cierre (CSV)',
  'reports.exports.closingDesc': '{date} — pedidos, pagos, productos, mesas y mozos',
  'reports.ph.vendasTitle': 'Análisis de ventas en desarrollo',
  'reports.ph.vendasDesc': 'Reporte de tendencias y comparativos de ventas. Disponible próximamente.',
  'reports.ph.cozinhaTitle': 'Desempeño de la cocina en desarrollo',
  'reports.ph.cozinhaDesc': 'Tiempo promedio de preparación y eficiencia de la cocina. Disponible próximamente.',
  'reports.ph.reservasTitle': 'Reporte de reservas en desarrollo',
  'reports.ph.reservasDesc': 'Ocupación y análisis de reservas. Disponible próximamente.',
  'res.title': 'Reservas',
  'res.today': 'Hoy',
  'res.noTable': 'Sin mesa',
  'res.guestsN': '{n} personas',
  'res.tableN': 'Mesa {n}',
  'res.seatsN': '{n} lugares',
  'res.conflict': 'Conflicto',
  'res.free': 'Libre',
  'res.available': 'Disponible',
  'res.reserve': 'Reservar',
  'res.back': 'Volver',
  'res.view': 'Ver',
  'res.hub': 'Hub',
  'res.confirm': 'Confirmar',
  'res.minN': '{n} min',
  'res.hoursN': '{n}h',
  'res.timeNow': 'ahora',
  'res.status.pending': 'Pendiente',
  'res.status.confirmed': 'Confirmada',
  'res.status.seated': 'Sentado',
  'res.status.completed': 'Completada',
  'res.status.canceled': 'Cancelada',
  'res.status.noShow': 'No vino',
  'res.tag.birthday': '🎂 Cumpleaños',
  'res.tag.vip': '⭐ VIP',
  'res.tag.allergy': '⚠️ Alergia',
  'res.tag.anniversary': '💍 Pareja',
  'res.tag.late': '⏰ Retraso',
  'res.source.phone': 'Teléfono',
  'res.source.walkIn': 'Presencial',
  'res.source.online': 'Online',
  'res.urgency.overdue': 'Retrasada {n}min',
  'res.urgency.now': 'Ahora',
  'res.urgency.inMin': 'En {n}min',
  'res.urgency.vip': 'VIP',
  'res.metrics.total': 'Total',
  'res.metrics.confirmed': 'Confirmadas',
  'res.metrics.pending': 'Pendientes',
  'res.metrics.seated': 'Sentados',
  'res.metrics.canceled': 'Canceladas',
  'res.metrics.noShow': 'No vinieron',
  'res.action.confirm': 'Confirmar',
  'res.action.seat': 'Sentar',
  'res.action.complete': 'Finalizar',
  'res.action.seatDirect': 'Sentar directamente',
  'res.action.editReservation': 'Editar reserva',
  'res.action.noShow': 'No se presentó',
  'res.action.cancelReservation': 'Cancelar reserva',
  'res.action.reopenPending': 'Reabrir como pendiente',
  'res.action.viewDetails': 'Ver detalles',
  'res.action.edit': 'Editar',
  'res.action.cancel': 'Cancelar',
  'res.action.reopen': 'Reabrir',
  'res.empty.title': 'Sin reservas',
  'res.empty.desc': 'No se encontraron reservas con los filtros seleccionados.',
  'res.emptyTable.title': 'Ninguna reserva',
  'res.reservationsCountN': '{n} reservas',
  'res.col.dateTime': 'Fecha / Hora',
  'res.col.customer': 'Cliente',
  'res.col.phone': 'Teléfono',
  'res.col.guests': 'Personas',
  'res.col.table': 'Mesa',
  'res.col.status': 'Estado',
  'res.col.channel': 'Canal',
  'res.col.notes': 'Obs.',
  'res.walkin.queue': 'Fila de espera',
  'res.walkin.add': 'Agregar a la fila',
  'res.walkin.emptyTitle': 'Fila vacía',
  'res.walkin.emptyDesc': 'Ningún cliente esperando en este momento.',
  'res.walkin.waitingSince': 'Esperando hace ',
  'res.walkin.since': 'Hace ',
  'res.walkin.estWait': 'Espera estimada: ~{n}min',
  'res.walkin.seat': 'Sentar',
  'res.walkin.remove': 'Quitar',
  'res.walkin.historyToday': 'Historial de hoy ({n})',
  'res.walkin.seated': 'Sentado',
  'res.walkin.removed': 'Quitado',
  'res.walkin.nameOrGroup': 'Nombre o grupo *',
  'res.walkin.nameOrGroupPlaceholder': 'Ej: Familia García',
  'res.walkin.estWaitMin': 'Espera estimada (min)',
  'res.settings.title': 'Configuración de reservas',
  'res.settings.hours': 'Horarios de atención',
  'res.settings.opening': 'Apertura',
  'res.settings.closing': 'Cierre',
  'res.settings.params': 'Parámetros',
  'res.settings.defaultDuration': 'Duración predeterminada (min)',
  'res.settings.defaultDurationHint': 'Duración estándar de cada reserva',
  'res.settings.lateTolerance': 'Tolerancia de retraso (min)',
  'res.settings.lateToleranceHint': 'Antes de marcar como no presentado',
  'res.settings.slotInterval': 'Intervalo entre horarios (min)',
  'res.settings.slotIntervalHint': 'Granularidad en el mapa de ocupación',
  'res.settings.maxParty': 'Máximo de personas por reserva',
  'res.settings.save': 'Guardar configuración',
  'res.settings.saved': '¡Guardado!',
  'res.modal.customerData': 'Datos del cliente',
  'res.modal.name': 'Nombre *',
  'res.modal.namePlaceholder': 'Nombre del cliente',
  'res.modal.phone': 'Teléfono',
  'res.modal.guests': 'Nº de personas',
  'res.modal.details': 'Detalles de la reserva',
  'res.modal.date': 'Fecha',
  'res.modal.time': 'Horario',
  'res.modal.duration': 'Duración (min)',
  'res.modal.source': 'Origen',
  'res.modal.tableOptional': '(opcional)',
  'res.modal.noTableOption': '— Sin mesa asignada —',
  'res.modal.notesTags': 'Observaciones y etiquetas',
  'res.modal.notes': 'Observaciones',
  'res.modal.notesPlaceholder': 'Ej: ventana, silla para bebé...',
  'res.modal.tags': 'Etiquetas',
  'res.modal.saveReservation': 'Guardar reserva',
  'res.modal.cancel': 'Cancelar',
  'res.modal.close': 'Cerrar',
  'res.occ.allTables': 'Todas',
  'res.occ.week': 'Semana',
  'res.occ.day': 'Día',
  'res.occ.month': 'Mes',
  'res.occ.viewDayDetails': 'Ver detalles del día',
  'res.occ.noSlots': 'Sin horarios configurados',
  'res.occ.occupiedShort': '{n} ocup.',
  'res.occ.freeShortN': '{n} libres',
  'res.occ.freeLower': 'libre',
  'res.occ.maxOccTitle': '{date} — Ocupación máx: {pct}%',
  'res.occ.occupied': 'Ocupadas',
  'res.occ.free2': 'Libres',
  'res.occ.occ': 'Ocup.',
  'res.occ.noActiveTables': 'Ninguna mesa activa',
  'res.occ.available': 'Disponibles',
  'res.occ.cancelConfirm': '¿Cancelar la reserva de {name}?',
  'res.occ.capacityUndefined': 'Capacidad no definida',
  'res.newReservationTable': 'Nueva reserva — Mesa {n}',
  'res.notif.canceled': 'Reserva cancelada',
  'res.notif.created': 'Reserva creada con éxito',
  'res.notif.createdShort': 'Reserva creada',
  'res.notif.updated': 'Reserva actualizada',
  'res.notif.status': 'Reserva: {status}',
  'res.notif.customerSeated': 'Cliente sentado',
  'res.notif.removedFromQueue': 'Quitado de la fila',
  'res.notif.addedToQueue': 'Agregado a la fila',
  'res.notif.settingsSaved': 'Configuración guardada',
  'res.tab.queue': 'Fila',
  'res.tab.occupancy': 'Ocupación',
  'res.tab.settings': 'Config.',
  'res.view.agenda': 'Agenda',
  'res.view.table': 'Tabla',
  'res.view.byTable': 'Por mesa',
  'res.scope.date': 'Fecha',
  'res.scope.all': 'Todos',
  'res.topbar.occupancy': 'Mapa de ocupación',
  'res.topbar.settings': 'Configuración',
  'res.newReservation': 'Nueva reserva',
  'res.searchPlaceholder': 'Buscar cliente o teléfono...',
  'res.allStatuses': 'Todos los estados',
  'res.openMenu': 'Abrir menú',
  'res.closeMenu': 'Cerrar menú',
  'hub.loggedAs': 'Conectado como {name} ({role})',
  'hub.chooseArea': 'Prototype — elige un área para ingresar',
  'hub.logout': 'Salir',
  'hub.resetConfirm': '¿Resetear datos de demostración? Todas las interacciones serán borradas.',
  'hub.resetBtn': 'Resetear datos de demostración',
  'hub.printCard': 'Imprimir tarjeta',
  'hub.cardPreviewTitle': 'Vista previa de la tarjeta',
  'hub.printTableQr': 'Imprimir QR de la Mesa',
  'hub.tableQrTitle': 'QR de la Mesa',
  'hub.sectionCustomer': 'Áreas del cliente',
  'hub.sectionOps': 'Operación',
  'hub.sectionNew': 'Nuevas funcionalidades',
  'hub.area.menu.title': 'Menú Digital',
  'hub.area.menu.desc': 'Cliente – mesa / para llevar',
  'hub.area.kiosk.title': 'Kiosk / Tótem',
  'hub.area.kiosk.desc': 'Autoatención',
  'hub.area.queue.title': 'Panel de Cola',
  'hub.area.queue.desc': 'TV / display público',
  'hub.area.kitchen.title': 'Cocina',
  'hub.area.kitchen.desc': 'Operación de cocina',
  'hub.area.waiter.title': 'Mozo',
  'hub.area.waiter.desc': 'Atención de piso',
  'hub.area.cashier.title': 'Caja',
  'hub.area.cashier.desc': 'Pagos y facturas',
  'hub.area.admin.title': 'Admin',
  'hub.area.admin.desc': 'Gestión del restaurante',
  'hub.area.delivery.title': 'Delivery',
  'hub.area.delivery.desc': 'Gestión de entregas + Agregadores',
  'hub.area.reservations.title': 'Reservas',
  'hub.area.reservations.desc': 'Gestión de reservas',
  'hub.area.reports.title': 'Informes',
  'hub.area.reports.desc': 'Cierre y métricas',
  'hub.area.login.title': 'Login / Perfiles',
  'hub.area.login.desc': 'Cambiar usuario y rol',
  'login.greeting': '👋 Hola, {name}',
  'login.loggedAs': 'Conectado como',
  'login.goToArea': 'Ir a mi área',
  'login.switchUser': 'Cambiar usuario',
  'login.hub': 'Hub',
  'login.title': 'Iniciar sesión',
  'login.subtitle': 'Selecciona tu perfil (demostración)',
  'login.submit': 'Entrar',
  'login.continueDemo': 'Continuar sin login (modo demo)',
  'login.role.owner': 'Propietario',
  'login.role.manager': 'Gerente',
  'login.role.cashier': 'Caja',
  'login.role.waiter': 'Mozo',
  'login.role.kitchen': 'Cocina',
  'login.role.support': 'Soporte',
  'login.emailLabel': 'Email',
  'login.emailPlaceholder': 'tu@email.com',
  'login.passwordLabel': 'Contraseña',
  'login.error.invalidCredentials': 'Email o contraseña incorrectos.',
  'login.error.generic': 'Error al iniciar sesión. Inténtalo de nuevo.',
};

const en: LabelMap = {
  ...es,
  'nav.menu': 'Menu',
  'nav.waiter': 'Waiter',
  'nav.language': 'Language',
  'nav.order': 'Order',
  'nav.bill': 'Bill',
  'lang.selector': 'Language',
  'menu.searchPlaceholder': 'Search product',
  'menu.allCategories': 'All',
  'menu.featured': 'Featured',
  'menu.empty': 'No results',
  'menu.emptyDesc': 'Try a different search or category.',
  'menu.greeting': 'Hello',
  'menu.addedToCart': 'Added to cart',
  'menu.viewCart': 'View cart',
  'menu.loadError': "We couldn't load the menu.",
  'menu.retry': 'Try again',
  'menu.categoryEmpty': 'No products available.',
  'product.add': 'Add',
  'product.notes': 'Notes',
  'product.notesPlaceholder': 'E.g.: No onions',
  'product.required': 'required',
  'product.upTo': 'up to {max}',
  'product.selectRequired': 'Please select the required options.',
  'product.from': 'From',
  'cart.title': 'Cart',
  'cart.empty': 'Your cart is empty',
  'cart.emptyDesc': 'Go back to the menu and pick your favorites.',
  'cart.viewMenu': 'View menu',
  'cart.name': 'Name',
  'cart.namePlaceholder': 'Your name',
  'cart.changeName': 'Change',
  'cart.addMore': 'Add more items',
  'cart.placeOrder': 'Place order',
  'cart.placingOrder': 'Sending...',
  'cart.namePromptTitle': 'Before continuing',
  'cart.namePromptDesc': 'Enter your name to identify your order at the table.',
  'cart.confirmName': 'Continue',
  'cart.items': 'Your items',
  'cart.increase': 'Increase',
  'cart.decrease': 'Decrease',
  'cart.removeItem': 'Remove',
  'cart.each': 'each',
  'summary.serviceFee': 'Service fee',
  'bill.title': 'Bill',
  'bill.tabTable': 'Table',
  'bill.tabIndividual': 'My Bill',
  'bill.closeTable': 'Request table bill',
  'bill.closeMine': 'Request my bill',
  'bill.empty': 'No orders yet at this table.',
  'bill.requestSent': 'Close request sent to the waiter.',
  'bill.you': 'You',
  'waiter.title': 'Waiter',
  'waiter.help': 'Need help?',
  'waiter.helpDesc': 'Tap an option and a waiter will come to your table.',
  'waiter.formTitle': 'Call the waiter',
  'waiter.formDesc': 'Enter your details to help us assist you.',
  'waiter.name': 'Name',
  'waiter.namePlaceholder': 'Your name',
  'waiter.cancel': 'Cancel',
  'waiter.send': 'Continue',
  'waiter.sent': 'Request sent. A waiter is on the way.',
  'waiter.action.call': 'Call waiter',
  'waiter.action.bill': 'Request bill',
  'waiter.action.order': 'My orders',
  'waiter.action.other': 'Something else',
  'waiter.status.pending': 'Pending',
  'waiter.status.acknowledged': 'Acknowledged',
  'waiter.status.resolved': 'Resolved',
  'waiter.status.canceled': 'Canceled',
  'waiter.activeTitle': 'Request in progress',
  'waiter.historyTitle': 'History',
  'waiter.cancelRequest': 'Cancel request',
  'waiter.resolveRequest': 'Mark as resolved',
  'waiter.dupeActive': 'You already have an active request. Please wait to be assisted.',
  'waiter.tableUnknown': 'Table not identified.',
  'waiter.billError': "We couldn't request the bill. Please try again.",
  'waiter.requestCanceled': 'Request canceled.',
  'waiter.requestResolved': 'Request marked as resolved.',
  'rating.title': 'Rate',
  'rating.question': 'How was your experience?',
  'rating.tapStars': 'Tap the stars to rate.',
  'rating.commentPlaceholder': 'Leave a comment (optional)',
  'rating.send': 'Send rating',
  'rating.thanks': 'Thank you for your rating!',
  'rating.thanksDesc': 'Your feedback helps us improve.',
  'rating.starLabel': '{n} stars',
  'rating.score1': 'Poor',
  'rating.score2': 'Fair',
  'rating.score3': 'Good',
  'rating.score4': 'Very good',
  'rating.score5': 'Excellent',
  'account.title': 'My account',
  'account.loyaltyTitle': 'Loyalty card',
  'account.stamps': '{current}/{total} stamps',
  'account.rewardEarned': '🎉 Congrats! You earned a discount.',
  'account.stampsLeft': '{n} stamps left for your next discount.',
  'account.ordersTitle': 'Order history',
  'account.noOrders': 'No orders yet.',
  'account.items': '{n} item(s)',
  'account.actionsTitle': 'Actions',
  'account.closeBill': 'Close bill',
  'account.myCashback': 'My cashback',
  'account.status.pending': 'Sent',
  'account.status.preparing': 'Preparing',
  'account.status.delivered': 'Delivered',
  'account.status.closed': 'Closed',
  'cashback.title': 'Cashback',
  'cashback.balance': 'Available balance',
  'cashback.note': 'Earn {rate}% back on every order.',
  'cashback.history': 'History',
  'cashback.signup': 'Sign up for cashback',
  'cashback.empty': "You don't have cashback yet. Place an order to get started!",
  'cashback.signupToast': "You'll soon be able to sign up for cashback.",
  'common.back': 'Back',
  'common.close': 'Close',
  'common.loading': 'Loading...',
  'common.required': 'Required',
  'common.optional': 'Optional',
  'confirmation.title': 'Order confirmed!',
  'confirmation.subtitle': 'Your order was sent to the kitchen.',
  'confirmation.orderNumber': 'Order number',
  'confirmation.customer': 'Name',
  'confirmation.table': 'Table',
  'confirmation.items': 'Items',
  'confirmation.note': 'Track the status on the board or wait to be called.',
  'confirmation.backToMenu': 'Back to menu',
  'confirmation.rate': 'Rate your experience',
  'confirmation.print': 'Print receipt',
  'kiosk.welcome.title': 'Welcome!',
  'kiosk.welcome.subtitle': 'How would you like to order?',
  'kiosk.welcome.eatIn': 'Dine in',
  'kiosk.welcome.takeaway': 'Take away',
  'kiosk.steps.menu': 'Menu',
  'kiosk.steps.review': 'Review',
  'kiosk.steps.payment': 'Payment',
  'kiosk.steps.done': 'Confirmation',
  'kiosk.menu.all': 'All',
  'kiosk.menu.emptyCategory': 'No products in this category',
  'kiosk.order.label': 'My order',
  'kiosk.order.item': 'item',
  'kiosk.order.items': 'items',
  'kiosk.order.tax': 'Fee',
  'kiosk.order.emptyTitle': 'Your cart is empty',
  'kiosk.order.emptyHint': 'Add items to your cart to continue',
  'kiosk.order.review': 'Review order',
  'kiosk.cart.title': 'Order review',
  'kiosk.cart.reviewSubtitle': 'Confirm your items before paying',
  'kiosk.cart.empty': 'Cart is empty',
  'kiosk.cart.remove': 'Remove',
  'kiosk.cart.addMore': 'Add more',
  'kiosk.cart.confirmPay': 'Confirm & pay',
  'kiosk.cart.serviceFee': 'Service fee',
  'kiosk.payment.title': 'Payment',
  'kiosk.payment.totalLabel': 'Total to pay',
  'kiosk.payment.how': 'How would you like to pay?',
  'kiosk.payment.card': 'Card',
  'kiosk.payment.cardDesc': 'Debit or credit',
  'kiosk.payment.pix': 'PIX',
  'kiosk.payment.pixDesc': 'Scan the QR code',
  'kiosk.payment.cash': 'Cash',
  'kiosk.payment.cashDesc': 'Pay at the counter',
  'kiosk.payment.mercadoPago': 'Mercado Pago',
  'kiosk.payment.mercadoPagoDesc': 'Scan the QR code',
  'kiosk.payment.cardInstrTitle': 'Use the card machine',
  'kiosk.payment.cardInstrDesc': 'Insert, tap or swipe your card on the machine beside you.',
  'kiosk.payment.qrTitle': 'Scan to pay',
  'kiosk.payment.qrDesc': 'Open your app and scan the QR code below.',
  'kiosk.payment.waiting': 'Waiting for payment confirmation…',
  'kiosk.payment.cashTitle': 'Pay at the counter',
  'kiosk.payment.cashSubtitle': 'Show this ticket at the counter to complete your payment',
  'kiosk.payment.cashInstr': 'Your order has been registered. Head to the counter with the number below.',
  'kiosk.payment.orderLabel': 'Order',
  'kiosk.payment.itemsLabel': 'Items',
  'kiosk.payment.confirm': 'Confirm payment',
  'kiosk.payment.processing': 'Processing payment…',
  'kiosk.payment.approved': 'Payment approved!',
  'kiosk.payment.rejected': 'Payment declined',
  'kiosk.payment.rejectedDesc': 'Please try another payment method.',
  'kiosk.payment.retry': 'Try again',
  'kiosk.confirm.title': 'Order confirmed!',
  'kiosk.confirm.subtitle': 'Keep the number below and wait to be called',
  'kiosk.confirm.ticketLabel': 'Your number',
  'kiosk.confirm.hint': 'Track it on the queue board or wait to be called by the number above',
  'kiosk.confirm.restarting': 'Restarting in {s}s…',
  'kiosk.confirm.newOrder': 'New order',
  'kiosk.confirm.print': 'Print receipt',
  'kiosk.confirm.orderLabel': 'Receipt',
  'kiosk.confirm.photoHint': 'Take a photo or show this number to the cashier.',
  'kiosk.confirm.printOk': 'Ticket printed ✓',
  'kiosk.confirm.printing': 'Printing…',
  'kiosk.confirm.reprintBtn': 'Print again',
  'kiosk.confirm.helpBtn': 'Request assistance',
  'kiosk.confirm.helpSent': 'Help is on the way!',
  'kiosk.confirm.qrHint': 'Scan to view your order on your phone',
  'kiosk.confirm.queueLabel': 'Queue',
  'kiosk.menu.categories': 'Categories',
  'kiosk.menu.added': 'Added',
  'kiosk.menu.featured': 'Most ordered',
  'kiosk.menu.featuredSub': 'house favourites',
  'kiosk.menu.bestseller': 'Best seller',
  'kiosk.menu.upsellHint': 'How about adding',
  'kiosk.idle.title': 'Are you still there?',
  'kiosk.idle.subtitle': 'Your session will restart in {s}s',
  'kiosk.idle.continue': 'Yes, continue',
  'kiosk.idle.restart': 'Start over',
  'kiosk.attract.cta': 'Touch anywhere to start',
  'receipt.notFound': 'Order not found.',
  'receipt.autoUpdate': 'Auto-updating',
  'receipt.order': 'Order',
  'receipt.status.draft': 'Draft',
  'receipt.status.created': 'Received',
  'receipt.status.sentToKitchen': 'In kitchen',
  'receipt.status.preparing': 'Preparing',
  'receipt.status.ready': 'Ready',
  'receipt.status.delivered': 'Delivered',
  'receipt.status.closed': 'Closed',
  'receipt.status.canceled': 'Cancelled',
  'receipt.payment.unpaid': 'Unpaid',
  'receipt.payment.partiallyPaid': 'Partially paid',
  'receipt.payment.paid': 'Paid',
  'receipt.payment.refunded': 'Refunded',
  'receipt.payment.canceled': 'Cancelled',
  'admin.nav.group.operation': 'Operations',
  'admin.nav.group.catalog': 'Catalog',
  'admin.nav.group.establishment': 'Establishment',
  'admin.nav.group.growth': 'Growth',
  'admin.nav.group.analytics': 'Analytics',
  'admin.nav.group.settings': 'Settings',
  'admin.nav.dashboard': 'Dashboard',
  'admin.nav.orders': 'Orders',
  'admin.nav.queue': 'Queue',
  'admin.nav.products': 'Products',
  'admin.nav.categories': 'Categories',
  'admin.nav.tables': 'Tables',
  'admin.nav.zones': 'Zones / Areas',
  'admin.nav.branches': 'Branches',
  'admin.nav.kiosks': 'Kiosks',
  'admin.nav.loyalty': 'Loyalty',
  'admin.nav.aggregator': 'Aggregators',
  'admin.nav.reports': 'Reports',
  'admin.nav.settings': 'Settings',
  'admin.status.operating': 'Operating',
  'admin.role': 'Administration',
  'admin.backToHub': 'Hub',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.edit': 'Edit',
  'common.create': 'Create',
  'common.enable': 'Enable',
  'common.disable': 'Disable',
  'common.all': 'All',
  'common.active': 'Active',
  'common.inactive': 'Inactive',
  'common.clearFilters': 'Clear filters',
  'common.customer': 'Customer',
  'common.order': 'Order',
  'common.now': 'now',
  'common.updated': 'Updated',
  'status.draft': 'Draft',
  'status.created': 'Created',
  'status.inKitchen': 'In kitchen',
  'status.preparing': 'Preparing',
  'status.ready': 'Ready',
  'status.delivered': 'Delivered',
  'status.closed': 'Closed',
  'status.canceled': 'Canceled',
  'status.maintenance': 'Maintenance',
  'dash.subtitle': 'Real-time operation overview',
  'dash.ordersToday': 'Orders today',
  'dash.revenueToday': 'Revenue today',
  'dash.avgTicket': 'Average ticket',
  'dash.inKitchen': 'In kitchen',
  'dash.avgPrepTime': 'Avg. prep time',
  'dash.ordersPerHour': 'Orders per hour',
  'dash.today': 'Today',
  'dash.orderSingular': 'order',
  'dash.orderPlural': 'orders',
  'dash.activity': 'Activity',
  'dash.live': 'live',
  'dash.noOrders': 'No orders yet',
  'dash.noOrdersDesc': 'Orders will appear here in real time.',
  'dash.bestSellers': 'Best sellers',
  'dash.tableLabel': 'Table',
  'adminQueue.title': 'Queue',
  'adminQueue.subtitle': 'Walk-in attendance queue management',
  'adminQueue.enabled': 'Queue active',
  'adminQueue.disabled': 'Queue inactive',
  'adminQueue.settings': 'Queue settings',
  'adminQueue.enabledDesc': 'Queue enabled — visible on Menu Digital',
  'adminQueue.disabledDesc': 'Queue disabled',
  'adminQueue.messageLabel': 'Message displayed to customers',
  'adminQueue.messagePlaceholder': 'e.g.: Track your order here!',
  'adminQueue.waiting': 'Waiting',
  'adminQueue.serving': 'Being served',
  'adminQueue.completed': 'Completed',
  'adminQueue.callNextBtn': 'Call next',
  'adminQueue.openTickets': 'Open tickets',
  'adminQueue.noOpenTickets': 'No open tickets',
  'adminQueue.empty': 'The queue is empty right now.',
  'adminQueue.ticket': 'Ticket',
  'adminQueue.orderLabel': 'Order',
  'adminQueue.callBtn': 'Call',
  'adminQueue.attendBtn': 'Attend',
  'adminQueue.completeBtn': 'Complete',
  'adminQueue.activatedToast': 'Queue activated — visible on Menu Digital',
  'adminQueue.deactivatedToast': 'Queue deactivated',
  'adminQueue.enableBtn': 'Enable queue',
  'adminQueue.callingToast': 'Calling ticket #{ticket} — {name}',
  'adminQueue.msgSavedToast': 'Queue message updated',
  'adminQueue.waitTime': 'Wait',
  'adminQueue.cancelBtn': 'Cancel',
  'adminQueue.configure': 'Configure',
  'adminQueue.cancelledToast': 'Ticket cancelled',
  'adminSettings.title': 'Settings',
  'adminSettings.subtitle': 'Identity, branch, operation and integration',
  'adminSettings.identity': 'Restaurant identity',
  'adminSettings.identityDesc': 'Name and logo shown on Menu Digital and Kiosk.',
  'adminSettings.restaurantName': 'Restaurant name',
  'adminSettings.restaurantNamePlaceholder': 'Establishment name',
  'adminSettings.logoUrl': 'Logo URL',
  'adminSettings.logoUrlDesc': 'Paste the public URL of the image (PNG, SVG or JPG).',
  'adminSettings.logoPreview': 'Logo preview',
  'adminSettings.defaultLanguage': 'Default language',
  'adminSettings.defaultLanguageDesc': 'Default language for Menu Digital and Kiosk of this tenant.',
  'adminSettings.branch': 'Branch / Unit',
  'adminSettings.branchDesc': 'Physical unit information and service type.',
  'adminSettings.branchName': 'Branch name',
  'adminSettings.branchNamePlaceholder': 'Unit name',
  'adminSettings.address': 'Address',
  'adminSettings.addressPlaceholder': 'Street, number, city...',
  'adminSettings.serviceType': 'Service type',
  'adminSettings.serviceTable': 'Table service',
  'adminSettings.serviceTakeaway': 'Takeaway',
  'adminSettings.serviceKiosk': 'Kiosk / Self-service',
  'adminSettings.financial': 'Financial',
  'adminSettings.financialDesc': 'Currency and service fee applied to orders.',
  'adminSettings.currency': 'Currency',
  'adminSettings.serviceFee': 'Service fee',
  'adminSettings.serviceFeeHint': 'E.g.: 0.1 = 10%',
  'adminSettings.payments': 'Payment methods',
  'adminSettings.paymentsDesc': 'Choose which payment methods the kiosk offers customers.',
  'adminSettings.payCard': 'Card',
  'adminSettings.payPix': 'PIX',
  'adminSettings.payMercadoPago': 'Mercado Pago',
  'adminSettings.payCash': 'Cash',
  'adminSettings.paymentOn': 'Enabled',
  'adminSettings.paymentOff': 'Disabled',
  'adminSettings.queueSection': 'Queue',
  'adminSettings.queueDesc': 'Queue configuration visible on Menu Digital.',
  'adminSettings.queueEnabledLabel': 'Queue enabled',
  'adminSettings.queueDisabledLabel': 'Queue disabled',
  'adminSettings.queueMessage': 'Queue message',
  'adminSettings.queueMessageDesc': 'Shown to customers on the queue screen of Menu Digital.',
  'adminSettings.queueMessagePlaceholder': 'e.g.: Track your order here!',
  'adminSettings.saveSuccess': 'Settings saved successfully',
  'adminSettings.saveError': 'Error saving — please try again',
  'adminLoyalty.title': 'Loyalty',
  'adminLoyalty.subtitle': 'Customer loyalty cards',
  'adminLoyalty.customerSingular': 'customer',
  'adminLoyalty.customerPlural': 'customers',
  'adminLoyalty.noCustomers': 'No customers registered',
  'adminLoyalty.noCustomersDesc': 'Customers using the loyalty program will appear here.',
  'adminLoyalty.stamps': 'Stamps',
  'adminLoyalty.totalEarned': 'Total earned',
  'adminLoyalty.discountsUsed': 'Discounts used',
  'adminLoyalty.noCard': 'No card found',
  'adminTables.title': 'Tables',
  'adminTables.tableSingular': 'table',
  'adminTables.tablePlural': 'tables',
  'adminTables.registered': 'registered',
  'adminTables.registeredPlural': 'registered',
  'adminTables.newTable': 'New table',
  'adminTables.searchPlaceholder': 'Search table, zone, waiter...',
  'adminTables.filterAll': 'All',
  'adminTables.filterActive': 'Active',
  'adminTables.filterInactive': 'Inactive',
  'adminTables.filterAllZones': 'All zones',
  'adminTables.ofCount': 'of',
  'adminTables.noTablesFound': 'No tables found',
  'adminTables.noTablesFoundDesc': 'Try adjusting filters or creating a new table.',
  'adminTables.colZone': 'Zone',
  'adminTables.colWaiter': 'Waiter',
  'adminTables.colSeats': 'Seats',
  'adminTables.colValidation': 'Validation',
  'adminTables.tableActive': 'Active',
  'adminTables.tableInactive': 'Inactive',
  'adminTables.editTitle': 'Edit Table {n}',
  'adminTables.newTitle': 'New table',
  'adminTables.number': 'Number / Name',
  'adminTables.numberPlaceholder': 'e.g.: 1, A3, VIP-1',
  'adminTables.capacity': 'Capacity (seats)',
  'adminTables.capacityPlaceholder': 'e.g.: 4',
  'adminTables.zone': 'Zone / Area',
  'adminTables.noZone': '— No zone —',
  'adminTables.waiter': 'Assigned waiter',
  'adminTables.noWaiter': '— Unassigned —',
  'adminTables.notes': 'Notes',
  'adminTables.notesPlaceholder': 'e.g.: near window, accessible, reserved for VIP...',
  'adminTables.isActive': 'Table active',
  'adminTables.saveChanges': 'Save changes',
  'adminTables.createTable': 'Create table',
  'adminTables.colZones': 'Zones / Areas',
  'adminTables.noZones': 'No zones',
  'adminTables.noZonesDesc': 'Create zones to organize your tables.',
  'adminTables.newZonePlaceholder': 'New zone...',
  'adminTables.addZone': 'Add zone',
  'adminTables.removeZone': 'Remove zone',
  'adminTables.updatedToast': 'Table {n} updated',
  'adminTables.createdToast': 'Table {n} created',
  'adminTables.disabledToast': 'Table disabled',
  'adminTables.enabledToast': 'Table enabled',
  'adminTables.codeRegeneratedToast': 'Code regenerated',
  'adminTables.regenerateCode': 'Regenerate code',
  'adminAggregator.title': 'Aggregators',
  'adminAggregator.subtitle': 'Integrations with external delivery platforms',
  'adminAggregator.noAggregators': 'No aggregators configured',
  'adminAggregator.noAggregatorsDesc': 'Set up integrations with iFood, Rappi and other platforms.',
  'adminAggregator.simulateOrder': 'Simulate order',
  'adminAggregator.activatedToast': '{platform} activated',
  'adminAggregator.deactivatedToast': '{platform} deactivated',
  'adminAggregator.simulatedToast': 'Simulated order from {platform} sent to kitchen',
  'adminOrders.title': 'Orders',
  'adminOrders.searchPlaceholder': 'Search order, customer or table...',
  'adminOrders.filterAll': 'All',
  'adminOrders.filterInKitchen': 'In kitchen',
  'adminOrders.filterPreparing': 'Preparing',
  'adminOrders.filterReady': 'Ready',
  'adminOrders.filterDelivered': 'Delivered',
  'adminOrders.filterPaid': 'Paid',
  'adminOrders.filterUnpaid': 'Unpaid',
  'adminOrders.noOrders': 'No orders found',
  'adminOrders.noOrdersDesc': 'No orders match the selected filters.',
  'adminOrders.colOrder': 'Order',
  'adminOrders.colTable': 'Table',
  'adminOrders.colPayment': 'Payment',
  'adminOrders.colOrigin': 'Origin',
  'adminOrders.colTime': 'Time',
  'adminOrders.sectionCustomer': 'Customer',
  'adminOrders.sectionItems': 'Items',
  'adminOrders.sectionHistory': 'History',
  'adminOrders.tableLabel': 'Table',
  'adminOrders.itemNote': 'Note: {note}',
  'adminOrders.subtotal': 'Subtotal',
  'adminOrders.serviceFee': 'Service fee',
  'adminOrders.actionSendKitchen': 'Send to kitchen',
  'adminOrders.actionPreparing': 'Mark as preparing',
  'adminOrders.actionReady': 'Mark as ready',
  'adminOrders.actionDelivered': 'Mark as delivered',
  'adminOrders.actionClose': 'Close order',
  'adminOrders.updatedToast': 'Order updated → {status}',
  'adminProducts.title': 'Products',
  'adminProducts.productSingular': 'product',
  'adminProducts.productPlural': 'products',
  'adminProducts.inCatalog': 'in catalog',
  'adminProducts.newProduct': 'New product',
  'adminProducts.searchPlaceholder': 'Search product...',
  'adminProducts.noProducts': 'No products found',
  'adminProducts.noProductsDesc': 'Try changing filters or create a new product.',
  'adminProducts.createFirst': 'Create first product',
  'adminProducts.colProduct': 'Product',
  'adminProducts.colCategory': 'Category',
  'adminProducts.colPrice': 'Price',
  'adminProducts.colFeatured': 'Featured',
  'adminProducts.featured': 'Featured',
  'adminProducts.removeFeatured': 'Remove featured',
  'adminProducts.addFeatured': 'Mark as featured',
  'adminProducts.editProduct': 'Edit product',
  'adminProducts.editTitle': 'Edit product',
  'adminProducts.newTitle': 'New product',
  'adminProducts.name': 'Name',
  'adminProducts.price': 'Price',
  'adminProducts.imageUrl': 'Image URL',
  'adminProducts.description': 'Description',
  'adminProducts.category': 'Category',
  'adminProducts.kitchenStation': 'Kitchen station',
  'adminProducts.stationGeneral': 'General',
  'adminProducts.stationGrill': 'Grill',
  'adminProducts.stationBar': 'Bar / Drinks',
  'adminProducts.stationColdFood': 'Cold food / Salads',
  'adminProducts.stationDesserts': 'Desserts',
  'adminProducts.stationFried': 'Fried food',
  'adminProducts.available': 'Available',
  'adminProducts.updatedToast': 'Product updated',
  'adminProducts.createdToast': 'Product created',
  'adminProducts.disabledToast': 'Product disabled',
  'adminProducts.enabledToast': 'Product enabled',
  'adminProducts.removedFeaturedToast': 'Featured removed',
  'adminProducts.addedFeaturedToast': 'Marked as featured',
  'adminCategories.title': 'Categories',
  'adminCategories.catSingular': 'category',
  'adminCategories.catPlural': 'categories',
  'adminCategories.inCatalog': 'in catalog',
  'adminCategories.newCategory': 'New category',
  'adminCategories.noCategories': 'No categories yet',
  'adminCategories.noCategoriesDesc': 'Create categories to organize your menu.',
  'adminCategories.createFirst': 'Create first category',
  'adminCategories.colCategory': 'Category',
  'adminCategories.colOrder': 'Order',
  'adminCategories.statusActive': 'Active',
  'adminCategories.statusInactive': 'Inactive',
  'adminCategories.editTitle': 'Edit category',
  'adminCategories.newTitle': 'New category',
  'adminCategories.name': 'Name',
  'adminCategories.imageUrl': 'Image URL',
  'adminCategories.isActive': 'Active',
  'adminCategories.updatedToast': 'Category updated',
  'adminCategories.createdToast': 'Category created',
  'adminCategories.disabledToast': 'Category disabled',
  'adminCategories.enabledToast': 'Category enabled',
  'imageUpload.urlPlaceholder': 'Paste an image URL',
  'imageUpload.uploadButton': 'Upload file',
  'adminKiosks.title': 'Kiosks',
  'adminKiosks.addKiosk': 'Add kiosk',
  'adminKiosks.searchPlaceholder': 'Search device...',
  'adminKiosks.filterAll': 'All',
  'adminKiosks.filterMaintenance': 'Maintenance',
  'adminKiosks.tabDevices': 'Devices',
  'adminKiosks.tabAttractScreen': 'Attract Screen',
  'adminKiosks.tabBranding': 'Branding',
  'adminKiosks.tabMedia': 'Media',
  'adminKiosks.tabBehavior': 'Behavior',
  'adminKiosks.colDevice': 'Device',
  'adminKiosks.colLastActivity': 'Last activity',
  'adminKiosks.noDevices': 'No devices',
  'adminKiosks.noDevicesDesc': 'No kiosks registered yet.',
  'adminKiosks.colBranch': 'Branch',
  'adminKiosks.colRegistered': 'Registered',
  'adminKiosks.attractConfig': 'General settings',
  'adminKiosks.attractConfigDesc': 'Shown when the kiosk is idle. Changes take effect the next time the screen loads.',
  'adminKiosks.enableAttractScreen': 'Enable attract screen',
  'adminKiosks.attractEnabled': 'Enabled',
  'adminKiosks.attractDisabled': 'Disabled',
  'adminKiosks.restaurantNameLabel': 'Restaurant name',
  'adminKiosks.sloganDesc': 'Shown below the name (optional).',
  'adminKiosks.sloganPlaceholder': 'E.g.: The best in town',
  'adminKiosks.videoUrl': 'Video URL',
  'adminKiosks.videoUrlDesc': 'Without video, a gradient background is used (optional).',
  'adminKiosks.idleTimeout': 'Idle timeout: {s}s',
  'adminKiosks.idleTimeoutDesc': "After this time without touch, the 'Are you still there?' prompt appears.",
  'adminKiosks.previewLabel': 'Preview',
  'adminKiosks.touchToStart': 'Touch to start',
  'adminKiosks.attractDisabledPreview': 'Attract screen disabled',
  'adminKiosks.attractPreviewNote': 'Screen shown when the kiosk is idle',
  'adminKiosks.sectionSoon': 'This section will be configured soon.',
  'adminKiosks.nowAgo': 'Just now',
  'adminKiosks.minAgo': 'min ago',
  'adminKiosks.hourAgo': 'h ago',
  'adminKiosks.dayAgo': 'd ago',
  'adminKiosks.viewDetails': 'View details',
  'adminKiosks.reloadConfig': 'Reload configuration',
  'adminKiosks.removeDevice': 'Remove device',
  'adminKiosks.reloadBtn': 'Reload',
  'adminKiosks.previewBtn': 'Preview',
  'adminKiosks.removeBtn': 'Remove',
  'cashier.title': 'Cashier / Payments',
  'cashier.live': 'Live',
  'cashier.hub': 'Hub',
  'cashier.tab.orders': 'Tables / Orders',
  'cashier.tab.history': 'History',
  'cashier.tab.receipts': 'Receipts',
  'cashier.tab.invoices': 'Invoices',
  'cashier.metric.received': 'Collected today',
  'cashier.metric.paid': 'Paid orders',
  'cashier.metric.pending': 'Outstanding',
  'cashier.metric.tables': 'Pending tables',
  'cashier.filter.all': 'All',
  'cashier.filter.pending': 'Pending',
  'cashier.filter.partial': 'Partial',
  'cashier.filter.paid': 'Paid',
  'cashier.filter.search': 'Search table...',
  'cashier.collapse': 'Collapse',
  'cashier.expand': 'Expand',
  'cashier.pay.totalDue': 'Bill total',
  'cashier.pay.alreadyPaid': 'Already paid',
  'cashier.pay.amountDue': 'Amount due',
  'cashier.pay.chargeMode': 'Charge mode',
  'cashier.pay.remaining': 'Full remaining',
  'cashier.pay.partial': 'Partial amount',
  'cashier.pay.method': 'Payment method',
  'cashier.pay.receive': 'Collect {amount}',
  'cashier.pay.processing': 'Processing...',
  'cashier.pay.cancel': 'Cancel',
  'cashier.pay.done': 'Payment received!',
  'cashier.pay.change': 'Change',
  'cashier.pay.print': 'Receipt',
  'cashier.pay.close': 'Close',
  'cashier.pay.cashGiven': 'Amount given by customer',
  'cashier.pay.remainingAfter': 'Remaining after payment:',
  'cashier.method.cash': 'Cash',
  'cashier.method.card': 'Card',
  'cashier.method.pix': 'PIX',
  'cashier.method.terminal': 'Terminal',
  'cashier.receipt.title': 'Receipt',
  'cashier.receipt.subtotal': 'Subtotal',
  'cashier.receipt.fee': 'Service fee',
  'cashier.receipt.total': 'TOTAL',
  'cashier.receipt.method': 'Method:',
  'cashier.receipt.print': 'Print',
  'cashier.receipt.close': 'Close',
  'cashier.customer.subtotal': 'Subtotal',
  'cashier.customer.fee': 'Service fee (10%)',
  'cashier.customer.total': 'Total',
  'cashier.customer.paid': 'Already paid',
  'cashier.customer.due': 'Outstanding',
  'cashier.customer.receive': 'Collect {amount}',
  'cashier.customer.partial': 'Partial',
  'cashier.table.due': 'Outstanding',
  'cashier.table.receive': 'Collect table',
  'cashier.table.total': 'Bill total:',
  'cashier.table.paid': 'Paid:',
  'cashier.table.remaining': 'Remaining:',
  'cashier.table.partialBtn': 'Partial amount',
  'cashier.table.allPaid': 'Table fully paid',
  'cashier.empty.tables': 'No active tables',
  'cashier.empty.tablesDesc': 'Tables with active orders will appear here.',
  'cashier.empty.history': 'No payments',
  'cashier.empty.receipts': 'No receipts generated',
  'cashier.empty.invoices': 'No invoices generated',
  'cashier.empty.pendingTables': 'No tables waiting for payment.',
  'cashier.col.order': 'Order',
  'cashier.col.customer': 'Customer',
  'cashier.col.table': 'Table',
  'cashier.col.total': 'Total',
  'cashier.col.paid': 'Paid',
  'cashier.col.method': 'Method',
  'cashier.col.status': 'Status',
  'cashier.col.actions': 'Actions',
  'cashier.col.number': 'Number',
  'cashier.col.date': 'Date',
  'cashier.status.paid': 'Paid',
  'cashier.status.partial': 'Partial',
  'cashier.status.pending': 'Pending',
  'cashier.kiosk.alerts': 'Kiosk Alerts',
  'cashier.kiosk.resolve': 'Resolve',
  'cashier.kiosk.needsHelp': 'Needs help',
  'cashier.kiosk.printFailed': 'Ticket not printed',
  'cashier.kiosk.totemN': 'Kiosk {n}',
  'cashier.kiosk.noAlerts': 'No active alerts',
  'queue.nowCalling': 'NOW CALLING',
  'queue.pickupAtCounter': 'Pick up your order at the counter',
  'queue.ticketLabel': 'TICKET',
  'queue.preparingTitle': 'Preparing your orders',
  'queue.preparingSub': "We'll call you as soon as it's ready",
  'queue.allReady': 'All orders ready',
  'queue.noActiveTitle': 'No active orders',
  'queue.noActiveSub': 'Place your order to appear here',
  'queue.headerTitle': 'Track your order',
  'queue.readyColumn': 'Ready — Pick up!',
  'queue.preparingColumn': 'Preparing',
  'queue.pageOf': 'Page {page} of {total}',
  'queue.refreshNote': 'Updates every 3 seconds',
  'queue.checkPrintedTicket': 'Check the number on your printed ticket',
  'queue.restaurantFallback': 'Restaurant',
  'kitchen.title': 'Kitchen',
  'kitchen.action.start': 'Start preparing',
  'kitchen.action.ready': 'Mark ready',
  'kitchen.action.deliver': 'Mark delivered',
  'kitchen.col.new': 'New',
  'kitchen.col.preparing': 'Preparing',
  'kitchen.col.ready': 'Ready',
  'kitchen.empty.new': 'No new orders',
  'kitchen.empty.preparing': 'No orders in preparation',
  'kitchen.empty.ready': 'No orders ready',
  'kitchen.empty.generic': 'No orders',
  'kitchen.notify.preparing': 'Preparation started',
  'kitchen.notify.ready': '✅ Order ready!',
  'kitchen.notify.delivered': 'Delivered to customer',
  'kitchen.notify.statusUpdated': 'Status updated',
  'kitchen.filter.all': 'All queues',
  'kitchen.meta.counter': 'Counter',
  'kitchen.stat.delivered': 'Delivered',
  'kitchen.stat.avgTime': 'Avg. time',
  'kitchen.stat.longestWait': 'Longest wait',
  'kitchen.live': 'LIVE',
  'kitchen.tooltip.unmute': 'Enable sound',
  'kitchen.tooltip.mute': 'Mute',
  'kitchen.tooltip.fullscreen': 'Fullscreen',
  'kitchen.tooltip.exitFullscreen': 'Exit fullscreen',
  'reports.title': 'Reports',
  'reports.role': 'Analytics',
  'reports.section.dashboard': 'Overview',
  'reports.section.fechamento': 'Daily closing',
  'reports.section.vendas': 'Sales',
  'reports.section.pagamentos': 'Payments',
  'reports.section.produtos': 'Top products',
  'reports.section.mesas': 'Revenue by table',
  'reports.section.garcons': 'Revenue by waiter',
  'reports.section.cozinha': 'Kitchen performance',
  'reports.section.ocupacao': 'Occupancy / idle hours',
  'reports.section.reservas': 'Reservations',
  'reports.section.exportacoes': 'Exports',
  'reports.navGroup.overview': 'Overview',
  'reports.navGroup.financial': 'Financial',
  'reports.navGroup.performance': 'Performance',
  'reports.nav.ocupacao': 'Occupancy / hours',
  'reports.method.cash': 'Cash',
  'reports.method.card': 'Card',
  'reports.method.other': 'Other',
  'reports.today': 'Today',
  'reports.yesterday': 'Yesterday',
  'reports.refresh': 'Refresh',
  'reports.exportCsv': 'Export CSV',
  'reports.csvExported': 'CSV exported',
  'reports.admin': 'Administration',
  'reports.kpi.revenue': 'Revenue',
  'reports.kpi.totalOrders': 'Total orders',
  'reports.kpi.paidOrders': 'Paid orders',
  'reports.kpi.avgTicket': 'Avg. ticket',
  'reports.kpi.serviceFee': 'Service fee',
  'reports.kpi.canceled': 'Canceled',
  'reports.noData.title': 'No data for this period',
  'reports.noData.desc': 'No sales recorded on {date}. Try selecting another date.',
  'reports.notFound.title': 'Section not found',
  'reports.notFound.desc': 'Select a valid section from the side menu.',
  'reports.empty.byHour': 'No hourly data',
  'reports.empty.payments': 'No payments recorded',
  'reports.empty.products': 'No products sold',
  'reports.empty.tables': 'No table data',
  'reports.empty.waiters': 'No waiter data',
  'reports.ordersN': '{n} orders',
  'reports.ordersAbbrN': '{n} ord.',
  'reports.unitsN': '{n} units',
  'reports.peakHour': 'Peak hour',
  'reports.topRevenueHour': 'Top revenue hour',
  'reports.ordersInDay': 'orders today',
  'reports.paid': 'paid',
  'reports.sortRevenue': 'Revenue',
  'reports.sortQty': 'Qty',
  'reports.tableN': 'Table {n}',
  'reports.details': 'Details',
  'reports.waiter.name': 'Waiter',
  'reports.waiter.orders': 'Orders',
  'reports.waiter.tables': 'Tables',
  'reports.waiter.grossSales': 'Gross sales',
  'reports.insights.title': "Day's highlights",
  'reports.insights.quietHour': 'Quietest hour',
  'reports.promoOpportunity': 'promo opportunity',
  'reports.insights.topTable': 'Most profitable table',
  'reports.insights.topProduct': 'Featured product',
  'reports.insights.bestWaiter': 'Best waiter',
  'reports.insights.payRate': 'Payment rate',
  'reports.insights.payRateSub': '{paid} of {total} orders',
  'reports.insights.grossSalesSub': '+ {fee} in service fee',
  'reports.card.ordersByHour': 'Orders by hour',
  'reports.card.hoursActive': '{n} active hours',
  'reports.card.paymentMethods': 'Payment methods',
  'reports.card.byRevenue': 'Distribution by revenue',
  'reports.card.topItems': 'Top {n} items today',
  'reports.card.tablesActive': '{n} active tables',
  'reports.card.waiterPerf': 'Waiter performance',
  'reports.card.byRevenueGenerated': 'Ranked by revenue generated',
  'reports.card.financialSummary': 'Financial summary',
  'reports.fin.totalRevenue': 'Total revenue',
  'reports.dateByRevenue': '{date} — distribution by revenue',
  'reports.dateTopItems': '{date} — top {n} items',
  'reports.dateTablesActive': '{date} — {n} active tables',
  'reports.dateWaiterRanked': '{date} — ranked by revenue generated',
  'reports.dateHoursActive': '{date} — {n} active hours',
  'reports.exports.subtitle': 'Export data for the selected period',
  'reports.exports.closingReport': 'Closing report (CSV)',
  'reports.exports.closingDesc': '{date} — orders, payments, products, tables and waiters',
  'reports.ph.vendasTitle': 'Sales analysis in development',
  'reports.ph.vendasDesc': 'Sales trends and comparison report. Coming soon.',
  'reports.ph.cozinhaTitle': 'Kitchen performance in development',
  'reports.ph.cozinhaDesc': 'Average prep time and kitchen efficiency. Coming soon.',
  'reports.ph.reservasTitle': 'Reservations report in development',
  'reports.ph.reservasDesc': 'Occupancy and reservation analysis. Coming soon.',
  'res.title': 'Reservations',
  'res.today': 'Today',
  'res.noTable': 'No table',
  'res.guestsN': '{n} guests',
  'res.tableN': 'Table {n}',
  'res.seatsN': '{n} seats',
  'res.conflict': 'Conflict',
  'res.free': 'Free',
  'res.available': 'Available',
  'res.reserve': 'Reserve',
  'res.back': 'Back',
  'res.view': 'View',
  'res.hub': 'Hub',
  'res.confirm': 'Confirm',
  'res.minN': '{n} min',
  'res.hoursN': '{n}h',
  'res.timeNow': 'now',
  'res.status.pending': 'Pending',
  'res.status.confirmed': 'Confirmed',
  'res.status.seated': 'Seated',
  'res.status.completed': 'Completed',
  'res.status.canceled': 'Canceled',
  'res.status.noShow': 'No-show',
  'res.tag.birthday': '🎂 Birthday',
  'res.tag.vip': '⭐ VIP',
  'res.tag.allergy': '⚠️ Allergy',
  'res.tag.anniversary': '💍 Couple',
  'res.tag.late': '⏰ Late',
  'res.source.phone': 'Phone',
  'res.source.walkIn': 'Walk-in',
  'res.source.online': 'Online',
  'res.urgency.overdue': 'Overdue {n}min',
  'res.urgency.now': 'Now',
  'res.urgency.inMin': 'In {n}min',
  'res.urgency.vip': 'VIP',
  'res.metrics.total': 'Total',
  'res.metrics.confirmed': 'Confirmed',
  'res.metrics.pending': 'Pending',
  'res.metrics.seated': 'Seated',
  'res.metrics.canceled': 'Canceled',
  'res.metrics.noShow': 'No-shows',
  'res.action.confirm': 'Confirm',
  'res.action.seat': 'Seat',
  'res.action.complete': 'Complete',
  'res.action.seatDirect': 'Seat directly',
  'res.action.editReservation': 'Edit reservation',
  'res.action.noShow': 'No-show',
  'res.action.cancelReservation': 'Cancel reservation',
  'res.action.reopenPending': 'Reopen as pending',
  'res.action.viewDetails': 'View details',
  'res.action.edit': 'Edit',
  'res.action.cancel': 'Cancel',
  'res.action.reopen': 'Reopen',
  'res.empty.title': 'No reservations',
  'res.empty.desc': 'No reservations found with the selected filters.',
  'res.emptyTable.title': 'No reservations',
  'res.reservationsCountN': '{n} reservations',
  'res.col.dateTime': 'Date / Time',
  'res.col.customer': 'Customer',
  'res.col.phone': 'Phone',
  'res.col.guests': 'Guests',
  'res.col.table': 'Table',
  'res.col.status': 'Status',
  'res.col.channel': 'Channel',
  'res.col.notes': 'Notes',
  'res.walkin.queue': 'Waiting list',
  'res.walkin.add': 'Add to queue',
  'res.walkin.emptyTitle': 'Empty queue',
  'res.walkin.emptyDesc': 'No customers waiting right now.',
  'res.walkin.waitingSince': 'Waiting for ',
  'res.walkin.since': 'For ',
  'res.walkin.estWait': 'Est. wait: ~{n}min',
  'res.walkin.seat': 'Seat',
  'res.walkin.remove': 'Remove',
  'res.walkin.historyToday': "Today's history ({n})",
  'res.walkin.seated': 'Seated',
  'res.walkin.removed': 'Removed',
  'res.walkin.nameOrGroup': 'Name or group *',
  'res.walkin.nameOrGroupPlaceholder': 'E.g. Smith family',
  'res.walkin.estWaitMin': 'Estimated wait (min)',
  'res.settings.title': 'Reservation settings',
  'res.settings.hours': 'Opening hours',
  'res.settings.opening': 'Opening',
  'res.settings.closing': 'Closing',
  'res.settings.params': 'Parameters',
  'res.settings.defaultDuration': 'Default duration (min)',
  'res.settings.defaultDurationHint': 'Default duration of each reservation',
  'res.settings.lateTolerance': 'Late tolerance (min)',
  'res.settings.lateToleranceHint': 'Before marking as no-show',
  'res.settings.slotInterval': 'Slot interval (min)',
  'res.settings.slotIntervalHint': 'Granularity in the occupancy map',
  'res.settings.maxParty': 'Max guests per reservation',
  'res.settings.save': 'Save settings',
  'res.settings.saved': 'Saved!',
  'res.modal.customerData': 'Customer details',
  'res.modal.name': 'Name *',
  'res.modal.namePlaceholder': 'Customer name',
  'res.modal.phone': 'Phone',
  'res.modal.guests': 'No. of guests',
  'res.modal.details': 'Reservation details',
  'res.modal.date': 'Date',
  'res.modal.time': 'Time',
  'res.modal.duration': 'Duration (min)',
  'res.modal.source': 'Source',
  'res.modal.tableOptional': '(optional)',
  'res.modal.noTableOption': '— No table assigned —',
  'res.modal.notesTags': 'Notes & tags',
  'res.modal.notes': 'Notes',
  'res.modal.notesPlaceholder': 'E.g. window, baby chair...',
  'res.modal.tags': 'Tags',
  'res.modal.saveReservation': 'Save reservation',
  'res.modal.cancel': 'Cancel',
  'res.modal.close': 'Close',
  'res.occ.allTables': 'All',
  'res.occ.week': 'Week',
  'res.occ.day': 'Day',
  'res.occ.month': 'Month',
  'res.occ.viewDayDetails': 'View day details',
  'res.occ.noSlots': 'No time slots configured',
  'res.occ.occupiedShort': '{n} occ.',
  'res.occ.freeShortN': '{n} free',
  'res.occ.freeLower': 'free',
  'res.occ.maxOccTitle': '{date} — Max occupancy: {pct}%',
  'res.occ.occupied': 'Occupied',
  'res.occ.free2': 'Free',
  'res.occ.occ': 'Occ.',
  'res.occ.noActiveTables': 'No active tables',
  'res.occ.available': 'Available',
  'res.occ.cancelConfirm': "Cancel {name}'s reservation?",
  'res.occ.capacityUndefined': 'Capacity not set',
  'res.newReservationTable': 'New reservation — Table {n}',
  'res.notif.canceled': 'Reservation canceled',
  'res.notif.created': 'Reservation created successfully',
  'res.notif.createdShort': 'Reservation created',
  'res.notif.updated': 'Reservation updated',
  'res.notif.status': 'Reservation: {status}',
  'res.notif.customerSeated': 'Customer seated',
  'res.notif.removedFromQueue': 'Removed from queue',
  'res.notif.addedToQueue': 'Added to queue',
  'res.notif.settingsSaved': 'Settings saved',
  'res.tab.queue': 'Queue',
  'res.tab.occupancy': 'Occupancy',
  'res.tab.settings': 'Settings',
  'res.view.agenda': 'Agenda',
  'res.view.table': 'Table',
  'res.view.byTable': 'By table',
  'res.scope.date': 'Date',
  'res.scope.all': 'All',
  'res.topbar.occupancy': 'Occupancy map',
  'res.topbar.settings': 'Settings',
  'res.newReservation': 'New reservation',
  'res.searchPlaceholder': 'Search customer or phone...',
  'res.allStatuses': 'All statuses',
  'res.openMenu': 'Open menu',
  'res.closeMenu': 'Close menu',
  'hub.loggedAs': 'Logged in as {name} ({role})',
  'hub.chooseArea': 'Prototype — choose an area to enter',
  'hub.logout': 'Sign out',
  'hub.resetConfirm': 'Reset demo data? All interactions will be deleted.',
  'hub.resetBtn': 'Reset demo data',
  'hub.printCard': 'Print card',
  'hub.cardPreviewTitle': 'Card preview',
  'hub.printTableQr': 'Print Table QR',
  'hub.tableQrTitle': 'Table QR',
  'hub.sectionCustomer': 'Customer areas',
  'hub.sectionOps': 'Operations',
  'hub.sectionNew': 'New features',
  'hub.area.menu.title': 'Digital Menu',
  'hub.area.menu.desc': 'Customer – table / takeaway',
  'hub.area.kiosk.desc': 'Self-service',
  'hub.area.queue.title': 'Queue Display',
  'hub.area.kitchen.title': 'Kitchen',
  'hub.area.kitchen.desc': 'Kitchen operations',
  'hub.area.waiter.title': 'Waiter',
  'hub.area.waiter.desc': 'Floor service',
  'hub.area.cashier.title': 'Cashier',
  'hub.area.cashier.desc': 'Payments and receipts',
  'hub.area.admin.desc': 'Restaurant management',
  'hub.area.reservations.title': 'Reservations',
  'hub.area.reservations.desc': 'Reservation management',
  'hub.area.reports.title': 'Reports',
  'hub.area.reports.desc': 'Closing and metrics',
  'hub.area.login.title': 'Login / Profiles',
  'hub.area.login.desc': 'Switch user and role',
  'login.greeting': '👋 Hi, {name}',
  'login.loggedAs': 'Logged in as',
  'login.goToArea': 'Go to my area',
  'login.switchUser': 'Switch user',
  'login.title': 'Sign in',
  'login.subtitle': 'Select your profile (demo)',
  'login.submit': 'Sign in',
  'login.continueDemo': 'Continue without login (demo mode)',
  'login.role.owner': 'Owner',
  'login.role.manager': 'Manager',
  'login.role.cashier': 'Cashier',
  'login.role.waiter': 'Waiter',
  'login.role.kitchen': 'Kitchen',
  'login.role.support': 'Support',
  'login.emailLabel': 'Email',
  'login.emailPlaceholder': 'your@email.com',
  'login.passwordLabel': 'Password',
  'login.error.invalidCredentials': 'Invalid email or password.',
  'login.error.generic': 'Login failed. Please try again.',
};

export const labels: Record<LanguageCode, LabelMap> = {
  'pt-BR': ptBR,
  es,
  en,
};

export const DEFAULT_LANGUAGE: LanguageCode = 'pt-BR';

export function resolveLanguage(input?: string | null): LanguageCode {
  if (!input) return DEFAULT_LANGUAGE;
  if (input.startsWith('pt')) return 'pt-BR';
  if (input.startsWith('en')) return 'en';
  if (input.startsWith('es')) return 'es';
  return DEFAULT_LANGUAGE;
}

export function format(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''));
}
