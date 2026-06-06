import { useEffect, useState } from 'react';

/** Causes the component to re-render at the given interval so elapsed-time
 *  badges stay fresh without any external trigger. */
export function useElapsed(intervalMs = 30_000): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}

export function elapsedMins(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
}

export function fmtElapsed(mins: number): string {
  if (mins < 1) return '< 1 min';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export type AgeSeverity = 'ok' | 'warn' | 'critical';

export function ageSeverity(mins: number, warnAt: number, critAt: number): AgeSeverity {
  if (mins >= critAt) return 'critical';
  if (mins >= warnAt) return 'warn';
  return 'ok';
}

export const SEVERITY_STYLE: Record<AgeSeverity, { bg: string; color: string; border: string }> = {
  ok:       { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  warn:     { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  critical: { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
};
