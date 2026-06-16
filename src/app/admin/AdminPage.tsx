import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tenantService } from '@/lib/services/adminService';
import { getCollection } from '@/lib/mock-db';
import type { DbOrder } from '@/lib/types';
import { AdminLayout } from '@/components/layout';
import type { SidebarNavGroup } from '@/components/layout';
import { I18nProvider } from '@/i18n/I18nContext';
import { useLabels } from '@/i18n/I18nContext';
import { useAdminLanguage } from '@/i18n/useAdminLanguage';
import type { LanguageCode } from '@/i18n/labels';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';

import { Dashboard }           from './sections/Dashboard';
import { Products }            from './sections/Products';
import { Categories }          from './sections/Categories';
import { Tables }              from './sections/Tables';
import { Zones }               from './sections/Zones';
import { Orders }              from './sections/Orders';
import { RestaurantSettings }  from './sections/RestaurantSettings';
import { LoyaltySection }      from './sections/LoyaltySection';
import { AggregatorSection }   from './sections/AggregatorSection';
import { Kiosks }              from './sections/Kiosks';
import { QueueSection }        from './sections/QueueSection';

type AdminSection =
  | 'dashboard' | 'products' | 'categories'
  | 'tables'    | 'zones'    | 'orders'     | 'kiosks'   | 'queue'
  | 'settings'  | 'loyalty'  | 'aggregator' | 'reports';

type NavGroupDef = {
  groupKey: 'admin.nav.group.operation' | 'admin.nav.group.catalog' | 'admin.nav.group.establishment' | 'admin.nav.group.growth' | 'admin.nav.group.analytics' | 'admin.nav.group.settings';
  items: {
    section: AdminSection;
    labelKey: 'admin.nav.dashboard' | 'admin.nav.orders' | 'admin.nav.queue' | 'admin.nav.products' | 'admin.nav.categories' | 'admin.nav.tables' | 'admin.nav.zones' | 'admin.nav.kiosks' | 'admin.nav.loyalty' | 'admin.nav.aggregator' | 'admin.nav.reports' | 'admin.nav.settings';
    icon: string;
  }[];
};

const NAV_DEF: NavGroupDef[] = [
  {
    groupKey: 'admin.nav.group.operation',
    items: [
      { section: 'dashboard',  labelKey: 'admin.nav.dashboard',  icon: 'bi-grid-1x2' },
      { section: 'orders',     labelKey: 'admin.nav.orders',     icon: 'bi-receipt' },
      { section: 'queue',      labelKey: 'admin.nav.queue',      icon: 'bi-people' },
    ],
  },
  {
    groupKey: 'admin.nav.group.catalog',
    items: [
      { section: 'products',   labelKey: 'admin.nav.products',   icon: 'bi-box' },
      { section: 'categories', labelKey: 'admin.nav.categories', icon: 'bi-tags' },
    ],
  },
  {
    groupKey: 'admin.nav.group.establishment',
    items: [
      { section: 'tables',     labelKey: 'admin.nav.tables',     icon: 'bi-table' },
      { section: 'zones',      labelKey: 'admin.nav.zones',      icon: 'bi-diagram-3' },
      { section: 'kiosks',     labelKey: 'admin.nav.kiosks',     icon: 'bi-display' },
    ],
  },
  {
    groupKey: 'admin.nav.group.growth',
    items: [
      { section: 'loyalty',    labelKey: 'admin.nav.loyalty',    icon: 'bi-star' },
      { section: 'aggregator', labelKey: 'admin.nav.aggregator', icon: 'bi-phone' },
    ],
  },
  {
    groupKey: 'admin.nav.group.analytics',
    items: [
      { section: 'reports',    labelKey: 'admin.nav.reports',    icon: 'bi-bar-chart-line' },
    ],
  },
  {
    groupKey: 'admin.nav.group.settings',
    items: [
      { section: 'settings',   labelKey: 'admin.nav.settings',   icon: 'bi-gear' },
    ],
  },
];

const ALL_SECTIONS = NAV_DEF.flatMap((g) => g.items.map((i) => i.section));

function AdminClock() {
  const { language } = useLabels();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const locale = language === 'pt-BR' ? 'pt-BR' : language === 'es' ? 'es-AR' : 'en-US';
  return (
    <span className="ff-area-topbar-clock">
      {now.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })}
      {' · '}
      {now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

export function AdminPage() {
  const { lang, setLang } = useAdminLanguage();
  return (
    <I18nProvider language={lang}>
      <AdminPageInner lang={lang} onLangChange={setLang} />
    </I18nProvider>
  );
}

function AdminPageInner({
  lang,
  onLangChange,
}: {
  lang: LanguageCode;
  onLangChange: (l: LanguageCode) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLabels();
  const [section, setSection]       = useState<AdminSection>('dashboard');
  const [tenantName, setTenantName] = useState('Admin');
  const [tenantLogo, setTenantLogo] = useState<string | undefined>();

  useEffect(() => {
    const s = location.pathname.split('/admin/')[1] as AdminSection | undefined;
    if (s && ALL_SECTIONS.includes(s)) setSection(s);
  }, [location.pathname]);

  useEffect(() => {
    tenantService.get().then((tenant) => {
      if (tenant) { setTenantName(tenant.name); setTenantLogo(tenant.logoUrl ?? undefined); }
    });
  }, []);

  function goTo(s: string) {
    if (s === 'reports') { navigate('/reports/dashboard'); return; }
    setSection(s as AdminSection);
    navigate(`/admin/${s}`);
  }

  const pendingOrders = getCollection<DbOrder>('orders').filter(
    (o) => o.status === 'SENT_TO_KITCHEN' || o.status === 'PREPARING',
  ).length;

  const groups: SidebarNavGroup[] = NAV_DEF.map((g) => ({
    label: t(g.groupKey),
    items: g.items.map((n) => ({
      key: n.section,
      label: t(n.labelKey),
      icon: n.icon,
      badge: n.section === 'orders' ? pendingOrders : undefined,
    })),
  }));

  const currentLabel = NAV_DEF
    .flatMap((g) => g.items)
    .find((n) => n.section === section);

  const topBarRight = (
    <>
      <AdminClock />
      <div className="ff-area-status-badge">
        <span className="ff-area-status-dot" />
        {t('admin.status.operating')}
      </div>
      <AdminLanguageSelector language={lang} onChange={onLangChange} />
      <div className="ff-area-topbar-avatar" title="Admin"><i className="bi bi-person" /></div>
    </>
  );

  const sidebarFooter = (
    <button className="ff-nav-item" onClick={() => navigate('/')}>
      <i className="bi bi-house" />{t('admin.backToHub')}
    </button>
  );

  return (
    <AdminLayout
      branding={{
        logoUrl: tenantLogo,
        fallbackIcon: 'bi-shop',
        name: tenantName,
        role: t('admin.role'),
      }}
      groups={groups}
      activeKey={section}
      onSelect={goTo}
      breadcrumb={{ root: tenantName, active: currentLabel ? t(currentLabel.labelKey) : section }}
      topBarRight={topBarRight}
      sidebarFooter={sidebarFooter}
    >
      {section === 'dashboard'  && <Dashboard />}
      {section === 'products'   && <Products />}
      {section === 'categories' && <Categories />}
      {section === 'tables'     && <Tables />}
      {section === 'zones'      && <Zones />}
      {section === 'orders'     && <Orders />}
      {section === 'settings'   && <RestaurantSettings />}
      {section === 'kiosks'     && <Kiosks />}
      {section === 'queue'      && <QueueSection />}
      {section === 'loyalty'    && <LoyaltySection />}
      {section === 'aggregator' && <AggregatorSection />}
    </AdminLayout>
  );
}
