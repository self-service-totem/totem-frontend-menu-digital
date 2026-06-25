import { useLabels } from '@/i18n/I18nContext';
import type { WalkIn, DbTable } from '@/lib/types';
import { timeAgo } from './reservationsUtils';

interface WalkInPanelProps {
  walkIns: WalkIn[];
  tables: DbTable[];
  onSeat: (id: string) => void;
  onCancel: (id: string) => void;
  onAdd: () => void;
}

export function WalkInPanel({ walkIns, onSeat, onCancel, onAdd }: WalkInPanelProps) {
  const { t } = useLabels();
  const waiting = walkIns.filter((w) => w.status === 'WAITING');
  const past    = walkIns.filter((w) => w.status !== 'WAITING');

  return (
    <div>
      {/* Header */}
      <div className="ff-walkin-header">
        <div className="ff-walkin-header-title">
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{t('res.walkin.queue')}</span>
          {waiting.length > 0 && (
            <span className="ff-walkin-badge">{waiting.length}</span>
          )}
        </div>
        <button className="btn btn-sm btn-primary" onClick={onAdd}>
          <i className="bi bi-plus me-1" />{t('res.walkin.add')}
        </button>
      </div>

      {/* Empty state */}
      {waiting.length === 0 && (
        <div className="ff-empty-state">
          <i className="bi bi-people ff-empty-state-icon" />
          <div className="ff-empty-state-title">{t('res.walkin.emptyTitle')}</div>
          <div className="ff-empty-state-desc">{t('res.walkin.emptyDesc')}</div>
        </div>
      )}

      {/* Waiting list */}
      <div className="ff-walkin-list">
        {waiting.map((w, idx) => {
          const waitMins = Math.floor((Date.now() - new Date(w.arrivedAt).getTime()) / 60000);
          const isLong = waitMins > (w.estimatedWaitMinutes ?? 30);
          return (
            <div key={w.id} className="ff-walkin-card" style={{ borderLeftColor: isLong ? '#dc2626' : '#0284c7' }}>
              {/* Position number */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: isLong ? '#fef2f2' : '#eff6ff',
                  color: isLong ? '#dc2626' : '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </div>

              {/* Info */}
              <div className="ff-walkin-info">
                <div className="ff-walkin-name">{w.customerName}</div>
                <div className="ff-walkin-meta">
                  <span><i className="bi bi-people-fill me-1" />{t('res.guestsN', { n: w.partySize })}</span>
                  {w.customerPhone && <span><i className="bi bi-telephone-fill me-1" />{w.customerPhone}</span>}
                </div>
                <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: isLong ? '#fee2e2' : '#f0fdf4',
                      color: isLong ? '#991b1b' : '#14532d',
                    }}
                  >
                    <i className="bi bi-clock me-1" />
                    {isLong ? t('res.walkin.waitingSince') : t('res.walkin.since')}{timeAgo(w.arrivedAt, t)}
                  </span>
                  {w.estimatedWaitMinutes && (
                    <span style={{ fontSize: '0.74rem', color: '#9ca3af' }}>
                      {t('res.walkin.estWait', { n: w.estimatedWaitMinutes })}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="ff-walkin-card-actions">
                <button
                  className="btn btn-sm btn-primary"
                  style={{ fontSize: '0.78rem', fontWeight: 700 }}
                  onClick={() => onSeat(w.id)}
                >
                  <i className="bi bi-person-check-fill me-1" />{t('res.walkin.seat')}
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => onCancel(w.id)}
                >
                  {t('res.walkin.remove')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* History */}
      {past.length > 0 && (
        <details style={{ marginTop: 20 }}>
          <summary className="ff-walkin-history-summary">
            <i className="bi bi-clock-history" />
            {t('res.walkin.historyToday', { n: past.length })}
          </summary>
          <div className="ff-walkin-past-list">
            {past.map((w) => (
              <div key={w.id} className="ff-walkin-past-item">
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.87rem' }}>{w.customerName}</span>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af', marginLeft: 8 }}>
                    {t('res.guestsN', { n: w.partySize })} ·{' '}
                    {w.status === 'SEATED' ? (
                      <span style={{ color: '#059669' }}>{t('res.walkin.seated')}</span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>{t('res.walkin.removed')}</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
