import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
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

export const router = createBrowserRouter([
  // ─── Hub ──────────────────────────────────────────────────────────────────
  { path: '/', element: <HubPage /> },
  { path: '/hub', element: <Navigate to="/" replace /> },

  // ─── Digital Menu (existing, unchanged) ───────────────────────────────────
  {
    path: '/menu',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/menu/branch-1/table/140" replace /> },
      // Keep legacy route working
      { path: ':tableId', element: <MenuPage /> },
      // New route shape with branchId + tableId
      { path: ':branchId/table/:tableId', element: <MenuPage /> },
    ],
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { path: 'cart', element: <CartPage /> },
      { path: 'order-confirmation', element: <OrderConfirmationPage /> },
      { path: 'close-account', element: <CloseAccountPage /> },
      { path: 'waiter', element: <WaiterPage /> },
      { path: 'rating', element: <RatingPage /> },
      { path: 'cashback', element: <CashbackPage /> },
      { path: 'account', element: <AccountPage /> },
    ],
  },

  // ─── Kitchen ──────────────────────────────────────────────────────────────
  { path: '/kitchen', element: <Navigate to="/kitchen/orders" replace /> },
  { path: '/kitchen/orders', element: <KitchenOrdersPage /> },

  // ─── Queue Display ────────────────────────────────────────────────────────
  { path: '/queue-display', element: <QueueDisplayPage /> },
  { path: '/queue-display/:branchId', element: <QueueDisplayPage /> },

  // ─── Waiter Staff ─────────────────────────────────────────────────────────
  { path: '/waiter-staff', element: <Navigate to="/waiter-staff/tables" replace /> },
  { path: '/waiter-staff/tables', element: <WaiterTablesPage /> },
  { path: '/waiter-staff/tables/:tableId', element: <WaiterTableDetailPage /> },
  { path: '/waiter-staff/calls', element: <WaiterTablesPage /> },

  // ─── Cashier ──────────────────────────────────────────────────────────────
  { path: '/cashier', element: <Navigate to="/cashier/orders" replace /> },
  { path: '/cashier/orders', element: <CashierPage /> },
  { path: '/cashier/kiosk', element: <CashierPage /> },
  { path: '/cashier/history', element: <CashierPage /> },
  { path: '/cashier/receipts', element: <CashierPage /> },
  { path: '/cashier/invoices', element: <CashierPage /> },

  // ─── Admin ────────────────────────────────────────────────────────────────
  { path: '/admin', element: <Navigate to="/admin/dashboard" replace /> },
  { path: '/admin/:section', element: <AdminPage /> },

  // ─── Kiosk ────────────────────────────────────────────────────────────────
  { path: '/kiosk', element: <Navigate to="/kiosk/attract" replace /> },
  { path: '/kiosk/attract', element: <AttractScreen /> },
  { path: '/kiosk/start', element: <KioskWelcomePage /> },
  { path: '/kiosk/menu', element: <KioskMenuPage /> },
  { path: '/kiosk/cart', element: <KioskCartPage /> },
  { path: '/kiosk/payment', element: <KioskPaymentPage /> },
  { path: '/receipt/:orderId', element: <KioskReceiptPage /> },

  // ─── New features ─────────────────────────────────────────────────────────
  { path: '/login', element: <LoginPage /> },
  { path: '/reports', element: <Navigate to="/reports/dashboard" replace /> },
  { path: '/reports/:section', element: <ReportsPage /> },
  { path: '/reservations', element: <ReservationsPage /> },
  { path: '/delivery', element: <DeliveryPage /> },

  // ─── 404 ──────────────────────────────────────────────────────────────────────
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
