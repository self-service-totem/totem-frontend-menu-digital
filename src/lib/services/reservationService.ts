// F9: Reservation system
import { getCollection, insertOne, updateOne } from '@/lib/mock-db';
import { BRANCH_ID, TENANT_ID } from '@/lib/mock-db';
import type {
  Reservation,
  ReservationStatus,
  WalkIn,
  WalkInStatus,
  ReservationSettings,
  DbTable,
} from '@/lib/types';

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

  async update(
    id: string,
    data: Partial<Omit<Reservation, 'id' | 'tenantId' | 'branchId' | 'createdAt'>>,
  ): Promise<Reservation | null> {
    return delay(updateOne<Reservation>('reservations', id, { ...data, updatedAt: new Date().toISOString() }));
  },

  async updateStatus(id: string, status: ReservationStatus): Promise<Reservation | null> {
    return delay(updateOne<Reservation>('reservations', id, { status, updatedAt: new Date().toISOString() }));
  },

  async confirmReservation(id: string): Promise<Reservation | null> {
    return reservationService.updateStatus(id, 'CONFIRMED');
  },

  async cancelReservation(id: string): Promise<Reservation | null> {
    return reservationService.updateStatus(id, 'CANCELED');
  },

  async seatReservation(id: string, tableId?: string, tableNumber?: string): Promise<Reservation | null> {
    const now = new Date().toISOString();
    const result = updateOne<Reservation>('reservations', id, {
      status: 'SEATED',
      ...(tableId ? { tableId } : {}),
      ...(tableNumber ? { tableNumber } : {}),
      updatedAt: now,
    });
    if (tableId) {
      updateOne<DbTable>('tables', tableId, { status: 'OCCUPIED', updatedAt: now });
    }
    return delay(result);
  },

  async markNoShow(id: string): Promise<Reservation | null> {
    return reservationService.updateStatus(id, 'NO_SHOW');
  },

  async complete(id: string): Promise<Reservation | null> {
    return reservationService.updateStatus(id, 'COMPLETED');
  },

  getTodayReservations(): Reservation[] {
    const today = new Date().toISOString().slice(0, 10);
    return getCollection<Reservation>('reservations').filter(
      (r) => r.date === today && r.branchId === BRANCH_ID && r.status !== 'CANCELED',
    ).sort((a, b) => a.time.localeCompare(b.time));
  },

  // ─── Walk-ins ───────────────────────────────────────────────────────────────

  async listWalkIns(): Promise<WalkIn[]> {
    return delay(
      getCollection<WalkIn>('walkIns')
        .filter((w) => w.branchId === BRANCH_ID)
        .sort((a, b) => a.arrivedAt.localeCompare(b.arrivedAt)),
    );
  },

  async addWalkIn(
    data: Omit<WalkIn, 'id' | 'tenantId' | 'branchId' | 'createdAt' | 'updatedAt' | 'status'>,
  ): Promise<WalkIn> {
    const now = new Date().toISOString();
    const wi: WalkIn = {
      id: `wi-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      status: 'WAITING',
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    return delay(insertOne('walkIns', wi));
  },

  async updateWalkInStatus(
    id: string,
    status: WalkInStatus,
    extra?: { tableId?: string; tableNumber?: string; seatedAt?: string },
  ): Promise<WalkIn | null> {
    return delay(
      updateOne<WalkIn>('walkIns', id, {
        status,
        ...(extra ?? {}),
        updatedAt: new Date().toISOString(),
      }),
    );
  },

  // ─── Settings ───────────────────────────────────────────────────────────────

  async getSettings(): Promise<ReservationSettings | null> {
    const all = getCollection<ReservationSettings>('reservationSettings');
    return delay(all.find((s) => s.branchId === BRANCH_ID) ?? null);
  },

  async saveSettings(data: Partial<ReservationSettings>): Promise<ReservationSettings> {
    const existing = getCollection<ReservationSettings>('reservationSettings')
      .find((s) => s.branchId === BRANCH_ID);
    if (existing) {
      return delay(
        updateOne<ReservationSettings>('reservationSettings', existing.id, {
          ...data,
          updatedAt: new Date().toISOString(),
        }) as ReservationSettings,
      );
    }
    const now = new Date().toISOString();
    const settings: ReservationSettings = {
      id: `res-settings-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      defaultDurationMinutes: 90,
      lateToleranceMinutes: 15,
      openingTime: '11:30',
      closingTime: '23:00',
      slotIntervalMinutes: 30,
      maxPartySize: 12,
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    return delay(insertOne('reservationSettings', settings));
  },
};
