const MAX_ENTRIES = 100;
const STORAGE_KEY = 'ff:error-log';

export type ErrorEntry = {
  id: string;
  ts: number;
  message: string;
  stack?: string;
};

export function installErrorReporter() {
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    original(...args);
    _capture(args.map((a) => (a instanceof Error ? a.message : String(a))).join(' '));
  };

  window.addEventListener('error', (e) => {
    _capture(e.message, (e.error as Error | undefined)?.stack);
  });

  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason as Error | string | undefined;
    _capture(r instanceof Error ? r.message : String(r ?? 'unhandledrejection'), (r as Error)?.stack);
  });
}

function _capture(message: string, stack?: string) {
  const entries = getErrorLog();
  entries.unshift({ id: crypto.randomUUID(), ts: Date.now(), message, stack });
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch { /* storage full */ }
}

export function getErrorLog(): ErrorEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}

export function clearErrorLog() {
  localStorage.removeItem(STORAGE_KEY);
}
