import { formatMoney } from '@/utils/format';

interface OrderSummaryProps {
  subtotal: number;
  serviceFee: number;
  total: number;
  serviceFeeLabel?: string;
}

export function OrderSummary({
  subtotal,
  serviceFee,
  total,
  serviceFeeLabel = 'Taxa de serviço',
}: OrderSummaryProps) {
  return (
    <div className="ff-summary">
      <div className="ff-summary__row">
        <span>Subtotal</span>
        <span>{formatMoney(subtotal)}</span>
      </div>
      <div className="ff-summary__row">
        <span>{serviceFeeLabel}</span>
        <span>{formatMoney(serviceFee)}</span>
      </div>
      <div className="ff-summary__row ff-summary__row--total">
        <span>Total</span>
        <span>{formatMoney(total)}</span>
      </div>
    </div>
  );
}
