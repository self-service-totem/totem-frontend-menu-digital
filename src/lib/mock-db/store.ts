// Lightweight localStorage-backed store for cross-area mock persistence.
// All app areas share the same storage keys so mutations in one area are
// immediately visible in another.

const PREFIX = 'ff_mock_db_';

export function getCollection<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function setCollection<T>(key: string, data: T[]): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(data));
}

export function insertOne<T extends { id: string }>(key: string, item: T): T {
  const col = getCollection<T>(key);
  col.push(item);
  setCollection(key, col);
  return item;
}

export function updateOne<T extends { id: string }>(
  key: string,
  id: string,
  patch: Partial<T>,
): T | null {
  const col = getCollection<T>(key);
  const idx = col.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  col[idx] = { ...col[idx], ...patch, updatedAt: new Date().toISOString() } as T;
  setCollection(key, col);
  return col[idx];
}

export function findById<T extends { id: string }>(key: string, id: string): T | null {
  return getCollection<T>(key).find((x) => x.id === id) ?? null;
}

export function findWhere<T>(key: string, pred: (item: T) => boolean): T[] {
  return getCollection<T>(key).filter(pred);
}

export function clearCollection(key: string): void {
  localStorage.removeItem(PREFIX + key);
}

const SEED_VERSION = 'v11';

export function isSeeded(): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return (
    localStorage.getItem(PREFIX + '__seeded') === SEED_VERSION &&
    localStorage.getItem(PREFIX + '__seeded_date') === today
  );
}

export function markSeeded(): void {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(PREFIX + '__seeded', SEED_VERSION);
  localStorage.setItem(PREFIX + '__seeded_date', today);
}

export function resetDb(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}
