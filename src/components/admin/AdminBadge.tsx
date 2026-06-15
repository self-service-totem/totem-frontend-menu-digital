export type AdminBadgeVariant =
  | 'new' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled'
  | 'waiting' | 'called' | 'serving' | 'completed'
  | 'active' | 'inactive'
  | 'draft' | 'neutral'
  | 'blue' | 'amber' | 'green' | 'purple' | 'red' | 'slate';

const ORDER_STATUS_VARIANT: Record<string, AdminBadgeVariant> = {
  DRAFT:           'draft',
  CREATED:         'neutral',
  SENT_TO_KITCHEN: 'new',
  PREPARING:       'preparing',
  READY:           'ready',
  DELIVERED:       'delivered',
  CLOSED:          'paid',
  CANCELED:        'cancelled',
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT:           'Rascunho',
  CREATED:         'Criado',
  SENT_TO_KITCHEN: 'Na cozinha',
  PREPARING:       'Preparando',
  READY:           'Pronto',
  DELIVERED:       'Entregue',
  CLOSED:          'Encerrado',
  CANCELED:        'Cancelado',
};

const PAYMENT_STATUS_VARIANT: Record<string, AdminBadgeVariant> = {
  UNPAID:         'neutral',
  PARTIALLY_PAID: 'amber',
  PAID:           'green',
  REFUNDED:       'purple',
  CANCELED:       'cancelled',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID:         'Não pago',
  PARTIALLY_PAID: 'Parcial',
  PAID:           'Pago',
  REFUNDED:       'Reembolsado',
  CANCELED:       'Cancelado',
};

const QUEUE_STATUS_VARIANT: Record<string, AdminBadgeVariant> = {
  WAITING:   'waiting',
  CALLED:    'called',
  SERVING:   'serving',
  COMPLETED: 'paid',
  CANCELED:  'cancelled',
};

const QUEUE_STATUS_LABEL: Record<string, string> = {
  WAITING:   'Aguardando',
  CALLED:    'Chamado',
  SERVING:   'Atendendo',
  COMPLETED: 'Concluído',
  CANCELED:  'Cancelado',
};

export function AdminBadge({
  variant,
  label,
  className = '',
}: {
  variant: AdminBadgeVariant;
  label: string;
  className?: string;
}) {
  return (
    <span className={`ff-admin-badge ff-admin-badge--${variant} ${className}`.trim()}>
      {label}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <AdminBadge
      variant={ORDER_STATUS_VARIANT[status] ?? 'neutral'}
      label={ORDER_STATUS_LABEL[status] ?? status}
    />
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <AdminBadge
      variant={PAYMENT_STATUS_VARIANT[status] ?? 'neutral'}
      label={PAYMENT_STATUS_LABEL[status] ?? status}
    />
  );
}

export function QueueStatusBadge({ status }: { status: string }) {
  return (
    <AdminBadge
      variant={QUEUE_STATUS_VARIANT[status] ?? 'neutral'}
      label={QUEUE_STATUS_LABEL[status] ?? status}
    />
  );
}
