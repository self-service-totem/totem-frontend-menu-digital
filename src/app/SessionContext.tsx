import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Customer, MenuContext } from '@/types';
import { menuContextService, sessionService } from '@/services';
import { mapMenuContextResponseToViewModel } from '@/lib/jsonapi';

interface SessionContextValue {
  menuContext: MenuContext | null;
  tableId: string | null;
  customer: Customer | null;
  loading: boolean;
  setTableId: (id: string) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
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
    menuContextService.get(effectiveId).then((response) => {
      if (cancelled) return;
      setMenuContext(mapMenuContextResponseToViewModel(response));
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

  const value = useMemo<SessionContextValue>(
    () => ({
      menuContext,
      tableId: tableId ?? menuContext?.tableId ?? null,
      customer,
      loading,
      setTableId,
      setCustomerName,
      setCustomerPhone,
    }),
    [menuContext, tableId, customer, loading, setTableId, setCustomerName, setCustomerPhone],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
