import type { CurrencyCode } from '@/lib/types';
import { getCollection } from '@/lib/mock-db';
import type { Tenant } from '@/lib/types';

const localeByCurrency: Record<CurrencyCode, string> = {
  BRL: 'pt-BR',
  USD: 'en-US',
  ARS: 'es-AR',
};

export function getTenantCurrency(): CurrencyCode {
  const tenant = getCollection<Tenant>('tenants')[0];
  return (tenant?.currency as CurrencyCode) ?? 'ARS';
}

export function getTenantLocale(): string {
  return localeByCurrency[getTenantCurrency()] ?? 'es-AR';
}

export function formatMoney(amount: number, currency: CurrencyCode = 'ARS'): string {
  return new Intl.NumberFormat(localeByCurrency[currency] ?? 'es-AR', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatCurrency(v: number | undefined | null): string {
  if (v == null || isNaN(v as number)) return '—';
  const currency = getTenantCurrency();
  return (v as number).toLocaleString(localeByCurrency[currency], { style: 'currency', currency });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(getTenantLocale());
}
