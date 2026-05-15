import type { Promotion } from '@/types';

interface PromoBannerProps {
  promotion: Promotion;
  onClick?: () => void;
}

export function PromoBanner({ promotion, onClick }: PromoBannerProps) {
  return (
    <div className="ff-promo" style={{ background: promotion.background }}>
      <div>
        <h3 className="ff-promo__title">{promotion.title}</h3>
        {promotion.subtitle && <p className="ff-promo__subtitle">{promotion.subtitle}</p>}
      </div>
      {promotion.ctaLabel && (
        <button type="button" className="ff-promo__cta" onClick={onClick}>
          {promotion.ctaLabel}
        </button>
      )}
    </div>
  );
}
