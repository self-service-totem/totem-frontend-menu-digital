import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { waiterStaffService, type FloorTable } from '@/lib/services/waiterStaffService';
import { useNotify } from '@/lib/notifications';
import { getTableStatusUI } from '@/lib/utils/tableStatusUI';
import { useElapsed, elapsedMins, fmtElapsed, ageSeverity, SEVERITY_STYLE } from '@/lib/utils/useElapsed';
import type { WaiterCall, MockUser } from '@/lib/types';

// ─── Types & constants ─────────────────────────────────────────────────────────

type QuickFilter = 'all' | 'action' | 'calling' | 'ready' | 'payment' | 'empty';

const CALL_REASON_LABEL: Record<string, string> = {
  call: 'Chamar garçom',
  bill: 'Pedir a conta',
  order: 'Ver pedidos',
  other: 'Outro motivo',
};

const QUICK_FILTER_DEFS: { key: QuickFilter; label: string; icon: string; color?: string }[] = [
  { key: 'all',     label: 'Todas',           icon: 'bi-grid-3x3-gap'         },
  { key: 'action',  label: 'Ação requerida',  icon: 'bi-lightning-charge-fill', color: '#b45309' },
  { key: 'calling', label: 'Chamando',         icon: 'bi-megaphone-fill',        color: '#dc2626' },
  { key: 'ready',   label: 'Pronto p/ servir', icon: 'bi-check2-circle',         color: '#059669' },
  { key: 'payment', label: 'Aguard. pgto',     icon: 'bi-credit-card-2-front',   color: '#7c3aed' },
  { key: 'empty',   label: 'Vazias',           icon: 'bi-circle',                color: '#9ca3af' },
];

// ─── Utils ──────────────────────────────────────────────────────────────────────

function formatBRL(v: number) {
  if (!v) return null;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

function alertPriority(t: FloorTable): number {
  if (t.pendingCallCount > 0) return 3;
  if (t.hasReadyOrders || t.status === 'READY_TO_SERVE') return 2;
  if (t.status === 'WAITING_FOR_PAYMENT') return 1;
  return 0;
}

function quickFilterCount(key: QuickFilter, tables: FloorTable[]): number {
  switch (key) {
    case 'all':     return tables.length;
    case 'action':  return tables.filter((t) => alertPriority(t) > 0).length;
    case 'calling': return tables.filter((t) => t.pendingCallCount > 0).length;
    case 'ready':   return tables.filter((t) => t.hasReadyOrders || t.status === 'READY_TO_SERVE').length;
    case 'payment': return tables.filter((t) => t.status === 'WAITING_FOR_PAYMENT').length;
    case 'empty':   return tables.filter((t) => t.status === 'EMPTY' || t.status === 'CLOSED').length;
  }
}

// ─── Table card ─────────────────────────────────────────────────────────────────

interface TableCardProps {
  table: FloorTable;
  onRequestBill: (t: FloorTable) => void;
  onOpen: (t: FloorTable) => void;
  onMarkServed: (t: FloorTable) => void;
  onClose: (t: FloorTable) => void;
  onReassign: (t: FloorTable) => void;
  onDetail: (t: FloorTable) => void;
}

function TableCard({ table, onRequestBill, onOpen, onMarkServed, onClose, onReassign, onDetail }: TableCardProps) {
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

  const badgeUI = hasCall ? callUI : ui;

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
      {/* Body */}
      <div style={{ padding: '13px 14px 10px' }}>
        {/* Table number + status badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 9 }}>
          <span style={{ fontWeight: 900, fontSize: '1.45rem', color: '#111827', letterSpacing: '-0.02em', lineHeight: 1 }}>
            Mesa {table.number}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: badgeUI.bgColor,
            color: badgeUI.color,
            border: `1px solid ${badgeUI.color}30`,
            borderRadius: 20, padding: '3px 10px',
            fontSize: '0.69rem', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap', marginLeft: 'auto',
          }}>
            <i className={`bi ${badgeUI.icon}`} style={{ fontSize: '0.69rem' }} />
            {badgeUI.label}
          </span>
        </div>

        {/* Urgency alert — waiter call */}
        {hasCall && (() => {
          const mins = table.oldestCallAt ? elapsedMins(table.oldestCallAt) : 0;
          const sev  = ageSeverity(mins, 3, 7);
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

        {/* Urgency alert — food ready */}
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
              {(table.guestCount ?? 0) > 0 && (
                <span><i className="bi bi-people me-1" />{table.guestCount} pax</span>
              )}
              {table.activeOrderCount > 0 && (
                <span><i className="bi bi-receipt me-1" />{table.activeOrderCount} pedido{table.activeOrderCount > 1 ? 's' : ''}</span>
              )}
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
        {/* Primary action — waiter call takes highest priority */}
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

// ─── Zone section ─────────────────────────────────────────────────────────────

interface ZoneSectionProps {
  zone: string;
  tables: FloorTable[];
  cardProps: Omit<TableCardProps, 'table'>;
}

function ZoneSection({ zone, tables, cardProps }: ZoneSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const alertCount  = tables.filter((t) => alertPriority(t) > 0).length;
  const waiterNames = [...new Set(tables.map((t) => t.assignedWaiterName).filter(Boolean))];

  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: collapsed ? 0 : 14, cursor: 'pointer', userSelect: 'none', padding: '0 2px' }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <i className={`bi bi-chevron-${collapsed ? 'right' : 'down'}`} style={{ color: '#d1d5db', fontSize: '0.7rem', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {zone}
        </span>
        <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
          · {tables.length} mesa{tables.length !== 1 ? 's' : ''}
        </span>
        {waiterNames.length > 0 && (
          <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>· {waiterNames.join(', ')}</span>
        )}
        {alertCount > 0 && (
          <span style={{ marginLeft: 4, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 20, padding: '2px 10px', fontSize: '0.68rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '0.62rem' }} />
            {alertCount} alerta{alertCount > 1 ? 's' : ''}
          </span>
        )}
        <div style={{ flex: 1, height: 1, background: '#f0f0f0', marginLeft: 4 }} />
      </div>

      {!collapsed && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {tables.map((t) => (
            <TableCard key={t.id} table={t} {...cardProps} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reassign waiter modal ─────────────────────────────────────────────────────

function ReassignModal({ table, waiters, onSave, onClose }: {
  table: FloorTable;
  waiters: MockUser[];
  onSave: (tableId: string, waiterName: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(table.assignedWaiterName ?? '');

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, padding: 28, width: 360, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>Reatribuir — Mesa {table.number}</h5>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 8 }}>Garçom responsável</label>
          <select className="form-select form-select-sm" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">— Sem atribuição —</option>
            {waiters.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary flex-1" style={{ fontWeight: 700, borderRadius: 8 }} onClick={() => onSave(table.id, selected)}>Salvar</button>
          <button className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Call card (calls tab) ─────────────────────────────────────────────────────

function CallCard({ call, onAck, onResolve, onViewTable }: {
  call: WaiterCall;
  onAck: (id: string) => void;
  onResolve: (id: string) => void;
  onViewTable: (tableId: string) => void;
}) {
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
        {/* Icon */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: isPending ? '#dc2626' : '#d97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 2,
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
      <div style={{ padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', background: '#fafafa' }}>
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export function WaiterTablesPage() {
  const [floorTables,     setFloorTables]     = useState<FloorTable[]>([]);
  const [calls,           setCalls]           = useState<WaiterCall[]>([]);
  const [waiters,         setWaiters]         = useState<MockUser[]>([]);
  const [activeTab,       setActiveTab]       = useState<'floor' | 'calls'>('floor');
  const [search,          setSearch]          = useState('');
  const [zoneFilter,      setZoneFilter]      = useState('all');
  const [waiterFilter,    setWaiterFilter]    = useState('all');
  const [quickFilter,     setQuickFilter]     = useState<QuickFilter>('all');
  const [reassignTarget,  setReassignTarget]  = useState<FloorTable | null>(null);
  const [showResolved,    setShowResolved]    = useState(false);
  const [muteAlerts,      setMuteAlerts]      = useState(false);
  const notify   = useNotify();
  const navigate = useNavigate();
  useElapsed(30_000);

  async function load() {
    const [ft, c] = await Promise.all([
      waiterStaffService.getFloorState(),
      waiterStaffService.listCalls(),
    ]);
    setFloorTables(ft);
    setCalls(c);
  }

  useEffect(() => {
    load();
    waiterStaffService.listWaiters().then(setWaiters);
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  // Derived
  const zones        = [...new Set(floorTables.map((t) => t.zoneName).filter(Boolean) as string[])];
  const waiterNames  = [...new Set(floorTables.map((t) => t.assignedWaiterName).filter(Boolean) as string[])].sort();
  const pendingCalls = calls.filter((c) => c.status === 'PENDING' || c.status === 'ACKNOWLEDGED');
  const activeCalls  = pendingCalls;
  const resolvedCalls = calls.filter((c) => c.status === 'RESOLVED');
  const totalAlerts  = floorTables.filter((t) => alertPriority(t) > 0).length;

  // Filtered tables
  const filtered = floorTables.filter((t) => {
    if (search && !t.number.includes(search)) return false;
    if (zoneFilter !== 'all' && t.zoneName !== zoneFilter) return false;
    if (waiterFilter !== 'all' && t.assignedWaiterName !== waiterFilter) return false;
    switch (quickFilter) {
      case 'action':  if (alertPriority(t) === 0) return false; break;
      case 'calling': if (t.pendingCallCount === 0) return false; break;
      case 'ready':   if (!t.hasReadyOrders && t.status !== 'READY_TO_SERVE') return false; break;
      case 'payment': if (t.status !== 'WAITING_FOR_PAYMENT') return false; break;
      case 'empty':   if (t.status !== 'EMPTY' && t.status !== 'CLOSED') return false; break;
    }
    return true;
  });

  // Group by zone
  const tablesByZone = new Map<string, FloorTable[]>();
  const ungrouped: FloorTable[] = [];
  for (const t of filtered) {
    if (!t.zoneName) { ungrouped.push(t); continue; }
    if (!tablesByZone.has(t.zoneName)) tablesByZone.set(t.zoneName, []);
    tablesByZone.get(t.zoneName)!.push(t);
  }

  function sortedTables(tables: FloorTable[]) {
    return [...tables].sort(
      (a, b) => alertPriority(b) - alertPriority(a) || a.number.localeCompare(b.number, undefined, { numeric: true }),
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────────

  async function handleRequestBill(t: FloorTable) {
    await waiterStaffService.requestBill(t.id);
    notify(`Mesa ${t.number} — conta solicitada ao caixa`);
    load();
  }

  async function handleOpen(t: FloorTable) {
    await waiterStaffService.openTable(t.id);
    notify(`Mesa ${t.number} aberta`);
    load();
  }

  async function handleMarkServed(t: FloorTable) {
    await waiterStaffService.markServed(t.id);
    notify(`Mesa ${t.number} — pedido entregue`);
    load();
  }

  async function handleClose(t: FloorTable) {
    await waiterStaffService.closeTable(t.id);
    notify(`Mesa ${t.number} fechada`);
    load();
  }

  async function handleAssignWaiter(tableId: string, waiterName: string) {
    await waiterStaffService.assignWaiter(tableId, waiterName);
    notify(waiterName ? `Garçom ${waiterName} atribuído` : 'Atribuição removida');
    setReassignTarget(null);
    load();
  }

  async function handleAck(id: string) {
    await waiterStaffService.acknowledgeCall(id);
    notify('Chamado reconhecido', 'info');
    load();
  }

  async function handleResolve(id: string) {
    await waiterStaffService.resolveCall(id);
    notify('Chamado resolvido');
    load();
  }

  const cardProps: Omit<TableCardProps, 'table'> = {
    onRequestBill: handleRequestBill,
    onOpen:        handleOpen,
    onMarkServed:  handleMarkServed,
    onClose:       handleClose,
    onReassign:    setReassignTarget,
    onDetail:      (t) => navigate(`/waiter-staff/tables/${t.id}`),
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="ff-area-layout">
      {/* Sidebar */}
      <aside className="ff-area-sidebar ff-area-sidebar--mobile-bottom">
        <div className="ff-area-sidebar-logo">
          <i className="bi bi-person-badge me-2" />Garçom
        </div>
        <nav className="ff-area-sidebar-nav">
          <button className={`ff-nav-item${activeTab === 'floor' ? ' active' : ''}`} onClick={() => setActiveTab('floor')}>
            <i className="bi bi-grid-3x3-gap" />Mesas
            {totalAlerts > 0 && <span className="ff-nav-badge ff-nav-badge--warn">{totalAlerts}</span>}
          </button>
          <button className={`ff-nav-item${activeTab === 'calls' ? ' active' : ''}`} onClick={() => setActiveTab('calls')}>
            <i className="bi bi-bell" />Chamados
            {pendingCalls.length > 0 && <span className="ff-nav-badge ff-nav-badge--danger">{pendingCalls.length}</span>}
          </button>
          <button className="ff-nav-item" onClick={() => navigate('/')}>
            <i className="bi bi-house" />Hub
          </button>
        </nav>
      </aside>

      <div className="ff-area-main ff-area-main--mobile-bottom-pad" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Topbar */}
        <div className="ff-area-topbar">
          <span className="ff-area-topbar-title">
            {activeTab === 'floor' ? 'Mesas' : 'Chamados de garçom'}
          </span>
          <div className="ms-auto d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              style={{ borderRadius: 8, padding: '5px 10px' }}
              title={muteAlerts ? 'Alertas silenciados' : 'Silenciar alertas'}
              onClick={() => setMuteAlerts((v) => !v)}
            >
              <i className={`bi bi-bell${muteAlerts ? '-slash' : ''}`} style={{ color: muteAlerts ? '#9ca3af' : undefined }} />
            </button>
            <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 8, padding: '5px 10px' }} onClick={load} title="Atualizar">
              <i className="bi bi-arrow-clockwise" />
            </button>
          </div>
        </div>

        {activeTab === 'floor' && (
          <>
            {/* Filter bar — status chips + search/zone/waiter */}
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #e5e7eb', background: '#fafafa', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Status filter chips — also serve as operational summary */}
              <div style={{ display: 'flex', gap: 5, overflowX: 'auto', alignItems: 'center', paddingBottom: 2 }}>
                {QUICK_FILTER_DEFS.map((f) => {
                  const count    = quickFilterCount(f.key, floorTables);
                  const isActive = quickFilter === f.key;
                  const color    = f.color ?? '#1d4ed8';
                  return (
                    <button
                      key={f.key}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: isActive ? color : '#f3f4f6',
                        color: isActive ? '#fff' : (f.color ?? '#374151'),
                        border: `1.5px solid ${isActive ? color : 'transparent'}`,
                        borderRadius: 20, padding: '4px 12px',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
                        flexShrink: 0,
                      }}
                      onClick={() => setQuickFilter(f.key)}
                    >
                      <i className={`bi ${f.icon}`} style={{ fontSize: '0.72rem' }} />
                      {f.label}
                      <span style={{ background: isActive ? 'rgba(255,255,255,.25)' : `${color}20`, color: isActive ? '#fff' : color, borderRadius: 10, padding: '0 6px', fontSize: '0.7rem', fontWeight: 800, minWidth: 18, textAlign: 'center' }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Secondary: search + zone + waiter */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.8rem', pointerEvents: 'none' }} />
                  <input
                    className="form-control form-control-sm"
                    style={{ paddingLeft: 28, width: 130, borderRadius: 8 }}
                    placeholder="Nº mesa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {zones.map((z) => (
                  <button
                    key={z}
                    style={{
                      background: zoneFilter === z ? '#1d4ed8' : '#f3f4f6',
                      color: zoneFilter === z ? '#fff' : '#374151',
                      border: 'none', borderRadius: 8, padding: '5px 12px',
                      fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
                    }}
                    onClick={() => setZoneFilter(zoneFilter === z ? 'all' : z)}
                  >
                    {z}
                  </button>
                ))}

                {waiterNames.length > 0 && (
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 170, borderRadius: 8 }}
                    value={waiterFilter}
                    onChange={(e) => setWaiterFilter(e.target.value)}
                  >
                    <option value="all">Todos os garçons</option>
                    {waiterNames.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* Floor content */}
            <div className="ff-area-content" style={{ overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div className="ff-empty-state">
                  <i className="bi bi-grid ff-empty-state-icon" />
                  <span className="ff-empty-state-title">Nenhuma mesa encontrada</span>
                  <span className="ff-empty-state-desc">Tente ajustar os filtros para ver mais mesas.</span>
                </div>
              ) : (
                <>
                  {[...tablesByZone.entries()].map(([zone, tables]) => (
                    <ZoneSection key={zone} zone={zone} tables={sortedTables(tables)} cardProps={cardProps} />
                  ))}
                  {ungrouped.length > 0 && (
                    <ZoneSection zone="Sem zona" tables={sortedTables(ungrouped)} cardProps={cardProps} />
                  )}
                </>
              )}
            </div>
          </>
        )}

        {activeTab === 'calls' && (
          <div className="ff-area-content" style={{ overflowY: 'auto' }}>
            <div style={{ maxWidth: 680 }}>
              {/* Pending / acknowledged calls */}
              {activeCalls.length === 0 && (
                <div className="ff-empty-state" style={{ paddingTop: 48 }}>
                  <i className="bi bi-bell-slash ff-empty-state-icon" />
                  <span className="ff-empty-state-title">Nenhum chamado pendente</span>
                  <span className="ff-empty-state-desc">Todos os chamados estão resolvidos.</span>
                </div>
              )}
              {activeCalls.map((call) => (
                <CallCard
                  key={call.id}
                  call={call}
                  onAck={handleAck}
                  onResolve={handleResolve}
                  onViewTable={(id) => navigate(`/waiter-staff/tables/${id}`)}
                />
              ))}

              {/* Resolved calls toggle */}
              {resolvedCalls.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <button
                    style={{ background: 'none', border: 'none', fontSize: '0.82rem', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}
                    onClick={() => setShowResolved((v) => !v)}
                  >
                    <i className={`bi bi-chevron-${showResolved ? 'up' : 'down'}`} style={{ fontSize: '0.72rem' }} />
                    {showResolved ? 'Ocultar' : 'Ver'} {resolvedCalls.length} chamado{resolvedCalls.length > 1 ? 's' : ''} resolvido{resolvedCalls.length > 1 ? 's' : ''}
                  </button>
                  {showResolved && (
                    <div style={{ marginTop: 10, opacity: 0.55 }}>
                      {resolvedCalls.map((call) => (
                        <div key={call.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderLeft: '4px solid #e5e7eb', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <i className="bi bi-check-circle-fill" style={{ color: '#6b7280' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Mesa {call.tableNumber}</span>
                          {call.reason && <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{CALL_REASON_LABEL[call.reason] ?? call.reason}</span>}
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#9ca3af' }}>{fmtElapsed(elapsedMins(call.updatedAt))} atrás</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reassign modal */}
      {reassignTarget && (
        <ReassignModal
          table={reassignTarget}
          waiters={waiters}
          onSave={handleAssignWaiter}
          onClose={() => setReassignTarget(null)}
        />
      )}
    </div>
  );
}
