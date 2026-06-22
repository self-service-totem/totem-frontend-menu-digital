import type { CurrencyCode } from '@/lib/types';

const localeByCurrency: Record<CurrencyCode, string> = {
  BRL: 'pt-BR',
  USD: 'en-US',
  ARS: 'es-AR',
};

export function formatMoney(amount: number, currency: CurrencyCode = 'BRL'): string {
  return new Intl.NumberFormat(localeByCurrency[currency], {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatCurrency(v: number | undefined | null): string {
  if (v == null || isNaN(v as number)) return '—';
  return (v as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
