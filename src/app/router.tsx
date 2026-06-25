import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { StaffGuard } from '@/components/shared/StaffGuard';
import { makeRoleGuard } from '@/components/shared/RoleGuard';

const AdminGuard = makeRoleGuard('OWNER', 'MANAGER', 'SUPPORT');
const ReportsGuard = makeRoleGuard('OWNER', 'MANAGER');
import { MenuPage } from '@/features/menu/MenuPage';
import { CartPage } from '@/features/cart/CartPage';
import { CloseAccountPage } from '@/features/close-account/CloseAccountPage';
import { WaiterPage } from '@/features/waiter/WaiterPage';
import { RatingPage } from '@/features/rating/RatingPage';
import { CashbackPage } from '@/features/cashback/CashbackPage';
import { AccountPage } from '@/features/account/AccountPage';
import { OrderConfirmationPage } from '@/features/order-confirmation/OrderConfirmationPage';
import { HubPage } from './hub/HubPage';
import { KitchenOrdersPage } from './kitchen/KitchenOrdersPage';
import { QueueDisplayPage } from './queue-display/QueueDisplayPage';
import { WaiterTablesPage } from './waiter-staff/WaiterTablesPage';
import { WaiterTableDetailPage } from './waiter-staff/WaiterTableDetailPage';
import { CashierPage } from './cashier/CashierPage';
import { AdminPage } from './admin/AdminPage';
import { KioskWelcomePage } from './kiosk/KioskWelcomePage';
import { KioskMenuPage } from './kiosk/KioskMenuPage';
import { KioskCartPage } from './kiosk/KioskCartPage';
import { KioskPaymentPage } from './kiosk/KioskPaymentPage';
import { AttractScreen } from './kiosk/AttractScreen';
import { KioskReceiptPage } from './kiosk/KioskReceiptPage';
import { LoginPage } from './login/LoginPage';
import { ReportsPage } from './reports/ReportsPage';
import { ReservationsPage } from './reservations/ReservationsPage';
import { DeliveryPage } from './delivery/DeliveryPage';
import { SuperAdminPage } from './superadmin/SuperAdminPage';

export const router = createBrowserRouter([
  // ─── Auth ─────────────────────────────────────────────────────────────────
  // /login es siempre público (si ya está autenticado, LoginPage muestra el estado).
  { path: '/login', element: <LoginPage /> },

  // ─── Customer (public) ────────────────────────────────────────────────────
  // Estas rutas NO requieren auth: el comensal escanea el QR y aterriza acá.
  // AppShell es un layout pathless para no competir con la ruta '/' del StaffGuard.
  {
    path: '/menu',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/menu/branch-1/table/140" replace /> },
      { path: ':tableId', element: <MenuPage /> },
      { path: ':branchId/table/:tableId', element: <MenuPage /> },
    ],
  },
  {
    element: <AppShell />,
    children: [
      { path: '/cart', element: <CartPage /> },
      { path: '/order-confirmation', element: <OrderConfirmationPage /> },
      { path: '/close-account', element: <CloseAccountPage /> },
      { path: '/waiter', element: <WaiterPage /> },
      { path: '/rating', element: <RatingPage /> },
      { path: '/cashback', element: <CashbackPage /> },
      { path: '/account', element: <AccountPage /> },
    ],
  },
  // Receipt: público para que el comensal pueda verlo sin auth.
  { path: '/receipt/:orderId', element: <KioskReceiptPage /> },

  // ─── Staff (protected) ────────────────────────────────────────────────────
  // StaffGuard: redirige a /login si no hay sesión (con Firebase activo).
  {
    element: <StaffGuard />,
    children: [
      { path: '/', element: <HubPage /> },
      { path: '/hub', element: <Navigate to="/" replace /> },

      // Kitchen
      { path: '/kitchen', element: <Navigate to="/kitchen/orders" replace /> },
      { path: '/kitchen/orders', element: <KitchenOrdersPage /> },

      // Queue Display
      { path: '/queue-display', element: <QueueDisplayPage /> },
      { path: '/queue-display/:branchId', element: <QueueDisplayPage /> },

      // Waiter Staff
      { path: '/waiter-staff', element: <Navigate to="/waiter-staff/tables" replace /> },
      { path: '/waiter-staff/tables', element: <WaiterTablesPage /> },
      { path: '/waiter-staff/tables/:tableId', element: <WaiterTableDetailPage /> },
      { path: '/waiter-staff/calls', element: <WaiterTablesPage /> },

      // Cashier
      { path: '/cashier', element: <Navigate to="/cashier/orders" replace /> },
      { path: '/cashier/orders', element: <CashierPage /> },
      { path: '/cashier/kiosk', element: <CashierPage /> },
      { path: '/cashier/history', element: <CashierPage /> },
      { path: '/cashier/receipts', element: <CashierPage /> },
      { path: '/cashier/invoices', element: <CashierPage /> },

      // Admin — solo OWNER, MANAGER, SUPPORT
      {
        element: <AdminGuard />,
        children: [
          { path: '/admin', element: <Navigate to="/admin/dashboard" replace /> },
          { path: '/admin/:section', element: <AdminPage /> },
        ],
      },

      // Reports — solo OWNER, MANAGER
      {
        element: <ReportsGuard />,
        children: [
          { path: '/reports', element: <Navigate to="/reports/dashboard" replace /> },
          { path: '/reports/:section', element: <ReportsPage /> },
        ],
      },

      // Reservations / Delivery
      { path: '/reservations', element: <ReservationsPage /> },
      { path: '/delivery', element: <DeliveryPage /> },
    ],
  },

  // ─── Kiosk (PIN-gated, no StaffGuard) ────────────────────────────────────
  { path: '/kiosk', element: <Navigate to="/kiosk/attract" replace /> },
  { path: '/kiosk/attract', element: <AttractScreen /> },
  { path: '/kiosk/start', element: <KioskWelcomePage /> },
  { path: '/kiosk/menu', element: <KioskMenuPage /> },
  { path: '/kiosk/cart', element: <KioskCartPage /> },
  { path: '/kiosk/payment', element: <KioskPaymentPage /> },

  // ─── Superadmin (PIN-gated, no StaffGuard) ───────────────────────────────
  { path: '/superadmin', element: <SuperAdminPage /> },

  // ─── 404 ──────────────────────────────────────────────────────────────────
  {
    path: '*',
    element: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, fontFamily: 'system-ui, sans-serif', color: '#374151' }}>
        <i className="bi bi-exclamation-circle" style={{ fontSize: 48, color: '#9ca3af' }} />
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>404 — Página não encontrada</h2>
        <a href="/" style={{ color: '#1d4ed8', fontSize: 14 }}>← Voltar ao Hub</a>
      </div>
    ),
  },
]);
