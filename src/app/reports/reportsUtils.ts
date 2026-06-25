import type { PaymentMethodSummary } from '@/lib/services/reportService';
import type { LabelKey } from '@/i18n/labels';
import { formatCurrency, getTenantCurrency, getTenantLocale } from '@/utils/format';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportSection =
  | 'dashboard' | 'fechamento' | 'vendas'      | 'pagamentos'
  | 'produtos'  | 'mesas'      | 'garcons'     | 'cozinha'
  | 'ocupacao'  | 'reservas'   | 'exportacoes';

export const SECTION_LABEL_KEYS: Record<ReportSection, LabelKey> = {
  dashboard:   'reports.section.dashboard',
  fechamento:  'reports.section.fechamento',
  vendas:      'reports.section.vendas',
  pagamentos:  'reports.section.pagamentos',
  produtos:    'reports.section.produtos',
  mesas:       'reports.section.mesas',
  garcons:     'reports.section.garcons',
  cozinha:     'reports.section.cozinha',
  ocupacao:    'reports.section.ocupacao',
  reservas:    'reports.section.reservas',
  exportacoes: 'reports.section.exportacoes',
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const METHOD_LABEL_KEYS: Record<string, LabelKey> = {
  CASH: 'reports.method.cash',
  CARD: 'reports.method.card',
  PIX: 'reports.method.pix',
  EXTERNAL_TERMINAL: 'reports.method.terminal',
  UNKNOWN: 'reports.method.other',
};

export const METHOD_COLORS: Record<string, string> = {
  PIX: '#3b82f6',
  CARD: '#059669',
  CASH: '#f59e0b',
  EXTERNAL_TERMINAL: '#7c3aed',
  UNKNOWN: '#9ca3af',
};

export const WAITER_COLORS = ['#e11d48', '#3b82f6', '#059669', '#d97706', '#7c3aed', '#0891b2'];

// ─── Utilities ────────────────────────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function fBRL(v: number | null | undefined): string {
  return formatCurrency(v);
}

export function fBRLShort(v: number): string {
  const currency = getTenantCurrency();
  const locale = getTenantLocale();
  if (v >= 1000) {
    const sym = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 })
      .format(0).replace(/[\d.,\s]/g, '').trim();
    return `${sym} ${(v / 1000).toFixed(1)}k`;
  }
  return formatCurrency(v);
}

export function formatDateFull(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function buildDonutGrad(segs: PaymentMethodSummary[]): string {
  if (!segs.length) return 'conic-gradient(#e5e7eb 0% 100%)';
  let cur = 0;
  const stops = segs.map((s) => {
    const from = cur;
    cur += s.pct;
    const color = METHOD_COLORS[s.method] ?? '#9ca3af';
    return `${color} ${from.toFixed(1)}% ${Math.min(cur, 100).toFixed(1)}%`;
  });
  if (cur < 99.5) stops.push(`#e5e7eb ${cur.toFixed(1)}% 100%`);
  return `conic-gradient(${stops.join(', ')})`;
}

export function rankClass(i: number): string {
  if (i === 0) return 'ff-rep-bar-rank ff-rep-bar-rank-1';
  if (i === 1) return 'ff-rep-bar-rank ff-rep-bar-rank-2';
  if (i === 2) return 'ff-rep-bar-rank ff-rep-bar-rank-3';
  return 'ff-rep-bar-rank ff-rep-bar-rank-n';
}
