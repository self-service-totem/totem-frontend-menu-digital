import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { waiterStaffService, type FloorTable } from '@/lib/services/waiterStaffService';
import { useNotify } from '@/lib/notifications';
import { useElapsed } from '@/lib/utils/useElapsed';
import type { WaiterCall, MockUser } from '@/lib/types';
import { alertPriority, type QuickFilter } from './waiterUtils';

export function useWaiterTables() {
  const location = useLocation();
  const notify   = useNotify();
  useElapsed(30_000);

  const [floorTables,    setFloorTables]    = useState<FloorTable[]>([]);
  const [calls,          setCalls]          = useState<WaiterCall[]>([]);
  const [waiters,        setWaiters]        = useState<MockUser[]>([]);
  const [activeTab,      setActiveTab]      = useState<'floor' | 'calls'>(() => location.pathname.includes('/calls') ? 'calls' : 'floor');
  const [search,         setSearch]         = useState('');
  const [zoneFilter,     setZoneFilter]     = useState('all');
  const [waiterFilter,   setWaiterFilter]   = useState('all');
  const [quickFilter,    setQuickFilter]    = useState<QuickFilter>('all');
  const [reassignTarget, setReassignTarget] = useState<FloorTable | null>(null);
  const [showResolved,   setShowResolved]   = useState(false);
  const [muteAlerts,     setMuteAlerts]     = useState(false);

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

  // ── Derived ────────────────────────────────────────────────────────────────

  const zones        = [...new Set(floorTables.map((t) => t.zoneName).filter(Boolean) as string[])];
  const waiterNames  = [...new Set(floorTables.map((t) => t.assignedWaiterName).filter(Boolean) as string[])].sort();
  const pendingCalls = calls.filter((c) => c.status === 'PENDING' || c.status === 'ACKNOWLEDGED');
  const activeCalls  = pendingCalls;
  const resolvedCalls = calls.filter((c) => c.status === 'RESOLVED');
  const totalAlerts  = floorTables.filter((t) => alertPriority(t) > 0).length;

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

  // ── Handlers ───────────────────────────────────────────────────────────────

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

  return {
    floorTables, calls, waiters,
    activeTab, setActiveTab,
    search, setSearch,
    zoneFilter, setZoneFilter,
    waiterFilter, setWaiterFilter,
    quickFilter, setQuickFilter,
    reassignTarget, setReassignTarget,
    showResolved, setShowResolved,
    muteAlerts, setMuteAlerts,
    zones, waiterNames, pendingCalls, activeCalls, resolvedCalls, totalAlerts,
    filtered, tablesByZone, ungrouped, sortedTables,
    load,
    handleRequestBill, handleOpen, handleMarkServed, handleClose,
    handleAssignWaiter, handleAck, handleResolve,
  };
}
