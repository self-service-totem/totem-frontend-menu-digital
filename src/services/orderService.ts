import type { Bill, CartItem, Order, PlaceOrderRequest } from '@/types';
import { mockOrders } from '@/mocks';
import { buildMockBill } from '@/mocks/tableAccount';
import { delay } from './api';

export interface CloseBillResponse {
  ok: true;
  ticketId: string;
}

export const orderService = {
  // POST /api/tables/{tableId}/orders
  async placeOrder(
    tableId: string,
    payload: PlaceOrderRequest,
    cartItems: CartItem[],
  ): Promise<Order> {
    const subtotal = cartItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
    const serviceFee = +(subtotal * 0.1).toFixed(2);
    const total = +(subtotal + serviceFee).toFixed(2);
    const order: Order = {
      id: `order-${Date.now()}`,
      orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: payload.customerName,
      items: cartItems.map((it) => ({
        productId: it.productId,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        note: it.note,
      })),
      subtotal: +subtotal.toFixed(2),
      serviceFee,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[orderService.placeOrder]', tableId, payload);
    }
    return delay(order, 400);
  },

  async listMyOrders(): Promise<Order[]> {
    return delay(mockOrders);
  },

  // GET /api/tables/{tableId}/bill
  async getBill(tableId: string): Promise<Bill> {
    return delay(buildMockBill(tableId));
  },

  // POST /api/tables/{tableId}/bill/close-request
  async requestCloseBill(
    tableId: string,
    payload: { customerName: string },
  ): Promise<CloseBillResponse> {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[orderService.requestCloseBill]', tableId, payload);
    }
    return delay({ ok: true as const, ticketId: `cb-${Date.now()}` }, 350);
  },
};
