import type { FloorTable } from '@/lib/services/waiterStaffService';

export type QuickFilter = 'all' | 'action' | 'calling' | 'ready' | 'payment' | 'empty';

export const CALL_REASON_LABEL: Record<string, string> = {
  call: 'Chamar garçom',
  bill: 'Pedir a conta',
  order: 'Ver pedidos',
  other: 'Outro motivo',
};

export const QUICK_FILTER_DEFS: { key: QuickFilter; label: string; icon: string; color?: string }[] = [
  { key: 'all',     label: 'Todas',            icon: 'bi-grid-3x3-gap'          },
  { key: 'action',  label: 'Ação requerida',   icon: 'bi-lightning-charge-fill', color: '#b45309' },
  { key: 'calling', label: 'Chamando',          icon: 'bi-megaphone-fill',        color: '#dc2626' },
  { key: 'ready',   label: 'Pronto p/ servir', icon: 'bi-check2-circle',         color: '#059669' },
  { key: 'payment', label: 'Aguard. pgto',      icon: 'bi-credit-card-2-front',   color: '#7c3aed' },
  { key: 'empty',   label: 'Vazias',            icon: 'bi-circle',                color: '#9ca3af' },
];

export function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

export function alertPriority(t: FloorTable): number {
  if (t.pendingCallCount > 0) return 3;
  if (t.hasReadyOrders || t.status === 'READY_TO_SERVE') return 2;
  if (t.status === 'WAITING_FOR_PAYMENT') return 1;
  return 0;
}

export function quickFilterCount(key: QuickFilter, tables: FloorTable[]): number {
  switch (key) {
    case 'all':     return tables.length;
    case 'action':  return tables.filter((t) => alertPriority(t) > 0).length;
    case 'calling': return tables.filter((t) => t.pendingCallCount > 0).length;
    case 'ready':   return tables.filter((t) => t.hasReadyOrders || t.status === 'READY_TO_SERVE').length;
    case 'payment': return tables.filter((t) => t.status === 'WAITING_FOR_PAYMENT').length;
    case 'empty':   return tables.filter((t) => t.status === 'EMPTY' || t.status === 'CLOSED').length;
  }
}
