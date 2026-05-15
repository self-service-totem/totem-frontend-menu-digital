// Catálogo de etiquetas por idioma. La estructura está armada para que más
// adelante se pueda reemplazar por una librería (react-intl / i18next) sin tocar
// las páginas: cada componente lee de `useLabels()` por clave.

export type LanguageCode = 'pt-BR' | 'es' | 'en';

export type LabelKey =
  | 'nav.waiter'
  | 'nav.rating'
  | 'nav.order'
  | 'nav.cashback'
  | 'nav.bill'
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
  | 'common.optional';

type LabelMap = Record<LabelKey, string>;

const ptBR: LabelMap = {
  'nav.waiter': 'Garçom',
  'nav.rating': 'Avaliar',
  'nav.order': 'Pedir',
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
};

const es: LabelMap = {
  'nav.waiter': 'Mozo',
  'nav.rating': 'Evaluar',
  'nav.order': 'Pedir',
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
};

const en: LabelMap = {
  ...es,
  'nav.waiter': 'Waiter',
  'nav.rating': 'Rate',
  'nav.order': 'Order',
  'nav.bill': 'Bill',
  'menu.searchPlaceholder': 'Search product',
  'product.add': 'Add',
  'cart.placeOrder': 'Place order',
  'waiter.title': 'Waiter',
  'waiter.help': 'Need help?',
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
