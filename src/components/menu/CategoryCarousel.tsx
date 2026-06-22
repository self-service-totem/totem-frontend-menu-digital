import type { Category } from '@/lib/types';
import { useLabels } from '@/i18n/I18nContext';

const FALLBACK_CAT =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Ccircle cx='30' cy='30' r='30' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='22' fill='%239ca3af'%3E🍽%3C/text%3E%3C/svg%3E";

interface CategoryCarouselProps {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryCarousel({ categories, activeId, onSelect }: CategoryCarouselProps) {
  const { t } = useLabels();
  return (
    <div className="ff-categories" role="tablist" aria-label="Categorias">
      <button
        type="button"
        role="tab"
        aria-selected={activeId === null}
        className={`ff-category ${activeId === null ? 'ff-category--active' : ''}`}
        onClick={() => onSelect(null)}
      >
        <span className="ff-category__img ff-category__img--icon" aria-hidden>
          <i className="bi bi-grid-fill" />
        </span>
        <span className="ff-category__name">{t('menu.allCategories')}</span>
      </button>
      {categories.map((cat) => {
        const active = activeId === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`ff-category ${active ? 'ff-category--active' : ''}`}
            onClick={() => onSelect(active ? null : cat.id)}
          >
            <img
              className="ff-category__img"
              src={cat.imageUrl}
              alt=""
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_CAT;
              }}
            />
            <span className="ff-category__name">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
