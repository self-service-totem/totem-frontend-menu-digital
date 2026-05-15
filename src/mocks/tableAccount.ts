import type { Bill, TableAccount } from '@/types';

export function buildMockBill(tableId: string): Bill {
  const customers = [
    {
      customerName: 'Fernanda Ribeiro',
      items: [
        {
          productId: 'prod-isquinha-frango',
          productName: 'Isquinha de Frango Kids',
          quantity: 1,
          unitPrice: 29.9,
          total: 29.9,
        },
        {
          productId: 'prod-coca-zero',
          productName: 'Coca Cola Zero',
          quantity: 1,
          unitPrice: 8.9,
          total: 8.9,
        },
      ],
      subtotal: 38.8,
    },
    {
      customerName: 'Júnior',
      items: [
        {
          productId: 'prod-carne-de-sol',
          productName: 'Carne de sol c/ aipim',
          quantity: 1,
          unitPrice: 98.9,
          total: 98.9,
        },
      ],
      subtotal: 98.9,
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
