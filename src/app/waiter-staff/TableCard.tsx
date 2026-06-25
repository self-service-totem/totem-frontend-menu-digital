import { useState } from 'react';
import type { FloorTable } from '@/lib/services/waiterStaffService';
import { getTableStatusUI } from '@/lib/utils/tableStatusUI';
import { elapsedMins, fmtElapsed, ageSeverity, SEVERITY_STYLE } from '@/lib/utils/useElapsed';
import { formatCurrency as formatBRL } from '@/utils/format';
import { initials } from './waiterUtils';

export interface TableCardProps {
  table: FloorTable;
  onRequestBill: (t: FloorTable) => void;
  onOpen: (t: FloorTable) => void;
  onMarkServed: (t: FloorTable) => void;
  onClose: (t: FloorTable) => void;
  onReassign: (t: FloorTable) => void;
  onDetail: (t: FloorTable) => void;
}

export function TableCard({ table, onRequestBill, onOpen, onMarkServed, onClose, onReassign, onDetail }: TableCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ui      = getTableStatusUI(table.status);
  const callUI  = getTableStatusUI('WAITING_FOR_WAITER');
  const isEmpty = table.status === 'EMPTY' || table.status === 'CLOSED';
  const hasCall = table.pendingCallCount > 0;
  const hasReady = table.hasReadyOrders || table.status === 'READY_TO_SERVE';

  const accentColor = hasCall
    ? '#dc2626'
    : hasReady
    ? '#059669'
    : table.status === 'WAITING_FOR_PAYMENT'
    ? '#7c3aed'
    : '#e5e7eb';

  const badgeUI    = hasCall ? callUI : ui;
  const borderColor = hasCall ? '#fecaca' : hasReady ? '#bbf7d0' : table.status === 'WAITING_FOR_PAYMENT' ? '#ddd6fe' : '#e5e7eb';

  return (
    <div
      className="ff-waiter-table-card"
      style={{
        borderRadius: 14,
        border: `1.5px solid ${borderColor}`,
        boxShadow: hasCall ? '0 0 0 3px #dc262618, 0 2px 8px rgba(0,0,0,.06)' : '0 1px 4px rgba(0,0,0,.05)',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        borderLeft: `4px solid ${accentColor}`,
      }}
      onClick={() => onDetail(table)}
    >
      <div style={{ padding: '13px 14px 10px' }}>
        {/* Number + status badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 9 }}>
          <span style={{ fontWeight: 900, fontSize: '1.45rem', color: '#111827', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Mesa {table.number}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: badgeUI.bgColor, color: badgeUI.color,
            border: `1px solid ${badgeUI.color}30`,
            borderRadius: 20, padding: '3px 10px',
            fontSize: '0.69rem', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap', marginLeft: 'auto',
          }}>
            <i className={`bi ${badgeUI.icon}`} style={{ fontSize: '0.69rem' }} />
            {badgeUI.label}
          </span>
        </div>

        {/* Urgency: waiter call */}
        {hasCall && (() => {
          const mins   = table.oldestCallAt ? elapsedMins(table.oldestCallAt) : 0;
          const sev    = ageSeverity(mins, 3, 7);
          const timerBg = sev === 'critical' ? '#dc2626' : sev === 'warn' ? '#d97706' : '#059669';
          return (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
              <i className="bi bi-megaphone-fill" style={{ color: '#dc2626', fontSize: '0.75rem', flexShrink: 0 }} />
              <span style={{ fontSize: '0.79rem', fontWeight: 700, color: '#dc2626', flex: 1 }}>
                {table.pendingCallCount > 1 ? `${table.pendingCallCount}× chamados` : 'Chamando garçom'}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff', background: timerBg, borderRadius: 10, padding: '1px 8px' }}>
                {fmtElapsed(mins)}
              </span>
            </div>
          );
        })()}

        {/* Urgency: food ready */}
        {!hasCall && hasReady && (() => {
          const mins = table.oldestReadyOrderAt ? elapsedMins(table.oldestReadyOrderAt) : 0;
          const sev  = ageSeverity(mins, 5, 12);
          const s    = SEVERITY_STYLE[sev];
          return (
            <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
              <i className="bi bi-check-circle-fill" style={{ color: s.color, fontSize: '0.75rem', flexShrink: 0 }} />
              <span style={{ fontSize: '0.79rem', fontWeight: 700, color: s.color, flex: 1 }}>Pronto para servir</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: s.color, background: s.border, borderRadius: 10, padding: '1px 8px' }}>
                {fmtElapsed(mins)}
              </span>
            </div>
          );
        })()}

        {/* Waiter */}
        {table.assignedWaiterName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ background: '#e0e7ff', color: '#4338ca', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 800, flexShrink: 0 }}>
              {initials(table.assignedWaiterName)}
            </span>
            <span style={{ fontSize: '0.79rem', color: '#6b7280' }}>{table.assignedWaiterName}</span>
          </div>
        )}

        {/* Session meta */}
        {!isEmpty ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(table.guestCount ?? 0) > 0 && <span><i className="bi bi-people me-1" />{table.guestCount} pax</span>}
              {table.activeOrderCount > 0 && <span><i className="bi bi-receipt me-1" />{table.activeOrderCount} pedido{table.activeOrderCount > 1 ? 's' : ''}</span>}
            </div>
            {table.unpaidAmount > 0 && (
              <span style={{ fontWeight: 800, fontSize: '0.97rem', color: '#111827', marginTop: 2 }}>
                {formatBRL(table.unpaidAmount)}
              </span>
            )}
            {table.customerNames.length > 0 && (
              <span style={{ fontSize: '0.72rem', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {table.customerNames.slice(0, 2).join(', ')}
                {table.customerNames.length > 2 && ` +${table.customerNames.length - 2}`}
              </span>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="bi bi-circle" style={{ color: '#d1d5db', fontSize: '0.7rem' }} />
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Disponível</span>
          </div>
        )}
      </div>

      {/* Action row */}
      <div
        style={{ borderTop: '1px solid #f3f4f6', padding: '8px 10px', display: 'flex', gap: 6, alignItems: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {hasCall && (
          <button
            className="btn btn-sm flex-1 ff-waiter-btn-action"
            style={{ background: '#dc2626', color: '#fff', border: 'none', fontSize: '0.8rem', fontWeight: 700, minHeight: 36, borderRadius: 8 }}
            onClick={() => onDetail(table)}
          >
            <i className="bi bi-megaphone me-1" />Atender
          </button>
        )}
        {!hasCall && table.status === 'EMPTY' && (
          <button className="btn btn-sm btn-outline-primary flex-1 ff-waiter-btn-action" style={{ fontSize: '0.8rem', minHeight: 36, borderRadius: 8 }} onClick={() => onOpen(table)}>
            <i className="bi bi-unlock me-1" />Abrir
          </button>
        )}
        {!hasCall && (table.status === 'OCCUPIED' || table.status === 'ORDER_IN_PROGRESS') && (
          <button className="btn btn-sm btn-outline-primary flex-1 ff-waiter-btn-action" style={{ fontSize: '0.8rem', minHeight: 36, borderRadius: 8 }} onClick={() => onRequestBill(table)}>
            <i className="bi bi-receipt me-1" />Pedir conta
          </button>
        )}
        {!hasCall && table.status === 'WAITING_FOR_KITCHEN' && !hasReady && (
          <button className="btn btn-sm btn-outline-secondary flex-1 ff-waiter-btn-action" style={{ fontSize: '0.8rem', minHeight: 36, borderRadius: 8 }} onClick={() => onDetail(table)}>
            <i className="bi bi-fire me-1" />Na cozinha
          </button>
        )}
        {!hasCall && hasReady && (
          <button
            className="btn btn-sm flex-1 ff-waiter-btn-action"
            style={{ background: '#059669', color: '#fff', border: 'none', fontSize: '0.8rem', fontWeight: 700, minHeight: 36, borderRadius: 8 }}
            onClick={() => onMarkServed(table)}
          >
            <i className="bi bi-check2 me-1" />Entregar
          </button>
        )}
        {!hasCall && !hasReady && table.status === 'WAITING_FOR_PAYMENT' && (
          <button
            className="btn btn-sm flex-1 ff-waiter-btn-action"
            style={{ background: '#7c3aed', color: '#fff', border: 'none', fontSize: '0.8rem', fontWeight: 700, minHeight: 36, borderRadius: 8 }}
            onClick={() => onDetail(table)}
          >
            <i className="bi bi-credit-card me-1" />Ver conta
          </button>
        )}
        {!hasCall && table.status === 'CLOSED' && (
          <button className="btn btn-sm btn-outline-secondary flex-1 ff-waiter-btn-action" style={{ fontSize: '0.8rem', minHeight: 36, borderRadius: 8 }} onClick={() => onClose(table)}>
            <i className="bi bi-door-open me-1" />Liberar
          </button>
        )}

        {/* ⋮ overflow menu */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-sm btn-outline-secondary"
            style={{ padding: '7px 9px', minHeight: 36, borderRadius: 8 }}
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          >
            <i className="bi bi-three-dots-vertical" />
          </button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(false)} />
              <div style={{ position: 'absolute', right: 0, bottom: '100%', marginBottom: 6, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,.12)', zIndex: 100, minWidth: 196, overflow: 'hidden' }}>
                {[
                  { icon: 'bi-eye',          label: 'Ver detalhes',      action: () => { onDetail(table);   setMenuOpen(false); } },
                  { icon: 'bi-person-badge', label: 'Reatribuir garçom', action: () => { onReassign(table); setMenuOpen(false); } },
                  ...(table.status !== 'EMPTY' && table.status !== 'CLOSED'
                    ? [{ icon: 'bi-x-circle', label: 'Fechar mesa', action: () => { onClose(table); setMenuOpen(false); } }]
                    : [{ icon: 'bi-unlock',   label: 'Abrir mesa',  action: () => { onOpen(table);  setMenuOpen(false); } }]),
                ].map((item, idx) => (
                  <button
                    key={item.label}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: '0.85rem', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: idx < 2 ? '1px solid #f3f4f6' : 'none' }}
                    onClick={item.action}
                  >
                    <i className={`bi ${item.icon}`} style={{ width: 16, fontSize: '0.9rem', color: item.label === 'Fechar mesa' ? '#dc2626' : '#6b7280' }} />
                    <span style={{ color: item.label === 'Fechar mesa' ? '#dc2626' : '#374151' }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
