import type { Product } from '@/lib/types';
import { formatMoney } from '@/utils/format';

const FALLBACK_PRODUCT =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='28' fill='%239ca3af'%3E🍽%3C/text%3E%3C/svg%3E";

interface ProductCardProps {
  product: Product;
  onOpen: (product: Product) => void;
  variant?: 'row' | 'featured';
}

export function ProductCard({ product, onOpen }: ProductCardProps) {
  const open = () => onOpen(product);

  return (
    <article
      className="ff-product-row"
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && open()}
    >
      <div className="ff-product-row__body">
        <h3 className="ff-product-row__name">{product.name}</h3>
        {product.description && (
          <p className="ff-product-row__desc">{product.description}</p>
        )}
        <span className="ff-product-row__price">{formatMoney(product.price)}</span>
      </div>
      {product.imageUrl && (
        <img
          className="ff-product-row__img"
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_PRODUCT;
          }}
        />
      )}
    </article>
  );
}
