import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLabels } from '@/i18n/I18nContext';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { useKioskIdleTimeout, KioskIdleModal, useBrand } from './kioskShared';

export function KioskWelcomePage() {
  const navigate = useNavigate();
  const { t } = useLabels();
  const { warning, dismiss, goHome } = useKioskIdleTimeout();
  const brand = useBrand();

  // Fresh session: drop any cart left behind by an abandoned/timed-out order
  useEffect(() => {
    sessionStorage.removeItem('ff_kiosk_cart');
    sessionStorage.removeItem('ff_kiosk_service');
  }, []);

  // Future: replace with branch.heroImageUrl from admin config
  const heroImageUrl: string | null = null;

  return (
    <div className="ff-kiosk-layout ff-kiosk-welcome-layout">
      {/* Header — brand name */}
      <div className="ff-kiosk-welcome-header">
        <span className="ff-kiosk-welcome-brand">{brand.name}</span>
      </div>

      {/* Language selector — prominent bar below header */}
      <div className="ff-kiosk-welcome-lang-bar">
        <LanguageSelector variant="pills" className="ff-kiosk-welcome-lang-pills" />
      </div>

      {/* Body — hero + service buttons */}
      <div className="ff-kiosk-welcome-body">
        <div className="ff-kiosk-welcome-hero">
          {heroImageUrl ? (
            <img src={heroImageUrl} alt="Restaurant" className="ff-kiosk-welcome-hero-img" />
          ) : (
            <div className="ff-kiosk-welcome-badge">
              <i className="bi bi-cup-hot-fill" />
            </div>
          )}
          <div className="ff-kiosk-welcome-title">{t('kiosk.welcome.title')}</div>
          <div className="ff-kiosk-welcome-subtitle">{t('kiosk.welcome.subtitle')}</div>
        </div>

        <div className="ff-kiosk-service-options">
          <button
            className="ff-kiosk-service-btn"
            onClick={() => navigate('/kiosk/menu?service=EAT_IN')}
          >
            <i className="bi bi-door-open" />
            <span>{t('kiosk.welcome.eatIn')}</span>
          </button>
          <button
            className="ff-kiosk-service-btn"
            onClick={() => navigate('/kiosk/menu?service=TAKEAWAY')}
          >
            <i className="bi bi-bag" />
            <span>{t('kiosk.welcome.takeaway')}</span>
          </button>
        </div>
      </div>

      {warning && <KioskIdleModal onContinue={dismiss} onRestart={goHome} />}
    </div>
  );
}
