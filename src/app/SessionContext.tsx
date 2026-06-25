import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Customer, MenuContext } from '@/lib/types';
import { menuContextService, sessionService } from '@/lib/services';
import { mapMenuContextResponseToViewModel } from '@/lib/jsonapi';
import { resolveLanguage, type LanguageCode } from '@/i18n/labels';

const LANGUAGE_KEY = 'ff_language';

interface SessionContextValue {
  menuContext: MenuContext | null;
  tableId: string | null;
  customer: Customer | null;
  loading: boolean;
  tableError: boolean;
  /** Explicit user language choice; null = follow tenant default */
  language: LanguageCode | null;
  setTableId: (id: string) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setLanguage: (lang: LanguageCode) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const FALLBACK_TABLE_ID = '140';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [tableId, setTableIdState] = useState<string | null>(
    () => sessionService.loadTableId(),
  );
  const [menuContext, setMenuContext] = useState<MenuContext | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [language, setLanguageState] = useState<LanguageCode | null>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return saved ? resolveLanguage(saved) : null;
  });

  // Hidrata el customer guardado en localStorage al iniciar.
  useEffect(() => {
    sessionService.getCustomerSnapshot().then((c) => {
      if (c) setCustomer(c);
    });
  }, []);

  // Cada vez que cambia el tableId, recarga el menu-context.
  useEffect(() => {
    const effectiveId = tableId ?? FALLBACK_TABLE_ID;
    let cancelled = false;
    setLoading(true);
    setTableError(false);
    menuContextService.get(effectiveId).then((response) => {
      if (cancelled) return;
      setMenuContext(mapMenuContextResponseToViewModel(response));
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setTableError(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tableId]);

  const setTableId = useCallback((id: string) => {
    if (!id) return;
    sessionService.saveTableId(id);
    setTableIdState(id);
  }, []);

  const setCustomerName = useCallback((name: string) => {
    setCustomer((prev) => {
      const next: Customer = {
        id: prev?.id ?? `customer-${Date.now()}`,
        name: name.trim(),
        phone: prev?.phone ?? '',
      };
      sessionService.saveCustomer(next);
      return next;
    });
  }, []);

  const setCustomerPhone = useCallback((phone: string) => {
    setCustomer((prev) => {
      const next: Customer = {
        id: prev?.id ?? `customer-${Date.now()}`,
        name: prev?.name ?? '',
        phone: phone.trim(),
      };
      sessionService.saveCustomer(next);
      return next;
    });
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    localStorage.setItem(LANGUAGE_KEY, lang);
    setLanguageState(lang);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      menuContext,
      tableId: tableId ?? menuContext?.tableId ?? null,
      customer,
      loading,
      tableError,
      language,
      setTableId,
      setCustomerName,
      setCustomerPhone,
      setLanguage,
    }),
    [menuContext, tableId, customer, loading, tableError, language, setTableId, setCustomerName, setCustomerPhone, setLanguage],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
