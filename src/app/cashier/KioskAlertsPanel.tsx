import { format } from '@/i18n/labels';
import { formatCurrency as formatBRL } from '@/utils/format';
import { elapsedMins, fmtElapsed } from '@/lib/utils/useElapsed';
import type { KioskAlert } from '@/lib/types';

export function KioskAlertsPanel({
  alerts, onResolve,
  labelAlerts, labelResolve, labelNeedsHelp, labelPrintFailed, labelTotemN, labelNoAlerts,
}: {
  alerts: KioskAlert[];
  onResolve: (id: string) => void;
  labelAlerts: string;
  labelResolve: string;
  labelNeedsHelp: string;
  labelPrintFailed: string;
  labelTotemN: string;
  labelNoAlerts: string;
}) {
  const open = alerts.filter((a) => a.status === 'OPEN');

  return (
    <div className="ff-kiosk-alerts-panel">
      <div className="ff-kiosk-alerts-header">
        <i className="bi bi-bell-fill" />
        {labelAlerts}
        <span className={`ff-kiosk-alerts-badge${open.length > 0 ? ' active' : ''}`}>
          {open.length}
        </span>
      </div>

      {open.length === 0 ? (
        <div className="ff-kiosk-alerts-empty">
          <i className="bi bi-check2-circle" style={{ fontSize: 18, marginRight: 6 }} />
          {labelNoAlerts}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {open.map((alert) => (
            <div key={alert.id} className="ff-kiosk-alert-card">
              <div className="ff-kiosk-alert-left">
                <div className="ff-kiosk-alert-icon">
                  <i className={`bi ${alert.issueType === 'NEEDS_HELP' ? 'bi-headset' : 'bi-printer'}`} />
                </div>
                <div className="ff-kiosk-alert-info">
                  <div className="ff-kiosk-alert-totem">
                    {format(labelTotemN, { n: alert.kioskNumber })}
                    <span className="ff-kiosk-alert-order">{alert.orderNumber}</span>
                  </div>
                  <div className="ff-kiosk-alert-issue">
                    {alert.issueType === 'NEEDS_HELP' ? labelNeedsHelp : labelPrintFailed}
                  </div>
                  <div className="ff-kiosk-alert-meta">
                    <span>{formatBRL(alert.total)}</span>
                    <span className={`ff-kiosk-alert-payment${alert.paymentStatus === 'PAID' ? ' paid' : ''}`}>
                      {alert.paymentStatus === 'PAID' ? 'Pago' : alert.paymentStatus === 'UNPAID' ? 'Pendiente' : alert.paymentStatus}
                    </span>
                    <span>{fmtElapsed(elapsedMins(alert.createdAt))}</span>
                  </div>
                </div>
              </div>
              <button className="ff-kiosk-alert-resolve" onClick={() => onResolve(alert.id)}>
                <i className="bi bi-check2" />
                {labelResolve}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
