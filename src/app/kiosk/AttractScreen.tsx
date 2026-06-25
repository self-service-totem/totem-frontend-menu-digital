import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLabels } from '@/i18n/I18nContext';
import { loadAttractConfig } from './attractConfig';
import { useBrand, useKioskPin } from './kioskShared';

export function AttractScreen() {
  const [fading, setFading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLabels();
  // Nombre y logo vienen del tenant (Admin → Configuración); el resto (video,
  // slogan, timeout) sigue siendo config específica del kiosk.
  const config = loadAttractConfig();
  const brand = useBrand();
  const logoUrl = brand.logoUrl ?? config.logoUrl;
  const { pin, locked, unlock } = useKioskPin();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  function handlePinSubmit(e: FormEvent) {
    e.preventDefault();
    if (pinInput === pin) {
      unlock();
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  }

  function handleTouch() {
    if (fading) return;
    setFading(true);
    setTimeout(() => navigate('/kiosk/start'), 420);
  }

  if (locked) {
    return (
      <div className="ff-kiosk-pin-screen">
        <div className="ff-kiosk-pin-card">
          {logoUrl && <img src={logoUrl} alt={brand.name} className="ff-kiosk-pin-logo" />}
          <div className="ff-kiosk-pin-title">{t('kiosk.pin.title')}</div>
          <div className="ff-kiosk-pin-subtitle">{t('kiosk.pin.subtitle')}</div>
          <form onSubmit={handlePinSubmit} className="ff-kiosk-pin-form">
            <input
              className={`ff-kiosk-pin-input${pinError ? ' error' : ''}`}
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pinInput}
              autoFocus
              placeholder="••••"
              onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
            />
            {pinError && <div className="ff-kiosk-pin-error">{t('kiosk.pin.wrong')}</div>}
            <button type="submit" className="ff-kiosk-pin-submit">{t('kiosk.pin.submit')}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`ff-attract-root${fading ? ' ff-attract-fade-out' : ''}`}
      onClick={handleTouch}
      role="button"
      tabIndex={0}
      aria-label={t('kiosk.attract.cta')}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTouch(); }}
    >
      {config.videoUrl ? (
        <>
          <video
            className="ff-attract-video"
            src={config.videoUrl}
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="ff-attract-video-tint" />
        </>
      ) : (
        <div className="ff-attract-backdrop" />
      )}

      <div className="ff-attract-overlay">
        <div className="ff-attract-brand">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={brand.name}
              className="ff-attract-logo"
            />
          )}
          <div className="ff-attract-name">{brand.name}</div>
          {config.slogan && (
            <div className="ff-attract-slogan">{config.slogan}</div>
          )}
        </div>

        <div className="ff-attract-cta">
          <div className="ff-attract-cta-ring" aria-hidden="true">
            <i className="bi bi-hand-index-thumb" />
          </div>
          <div className="ff-attract-cta-text">{t('kiosk.attract.cta')}</div>
        </div>
      </div>
    </div>
  );
}
