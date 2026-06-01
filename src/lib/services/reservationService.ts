// F9: Reservation system
import { getCollection, insertOne, updateOne } from '@/lib/mock-db';
import { BRANCH_ID, TENANT_ID } from '@/lib/mock-db';
import type { Reservation, ReservationStatus } from '@/lib/types';

function delay<T>(v: T, ms = 150): Promise<T> {
  return new Promise((r) => setTimeout(() => r(v), ms));
}

export const reservationService = {
  async listForDate(date: string): Promise<Reservation[]> {
    return delay(
      getCollection<Reservation>('reservations')
        .filter((r) => r.date === date && r.branchId === BRANCH_ID)
        .sort((a, b) => a.time.localeCompare(b.time)),
    );
  },

  async listAll(): Promise<Reservation[]> {
    return delay(
      getCollection<Reservation>('reservations')
        .filter((r) => r.branchId === BRANCH_ID)
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    );
  },

  async create(
    data: Omit<Reservation, 'id' | 'tenantId' | 'branchId' | 'createdAt' | 'updatedAt' | 'status'>,
  ): Promise<Reservation> {
    const now = new Date().toISOString();
    const res: Reservation = {
      id: `res-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    return delay(insertOne('reservations', res));
  },

  async updateStatus(id: string, status: ReservationStatus): Promise<Reservation | null> {
    return delay(updateOne<Reservation>('reservations', id, { status }));
  },

  async confirmReservation(id: string): Promise<Reservation | null> {
    return reservationService.updateStatus(id, 'CONFIRMED');
  },

  async cancelReservation(id: string): Promise<Reservation | null> {
    return reservationService.updateStatus(id, 'CANCELED');
  },

  async seatReservation(id: string, tableId: string): Promise<Reservation | null> {
    return delay(updateOne<Reservation>('reservations', id, { status: 'SEATED', tableId }));
  },

  getTodayReservations(): Reservation[] {
    const today = new Date().toISOString().slice(0, 10);
    return getCollection<Reservation>('reservations').filter(
      (r) => r.date === today && r.branchId === BRANCH_ID && r.status !== 'CANCELED',
    ).sort((a, b) => a.time.localeCompare(b.time));
  },
};
