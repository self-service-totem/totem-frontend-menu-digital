import type { CartItem } from '@/types';
import { formatMoney } from '@/utils/format';
import { QuantitySelector } from '@/components/common/QuantitySelector';

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  const lineTotal = item.unitPrice * item.quantity;
  return (
    <article className="ff-cart-item">
      <img className="ff-cart-item__img" src={item.imageUrl} alt={item.name} loading="lazy" />
      <div className="ff-cart-item__body">
        <h3 className="ff-cart-item__name">{item.name}</h3>
        {item.note && <p className="ff-cart-item__note">{item.note}</p>}
        <div className="ff-cart-item__row">
          <QuantitySelector
            value={item.quantity}
            onChange={(q) => onQuantityChange(item.id, q)}
            min={1}
          />
          <span className="ff-cart-item__price">{formatMoney(lineTotal)}</span>
        </div>
      </div>
      <button
        type="button"
        className="ff-cart-item__remove"
        onClick={() => onRemove(item.id)}
        aria-label={`Remover ${item.name}`}
      >
        <i className="bi bi-trash" />
      </button>
    </article>
  );
}
