import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { MockUser, UserRole } from '@/lib/types';
import { signIn, signOut, getStaffUserDoc, subscribeAuthState } from '@/lib/firebase/auth';
import { getCollection } from '@/lib/mock-db';
import { firebaseEnabled } from '@/lib/firebase/config';

interface RoleContextValue {
  currentUser: MockUser | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  isAuthenticated: boolean;
}

const RoleContext = createContext<RoleContextValue>({
  currentUser: null,
  authLoading: false,
  login: async () => {},
  logout: async () => {},
  hasRole: () => false,
  isAuthenticated: false,
});

const MOCK_STORAGE_KEY = 'ff_mock_user_id';

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  // authLoading stays true until Firebase resolves the initial auth state.
  // In mock mode it resolves synchronously on mount.
  const [authLoading, setAuthLoading] = useState(firebaseEnabled);

  useEffect(() => {
    if (!firebaseEnabled) {
      const id = localStorage.getItem(MOCK_STORAGE_KEY);
      if (id) {
        const user = getCollection<MockUser>('mockUsers').find((u) => u.id === id) ?? null;
        setCurrentUser(user);
      }
      setAuthLoading(false);
      return;
    }

    const unsub = subscribeAuthState(async (fbUser) => {
      try {
        if (fbUser) {
          const staffUser = await getStaffUserDoc(fbUser.uid);
          setCurrentUser(staffUser);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[auth] resolving staff user failed', err);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    });
    return unsub;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!firebaseEnabled) {
      // Mock mode: match by email, ignore password.
      const user = getCollection<MockUser>('mockUsers').find((u) => u.email === email) ?? null;
      setCurrentUser(user);
      if (user) localStorage.setItem(MOCK_STORAGE_KEY, user.id);
      return;
    }
    // Firebase mode: signIn triggers onAuthStateChanged which calls setCurrentUser.
    await signIn(email, password);
  }, []);

  const logout = useCallback(async () => {
    if (!firebaseEnabled) {
      setCurrentUser(null);
      localStorage.removeItem(MOCK_STORAGE_KEY);
      return;
    }
    await signOut();
    // onAuthStateChanged will set currentUser to null.
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!currentUser) return false;
      return roles.includes(currentUser.role);
    },
    [currentUser],
  );

  return (
    <RoleContext.Provider
      value={{ currentUser, authLoading, login, logout, hasRole, isAuthenticated: !!currentUser }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
