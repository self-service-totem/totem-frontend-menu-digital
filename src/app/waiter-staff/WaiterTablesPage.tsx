import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { waiterStaffService, type FloorTable } from '@/lib/services/waiterStaffService';
import { useNotify } from '@/lib/notifications';
import { getTableStatusUI } from '@/lib/utils/tableStatusUI';
import { useElapsed, elapsedMins, fmtElapsed, ageSeverity, SEVERITY_STYLE } from '@/lib/utils/useElapsed';
import type { WaiterCall, MockUser } from '@/lib/types';

const CALL_REASON_LABEL: Record<string, string> = {
  call: 'Chamar garçom',
  bill: 'Pedir a conta',
  order: 'Ver pedidos',
  other: 'Outro motivo',
};

function formatBRL(v: number) {
  if (!v) return null;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function alertPriority(t: FloorTable): number {
  if (t.pendingCallCount > 0) return 3;
  if (t.hasReadyOrders) return 2;
  if (t.status === 'WAITING_FOR_PAYMENT') return 1;
  return 0;
}

// ─── Table card ───────────────────────────────────────────────────────────────

interface TableCardProps {
  table: FloorTable;
  onRequestBill: (t: FloorTable) => void;
  onOpen: (t: FloorTable) => void;
  onMarkServed: (t: FloorTable) => void;
  onClose: (t: FloorTable) => void;
  onReassign: (t: FloorTable) => void;
  onDetail: (t: FloorTable) => void;
}

function TableCard({
  table,
  onRequestBill,
  onOpen,
  onMarkServed,
  onClose,
  onReassign,
  onDetail,
}: TableCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ui = getTableStatusUI(table.status);
  const isEmpty = table.status === 'EMPTY' || table.status === 'CLOSED';
  const priority = alertPriority(table);

  // Derived attention state overrides ring + badge when a call is pending
  const hasCall = table.pendingCallCount > 0;
  const callUI = getTableStatusUI('WAITING_FOR_WAITER');

  // Card border ring: red for waiter calls (highest urgency), then green/purple for other high-priority states
  const ringColor = hasCall
    ? callUI.color   // #dc2626 red
    : table.hasReadyOrders || table.status === 'READY_TO_SERVE'
    ? '#059669'
    : table.status === 'WAITING_FOR_PAYMENT'
    ? '#7c3aed'
    : undefined;

  const isHighPriority = ui.priority === 'high' || hasCall;
  const stripHeight = isHighPriority ? 7 : 5;

  return (
    <div
      style={{
        borderRadius: 10,
        border: `1.5px solid ${ringColor ?? '#e5e7eb'}`,
        boxShadow: ringColor ? `0 0 0 3px ${ringColor}28` : undefined,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
      onClick={() => onDetail(table)}
    >
      {/* Status color strip — rounded top corners match card; no overflow:hidden needed */}
      <div style={{ height: stripHeight, background: hasCall ? callUI.color : ui.color, flexShrink: 0, borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />

      {/* Body */}
      <div style={{ padding: '12px 14px', flex: 1 }}>
        {/* Table number */}
        <div style={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1, marginBottom: 8, color: '#111827' }}>
          Mesa {table.number}
        </div>

        {/* Status badge — primary visual anchor */}
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              // High priority: solid fill. Medium/low: tinted background.
              background: ui.priority === 'high' ? ui.color : ui.bgColor,
              color: ui.priority === 'high' ? '#fff' : ui.color,
              border: ui.priority === 'high' ? 'none' : `1px solid ${ui.color}40`,
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            <i className={`bi ${ui.icon}`} style={{ fontSize: '0.85rem' }} />
            {ui.label}
          </span>

          {/* "Ação necessária" + status age */}
          {(ui.priority === 'high' || hasCall) && (
            <div style={{ marginTop: 4, fontSize: '0.72rem', color: hasCall ? '#dc2626' : '#b45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="bi bi-lightning-charge-fill" />
              Ação necessária
              {!hasCall && !table.hasReadyOrders && (() => {
                const mins = elapsedMins(table.updatedAt);
                const sev = ageSeverity(mins, 15, 30);
                const s = SEVERITY_STYLE[sev];
                return (
                  <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 8, padding: '0 6px', fontSize: '0.67rem', fontWeight: 800 }}>
                    {fmtElapsed(mins)}
                  </span>
                );
              })()}
            </div>
          )}
        </div>

        {/* Waiter initials + name */}
        {table.assignedWaiterName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <span
              style={{
                background: '#e0e7ff',
                color: '#4338ca',
                borderRadius: '50%',
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {initials(table.assignedWaiterName)}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>
              {table.assignedWaiterName}
            </span>
          </div>
        )}

        {/* Session info: guests, orders, amount, customer names */}
        {!isEmpty && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: '0.79rem', color: '#6b7280', display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
              {(table.guestCount ?? 0) > 0 && (
                <span><i className="bi bi-people me-1" />{table.guestCount} pax</span>
              )}
              {table.activeOrderCount > 0 && (
                <span><i className="bi bi-receipt me-1" />{table.activeOrderCount} pedido{table.activeOrderCount > 1 ? 's' : ''}</span>
              )}
            </div>
            {table.unpaidAmount > 0 && (
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827' }}>
                {formatBRL(table.unpaidAmount)}
              </div>
            )}
            {table.customerNames.length > 0 && (
              <div style={{ fontSize: '0.73rem', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {table.customerNames.slice(0, 2).join(', ')}
                {table.customerNames.length > 2 && ` +${table.customerNames.length - 2}`}
              </div>
            )}
          </div>
        )}

        {/* Alert chips — separate from the status badge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: (table.pendingCallCount > 0 || table.hasReadyOrders) ? 8 : 0 }}>
          {table.pendingCallCount > 0 && (() => {
            const mins = table.oldestCallAt ? elapsedMins(table.oldestCallAt) : 0;
            const sev = ageSeverity(mins, 3, 7);
            return (
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: callUI.color, color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'default' }}
                onClick={(e) => e.stopPropagation()}
              >
                <i className={`bi ${callUI.icon}`} style={{ fontSize: '0.82rem' }} />
                {table.pendingCallCount === 1 ? 'Chamando garçom' : `${table.pendingCallCount}× chamado`}
                {table.pendingCallCount > 1 && (
                  <span style={{ background: '#fff', color: callUI.color, borderRadius: 8, padding: '0 5px', fontSize: '0.68rem', fontWeight: 900 }}>URGENTE</span>
                )}
                {table.oldestCallAt && (
                  <span style={{ background: sev === 'critical' ? '#7f1d1d' : '#991b1b', color: '#fecaca', borderRadius: 8, padding: '0 6px', fontSize: '0.68rem', fontWeight: 800 }}>
                    {fmtElapsed(mins)}
                  </span>
                )}
              </span>
            );
          })()}
          {table.hasReadyOrders && !hasCall && (() => {
            const mins = table.oldestReadyOrderAt ? elapsedMins(table.oldestReadyOrderAt) : 0;
            const sev = ageSeverity(mins, 5, 12);
            const style = SEVERITY_STYLE[sev];
            return (
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: style.bg, color: style.color, border: `1px solid ${style.border}`, borderRadius: 6, padding: '4px 10px', fontSize: '0.78rem', fontWeight: 700, cursor: 'default' }}
                onClick={(e) => e.stopPropagation()}
              >
                <i className="bi bi-check-circle-fill" style={{ fontSize: '0.82rem' }} />
                Pronto para servir
                {table.oldestReadyOrderAt && (
                  <span style={{ background: style.border, color: style.color, borderRadius: 8, padding: '0 6px', fontSize: '0.68rem', fontWeight: 800 }}>
                    {fmtElapsed(mins)}
                  </span>
                )}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Action row */}
      <div
        style={{
          borderTop: '1px solid #f3f4f6',
          padding: '8px 10px',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Primary action */}
        {table.status === 'EMPTY' && (
          <button className="btn btn-sm btn-outline-primary flex-1" style={{ fontSize: '0.78rem' }} onClick={() => onOpen(table)}>
            <i className="bi bi-unlock me-1" />Abrir
          </button>
        )}
        {(table.status === 'OCCUPIED' || table.status === 'ORDER_IN_PROGRESS') && (
          <button className="btn btn-sm btn-outline-primary flex-1" style={{ fontSize: '0.78rem' }} onClick={() => onRequestBill(table)}>
            <i className="bi bi-receipt me-1" />Pedir conta
          </button>
        )}
        {table.status === 'WAITING_FOR_KITCHEN' && (
          <button className="btn btn-sm btn-outline-secondary flex-1" style={{ fontSize: '0.78rem' }} onClick={() => onDetail(table)}>
            <i className="bi bi-eye me-1" />Ver pedidos
          </button>
        )}
        {table.status === 'READY_TO_SERVE' && (
          <button className="btn btn-sm flex-1" style={{ fontSize: '0.78rem', background: '#059669', color: '#fff', border: 'none' }} onClick={() => onMarkServed(table)}>
            <i className="bi bi-check2 me-1" />Entregar
          </button>
        )}
        {table.status === 'WAITING_FOR_PAYMENT' && (
          <button className="btn btn-sm btn-outline-primary flex-1" style={{ fontSize: '0.78rem' }} onClick={() => onDetail(table)}>
            <i className="bi bi-eye me-1" />Ver conta
          </button>
        )}
        {table.status === 'CLOSED' && (
          <button className="btn btn-sm btn-outline-secondary flex-1" style={{ fontSize: '0.78rem' }} onClick={() => onClose(table)}>
            <i className="bi bi-door-open me-1" />Liberar
          </button>
        )}

        {/* Overflow menu */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-sm btn-outline-secondary"
            style={{ padding: '3px 7px', fontSize: '0.78rem' }}
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          >
            <i className="bi bi-three-dots-vertical" />
          </button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(false)} />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: '100%',
                  marginBottom: 4,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,.1)',
                  zIndex: 100,
                  minWidth: 180,
                  overflow: 'hidden',
                }}
              >
                {[
                  { icon: 'bi-eye', label: 'Ver detalhes', action: () => { onDetail(table); setMenuOpen(false); } },
                  { icon: 'bi-person-badge', label: 'Reatribuir garçom', action: () => { onReassign(table); setMenuOpen(false); } },
                  ...(table.status !== 'EMPTY' && table.status !== 'CLOSED'
                    ? [{ icon: 'bi-x-circle text-danger', label: 'Fechar mesa', action: () => { onClose(table); setMenuOpen(false); } }]
                    : [{ icon: 'bi-unlock', label: 'Abrir mesa', action: () => { onOpen(table); setMenuOpen(false); } }]),
                ].map((item) => (
                  <button
                    key={item.label}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: '0.84rem', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={item.action}
                  >
                    <i className={`bi ${item.icon}`} />
                    {item.label}
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
  const alertCount = tables.filter((t) => alertPriority(t) > 0).length;
  const waiterNames = [...new Set(tables.map((t) => t.assignedWaiterName).filter(Boolean))];

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Zone header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <i
          className={`bi bi-chevron-${collapsed ? 'right' : 'down'}`}
          style={{ color: '#9ca3af', fontSize: '0.75rem' }}
        />
        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {zone}
        </span>
        <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>({tables.length})</span>
        {waiterNames.length > 0 && (
          <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
            · {waiterNames.join(', ')}
          </span>
        )}
        {alertCount > 0 && (
          <span
            style={{
              marginLeft: 'auto',
              background: '#fef3c7',
              color: '#92400e',
              borderRadius: 10,
              padding: '2px 8px',
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            <i className="bi bi-exclamation-triangle me-1" />
            {alertCount} alerta{alertCount > 1 ? 's' : ''}
          </span>
        )}
        <div style={{ flex: collapsed || alertCount > 0 ? 0 : 1, height: 1, background: '#e5e7eb', marginLeft: alertCount > 0 ? 0 : 'auto', minWidth: 20 }} />
      </div>

      {!collapsed && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          {tables.map((t) => (
            <TableCard key={t.id} table={t} {...cardProps} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reassign waiter modal ────────────────────────────────────────────────────

interface ReassignModalProps {
  table: FloorTable;
  waiters: MockUser[];
  onSave: (tableId: string, waiterName: string) => void;
  onClose: () => void;
}

function ReassignModal({ table, waiters, onSave, onClose }: ReassignModalProps) {
  const [selected, setSelected] = useState(table.assignedWaiterName ?? '');

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 14, padding: 24, width: 340, display: 'flex', flexDirection: 'column', gap: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5 style={{ margin: 0 }}>Reatribuir — Mesa {table.number}</h5>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Garçom responsável</label>
          <select className="form-select form-select-sm" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">— Sem atribuição —</option>
            {waiters.map((w) => (
              <option key={w.id} value={w.name}>{w.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary flex-1" onClick={() => onSave(table.id, selected)}>
            Salvar
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function WaiterTablesPage() {
  const [floorTables, setFloorTables] = useState<FloorTable[]>([]);
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [waiters, setWaiters] = useState<MockUser[]>([]);
  const [activeTab, setActiveTab] = useState<'floor' | 'calls'>('floor');
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [waiterFilter, setWaiterFilter] = useState('all');
  const [alertOnly, setAlertOnly] = useState(false);
  const [reassignTarget, setReassignTarget] = useState<FloorTable | null>(null);
  const notify = useNotify();
  const navigate = useNavigate();
  useElapsed(30_000); // re-render every 30 s to keep age badges current

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

  // Unique zones in display order
  const zones = [...new Set(floorTables.map((t) => t.zoneName).filter(Boolean) as string[])];

  // Filtered tables
  const filtered = floorTables.filter((t) => {
    if (search && !t.number.includes(search)) return false;
    if (zoneFilter !== 'all' && t.zoneName !== zoneFilter) return false;
    if (waiterFilter !== 'all' && t.assignedWaiterName !== waiterFilter) return false;
    if (alertOnly && alertPriority(t) === 0) return false;
    return true;
  });

  // Group by zone (preserving order)
  const tablesByZone = new Map<string, FloorTable[]>();
  const ungrouped: FloorTable[] = [];
  for (const t of filtered) {
    if (!t.zoneName) {
      ungrouped.push(t);
    } else {
      if (!tablesByZone.has(t.zoneName)) tablesByZone.set(t.zoneName, []);
      tablesByZone.get(t.zoneName)!.push(t);
    }
  }

  function sortedTables(tables: FloorTable[]) {
    return [...tables].sort(
      (a, b) =>
        alertPriority(b) - alertPriority(a) ||
        a.number.localeCompare(b.number, undefined, { numeric: true }),
    );
  }

  const pendingCalls = calls.filter((c) => c.status === 'PENDING' || c.status === 'ACKNOWLEDGED');
  const totalAlerts = floorTables.filter((t) => alertPriority(t) > 0).length;

  // Waiter names derived from floor tables
  const waiterNames = [...new Set(floorTables.map((t) => t.assignedWaiterName).filter(Boolean) as string[])].sort();

  // ── Handlers ────────────────────────────────────────────────────────────────

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
    onOpen: handleOpen,
    onMarkServed: handleMarkServed,
    onClose: handleClose,
    onReassign: setReassignTarget,
    onDetail: (t) => navigate(`/waiter-staff/tables/${t.id}`),
  };

  return (
    <div className="ff-area-layout">
      {/* Sidebar */}
      <aside className="ff-area-sidebar">
        <div className="ff-area-sidebar-logo">
          <i className="bi bi-person-badge me-2" />Garçom
        </div>
        <nav className="ff-area-sidebar-nav">
          <button
            className={`ff-nav-item${activeTab === 'floor' ? ' active' : ''}`}
            onClick={() => setActiveTab('floor')}
          >
            <i className="bi bi-grid-3x3-gap" />Mesas
            {totalAlerts > 0 && (
              <span style={{ marginLeft: 'auto', background: '#f59e0b', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>
                {totalAlerts}
              </span>
            )}
          </button>
          <button
            className={`ff-nav-item${activeTab === 'calls' ? ' active' : ''}`}
            onClick={() => setActiveTab('calls')}
          >
            <i className="bi bi-bell" />Chamados
            {pendingCalls.length > 0 && (
              <span className="badge bg-danger ms-auto">{pendingCalls.length}</span>
            )}
          </button>
          <button className="ff-nav-item" onClick={() => navigate('/')}>
            <i className="bi bi-house" />Hub
          </button>
        </nav>
      </aside>

      <div className="ff-area-main" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Topbar */}
        <div className="ff-area-topbar">
          <span className="ff-area-topbar-title">
            {activeTab === 'floor' ? 'Mesas' : 'Chamados de garçom'}
          </span>
          <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={load}>
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>

        {activeTab === 'floor' && (
          <>
            {/* Filter bar */}
            <div
              style={{
                padding: '10px 20px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
                background: '#fafafa',
              }}
            >
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.8rem' }} />
                <input
                  className="form-control form-control-sm"
                  style={{ paddingLeft: 26, width: 130 }}
                  placeholder="Mesa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Zone chips */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {['all', ...zones].map((z) => (
                  <button
                    key={z}
                    style={{
                      background: zoneFilter === z ? '#1d4ed8' : '#f3f4f6',
                      color: zoneFilter === z ? '#fff' : '#374151',
                      border: 'none',
                      borderRadius: 16,
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => setZoneFilter(z)}
                  >
                    {z === 'all' ? 'Todas as zonas' : z}
                  </button>
                ))}
              </div>

              {/* Waiter filter */}
              {waiterNames.length > 0 && (
                <select
                  className="form-select form-select-sm"
                  style={{ width: 150 }}
                  value={waiterFilter}
                  onChange={(e) => setWaiterFilter(e.target.value)}
                >
                  <option value="all">Todos os garçons</option>
                  {waiterNames.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              )}

              {/* Alert toggle */}
              <button
                style={{
                  background: alertOnly ? '#fef3c7' : '#f3f4f6',
                  color: alertOnly ? '#92400e' : '#374151',
                  border: alertOnly ? '1.5px solid #f59e0b' : '1.5px solid transparent',
                  borderRadius: 16,
                  padding: '4px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  marginLeft: 'auto',
                }}
                onClick={() => setAlertOnly((v) => !v)}
              >
                <i className="bi bi-exclamation-triangle" />
                Alertas
                {totalAlerts > 0 && (
                  <span style={{ background: '#f59e0b', color: '#fff', borderRadius: 8, padding: '0 5px', fontSize: '0.7rem', fontWeight: 800 }}>
                    {totalAlerts}
                  </span>
                )}
              </button>
            </div>

            {/* Floor content */}
            <div className="ff-area-content" style={{ overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div className="text-muted text-center py-8">
                  <i className="bi bi-grid" style={{ fontSize: 40, display: 'block', marginBottom: 8 }} />
                  Nenhuma mesa encontrada.
                </div>
              ) : (
                <>
                  {[...tablesByZone.entries()].map(([zone, tables]) => (
                    <ZoneSection
                      key={zone}
                      zone={zone}
                      tables={sortedTables(tables)}
                      cardProps={cardProps}
                    />
                  ))}
                  {ungrouped.length > 0 && (
                    <ZoneSection
                      zone="Sem zona"
                      tables={sortedTables(ungrouped)}
                      cardProps={cardProps}
                    />
                  )}
                </>
              )}
            </div>
          </>
        )}

        {activeTab === 'calls' && (
          <div className="ff-area-content" style={{ overflowY: 'auto' }}>
            <div style={{ maxWidth: 680 }}>
              {calls.length === 0 && (
                <div className="text-center text-muted py-4">Nenhum chamado registrado</div>
              )}
              {calls.map((call) => {
                const isPending = call.status === 'PENDING';
                const isAck = call.status === 'ACKNOWLEDGED';
                const isActive = isPending || isAck;
                return (
                  <div
                    key={call.id}
                    className="ff-data-card"
                    style={{
                      opacity: isActive ? 1 : 0.5,
                      marginBottom: 10,
                      borderLeft: isActive ? `4px solid ${isPending ? '#dc2626' : '#d97706'}` : '4px solid #e5e7eb',
                    }}
                  >
                    <div className="ff-data-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          style={{ background: 'none', border: 'none', padding: 0, fontWeight: 700, cursor: 'pointer', color: '#0284c7', fontSize: '0.9rem' }}
                          onClick={() => navigate(`/waiter-staff/tables/${call.tableId}`)}
                        >
                          Mesa {call.tableNumber}
                        </button>
                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{call.customerName || '—'}</span>
                        {call.reason && (
                          <span style={{ fontSize: '0.78rem', color: '#374151', background: '#f3f4f6', borderRadius: 4, padding: '1px 6px' }}>
                            {CALL_REASON_LABEL[call.reason] ?? call.reason}
                          </span>
                        )}
                      </div>
                      <span
                        className={`badge ${isPending ? 'bg-danger' : isAck ? 'bg-warning text-dark' : 'bg-secondary'}`}
                      >
                        {isPending ? 'Pendente' : isAck ? 'Reconhecido' : 'Resolvido'}
                      </span>
                    </div>
                    {isActive && (
                      <div style={{ padding: '10px 20px', display: 'flex', gap: 8 }}>
                        {isPending && (
                          <button className="btn btn-sm btn-outline-warning" onClick={() => handleAck(call.id)}>
                            Reconhecer
                          </button>
                        )}
                        <button className="btn btn-sm btn-success" onClick={() => handleResolve(call.id)}>
                          Resolver
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary ms-auto"
                          onClick={() => navigate(`/waiter-staff/tables/${call.tableId}`)}
                        >
                          <i className="bi bi-arrow-right me-1" />Ver mesa
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
