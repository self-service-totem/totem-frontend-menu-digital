import type { WaiterCallRequest } from '@/types';
import { delay } from './api';
import { insertOne, getCollection, BRANCH_ID, TENANT_ID } from '@/lib/mock-db';
import type { WaiterCall } from '@/lib/types';

export interface WaiterCallResponse {
  ok: true;
  ticketId: string;
}

// Cuando exista el backend:
// return request<WaiterCallResponse>(
//   `/tables/${encodeURIComponent(tableId)}/waiter-call`,
//   { method: 'POST', body: JSON.stringify(payload) }
// );
export const waiterService = {
  async callWaiter(tableId: string, payload: WaiterCallRequest): Promise<WaiterCallResponse> {
    if (!payload.phone.trim()) {
      throw new Error('phone is required');
    }
    const tables = getCollection<{ id: string; number: string }>('tables');
    const table = tables.find((t) => t.id === tableId || t.number === tableId);
    const now = new Date().toISOString();
    const ticketId = `wc-${Date.now()}`;
    const call: WaiterCall = {
      id: ticketId,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      tableId: table?.id ?? tableId,
      tableNumber: table?.number ?? tableId,
      customerName: payload.customerName,
      phone: payload.phone,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    insertOne('waiterCalls', call);
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[waiterService.callWaiter]', tableId, payload);
    }
    return delay({ ok: true as const, ticketId }, 350);
  },
};
