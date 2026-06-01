import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { MockUser, UserRole } from '@/lib/types';
import { getCollection } from '@/lib/mock-db';

interface RoleContextValue {
  currentUser: MockUser | null;
  login: (userId: string) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  isAuthenticated: boolean;
}

const RoleContext = createContext<RoleContextValue>({
  currentUser: null,
  login: () => {},
  logout: () => {},
  hasRole: () => true, // default open in prototype
  isAuthenticated: true,
});

const STORAGE_KEY = 'ff_mock_user_id';

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(() => {
    const id = localStorage.getItem(STORAGE_KEY);
    if (!id) return null;
    return getCollection<MockUser>('mockUsers').find((u) => u.id === id) ?? null;
  });

  const login = useCallback((userId: string) => {
    const user = getCollection<MockUser>('mockUsers').find((u) => u.id === userId) ?? null;
    setCurrentUser(user);
    if (user) localStorage.setItem(STORAGE_KEY, user.id);
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!currentUser) return true; // open in prototype
      return roles.includes(currentUser.role);
    },
    [currentUser],
  );

  return (
    <RoleContext.Provider value={{ currentUser, login, logout, hasRole, isAuthenticated: !!currentUser }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
