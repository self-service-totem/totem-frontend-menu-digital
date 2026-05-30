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
import { KioskWelcomePage, KioskMenuPage, KioskCartPage, KioskPaymentPage } from './kiosk/KioskApp';

export const router = createBrowserRouter([
  // ─── Hub ──────────────────────────────────────────────────────────────────
  { path: '/', element: <HubPage /> },

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
  { path: '/cashier/payments', element: <CashierPage /> },
  { path: '/cashier/invoices', element: <CashierPage /> },
  { path: '/cashier/receipts', element: <CashierPage /> },

  // ─── Admin ────────────────────────────────────────────────────────────────
  { path: '/admin', element: <Navigate to="/admin/dashboard" replace /> },
  { path: '/admin/:section', element: <AdminPage /> },

  // ─── Kiosk ────────────────────────────────────────────────────────────────
  { path: '/kiosk', element: <Navigate to="/kiosk/start" replace /> },
  { path: '/kiosk/start', element: <KioskWelcomePage /> },
  { path: '/kiosk/menu', element: <KioskMenuPage /> },
  { path: '/kiosk/cart', element: <KioskCartPage /> },
  { path: '/kiosk/payment', element: <KioskPaymentPage /> },
]);
