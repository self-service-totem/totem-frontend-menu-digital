import { getCollection, findById } from '@/lib/mock-db';
import type { QueueTicket, DbOrder } from '@/lib/types';

export interface EnrichedQueueTicket extends QueueTicket {
  items: DbOrder['items'];
}

function enrich(ticket: QueueTicket): EnrichedQueueTicket {
  const order = findById<DbOrder>('orders', ticket.orderId);
  return { ...ticket, items: order?.items ?? [] };
}

export const queueService = {
  async listActive(): Promise<EnrichedQueueTicket[]> {
    return new Promise((res) =>
      setTimeout(
        () =>
          res(
            getCollection<QueueTicket>('queueTickets')
              .filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELED')
              .sort((a, b) => a.ticketNumber - b.ticketNumber)
              .map(enrich),
          ),
        200,
      ),
    );
  },

  listActiveSync(): EnrichedQueueTicket[] {
    return getCollection<QueueTicket>('queueTickets')
      .filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELED')
      .sort((a, b) => a.ticketNumber - b.ticketNumber)
      .map(enrich);
  },
};
