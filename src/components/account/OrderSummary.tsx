import type { CurrencyCode } from '@/lib/types';
import { formatMoney } from '@/utils/format';

interface OrderSummaryProps {
  subtotal: number;
  serviceFee: number;
  total: number;
  currency?: CurrencyCode;
  subtotalLabel?: string;
  serviceFeeLabel?: string;
  totalLabel?: string;
}

export function OrderSummary({
  subtotal,
  serviceFee,
  total,
  currency = 'BRL',
  subtotalLabel = 'Subtotal',
  serviceFeeLabel = 'Taxa de serviço',
  totalLabel = 'Total',
}: OrderSummaryProps) {
  return (
    <div className="ff-summary">
      <div className="ff-summary__row">
        <span>{subtotalLabel}</span>
        <span>{formatMoney(subtotal, currency)}</span>
      </div>
      <div className="ff-summary__row">
        <span>{serviceFeeLabel}</span>
        <span>{formatMoney(serviceFee, currency)}</span>
      </div>
      <div className="ff-summary__row ff-summary__row--total">
        <span>{totalLabel}</span>
        <span>{formatMoney(total, currency)}</span>
      </div>
    </div>
  );
}
