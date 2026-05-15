import type { Promotion } from '@/types';

export const mockPromotions: Promotion[] = [
  {
    id: 'promo-cashback',
    title: 'Programa de cashback',
    subtitle: 'Ganhe 5% de volta em cada pedido',
    background: 'linear-gradient(135deg, #e11d2a 0%, #ff6b3d 100%)',
    ctaLabel: 'Saber mais',
  },
  {
    id: 'promo-combo',
    title: 'Combo família',
    subtitle: '2 pratos principais + 2 bebidas com 15% off',
    background: 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)',
    ctaLabel: 'Ver combo',
  },
];
