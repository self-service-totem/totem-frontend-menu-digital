import { RouterProvider } from 'react-router-dom';
import { SessionProvider, useSession } from './SessionContext';
import { CartProvider } from './CartContext';
import { router } from './router';
import { I18nProvider } from '@/i18n/I18nContext';
import { resolveLanguage } from '@/i18n/labels';
import { NotificationProvider } from '@/lib/notifications';
import { seedDb } from '@/lib/mock-db';
import { firebaseEnabled } from '@/lib/firebase/config';
import { initFirestoreSync, ensureFirestoreSeeded } from '@/lib/firebase/sync';
import { RoleProvider } from './RoleContext';
import type { ReactNode } from 'react';

// Seed the shared mock-db on startup (idempotent). Local seed da estado inmediato
// y sirve de fallback cuando Firebase está deshabilitado.
seedDb();

// Con Firebase activo: suscribir las colecciones vivas (mantiene el espejo local
// fresco entre dispositivos) y sembrar Firestore una vez si está vacío.
if (firebaseEnabled) {
  initFirestoreSync();
  void ensureFirestoreSeeded();
}

function I18nFromMenuContext({ children }: { children: ReactNode }) {
  const { menuContext, language } = useSession();
  // User's explicit choice takes priority; fall back to tenant default from menuContext
  const resolved = language ?? resolveLanguage(menuContext?.language);
  return <I18nProvider language={resolved}>{children}</I18nProvider>;
}

export function App() {
  return (
    <NotificationProvider>
      <RoleProvider>
        <SessionProvider>
          <I18nFromMenuContext>
            <CartProvider>
              <RouterProvider router={router} />
            </CartProvider>
          </I18nFromMenuContext>
        </SessionProvider>
      </RoleProvider>
    </NotificationProvider>
  );
}
