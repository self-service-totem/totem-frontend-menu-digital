import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

// Gray food placeholder — never shows a broken icon
const FALLBACK_BANNER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='120' viewBox='0 0 400 120'%3E%3Crect width='400' height='120' fill='%23374151'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='32' fill='%236b7280'%3E🍽%3C/text%3E%3C/svg%3E";

interface ProductSectionProps {
  title: string;
  imageUrl?: string;
  products: Product[];
  onOpen: (product: Product) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function ProductSection({
  title,
  imageUrl,
  products,
  onOpen,
  isExpanded = false,
  onToggle,
}: ProductSectionProps) {
  const isAccordion = onToggle !== undefined;

  return (
    <section className="ff-product-section">
      {/* ── Category banner ────────────────────────────────── */}
      {imageUrl ? (
        <div
          className={`ff-cat-banner ${isAccordion ? 'ff-cat-banner--clickable' : ''} ${isExpanded ? 'ff-cat-banner--open' : ''}`}
          onClick={onToggle}
          role={isAccordion ? 'button' : undefined}
          aria-expanded={isAccordion ? isExpanded : undefined}
        >
          <img
            className="ff-cat-banner__img"
            src={imageUrl}
            alt=""
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_BANNER;
            }}
          />
          <div className="ff-cat-banner__overlay">
            <span className="ff-cat-banner__title">{title}</span>
            {isAccordion && (
              <i
                className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} ff-cat-banner__chevron`}
                aria-hidden
              />
            )}
          </div>
        </div>
      ) : (
        <h2
          className="ff-section-title ff-section-title--lg"
          style={{ padding: '12px 16px 4px', margin: 0 }}
        >
          {title}
        </h2>
      )}

      {/* ── Accordion content (CSS Grid animation) ─────────── */}
      <div className={`ff-cat-content ${isExpanded ? 'ff-cat-content--open' : ''}`}>
        <div className="ff-cat-content__inner">
          {products.length === 0 ? (
            <p className="ff-cat-empty">Nenhum produto disponível.</p>
          ) : (
            <div className="ff-product-list">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onOpen={onOpen} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
