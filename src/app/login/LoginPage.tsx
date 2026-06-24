import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRole } from '@/app/RoleContext';
import type { UserRole } from '@/lib/types';
import { I18nProvider, useLabels } from '@/i18n/I18nContext';
import { useAdminLanguage } from '@/i18n/useAdminLanguage';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';
import type { LanguageCode } from '@/i18n/labels';

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
  const { login, currentUser, logout, isAuthenticated } = useRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      // After login, RoleContext resolves the user and their role.
      // Navigate with a small delay so currentUser populates from onAuthStateChanged.
      // The StaffGuard on the destination handles the redirect if still loading.
      const next = searchParams.get('next');
      navigate(next ?? '/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setError(t('login.error.invalidCredentials'));
      } else {
        setError(t('login.error.generic'));
      }
    } finally {
      setLoading(false);
    }
  }

  if (isAuthenticated && currentUser) {
    return (
      <div className="ff-login-layout">
        <div className="ff-login-card">
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <AdminLanguageSelector language={lang} onChange={onLangChange} />
          </div>
          <div className="ff-login-title">{t('login.greeting', { name: currentUser.name })}</div>
          <div style={{ textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
            {currentUser.email}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate(ROLE_DESTINATIONS[currentUser.role])}
          >
            {t('login.goToArea')}
          </button>
          <button
            className="btn btn-outline-secondary"
            onClick={() => { void logout(); }}
          >
            {t('login.switchUser')}
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

        <form onSubmit={(e) => { void handleLogin(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              {t('login.emailLabel')}
            </label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              {t('login.passwordLabel')}
            </label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: 8,
                padding: '8px 12px',
                color: '#dc2626',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className="bi bi-exclamation-circle" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
            ) : null}
            {t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
