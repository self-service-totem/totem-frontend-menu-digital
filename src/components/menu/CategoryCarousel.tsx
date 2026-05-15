import type { Category } from '@/types';

interface CategoryCarouselProps {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryCarousel({ categories, activeId, onSelect }: CategoryCarouselProps) {
  return (
    <div className="ff-categories" role="tablist" aria-label="Categorias">
      <button
        type="button"
        role="tab"
        aria-selected={activeId === null}
        className={`ff-category ${activeId === null ? 'ff-category--active' : ''}`}
        onClick={() => onSelect(null)}
      >
        <span
          className="ff-category__img"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--ff-primary-soft)',
            color: 'var(--ff-primary)',
            fontSize: '1.4rem',
          }}
          aria-hidden
        >
          <i className="bi bi-grid" />
        </span>
        <span className="ff-category__name">Tudo</span>
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
            onClick={() => onSelect(cat.id)}
          >
            <img className="ff-category__img" src={cat.imageUrl} alt="" loading="lazy" />
            <span className="ff-category__name">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
