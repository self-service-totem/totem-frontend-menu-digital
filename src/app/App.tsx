import { RouterProvider } from 'react-router-dom';
import { SessionProvider, useSession } from './SessionContext';
import { CartProvider } from './CartContext';
import { router } from './router';
import { I18nProvider } from '@/i18n/I18nContext';
import { resolveLanguage } from '@/i18n/labels';
import type { ReactNode } from 'react';

function I18nFromMenuContext({ children }: { children: ReactNode }) {
  const { menuContext } = useSession();
  const language = resolveLanguage(menuContext?.language);
  return <I18nProvider language={language}>{children}</I18nProvider>;
}

export function App() {
  return (
    <SessionProvider>
      <I18nFromMenuContext>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </I18nFromMenuContext>
    </SessionProvider>
  );
}
