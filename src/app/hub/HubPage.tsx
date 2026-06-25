import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetDb, seedDb } from '@/lib/mock-db';
import { firebaseEnabled } from '@/lib/firebase/config';
import { clearLiveCollections, pushSeedCollections } from '@/lib/firebase/sync';
import { CardPreviewModal } from '@/components/printing/CardPreviewModal';
import { TableQrModal } from '@/components/printing/TableQrModal';
import { useRole } from '@/app/RoleContext';
import { I18nProvider, useLabels } from '@/i18n/I18nContext';
import { useAdminLanguage } from '@/i18n/useAdminLanguage';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';
import type { LabelKey, LanguageCode } from '@/i18n/labels';
import { featureFlagService, type FeatureFlags } from '@/lib/services/featureFlagService';

type AreaDef = { path: string; icon: string; titleKey: LabelKey; descKey: LabelKey; color: string; flagKey?: keyof FeatureFlags };

const CUSTOMER_AREAS: AreaDef[] = [
  { path: '/menu/branch-1/table/140', icon: 'bi-phone', titleKey: 'hub.area.menu.title', descKey: 'hub.area.menu.desc', color: '#e11d2a' },
  { path: '/kiosk', icon: 'bi-display', titleKey: 'hub.area.kiosk.title', descKey: 'hub.area.kiosk.desc', color: '#7c3aed', flagKey: 'kiosk' },
  { path: '/queue-display', icon: 'bi-tv', titleKey: 'hub.area.queue.title', descKey: 'hub.area.queue.desc', color: '#0284c7', flagKey: 'queueDisplay' },
];

const OPERATIONAL_AREAS: AreaDef[] = [
  { path: '/kitchen/orders', icon: 'bi-fire', titleKey: 'hub.area.kitchen.title', descKey: 'hub.area.kitchen.desc', color: '#d97706' },
  { path: '/waiter-staff/tables', icon: 'bi-person-badge', titleKey: 'hub.area.waiter.title', descKey: 'hub.area.waiter.desc', color: '#059669' },
  { path: '/cashier/orders', icon: 'bi-cash-coin', titleKey: 'hub.area.cashier.title', descKey: 'hub.area.cashier.desc', color: '#9333ea' },
  { path: '/admin/dashboard', icon: 'bi-grid-1x2', titleKey: 'hub.area.admin.title', descKey: 'hub.area.admin.desc', color: '#ec4899' },
];

const NEW_AREAS: AreaDef[] = [
  { path: '/delivery', icon: 'bi-bicycle', titleKey: 'hub.area.delivery.title', descKey: 'hub.area.delivery.desc', color: '#06b6d4', flagKey: 'delivery' },
  { path: '/reservations', icon: 'bi-calendar-check', titleKey: 'hub.area.reservations.title', descKey: 'hub.area.reservations.desc', color: '#8b5cf6', flagKey: 'reservations' },
  { path: '/reports', icon: 'bi-bar-chart', titleKey: 'hub.area.reports.title', descKey: 'hub.area.reports.desc', color: '#ffffff' },
  { path: '/login', icon: 'bi-person-lock', titleKey: 'hub.area.login.title', descKey: 'hub.area.login.desc', color: '#60a5fa' },
];

function AreaGrid({ areas }: { areas: AreaDef[] }) {
  const { t } = useLabels();
  return (
    <div className="ff-hub-grid">
      {areas.map((a) => (
        <Link key={a.path} to={a.path} className="ff-hub-card" style={{ borderTopColor: a.color, borderTopWidth: 3 }}>
          <div className="ff-hub-card-icon" style={{ color: a.color }}>
            <i className={a.icon} />
          </div>
          <div className="ff-hub-card-title">{t(a.titleKey)}</div>
          <div className="ff-hub-card-desc">{t(a.descKey)}</div>
        </Link>
      ))}
    </div>
  );
}

export function HubPage() {
  const { lang, setLang } = useAdminLanguage();
  return (
    <I18nProvider language={lang}>
      <HubInner lang={lang} onLangChange={setLang} />
    </I18nProvider>
  );
}

function HubInner({ lang, onLangChange }: { lang: LanguageCode; onLangChange: (l: LanguageCode) => void }) {
  const { t } = useLabels();
  const { currentUser, logout } = useRole();
  const [cardPreviewOpen, setCardPreviewOpen] = useState(false);
  const [tableQrOpen, setTableQrOpen] = useState(false);

  const flags = featureFlagService.getAll();
  const filterByFlag = (areas: AreaDef[]) =>
    areas.filter((a) => !a.flagKey || flags[a.flagKey]);

  async function handleReset() {
    if (!window.confirm(t('hub.resetConfirm'))) return;
    resetDb();
    seedDb();
    // Reset de demo compartido: vaciar las colecciones vivas en Firestore y volver
    // a subir el seed inicial (mesas, reservas, walk-ins), así todos los dispositivos
    // arrancan con el mismo estado limpio de demo.
    if (firebaseEnabled) {
      await clearLiveCollections();
      pushSeedCollections();
    }
    window.location.reload();
  }

  return (
    <div className="ff-hub-layout">
      <div className="ff-hub-header">
        <div style={{ position: 'absolute', top: 12, right: 16 }}>
          <AdminLanguageSelector language={lang} onChange={onLangChange} />
        </div>
        <div className="ff-hub-title">🍽 Pertinho do Ceu</div>
        <div className="ff-hub-subtitle">
          {currentUser
            ? t('hub.loggedAs', { name: currentUser.name, role: currentUser.role })
            : t('hub.chooseArea')}
        </div>
        {currentUser && (
          <button
            onClick={logout}
            style={{ marginTop: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#94a3b8', borderRadius: 8, padding: '4px 14px', cursor: 'pointer', fontSize: 13 }}
          >
            {t('hub.logout')}
          </button>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: 900 }}>
        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
          {t('hub.sectionCustomer')}
        </div>
        <AreaGrid areas={filterByFlag(CUSTOMER_AREAS)} />

        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', margin: '24px 0 10px' }}>
          {t('hub.sectionOps')}
        </div>
        <AreaGrid areas={OPERATIONAL_AREAS} />

        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', margin: '24px 0 10px' }}>
          {t('hub.sectionNew')}
        </div>
        <AreaGrid areas={filterByFlag(NEW_AREAS)} />
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => setCardPreviewOpen(true)}
          style={{ background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)', color: '#93c5fd', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
        >
          <i className="bi bi-printer me-1" />
          {t('hub.printCard')}
        </button>
        <button
          onClick={() => setTableQrOpen(true)}
          style={{ background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', color: '#6ee7b7', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
        >
          <i className="bi bi-qr-code me-1" />
          {t('hub.printTableQr')}
        </button>
        <button className="ff-hub-reset-btn" onClick={handleReset}>
          <i className="bi bi-arrow-counterclockwise me-1" />
          {t('hub.resetBtn')}
        </button>
      </div>

      <CardPreviewModal open={cardPreviewOpen} onClose={() => setCardPreviewOpen(false)} />
      <TableQrModal open={tableQrOpen} onClose={() => setTableQrOpen(false)} />
    </div>
  );
}
