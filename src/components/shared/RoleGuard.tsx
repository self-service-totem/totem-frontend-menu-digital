import { Navigate, Outlet } from 'react-router-dom';
import { useRole } from '@/app/RoleContext';
import { firebaseEnabled } from '@/lib/firebase/config';
import type { UserRole } from '@/lib/types';

// Wraps routes that require specific roles beyond just "authenticated".
// In mock mode (no Firebase) passes through to avoid blocking dev work.
export function makeRoleGuard(...allowed: UserRole[]) {
  return function RoleGuard() {
    const { currentUser } = useRole();

    if (!firebaseEnabled) return <Outlet />;

    if (!currentUser || !allowed.includes(currentUser.role)) {
      return <Navigate to="/" replace />;
    }

    return <Outlet />;
  };
}
