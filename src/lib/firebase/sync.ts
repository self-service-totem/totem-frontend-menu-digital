// Capa de sincronización Firestore <-> espejo localStorage.
//
// Estrategia (ver plan): las lecturas siguen siendo síncronas desde localStorage.
// Las escrituras a colecciones "vivas" se propagan a Firestore (fire-and-forget) y
// onSnapshot mantiene el espejo local fresco en cada dispositivo. Las pantallas ya
// hacen polling, así que el cambio se renderiza en el siguiente tick.
//
// Todos los helpers son tolerantes a fallos: si Firebase está deshabilitado o falla,
// no-opean y la app sigue funcionando 100% local.
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { firestoreWriteHook } from './writeHook';
// getCollection y setCollectionLocal se importan aquí pero sync.ts NO re-exporta
// nada que store.ts necesite importar → dependencia circular eliminada.
import { getCollection, setCollectionLocal } from '@/lib/mock-db/store';

// Colecciones operativas compartidas entre dispositivos. El catálogo estático
// (products, categories, business, etc.) NO se sincroniza: vive en el seed local.
export const LIVE_COLLECTIONS = new Set<string>([
  'orders',
  'kitchenTickets',
  'queueTickets',
  'tables',
  'payments',
  'receipts',
  'invoices',
  'kioskAlerts',
  'waiterCalls',
  'reservations',
  'walkIns',
  // Config compartida: se edita en Admin (Configuración) y debe propagarse a todos
  // los dispositivos (kiosk, caja, cocina), que corren en otros orígenes/localStorage.
  'tenants',
  'branches',
]);

export function isLiveCollection(key: string): boolean {
  return LIVE_COLLECTIONS.has(key);
}

let unsubscribers: Array<() => void> = [];

/** Suscribe las colecciones vivas y vuelca cada snapshot al espejo localStorage. */
export function initFirestoreSync(): void {
  if (!db) return;
  // Registra el hook de escritura para que store.ts propague insertOne/updateOne
  // a Firestore sin dependencia circular (store → writeHook ← sync).
  firestoreWriteHook.register(pushDoc);
  // Evitar doble suscripción (HMR / remount).
  unsubscribers.forEach((u) => u());
  unsubscribers = [];

  for (const key of LIVE_COLLECTIONS) {
    const unsub = onSnapshot(
      collection(db, key),
      (snap) => {
        const rows = snap.docs.map((d) => d.data());
        // Guard: no pisar el seed local con un snapshot vacío para colecciones que
        // tienen datos de demo útiles. Se activa antes de que ensureFirestoreSeeded
        // las suba, o cuando Firestore genuinamente está vacío en el primer arranque.
        const GUARD_EMPTY = new Set(['tables', 'reservations', 'walkIns', 'tenants', 'branches']);
        if (GUARD_EMPTY.has(key) && rows.length === 0) return;
        // Escritura local-only: NO re-propaga a Firestore (evita bucles).
        setCollectionLocal(key, rows);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error(`[firebase] snapshot error on "${key}"`, err);
      },
    );
    unsubscribers.push(unsub);
  }
}

/** Elimina campos undefined recursivamente — Firestore lanza si los encuentra. */
function stripUndefined(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)]),
    );
  }
  return obj;
}

/** Inserta/sobrescribe un documento (id = item.id). Fire-and-forget. */
export function pushDoc<T extends { id: string }>(key: string, item: T): void {
  if (!db || !isLiveCollection(key)) return;
  const data = stripUndefined(item) as Record<string, unknown>;
  setDoc(doc(db, key, item.id), data).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`[firebase] pushDoc "${key}/${item.id}" failed`, err);
  });
}

/** Sube muchos documentos en batch (usado por el seed de demo de `tables`). */
export function pushMany<T extends { id: string }>(key: string, items: T[]): void {
  if (!db || !isLiveCollection(key) || items.length === 0) return;
  const batch = writeBatch(db);
  for (const item of items) {
    batch.set(doc(db, key, item.id), item as Record<string, unknown>);
  }
  batch.commit().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`[firebase] pushMany "${key}" failed`, err);
  });
}

/** Elimina un documento. Fire-and-forget. */
export function removeDoc(key: string, id: string): void {
  if (!db || !isLiveCollection(key)) return;
  deleteDoc(doc(db, key, id)).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`[firebase] removeDoc "${key}/${id}" failed`, err);
  });
}

/** Borra todos los documentos de las colecciones vivas (usado por el reset del Hub). */
export async function clearLiveCollections(): Promise<void> {
  if (!db) return;
  for (const key of LIVE_COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, key));
      if (snap.empty) continue;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[firebase] clearLiveCollections "${key}" failed`, err);
    }
  }
}

// Colecciones con datos de demo que deben subirse a Firestore en el primer arranque
// y después de cada reset, para que todos los dispositivos partan del mismo estado.
const SEED_COLLECTIONS = ['tables', 'reservations', 'walkIns', 'tenants', 'branches'] as const;

/**
 * Siembra Firestore una sola vez: si `tables` está vacío en la nube, sube las
 * colecciones de demo (tables, reservations, walkIns) del seed local. Así el
 * primer dispositivo deja el estado compartido sin necesidad de un reset manual.
 */
export async function ensureFirestoreSeeded(): Promise<void> {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, 'tables'));
    if (snap.empty) {
      for (const key of SEED_COLLECTIONS) {
        pushMany(key, getCollection<{ id: string }>(key));
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[firebase] ensureFirestoreSeeded failed', err);
  }
}

/**
 * Sube las colecciones de demo a Firestore. Llamar después de clearLiveCollections
 * en el reset del Hub para dejar el estado compartido limpio con datos iniciales.
 */
export function pushSeedCollections(): void {
  for (const key of SEED_COLLECTIONS) {
    pushMany(key, getCollection<{ id: string }>(key));
  }
}
