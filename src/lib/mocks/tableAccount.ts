import type { Bill, TableAccount } from '@/lib/types';

export function buildMockBill(tableId: string): Bill {
  const customers = [
    {
      customerName: 'Fernando',
      items: [
        {
          productId: 'prod-hamburguer',
          productName: 'Hambúrguer Artesanal',
          quantity: 1,
          unitPrice: 35.9,
          total: 35.9,
        },
        {
          productId: 'prod-coca-zero',
          productName: 'Coca Cola Zero',
          quantity: 1,
          unitPrice: 8.9,
          total: 8.9,
        },
      ],
      subtotal: 44.8,
    },
    {
      customerName: 'Pepe',
      items: [
        {
          productId: 'prod-pizza-mussarela',
          productName: 'Pizza Mussarela',
          quantity: 1,
          unitPrice: 62.9,
          total: 62.9,
        },
      ],
      subtotal: 62.9,
    },
    {
      customerName: 'Juan',
      items: [
        {
          productId: 'prod-pasta-bolonhesa',
          productName: 'Pasta Bolonhesa',
          quantity: 1,
          unitPrice: 48.9,
          total: 48.9,
        },
      ],
      subtotal: 48.9,
    },
  ];
  const subtotal = +customers.reduce((acc, c) => acc + c.subtotal, 0).toFixed(2);
  const serviceFee = +(subtotal * 0.1).toFixed(2);
  const tableTotal = +(subtotal + serviceFee).toFixed(2);
  return {
    tableId,
    tableName: `Mesa ${tableId}`,
    customers,
    subtotal,
    serviceFee,
    tableTotal,
  };
}

// Conservado por compatibilidad con código legacy.
export const mockTableAccount: TableAccount = {
  tableNumber: '140',
  customers: [],
  subtotal: 0,
  serviceFee: 0,
  total: 0,
};
