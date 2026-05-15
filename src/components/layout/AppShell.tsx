import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/navigation/BottomNav';

export function AppShell() {
  return (
    <div className="ff-app-shell">
      <Outlet />
      <BottomNav />
    </div>
  );
}
