import type { CurrencyCode, Order, OrderStatus } from '@/types';
import { useLabels } from '@/i18n/I18nContext';
import type { LabelKey } from '@/i18n/labels';
import { formatMoney } from '@/utils/format';

interface OrderHistoryCardProps {
  order: Order;
  currency: CurrencyCode;
}

// status → presentation (label key, icon, CSS modifier)
const STATUS_META: Record<OrderStatus, { labelKey: LabelKey; icon: string; mod: string }> = {
  pending: { labelKey: 'account.status.pending', icon: 'bi-hourglass-split', mod: 'pending' },
  preparing: { labelKey: 'account.status.preparing', icon: 'bi-fire', mod: 'preparing' },
  delivered: { labelKey: 'account.status.delivered', icon: 'bi-check-circle-fill', mod: 'delivered' },
  closed: { labelKey: 'account.status.closed', icon: 'bi-receipt', mod: 'closed' },
};

export function OrderHistoryCard({ order, currency }: OrderHistoryCardProps) {
  const { t, language } = useLabels();
  const itemCount = order.items.reduce((sum, it) => sum + it.quantity, 0);
  const meta = STATUS_META[order.status] ?? STATUS_META.pending;

  return (
    <article className="ff-order-card">
      <div className="ff-order-card__head">
        <span className="ff-order-card__number">{order.orderNumber}</span>
        <span className={`ff-status-badge ff-status-badge--${meta.mod}`}>
          <i className={`bi ${meta.icon}`} aria-hidden /> {t(meta.labelKey)}
        </span>
      </div>

      <div className="ff-order-card__items">
        {order.items.map((it) => it.name).join(' · ')}
      </div>

      <div className="ff-order-card__foot">
        <span className="ff-order-card__meta">
          {t('account.items', { n: itemCount })} · {new Date(order.createdAt).toLocaleString(language)}
        </span>
        <span className="ff-order-card__total">{formatMoney(order.total, currency)}</span>
      </div>
    </article>
  );
}
