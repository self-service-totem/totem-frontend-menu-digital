import type { Order } from '@/types';

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    orderNumber: '#1042',
    customerName: 'Fernanda Ribeiro',
    items: [
      { productId: 'prod-entrada-mirante', name: 'Entrada Mirante', quantity: 1, unitPrice: 42.0 },
      { productId: 'prod-coca-zero', name: 'Coca Cola Zero', quantity: 2, unitPrice: 8.9 },
    ],
    subtotal: 59.8,
    serviceFee: 5.98,
    total: 65.78,
    status: 'preparing',
    createdAt: '2026-05-12T20:14:00Z',
  },
  {
    id: 'order-2',
    orderNumber: '#1043',
    customerName: 'Júnior',
    items: [
      { productId: 'prod-carne-de-sol', name: 'Carne de sol c/ aipim', quantity: 1, unitPrice: 78.9 },
      { productId: 'prod-coca-normal', name: 'Coca Cola Normal', quantity: 2, unitPrice: 8.9 },
      { productId: 'prod-pudim', name: 'Pudim de leite', quantity: 1, unitPrice: 16.5 },
    ],
    subtotal: 113.2,
    serviceFee: 11.32,
    total: 124.52,
    status: 'delivered',
    createdAt: '2026-05-12T20:20:00Z',
  },
];
