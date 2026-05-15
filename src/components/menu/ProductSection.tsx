import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductSectionProps {
  title: string;
  products: Product[];
  onOpen: (product: Product) => void;
  featured?: boolean;
}

export function ProductSection({ title, products, onOpen, featured }: ProductSectionProps) {
  if (products.length === 0) return null;
  return (
    <section className="ff-section">
      <h2 className="ff-section-title ff-section-title--lg">{title}</h2>
      <div
        className={featured ? 'ff-grid-2' : 'ff-product-list'}
        style={featured ? { padding: 0 } : undefined}
      >
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onOpen={onOpen}
            variant={featured ? 'featured' : 'row'}
          />
        ))}
      </div>
    </section>
  );
}
