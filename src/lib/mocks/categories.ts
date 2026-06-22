import type { Category } from '@/lib/types';

export const mockCategories: Category[] = [
  {
    id: 'cat-entradas',
    name: 'Entradas',
    imageUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=200&q=70',
    order: 1,
  },
  {
    id: 'cat-bebidas',
    name: 'Bebidas',
    imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=200&q=70',
    order: 3,
  },
  {
    id: 'cat-pratos',
    name: 'Pratos principais',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=70',
    order: 4,
  },
  {
    id: 'cat-sobremesas',
    name: 'Sobremesas',
    imageUrl: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=200&q=70',
    order: 5,
  },
  {
    id: 'cat-cafeteria',
    name: 'Cafeteria',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&q=70',
    order: 6,
  },
];
