import { useState } from 'react';
import { useLabels } from '@/i18n/I18nContext';
import type { ReservationTag, ReservationSource, DbTable } from '@/lib/types';
import { TAG_CONFIG, SOURCE_CONFIG, ALL_TAGS, EMPTY_FORM } from './reservationsUtils';

interface ReservationModalProps {
  title: string;
  initial: typeof EMPTY_FORM;
  tables: DbTable[];
  onConfirm: (data: typeof EMPTY_FORM) => void;
  onClose: () => void;
  readOnly?: boolean;
}

export function ReservationModal({ title, initial, tables, onConfirm, onClose, readOnly }: ReservationModalProps) {
  const { t } = useLabels();
  const [form, setForm] = useState(initial);

  function toggleTag(tag: ReservationTag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  function field<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <div className="ff-admin-modal-overlay" onClick={onClose}>
      <div className="ff-admin-modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ff-admin-modal-header">
          <span className="ff-admin-modal-title">{title}</span>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, fontSize: 18, lineHeight: 1 }}
            onClick={onClose}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="ff-admin-modal-body" style={{ gap: 12 }}>
          {/* Customer details */}
          <div className="ff-modal-section">
            <span className="ff-modal-section-label">{t('res.modal.customerData')}</span>
            <div className="ff-modal-section-body">
              <div>
                <span className="ff-admin-modal-label">{t('res.modal.name')}</span>
                <input
                  className="form-control form-control-sm"
                  value={form.customerName}
                  readOnly={readOnly}
                  onChange={(e) => field('customerName', e.target.value)}
                  placeholder={t('res.modal.namePlaceholder')}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <span className="ff-admin-modal-label">{t('res.modal.phone')}</span>
                  <input
                    className="form-control form-control-sm"
                    type="tel"
                    value={form.customerPhone}
                    readOnly={readOnly}
                    onChange={(e) => field('customerPhone', e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <span className="ff-admin-modal-label">{t('res.modal.guests')}</span>
                  <input
                    className="form-control form-control-sm"
                    type="number"
                    min="1"
                    value={form.partySize}
                    readOnly={readOnly}
                    onChange={(e) => field('partySize', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reservation details */}
          <div className="ff-modal-section">
            <span className="ff-modal-section-label">{t('res.modal.details')}</span>
            <div className="ff-modal-section-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <span className="ff-admin-modal-label">{t('res.modal.date')}</span>
                  <input
                    className="form-control form-control-sm"
                    type="date"
                    value={form.date}
                    readOnly={readOnly}
                    onChange={(e) => field('date', e.target.value)}
                  />
                </div>
                <div>
                  <span className="ff-admin-modal-label">{t('res.modal.time')}</span>
                  <input
                    className="form-control form-control-sm"
                    type="time"
                    value={form.time}
                    readOnly={readOnly}
                    onChange={(e) => field('time', e.target.value)}
                  />
                </div>
                <div>
                  <span className="ff-admin-modal-label">{t('res.modal.duration')}</span>
                  <input
                    className="form-control form-control-sm"
                    type="number"
                    min="30"
                    value={form.duration}
                    readOnly={readOnly}
                    onChange={(e) => field('duration', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <span className="ff-admin-modal-label">{t('res.modal.source')}</span>
                <select
                  className="form-select form-select-sm"
                  value={form.source}
                  disabled={readOnly}
                  onChange={(e) => field('source', e.target.value as ReservationSource)}
                >
                  {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{t(v.labelKey)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table assignment */}
          <div className="ff-modal-section">
            <span className="ff-modal-section-label">
              {t('res.col.table')}{' '}
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{t('res.modal.tableOptional')}</span>
            </span>
            <div className="ff-modal-section-body">
              <select
                className="form-select form-select-sm"
                value={form.tableId}
                disabled={readOnly}
                onChange={(e) => field('tableId', e.target.value)}
              >
                <option value="">{t('res.modal.noTableOption')}</option>
                {tables.map((tb) => (
                  <option key={tb.id} value={tb.id}>
                    {t('res.tableN', { n: tb.number })}{tb.capacity ? ` (${t('res.seatsN', { n: tb.capacity })})` : ''}
                    {tb.zoneName ? ` — ${tb.zoneName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes & tags */}
          <div className="ff-modal-section">
            <span className="ff-modal-section-label">{t('res.modal.notesTags')}</span>
            <div className="ff-modal-section-body">
              <div>
                <span className="ff-admin-modal-label">{t('res.modal.notes')}</span>
                <input
                  className="form-control form-control-sm"
                  value={form.notes}
                  readOnly={readOnly}
                  onChange={(e) => field('notes', e.target.value)}
                  placeholder={t('res.modal.notesPlaceholder')}
                />
              </div>
              <div>
                <span className="ff-admin-modal-label">{t('res.modal.tags')}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                  {ALL_TAGS.map((tag) => {
                    const tc = TAG_CONFIG[tag];
                    const active = form.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        disabled={readOnly}
                        onClick={() => toggleTag(tag)}
                        style={{
                          background: active ? tc.bg : '#f3f4f6',
                          color: active ? tc.color : '#6b7280',
                          border: `1.5px solid ${active ? tc.color + '60' : 'transparent'}`,
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: readOnly ? 'default' : 'pointer',
                          transition: 'all .12s',
                        }}
                      >
                        {t(tc.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ff-admin-modal-footer">
          {!readOnly ? (
            <>
              <button
                className="btn btn-primary flex-1"
                onClick={() => onConfirm(form)}
                disabled={!form.customerName.trim()}
              >
                <i className="bi bi-floppy me-1" />{t('res.modal.saveReservation')}
              </button>
              <button className="btn btn-outline-secondary" onClick={onClose}>
                {t('res.modal.cancel')}
              </button>
            </>
          ) : (
            <button className="btn btn-outline-secondary flex-1" onClick={onClose}>
              {t('res.modal.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
