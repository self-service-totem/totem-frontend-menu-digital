import type { WaiterCallRequest } from '@/types';
import { delay } from './api';

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
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[waiterService.callWaiter]', tableId, payload);
    }
    return delay({ ok: true as const, ticketId: `wc-${Date.now()}` }, 350);
  },
};
