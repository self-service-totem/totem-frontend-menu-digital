import { useState } from 'react';
import { useLabels } from '@/i18n/I18nContext';
import type { ReservationSettings } from '@/lib/types';

interface SettingsPanelProps {
  settings: ReservationSettings | null;
  onSave: (s: Partial<ReservationSettings>) => void;
}

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const { t } = useLabels();
  const [form, setForm] = useState({
    defaultDurationMinutes: String(settings?.defaultDurationMinutes ?? 90),
    lateToleranceMinutes:   String(settings?.lateToleranceMinutes ?? 15),
    openingTime:            settings?.openingTime ?? '11:30',
    closingTime:            settings?.closingTime ?? '23:00',
    slotIntervalMinutes:    String(settings?.slotIntervalMinutes ?? 30),
    maxPartySize:           String(settings?.maxPartySize ?? 12),
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSave({
      defaultDurationMinutes: parseInt(form.defaultDurationMinutes) || 90,
      lateToleranceMinutes:   parseInt(form.lateToleranceMinutes) || 15,
      openingTime:            form.openingTime,
      closingTime:            form.closingTime,
      slotIntervalMinutes:    parseInt(form.slotIntervalMinutes) || 30,
      maxPartySize:           parseInt(form.maxPartySize) || 12,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="ff-settings-form">
      <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 20, color: '#1a1a1a' }}>
        <i className="bi bi-gear-fill me-2" style={{ color: '#6b7280' }} />
        {t('res.settings.title')}
      </div>

      <div className="ff-modal-section" style={{ marginBottom: 16 }}>
        <span className="ff-modal-section-label">{t('res.settings.hours')}</span>
        <div className="ff-modal-section-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: t('res.settings.opening'), key: 'openingTime' as const, type: 'time' },
            { label: t('res.settings.closing'), key: 'closingTime' as const, type: 'time' },
          ].map((f) => (
            <div key={f.key}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 4, color: '#374151' }}>
                {f.label}
              </label>
              <input
                className="form-control form-control-sm"
                type={f.type}
                value={form[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="ff-modal-section" style={{ marginBottom: 20 }}>
        <span className="ff-modal-section-label">{t('res.settings.params')}</span>
        <div className="ff-modal-section-body">
          {[
            { label: t('res.settings.defaultDuration'), key: 'defaultDurationMinutes' as const, hint: t('res.settings.defaultDurationHint') },
            { label: t('res.settings.lateTolerance'),   key: 'lateToleranceMinutes' as const, hint: t('res.settings.lateToleranceHint') },
            { label: t('res.settings.slotInterval'),    key: 'slotIntervalMinutes' as const, hint: t('res.settings.slotIntervalHint') },
            { label: t('res.settings.maxParty'),        key: 'maxPartySize' as const, hint: '' },
          ].map((f) => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: 2, color: '#374151' }}>
                  {f.label}
                </label>
                {f.hint && <div style={{ fontSize: '0.74rem', color: '#9ca3af' }}>{f.hint}</div>}
              </div>
              <input
                className="form-control form-control-sm"
                type="number"
                style={{ width: 90, textAlign: 'center' }}
                value={form[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-primary" onClick={handleSave}>
          <i className="bi bi-floppy me-1" />{t('res.settings.save')}
        </button>
        {saved && (
          <span style={{ fontSize: '0.85rem', color: '#059669', display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="bi bi-check-circle-fill" />{t('res.settings.saved')}
          </span>
        )}
      </div>
    </div>
  );
}
