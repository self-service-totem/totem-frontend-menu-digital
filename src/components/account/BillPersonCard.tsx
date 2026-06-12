import type { BillItem, CurrencyCode } from '@/types';
import { useLabels } from '@/i18n/I18nContext';
import { formatMoney } from '@/utils/format';

interface BillPersonCardProps {
  name: string;
  items: BillItem[];
  subtotal: number;
  currency: CurrencyCode;
  /** Highlight this card as the current customer's consumption */
  isMe?: boolean;
}

export function BillPersonCard({ name, items, subtotal, currency, isMe = false }: BillPersonCardProps) {
  const { t } = useLabels();

  return (
    <article className={`ff-person ${isMe ? 'ff-person--me' : ''}`}>
      <header className="ff-person__head">
        <span className="ff-person__who">
          <span className="ff-person__avatar">{(name || '?').charAt(0).toUpperCase()}</span>
          <span className="ff-person__name">{name}</span>
          {isMe && <span className="ff-person__you">{t('bill.you')}</span>}
        </span>
        <span className="ff-person__total">{formatMoney(subtotal, currency)}</span>
      </header>
      {items.map((it) => (
        <div key={it.productId} className="ff-person__line">
          <span>
            {it.quantity}× {it.productName}
          </span>
          <span>{formatMoney(it.total, currency)}</span>
        </div>
      ))}
    </article>
  );
}
