// Hook mínimo que desacopla store.ts de sync.ts sin dependencia circular.
// store.ts importa esto (no importa sync.ts); sync.ts registra la función en init.
type WriteFn = <T extends { id: string }>(key: string, item: T) => void;
let _hook: WriteFn | null = null;

export const firestoreWriteHook = {
  register: (fn: WriteFn) => { _hook = fn; },
  push: <T extends { id: string }>(key: string, item: T) => { _hook?.(key, item); },
};
