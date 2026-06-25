import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLabels } from '@/i18n/I18nContext';
import { loadAttractConfig } from './attractConfig';
import { getBrand, getKioskPin, type Brand } from '@/lib/services/brand';
import type { LabelKey } from '@/i18n/labels';
import './kiosk.css';

const IDLE_COUNTDOWN_S = 10;
const BRAND_POLL_MS = 4000;

/**
 * Marca del tenant (nombre + logo) para pantallas idle del kiosk. Relee del espejo
 * local cada pocos segundos: cuando Admin guarda un cambio, la colección `tenants`
 * se sincroniza vía Firestore y el kiosk lo refleja sin recargar la página.
 */
export function useBrand(): Brand {
  const [brand, setBrand] = useState<Brand>(getBrand);
  useEffect(() => {
    const id = setInterval(() => {
      setBrand((prev) => {
        const next = getBrand();
        return prev.name === next.name && prev.logoUrl === next.logoUrl ? prev : next;
      });
    }, BRAND_POLL_MS);
    return () => clearInterval(id);
  }, []);
  return brand;
}

const KIOSK_UNLOCKED_KEY = 'ff_kiosk_unlocked';

export function useKioskPin() {
  const [pin, setPin] = useState<string | null>(getKioskPin);
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem(KIOSK_UNLOCKED_KEY) === 'true',
  );

  useEffect(() => {
    const id = setInterval(() => setPin(getKioskPin()), BRAND_POLL_MS);
    return () => clearInterval(id);
  }, []);

  function unlock() {
    localStorage.setItem(KIOSK_UNLOCKED_KEY, 'true');
    setUnlocked(true);
  }

  const locked = Boolean(pin) && !unlocked;
  return { pin, locked, unlock };
}

/**
 * Idle handling for a kiosk session. After IDLE_TIMEOUT_MS of no interaction we
 * surface a "still there?" warning instead of resetting outright; the warning
 * runs its own countdown (see KioskIdleModal) before returning to the start.
 * Returns the warning flag plus handlers the page wires into the modal.
 */
export function useKioskIdleTimeout(enabled = true) {
  const navigate = useNavigate();
  const [warning, setWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Read timeout from saved admin config each time the hook mounts.
  const timeoutMs = useRef(loadAttractConfig().idleTimeoutSeconds * 1000);

  const goHome = useCallback(() => navigate('/kiosk/attract'), [navigate]);

  const armIdle = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setWarning(true), timeoutMs.current);
  }, []);

  const dismiss = useCallback(() => {
    setWarning(false);
    armIdle();
  }, [armIdle]);

  useEffect(() => {
    if (!enabled) return;
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    // While the warning is up we stop auto-resetting — the user must confirm
    const onActivity = () => { if (!warning) armIdle(); };
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    if (!warning) armIdle();
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, warning, armIdle]);

  return { warning, dismiss, goHome };
}

// "Still there?" overlay shown before an idle reset. Owns its own countdown.
export function KioskIdleModal({ onContinue, onRestart }: { onContinue: () => void; onRestart: () => void }) {
  const { t } = useLabels();
  const [count, setCount] = useState(IDLE_COUNTDOWN_S);

  useEffect(() => {
    if (count <= 0) { onRestart(); return; }
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count, onRestart]);

  return (
    <div className="ff-kiosk-idle-overlay" onClick={onContinue} role="alertdialog" aria-modal="true">
      <div className="ff-kiosk-idle-card" onClick={(e) => e.stopPropagation()}>
        <i className="bi bi-clock-history ff-kiosk-idle-icon" />
        <div className="ff-kiosk-idle-title">{t('kiosk.idle.title')}</div>
        <div className="ff-kiosk-idle-subtitle">{t('kiosk.idle.subtitle', { s: count })}</div>
        <div className="ff-kiosk-idle-actions">
          <button className="ff-kiosk-idle-restart" onClick={onRestart}>
            {t('kiosk.idle.restart')}
          </button>
          <button className="ff-kiosk-idle-continue" onClick={onContinue}>
            {t('kiosk.idle.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Progress stepper ─────────────────────────────────────────────────────────

const STEP_KEYS: LabelKey[] = ['kiosk.steps.menu', 'kiosk.steps.review', 'kiosk.steps.payment', 'kiosk.steps.done'];

export function KioskSteps({ current, allDone = false, compact = false }: { current: 1 | 2 | 3 | 4; allDone?: boolean; compact?: boolean }) {
  const { t } = useLabels();
  return (
    <div className={`ff-kiosk-steps${compact ? ' ff-kiosk-steps--compact' : ''}`}>
      {STEP_KEYS.map((key, i) => {
        const label = t(key);
        const n = i + 1;
        const state = allDone ? 'done' : current === n ? 'active' : current > n ? 'done' : '';
        const showCheck = allDone || current > n;
        return (
          <React.Fragment key={n}>
            <div className={`ff-kiosk-step${state ? ` ${state}` : ''}`}>
              <div className="ff-kiosk-step-dot">
                {showCheck ? <i className="bi bi-check" /> : n}
              </div>
              <span className="ff-kiosk-step-label">{label}</span>
            </div>
            {i < STEP_KEYS.length - 1 && (
              <div className={`ff-kiosk-step-line${allDone || current > n ? ' done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
