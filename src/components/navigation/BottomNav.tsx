import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '@/app/CartContext';
import { useSession } from '@/app/SessionContext';
import { useLabels } from '@/i18n/I18nContext';
import type { LabelKey } from '@/i18n/labels';

interface NavItem {
  to: (tableId: string | null) => string;
  matches: (path: string) => boolean;
  labelKey: LabelKey;
  icon: string;
  center?: boolean;
}

const items: NavItem[] = [
  {
    to: (tableId) => (tableId ? `/menu/${tableId}` : '/menu'),
    matches: (p) => p.startsWith('/menu'),
    labelKey: 'nav.menu',
    icon: 'bi-card-list',
  },
  {
    to: () => '/waiter',
    matches: (p) => p === '/waiter',
    labelKey: 'nav.waiter',
    icon: 'bi-bell',
  },
  {
    to: () => '/cart',
    matches: (p) => p === '/cart',
    labelKey: 'nav.order',
    icon: 'bi-bag-plus',
    center: true,
  },
  {
    to: () => '/cashback',
    matches: (p) => p === '/cashback',
    labelKey: 'nav.cashback',
    icon: 'bi-piggy-bank',
  },
  {
    to: () => '/close-account',
    matches: (p) => p === '/close-account' || p === '/account',
    labelKey: 'nav.bill',
    icon: 'bi-receipt',
  },
];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { totalQuantity } = useCart();
  const { tableId } = useSession();
  const { t } = useLabels();

  return (
    <nav className="ff-bottom-nav" aria-label="Navegação principal">
      {items.map((item) => {
        const active = item.matches(pathname);
        const showBadge = item.center && totalQuantity > 0;
        return (
          <button
            key={item.labelKey}
            type="button"
            onClick={() => navigate(item.to(tableId))}
            className={`ff-bottom-nav__item ${
              item.center ? 'ff-bottom-nav__item--center' : ''
            } ${active && !item.center ? 'ff-bottom-nav__item--active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <i className={`bi ${item.icon}`} aria-hidden />
            <span>{t(item.labelKey)}</span>
            {showBadge && <span className="ff-bottom-nav__badge">{totalQuantity}</span>}
          </button>
        );
      })}
    </nav>
  );
}
