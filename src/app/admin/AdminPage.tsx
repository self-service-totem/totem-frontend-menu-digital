import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tenantService } from '@/lib/services/adminService';
import { getCollection } from '@/lib/mock-db';
import type { DbOrder } from '@/lib/types';

import { Dashboard }           from './sections/Dashboard';
import { Products }            from './sections/Products';
import { Categories }          from './sections/Categories';
import { Tables }              from './sections/Tables';
import { Orders }              from './sections/Orders';
import { RestaurantSettings }  from './sections/RestaurantSettings';
import { LoyaltySection }      from './sections/LoyaltySection';
import { AggregatorSection }   from './sections/AggregatorSection';
import { Kiosks }              from './sections/Kiosks';
import { QueueSection }        from './sections/QueueSection';

type AdminSection =
  | 'dashboard' | 'products' | 'categories' | 'branches'
  | 'tables'    | 'orders'   | 'kiosks'     | 'queue'
  | 'settings'  | 'loyalty'  | 'aggregator';

type NavItem  = { section: AdminSection; label: string; icon: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  { label: 'Operação',        items: [{ section: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' }, { section: 'orders', label: 'Pedidos', icon: 'bi-receipt' }, { section: 'queue', label: 'Fila', icon: 'bi-people' }] },
  { label: 'Catálogo',        items: [{ section: 'products', label: 'Produtos', icon: 'bi-box' }, { section: 'categories', label: 'Categorias', icon: 'bi-tags' }] },
  { label: 'Estabelecimento', items: [{ section: 'tables', label: 'Mesas', icon: 'bi-table' }, { section: 'branches', label: 'Filiais', icon: 'bi-shop' }, { section: 'kiosks', label: 'Kiosks', icon: 'bi-display' }] },
  { label: 'Crescimento',     items: [{ section: 'loyalty', label: 'Fidelidade', icon: 'bi-star' }, { section: 'aggregator', label: 'Agregadores', icon: 'bi-phone' }] },
  { label: 'Configurações',   items: [{ section: 'settings', label: 'Configurações', icon: 'bi-gear' }] },
];

const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

function AdminClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="ff-area-topbar-clock">
      {now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
      {' · '}
      {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

export function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [section, setSection]     = useState<AdminSection>('dashboard');
  const [tenantName, setTenantName] = useState('Admin');
  const [tenantLogo, setTenantLogo] = useState<string | undefined>();

  useEffect(() => {
    const s = location.pathname.split('/admin/')[1] as AdminSection | undefined;
    if (s && NAV.find((n) => n.section === s)) setSection(s);
  }, [location.pathname]);

  useEffect(() => {
    tenantService.get().then((t) => {
      if (t) { setTenantName(t.name); setTenantLogo(t.logoUrl ?? undefined); }
    });
  }, []);

  function goTo(s: AdminSection) { setSection(s); navigate(`/admin/${s}`); }

  const pendingOrders = getCollection<DbOrder>('orders').filter(
    (o) => o.status === 'SENT_TO_KITCHEN' || o.status === 'PREPARING',
  ).length;

  const currentNavItem = NAV.find((n) => n.section === section);

  return (
    <div className="ff-area-layout">
      <aside className="ff-area-sidebar">
        <div className="ff-area-sidebar-logo">
          {tenantLogo
            ? <img src={tenantLogo} alt="" className="ff-area-sidebar-logo-img" />
            : <div className="ff-area-sidebar-logo-icon"><i className="bi bi-shop" /></div>
          }
          <div className="ff-area-sidebar-logo-text">
            <span className="ff-area-sidebar-logo-name">{tenantName}</span>
            <span className="ff-area-sidebar-logo-role">Administração</span>
          </div>
        </div>

        <nav className="ff-area-sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="ff-area-sidebar-group-label">{group.label}</div>
              {group.items.map((n) => (
                <button key={n.section} className={`ff-nav-item ${section === n.section ? 'active' : ''}`} onClick={() => goTo(n.section)}>
                  <i className={`bi ${n.icon}`} />
                  {n.label}
                  {n.section === 'orders' && pendingOrders > 0 && (
                    <span className="ff-nav-item-badge">{pendingOrders}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,.07)' }}>
            <button className="ff-nav-item" onClick={() => navigate('/')}><i className="bi bi-house" />Hub</button>
          </div>
        </nav>
      </aside>

      <div className="ff-area-main">
        <div className="ff-area-topbar">
          <div className="ff-area-topbar-breadcrumb">
            <span>{tenantName}</span>
            <span className="ff-area-topbar-breadcrumb-sep">›</span>
            <span className="ff-area-topbar-breadcrumb-active">{currentNavItem?.label ?? section}</span>
          </div>
          <div className="ff-area-topbar-right">
            <AdminClock />
            <div className="ff-area-status-badge">
              <span className="ff-area-status-dot" />
              Operando
            </div>
            <div className="ff-area-topbar-avatar" title="Admin"><i className="bi bi-person" /></div>
          </div>
        </div>

        <div className="ff-area-content">
          {section === 'dashboard'  && <Dashboard />}
          {section === 'products'   && <Products />}
          {section === 'categories' && <Categories />}
          {section === 'tables'     && <Tables />}
          {section === 'orders'     && <Orders />}
          {section === 'branches'   && <RestaurantSettings />}
          {section === 'settings'   && <RestaurantSettings />}
          {section === 'kiosks'     && <Kiosks />}
          {section === 'queue'      && <QueueSection />}
          {section === 'loyalty'    && <LoyaltySection />}
          {section === 'aggregator' && <AggregatorSection />}
        </div>
      </div>
    </div>
  );
}
