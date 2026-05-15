import type { Product } from '@/types';
import { formatMoney } from '@/utils/format';

interface ProductCardProps {
  product: Product;
  onOpen: (product: Product) => void;
  variant?: 'row' | 'featured';
}

export function ProductCard({ product, onOpen, variant = 'row' }: ProductCardProps) {
  const open = () => onOpen(product);

  if (variant === 'featured') {
    return (
      <article
        className="ff-product ff-product--featured"
        onClick={open}
        role="button"
      >
        <img className="ff-product__img" src={product.imageUrl} alt={product.name} loading="lazy" />
        <div className="ff-product__body">
          <h3 className="ff-product__name">{product.name}</h3>
          {product.description && <p className="ff-product__desc">{product.description}</p>}
          <div className="ff-product__row">
            <span className="ff-product__price">{formatMoney(product.price)}</span>
            <button
              type="button"
              className="ff-product__add"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              aria-label={`Ver ${product.name}`}
            >
              <i className="bi bi-plus" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="ff-product" onClick={open} role="button">
      <img className="ff-product__img" src={product.imageUrl} alt={product.name} loading="lazy" />
      <div className="ff-product__body">
        <h3 className="ff-product__name">{product.name}</h3>
        {product.description && <p className="ff-product__desc">{product.description}</p>}
        <span className="ff-product__price">{formatMoney(product.price)}</span>
      </div>
      <button
        type="button"
        className="ff-product__add"
        onClick={(e) => {
          e.stopPropagation();
          open();
        }}
        aria-label={`Ver ${product.name}`}
      >
        <i className="bi bi-plus" />
      </button>
    </article>
  );
}
