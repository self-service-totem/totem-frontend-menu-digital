import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useRole } from '@/app/RoleContext';
import { firebaseEnabled } from '@/lib/firebase/config';

// Protege rutas de staff. En modo mock (sin Firebase) deja pasar siempre.
// Con Firebase activo: muestra un spinner mientras resuelve el estado de auth;
// redirige a /login (con ?next=) si no hay sesión; renderiza children si está autenticado.
export function StaffGuard() {
  const { isAuthenticated, authLoading } = useRole();
  const location = useLocation();

  if (!firebaseEnabled) return <Outlet />;

  if (authLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 12,
          color: '#6b7280',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
        <span>Carregando...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
