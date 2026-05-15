import type { CurrencyCode } from '@/types';

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
