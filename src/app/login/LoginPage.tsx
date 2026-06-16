import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/app/RoleContext';
import { getCollection } from '@/lib/mock-db';
import type { MockUser, UserRole } from '@/lib/types';
import { I18nProvider, useLabels } from '@/i18n/I18nContext';
import { useAdminLanguage } from '@/i18n/useAdminLanguage';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';
import type { LabelKey, LanguageCode } from '@/i18n/labels';

const ROLE_ICONS: Record<UserRole, string> = {
  OWNER: 'bi-crown',
  MANAGER: 'bi-person-gear',
  CASHIER: 'bi-cash-register',
  WAITER: 'bi-person-badge',
  KITCHEN: 'bi-fire',
  SUPPORT: 'bi-headset',
};

const ROLE_LABEL_KEYS: Record<UserRole, LabelKey> = {
  OWNER: 'login.role.owner',
  MANAGER: 'login.role.manager',
  CASHIER: 'login.role.cashier',
  WAITER: 'login.role.waiter',
  KITCHEN: 'login.role.kitchen',
  SUPPORT: 'login.role.support',
};

const ROLE_DESTINATIONS: Record<UserRole, string> = {
  OWNER: '/admin/dashboard',
  MANAGER: '/admin/dashboard',
  CASHIER: '/cashier',
  WAITER: '/waiter-staff/tables',
  KITCHEN: '/kitchen/orders',
  SUPPORT: '/admin/dashboard',
};

export function LoginPage() {
  const { lang, setLang } = useAdminLanguage();
  return (
    <I18nProvider language={lang}>
      <LoginInner lang={lang} onLangChange={setLang} />
    </I18nProvider>
  );
}

function LoginInner({ lang, onLangChange }: { lang: LanguageCode; onLangChange: (l: LanguageCode) => void }) {
  const { t } = useLabels();
  const { login, currentUser, logout } = useRole();
  const navigate = useNavigate();
  const users = getCollection<MockUser>('mockUsers');
  const [selected, setSelected] = useState<string | null>(null);

  function handleLogin() {
    if (!selected) return;
    login(selected);
    const user = users.find((u) => u.id === selected);
    if (user) navigate(ROLE_DESTINATIONS[user.role]);
  }

  if (currentUser) {
    return (
      <div className="ff-login-layout">
        <div className="ff-login-card">
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <AdminLanguageSelector language={lang} onChange={onLangChange} />
          </div>
          <div className="ff-login-title">{t('login.greeting', { name: currentUser.name })}</div>
          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
            {t('login.loggedAs')} <strong>{t(ROLE_LABEL_KEYS[currentUser.role])}</strong>
          </div>
          <button className="btn btn-primary" onClick={() => navigate(ROLE_DESTINATIONS[currentUser.role])}>
            {t('login.goToArea')}
          </button>
          <button className="btn btn-outline-secondary" onClick={() => { logout(); navigate('/login'); }}>
            {t('login.switchUser')}
          </button>
          <button className="btn btn-outline-secondary" onClick={() => navigate('/')}>
            {t('login.hub')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-login-layout">
      <div className="ff-login-card">
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <AdminLanguageSelector language={lang} onChange={onLangChange} />
          </div>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🍽</div>
          <div className="ff-login-title">{t('login.title')}</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            {t('login.subtitle')}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map((user) => (
            <div
              key={user.id}
              className={`ff-role-card ${selected === user.id ? 'selected' : ''}`}
              onClick={() => setSelected(user.id)}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: selected === user.id ? 'var(--ff-primary)' : '#f3f4f6',
                  color: selected === user.id ? '#fff' : '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <i className={`bi ${ROLE_ICONS[user.role]}`} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{t(ROLE_LABEL_KEYS[user.role])}</div>
              </div>
              {selected === user.id && <i className="bi bi-check-circle-fill text-danger" />}
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleLogin} disabled={!selected}>
          {t('login.submit')}
        </button>

        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate('/')}
          style={{ marginTop: -8 }}
        >
          {t('login.continueDemo')}
        </button>
      </div>
    </div>
  );
}
