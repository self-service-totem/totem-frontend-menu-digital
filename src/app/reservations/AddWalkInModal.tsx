import { useState } from 'react';
import { useLabels } from '@/i18n/I18nContext';

interface AddWalkInModalProps {
  onConfirm: (data: { customerName: string; customerPhone: string; partySize: number; estimatedWaitMinutes: number }) => void;
  onClose: () => void;
}

export function AddWalkInModal({ onConfirm, onClose }: AddWalkInModalProps) {
  const { t } = useLabels();
  const [form, setForm] = useState({ customerName: '', customerPhone: '', partySize: '2', estimatedWaitMinutes: '20' });

  return (
    <div className="ff-admin-modal-overlay" onClick={onClose}>
      <div className="ff-admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="ff-admin-modal-header">
          <span className="ff-admin-modal-title">
            <i className="bi bi-person-plus-fill me-2" style={{ color: '#0284c7' }} />
            {t('res.walkin.add')}
          </span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18 }} onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="ff-admin-modal-body">
          <div>
            <span className="ff-admin-modal-label">{t('res.walkin.nameOrGroup')}</span>
            <input
              className="form-control form-control-sm"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              placeholder={t('res.walkin.nameOrGroupPlaceholder')}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <span className="ff-admin-modal-label">{t('res.modal.phone')}</span>
              <input
                className="form-control form-control-sm"
                type="tel"
                value={form.customerPhone}
                onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
              />
            </div>
            <div>
              <span className="ff-admin-modal-label">{t('res.modal.guests')}</span>
              <input
                className="form-control form-control-sm"
                type="number"
                min="1"
                value={form.partySize}
                onChange={(e) => setForm((f) => ({ ...f, partySize: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <span className="ff-admin-modal-label">{t('res.walkin.estWaitMin')}</span>
            <input
              className="form-control form-control-sm"
              type="number"
              min="5"
              value={form.estimatedWaitMinutes}
              onChange={(e) => setForm((f) => ({ ...f, estimatedWaitMinutes: e.target.value }))}
            />
          </div>
        </div>
        <div className="ff-admin-modal-footer">
          <button
            className="btn btn-primary flex-1"
            onClick={() =>
              onConfirm({
                customerName: form.customerName,
                customerPhone: form.customerPhone,
                partySize: parseInt(form.partySize) || 2,
                estimatedWaitMinutes: parseInt(form.estimatedWaitMinutes) || 20,
              })
            }
            disabled={!form.customerName.trim()}
          >
            <i className="bi bi-plus-circle-fill me-1" />{t('res.walkin.add')}
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>{t('res.modal.cancel')}</button>
        </div>
      </div>
    </div>
  );
}
