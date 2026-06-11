// Catálogo de etiquetas por idioma. La estructura está armada para que más
// adelante se pueda reemplazar por una librería (react-intl / i18next) sin tocar
// las páginas: cada componente lee de `useLabels()` por clave.

export type LanguageCode = 'pt-BR' | 'es' | 'en';

export type LabelKey =
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
  | 'product.quantity'
  | 'product.notes'
  | 'product.notesPlaceholder'
  | 'product.add'
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
  | 'rating.title'
  | 'rating.question'
  | 'rating.tapStars'
  | 'rating.commentPlaceholder'
  | 'rating.send'
  | 'rating.thanks'
  | 'rating.thanksDesc'
  | 'cashback.title'
  | 'cashback.balance'
  | 'cashback.note'
  | 'cashback.history'
  | 'cashback.signup'
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
  | 'kiosk.order.emptyHint'
  | 'kiosk.order.review'
  | 'kiosk.cart.title'
  | 'kiosk.cart.empty'
  | 'kiosk.cart.remove'
  | 'kiosk.cart.serviceFee'
  | 'kiosk.cart.addMore'
  | 'kiosk.cart.confirmPay'
  | 'kiosk.payment.title'
  | 'kiosk.payment.totalLabel'
  | 'kiosk.payment.how'
  | 'kiosk.payment.card'
  | 'kiosk.payment.cardDesc'
  | 'kiosk.payment.pix'
  | 'kiosk.payment.pixDesc'
  | 'kiosk.payment.cash'
  | 'kiosk.payment.cashDesc'
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
  | 'kiosk.menu.categories'
  | 'kiosk.menu.added'
  | 'kiosk.idle.title'
  | 'kiosk.idle.subtitle'
  | 'kiosk.idle.continue'
  | 'kiosk.idle.restart'
  | 'kiosk.a11y.label';

type LabelMap = Record<LabelKey, string>;

const ptBR: LabelMap = {
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
  'product.quantity': 'Quantidade',
  'product.notes': 'Observação',
  'product.notesPlaceholder': 'Ex: Tirar item "X"',
  'product.add': 'Adicionar',
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
  'rating.title': 'Avaliar',
  'rating.question': 'Como foi sua experiência?',
  'rating.tapStars': 'Toque nas estrelas para avaliar.',
  'rating.commentPlaceholder': 'Deixe um comentário (opcional)',
  'rating.send': 'Enviar avaliação',
  'rating.thanks': 'Obrigado pela sua avaliação!',
  'rating.thanksDesc': 'Sua opinião nos ajuda a melhorar.',
  'cashback.title': 'Cashback',
  'cashback.balance': 'Saldo disponível',
  'cashback.note': 'Você ganha {rate}% de volta em cada pedido.',
  'cashback.history': 'Histórico',
  'cashback.signup': 'Cadastrar para receber cashback',
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
  'kiosk.order.emptyHint': 'Adicione itens ao carrinho para continuar',
  'kiosk.order.review': 'Revisar pedido',
  'kiosk.cart.title': 'Revisão do pedido',
  'kiosk.cart.empty': 'Carrinho vazio',
  'kiosk.cart.remove': 'Remover',
  'kiosk.cart.serviceFee': 'Taxa de serviço (10%)',
  'kiosk.cart.addMore': 'Adicionar mais',
  'kiosk.cart.confirmPay': 'Confirmar e pagar',
  'kiosk.payment.title': 'Pagamento',
  'kiosk.payment.totalLabel': 'Total a pagar',
  'kiosk.payment.how': 'Como deseja pagar?',
  'kiosk.payment.card': 'Cartão',
  'kiosk.payment.cardDesc': 'Débito ou crédito',
  'kiosk.payment.pix': 'PIX',
  'kiosk.payment.pixDesc': 'Escaneie o QR Code',
  'kiosk.payment.cash': 'Dinheiro',
  'kiosk.payment.cashDesc': 'Pague no caixa',
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
  'kiosk.menu.categories': 'Categorias',
  'kiosk.menu.added': 'Adicionado',
  'kiosk.idle.title': 'Você ainda está aí?',
  'kiosk.idle.subtitle': 'Sua sessão será reiniciada em {s}s',
  'kiosk.idle.continue': 'Sim, continuar',
  'kiosk.idle.restart': 'Começar de novo',
  'kiosk.a11y.label': 'Modo acessível',
};

const es: LabelMap = {
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
  'product.quantity': 'Cantidad',
  'product.notes': 'Observación',
  'product.notesPlaceholder': 'Ej: Sin "X"',
  'product.add': 'Agregar',
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
  'rating.title': 'Evaluar',
  'rating.question': '¿Cómo fue tu experiencia?',
  'rating.tapStars': 'Tocá las estrellas para puntuar.',
  'rating.commentPlaceholder': 'Dejá un comentario (opcional)',
  'rating.send': 'Enviar evaluación',
  'rating.thanks': '¡Gracias por tu evaluación!',
  'rating.thanksDesc': 'Tu opinión nos ayuda a mejorar.',
  'cashback.title': 'Cashback',
  'cashback.balance': 'Saldo disponible',
  'cashback.note': 'Recibís {rate}% de vuelta en cada pedido.',
  'cashback.history': 'Historial',
  'cashback.signup': 'Registrarme para cashback',
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
  'kiosk.order.emptyHint': 'Agregá ítems al carrito para continuar',
  'kiosk.order.review': 'Revisar pedido',
  'kiosk.cart.title': 'Revisión del pedido',
  'kiosk.cart.empty': 'Carrito vacío',
  'kiosk.cart.remove': 'Quitar',
  'kiosk.cart.serviceFee': 'Servicio (10%)',
  'kiosk.cart.addMore': 'Agregar más',
  'kiosk.cart.confirmPay': 'Confirmar y pagar',
  'kiosk.payment.title': 'Pago',
  'kiosk.payment.totalLabel': 'Total a pagar',
  'kiosk.payment.how': '¿Cómo querés pagar?',
  'kiosk.payment.card': 'Tarjeta',
  'kiosk.payment.cardDesc': 'Débito o crédito',
  'kiosk.payment.pix': 'PIX',
  'kiosk.payment.pixDesc': 'Escaneá el código QR',
  'kiosk.payment.cash': 'Efectivo',
  'kiosk.payment.cashDesc': 'Pagá en la caja',
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
  'kiosk.menu.categories': 'Categorías',
  'kiosk.menu.added': 'Agregado',
  'kiosk.idle.title': '¿Seguís ahí?',
  'kiosk.idle.subtitle': 'Tu sesión se reiniciará en {s}s',
  'kiosk.idle.continue': 'Sí, continuar',
  'kiosk.idle.restart': 'Empezar de nuevo',
  'kiosk.a11y.label': 'Modo accesible',
};

const en: LabelMap = {
  ...es,
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
  'product.add': 'Add',
  'product.notes': 'Notes',
  'product.notesPlaceholder': 'E.g.: No onions',
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
  'summary.serviceFee': 'Service fee',
  'bill.title': 'Bill',
  'bill.tabTable': 'Table',
  'bill.tabIndividual': 'My Bill',
  'bill.closeTable': 'Request table bill',
  'bill.closeMine': 'Request my bill',
  'bill.empty': 'No orders yet at this table.',
  'bill.requestSent': 'Close request sent to the waiter.',
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
  'rating.title': 'Rate',
  'rating.question': 'How was your experience?',
  'rating.tapStars': 'Tap the stars to rate.',
  'rating.commentPlaceholder': 'Leave a comment (optional)',
  'rating.send': 'Send rating',
  'rating.thanks': 'Thank you for your rating!',
  'rating.thanksDesc': 'Your feedback helps us improve.',
  'cashback.title': 'Cashback',
  'cashback.balance': 'Available balance',
  'cashback.note': 'Earn {rate}% back on every order.',
  'cashback.history': 'History',
  'cashback.signup': 'Sign up for cashback',
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
  'kiosk.order.emptyHint': 'Add items to your cart to continue',
  'kiosk.order.review': 'Review order',
  'kiosk.cart.title': 'Order review',
  'kiosk.cart.empty': 'Cart is empty',
  'kiosk.cart.remove': 'Remove',
  'kiosk.cart.serviceFee': 'Service fee (10%)',
  'kiosk.cart.addMore': 'Add more',
  'kiosk.cart.confirmPay': 'Confirm & pay',
  'kiosk.payment.title': 'Payment',
  'kiosk.payment.totalLabel': 'Total to pay',
  'kiosk.payment.how': 'How would you like to pay?',
  'kiosk.payment.card': 'Card',
  'kiosk.payment.cardDesc': 'Debit or credit',
  'kiosk.payment.pix': 'PIX',
  'kiosk.payment.pixDesc': 'Scan the QR code',
  'kiosk.payment.cash': 'Cash',
  'kiosk.payment.cashDesc': 'Pay at the counter',
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
  'kiosk.menu.categories': 'Categories',
  'kiosk.menu.added': 'Added',
  'kiosk.idle.title': 'Are you still there?',
  'kiosk.idle.subtitle': 'Your session will restart in {s}s',
  'kiosk.idle.continue': 'Yes, continue',
  'kiosk.idle.restart': 'Start over',
  'kiosk.a11y.label': 'Accessibility mode',
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
