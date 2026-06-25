// Shared mapping from DbTable.status (and derived states) to display metadata.
// Import this anywhere status needs to be rendered consistently.

export interface TableStatusUI {
  label: string;
  icon: string;        // Bootstrap Icons class (bi-*)
  color: string;       // Primary color — used for text, border, fill
  bgColor: string;     // Light background — used for tinted badge variant
  priority: 'high' | 'medium' | 'low';
  description: string; // One-line explanation shown in tooltips / aria
}

const STATUS_MAP: Record<string, TableStatusUI> = {
  EMPTY: {
    label: 'Vazia',
    icon: 'bi-circle',
    color: '#9ca3af',
    bgColor: '#f3f4f6',
    priority: 'low',
    description: 'Mesa disponível para novos clientes',
  },
  OCCUPIED: {
    label: 'Ocupada',
    icon: 'bi-person-check',
    color: '#0284c7',
    bgColor: '#eff6ff',
    priority: 'low',
    description: 'Mesa ocupada, sem pedidos ainda',
  },
  ORDER_IN_PROGRESS: {
    label: 'Em andamento',
    icon: 'bi-clock-history',
    color: '#0891b2',
    bgColor: '#ecfeff',
    priority: 'low',
    description: 'Pedido registrado e em processamento',
  },
  WAITING_FOR_KITCHEN: {
    label: 'Na cozinha',
    icon: 'bi-fire',
    color: '#2563eb',
    bgColor: '#eff6ff',
    priority: 'medium',
    description: 'Pedido enviado, aguardando preparo',
  },
  READY_TO_SERVE: {
    label: 'Pronto para servir',
    icon: 'bi-check2-circle',
    color: '#059669',
    bgColor: '#f0fdf4',
    priority: 'high',
    description: 'Pedido pronto — entregar à mesa',
  },
  WAITING_FOR_PAYMENT: {
    label: 'Aguardando pagamento',
    icon: 'bi-credit-card-2-front',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    priority: 'high',
    description: 'Conta solicitada, aguardando pagamento',
  },
  PARTIALLY_PAID: {
    label: 'Pagamento parcial',
    icon: 'bi-pie-chart-fill',
    color: '#d97706',
    bgColor: '#fffbeb',
    priority: 'medium',
    description: 'Parte da conta já foi paga',
  },
  CLOSED: {
    label: 'Fechada',
    icon: 'bi-check-circle',
    color: '#6b7280',
    bgColor: '#f9fafb',
    priority: 'low',
    description: 'Sessão encerrada — mesa pode ser liberada',
  },
  // Derived state — applied when pendingCallCount > 0
  // Uses distinct icon (megaphone) and red color to stand apart from READY_TO_SERVE (green check)
  WAITING_FOR_WAITER: {
    label: 'Chamando garçom',
    icon: 'bi-megaphone-fill',
    color: '#dc2626',
    bgColor: '#fef2f2',
    priority: 'high',
    description: 'Cliente solicitou atenção imediata do garçom',
  },
};

const FALLBACK: TableStatusUI = {
  label: 'Desconhecido',
  icon: 'bi-question-circle',
  color: '#9ca3af',
  bgColor: '#f3f4f6',
  priority: 'low',
  description: 'Status não reconhecido',
};

export function getTableStatusUI(status: string): TableStatusUI {
  return STATUS_MAP[status] ?? FALLBACK;
}
