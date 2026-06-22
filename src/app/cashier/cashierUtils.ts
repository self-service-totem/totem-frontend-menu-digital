import type { Dispatch, SetStateAction } from 'react';
import type { PaymentMethod } from '@/lib/types';

// ─── Tab / filter types ────────────────────────────────────────────────────────

export type Tab = 'tables' | 'orders' | 'kiosk' | 'history' | 'receipts' | 'invoices';
export type PaymentFilter = 'all' | 'pending' | 'partial' | 'paid';
export type KioskPayState = 'confirm' | 'loading' | 'done';

export type PayContext =
  | { kind: 'table'; tableId: string; tableNumber: string; remaining: number; totalDue: number; totalPaid: number; initialMode?: 'full' | 'partial' }
  | { kind: 'customer'; tableId: string; tableNumber: string; customerName: string; remaining: number; totalDue: number; totalPaid: number; initialMode?: 'full' | 'partial' }
  | null;

// ─── Payment method config ─────────────────────────────────────────────────────

export const METHOD_CONFIG: Record<PaymentMethod, { icon: string; color: string }> = {
  CASH:              { icon: 'bi-cash-coin',             color: '#059669' },
  CARD:              { icon: 'bi-credit-card-2-front',   color: '#7c3aed' },
  PIX:               { icon: 'bi-qr-code',               color: '#0ea5e9' },
  EXTERNAL_TERMINAL: { icon: 'bi-device-hdd',            color: '#d97706' },
};

export function nextRoundAmount(amount: number): number {
  if (amount <= 20)  return Math.ceil(amount / 5) * 5;
  if (amount <= 100) return Math.ceil(amount / 10) * 10;
  if (amount <= 500) return Math.ceil(amount / 50) * 50;
  return Math.ceil(amount / 100) * 100;
}

// ─── Table group config ────────────────────────────────────────────────────────

export const TABLE_STATUS_LABEL: Record<string, string> = {
  EMPTY: 'Vazia', OCCUPIED: 'Ocupada', ORDER_IN_PROGRESS: 'Pedido em andamento',
  WAITING_FOR_KITCHEN: 'Aguardando cozinha', READY_TO_SERVE: 'Pronto para servir',
  WAITING_FOR_PAYMENT: 'Aguardando pagamento', CLOSED: 'Fechada',
};

export const PAYMENT_STATUS_CONFIG: Record<string, { bg: string; color: string; border: string }> = {
  UNPAID:         { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
  PARTIALLY_PAID: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  PAID:           { bg: '#f0fdf4', color: '#059669', border: '#6ee7b7' },
};

export const BORDER_COLOR: Record<string, string> = {
  UNPAID: '#dc2626', PARTIALLY_PAID: '#d97706', PAID: '#059669',
};

// ─── Tab helpers ───────────────────────────────────────────────────────────────

export function tabFromPath(pathname: string): Tab {
  if (pathname.includes('/history')) return 'history';
  if (pathname.includes('/orders')) return 'orders';
  if (pathname.includes('/kiosk')) return 'kiosk';
  if (pathname.includes('/receipts')) return 'receipts';
  if (pathname.includes('/invoices')) return 'invoices';
  return 'tables';
}

// ─── Table sort helpers ────────────────────────────────────────────────────────

export function sortRows<T>(rows: T[], key: string, dir: 'asc' | 'desc'): T[] {
  return [...rows].sort((a, b) => {
    const av = (a as Record<string, unknown>)[key];
    const bv = (b as Record<string, unknown>)[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === 'asc' ? cmp : -cmp;
  });
}

export function toggleSort(
  current: { key: string; dir: 'asc' | 'desc' },
  key: string,
  set: Dispatch<SetStateAction<{ key: string; dir: 'asc' | 'desc' }>>,
) {
  set(current.key === key
    ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
    : { key, dir: 'asc' });
}
