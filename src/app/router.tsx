import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { MenuPage } from '@/features/menu/MenuPage';
import { CartPage } from '@/features/cart/CartPage';
import { CloseAccountPage } from '@/features/close-account/CloseAccountPage';
import { WaiterPage } from '@/features/waiter/WaiterPage';
import { RatingPage } from '@/features/rating/RatingPage';
import { CashbackPage } from '@/features/cashback/CashbackPage';
import { AccountPage } from '@/features/account/AccountPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/menu/140" replace /> },
      { path: 'menu', element: <Navigate to="/menu/140" replace /> },
      { path: 'menu/:tableId', element: <MenuPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'close-account', element: <CloseAccountPage /> },
      { path: 'waiter', element: <WaiterPage /> },
      { path: 'rating', element: <RatingPage /> },
      { path: 'cashback', element: <CashbackPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: '*', element: <Navigate to="/menu/140" replace /> },
    ],
  },
]);
