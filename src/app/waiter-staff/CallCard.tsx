import type { WaiterCall } from '@/lib/types';
import { elapsedMins, fmtElapsed, ageSeverity } from '@/lib/utils/useElapsed';
import { CALL_REASON_LABEL } from './waiterUtils';

interface CallCardProps {
  call: WaiterCall;
  onAck: (id: string) => void;
  onResolve: (id: string) => void;
  onViewTable: (tableId: string) => void;
}

export function CallCard({ call, onAck, onResolve, onViewTable }: CallCardProps) {
  const isPending   = call.status === 'PENDING';
  const mins        = elapsedMins(call.createdAt);
  const sev         = ageSeverity(mins, 3, 7);
  const timerBg     = sev === 'critical' ? '#dc2626' : sev === 'warn' ? '#d97706' : '#059669';
  const borderColor = isPending ? '#dc2626' : '#d97706';

  return (
    <div
      className={isPending ? 'ff-waiter-call--pending' : undefined}
      style={{
        background: '#fff',
        border: `1.5px solid ${isPending ? '#fecaca' : '#fde68a'}`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 10,
      }}
    >
      {/* Header */}
      <div style={{
        background: isPending
          ? 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)'
          : 'linear-gradient(135deg, #fffbeb 0%, #fefce8 100%)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: 10,
          background: isPending ? '#dc2626' : '#d97706',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 2,
        }}>
          <i className={`bi ${isPending ? 'bi-megaphone-fill' : 'bi-hand-index-fill'}`} style={{ color: '#fff', fontSize: '0.9rem' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <button
              style={{ fontWeight: 900, fontSize: '1.1rem', color: '#111827', background: 'none', border: 'none', padding: 0, cursor: 'pointer', letterSpacing: '-0.01em' }}
              onClick={() => onViewTable(call.tableId)}
            >
              Mesa {call.tableNumber}
            </button>
            {call.reason && (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: borderColor, background: `${borderColor}14`, border: `1px solid ${borderColor}28`, borderRadius: 20, padding: '2px 10px' }}>
                {CALL_REASON_LABEL[call.reason] ?? call.reason}
              </span>
            )}
          </div>
          {call.customerName && (
            <span style={{ fontSize: '0.83rem', color: '#6b7280' }}>{call.customerName}</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, background: timerBg, color: '#fff', borderRadius: 20, padding: '3px 11px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <i className="bi bi-clock" style={{ fontSize: '0.7rem' }} />
            {fmtElapsed(mins)}
          </span>
          <span style={{
            fontSize: '0.66rem', fontWeight: 800, letterSpacing: '.04em',
            color: isPending ? '#991b1b' : '#92400e',
            background: isPending ? '#fee2e2' : '#fef3c7',
            border: `1px solid ${isPending ? '#fca5a5' : '#fde68a'}`,
            borderRadius: 20, padding: '2px 9px',
          }}>
            {isPending ? 'PENDENTE' : 'RECONHECIDO'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="ff-waiter-call-actions">
        {isPending && (
          <button
            className="btn btn-sm btn-outline-warning ff-waiter-btn-action"
            style={{ fontSize: '0.8rem', minHeight: 36, fontWeight: 600, borderRadius: 8 }}
            onClick={() => onAck(call.id)}
          >
            <i className="bi bi-hand-index me-1" />Reconhecer
          </button>
        )}
        <button
          className="btn btn-sm btn-success ff-waiter-btn-action"
          style={{ fontSize: '0.8rem', minHeight: 36, fontWeight: 700, borderRadius: 8 }}
          onClick={() => onResolve(call.id)}
        >
          <i className="bi bi-check2 me-1" />Resolver
        </button>
        <button
          className="btn btn-sm btn-outline-secondary ms-auto ff-waiter-btn-action"
          style={{ fontSize: '0.8rem', minHeight: 36, borderRadius: 8 }}
          onClick={() => onViewTable(call.tableId)}
        >
          <i className="bi bi-arrow-right me-1" />Ver mesa
        </button>
      </div>
    </div>
  );
}
