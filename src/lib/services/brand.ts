// Identidad de marca del tenant (nombre + logo), tal como se configura en
// Admin → Configuración. Lectura síncrona desde el espejo localStorage de mock-db:
// la colección `tenants` es "viva" (ver firebase/sync), así que el valor se mantiene
// fresco en cada dispositivo vía onSnapshot. Centraliza el acceso para que ninguna
// pantalla vuelva a hardcodear el nombre del restaurante.
import { getCollection } from '@/lib/mock-db';
import type { Tenant } from '@/lib/types';

const FALLBACK_BRAND_NAME = 'Pertinho do Céu';

export interface Brand {
  name: string;
  logoUrl: string | null;
}

export function getBrand(): Brand {
  const tenant = getCollection<Tenant>('tenants')[0];
  return {
    name: tenant?.name?.trim() || FALLBACK_BRAND_NAME,
    logoUrl: tenant?.logoUrl?.trim() || null,
  };
}

export function getBrandName(): string {
  return getBrand().name;
}
