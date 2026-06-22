import { useEffect, useState } from 'react';
import { reservationService } from '@/lib/services/reservationService';
import { tableService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import { useLabels } from '@/i18n/I18nContext';
import type { Reservation, ReservationStatus, ReservationSettings, DbTable, WalkIn } from '@/lib/types';
import {
  STATUS_CONFIG, EMPTY_FORM,
  type Tab, type View, type DateScope,
} from './reservationsUtils';

export function useReservations() {
  const { t } = useLabels();
  const notify = useNotify();

  const todayStr = new Date().toISOString().slice(0, 10);

  const [tab, setTab]             = useState<Tab>('reservations');
  const [view, setView]           = useState<View>('agenda');
  const [dateScope, setDateScope] = useState<DateScope>('today');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [walkIns, setWalkIns]     = useState<WalkIn[]>([]);
  const [settings, setSettings]   = useState<ReservationSettings | null>(null);
  const [tables, setTables]       = useState<DbTable[]>([]);
  const [date, setDate]           = useState(todayStr);
  const [search, setSearch]       = useState('');
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | ''>('');
  const [showModal, setShowModal]           = useState(false);
  const [editTarget, setEditTarget]         = useState<Reservation | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [drawerOpen, setDrawerOpen]         = useState(false);

  async function loadReservations() {
    if (dateScope === 'all') {
      setReservations(await reservationService.listAll());
    } else {
      const d = dateScope === 'today' ? todayStr : date;
      setReservations(await reservationService.listForDate(d));
    }
  }
  async function loadWalkIns()  { setWalkIns(await reservationService.listWalkIns()); }
  async function loadSettings() { setSettings(await reservationService.getSettings()); }

  useEffect(() => {
    tableService.list().then((ts) => setTables(ts.filter((t) => t.active)));
    loadWalkIns();
    loadSettings();
  }, []);

  useEffect(() => { loadReservations(); }, [dateScope, date]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleCreate(form: typeof EMPTY_FORM) {
    const table = tables.find((tb) => tb.id === form.tableId);
    await reservationService.create({
      customerName: form.customerName, customerPhone: form.customerPhone,
      partySize: parseInt(form.partySize) || 2, date: form.date, time: form.time,
      notes: form.notes || undefined, tableId: form.tableId || undefined,
      tableNumber: table?.number, source: form.source,
      duration: parseInt(form.duration) || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
    });
    notify(t('res.notif.createdShort'), 'success');
    setShowModal(false);
    loadReservations();
  }

  async function handleEdit(form: typeof EMPTY_FORM) {
    if (!editTarget) return;
    const table = tables.find((tb) => tb.id === form.tableId);
    await reservationService.update(editTarget.id, {
      customerName: form.customerName, customerPhone: form.customerPhone,
      partySize: parseInt(form.partySize) || 2, date: form.date, time: form.time,
      notes: form.notes || undefined, tableId: form.tableId || undefined,
      tableNumber: table?.number, source: form.source,
      duration: parseInt(form.duration) || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
    });
    notify(t('res.notif.updated'), 'success');
    setEditTarget(null);
    loadReservations();
  }

  async function handleStatusChange(id: string, status: ReservationStatus) {
    await reservationService.updateStatus(id, status);
    notify(
      t('res.notif.status', { status: t(STATUS_CONFIG[status].labelKey) }),
      status === 'CANCELED' || status === 'NO_SHOW' ? 'danger' : 'success',
    );
    loadReservations();
  }

  async function handleWalkInSeat(id: string) {
    await reservationService.updateWalkInStatus(id, 'SEATED', { seatedAt: new Date().toISOString() });
    notify(t('res.notif.customerSeated'), 'success');
    loadWalkIns();
  }

  async function handleWalkInCancel(id: string) {
    await reservationService.updateWalkInStatus(id, 'CANCELED');
    notify(t('res.notif.removedFromQueue'));
    loadWalkIns();
  }

  async function handleAddWalkIn(data: { customerName: string; customerPhone: string; partySize: number; estimatedWaitMinutes: number }) {
    await reservationService.addWalkIn({
      customerName: data.customerName, customerPhone: data.customerPhone || undefined,
      partySize: data.partySize, estimatedWaitMinutes: data.estimatedWaitMinutes,
      arrivedAt: new Date().toISOString(),
    });
    notify(t('res.notif.addedToQueue'), 'success');
    setShowWalkInModal(false);
    loadWalkIns();
  }

  async function handleSaveSettings(data: Partial<ReservationSettings>) {
    const saved = await reservationService.saveSettings(data);
    setSettings(saved);
    notify(t('res.notif.settingsSaved'), 'success');
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const filtered = reservations.filter((r) => {
    const matchSearch = !search || r.customerName.toLowerCase().includes(search.toLowerCase()) || r.customerPhone.includes(search);
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const waitingCount = walkIns.filter((w) => w.status === 'WAITING').length;

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'reservations', label: t('res.title'),         icon: 'bi-calendar-check' },
    { id: 'walkin',       label: t('res.tab.queue'),     icon: 'bi-people',         badge: waitingCount || undefined },
    { id: 'occupancy',    label: t('res.tab.occupancy'), icon: 'bi-grid-1x2' },
    { id: 'settings',     label: t('res.tab.settings'),  icon: 'bi-gear' },
  ];

  const views: { id: View; label: string; icon: string }[] = [
    { id: 'agenda',   label: t('res.view.agenda'),  icon: 'bi-calendar3' },
    { id: 'table',    label: t('res.view.table'),   icon: 'bi-table' },
    { id: 'by-table', label: t('res.view.byTable'), icon: 'bi-layout-three-columns' },
  ];

  const initialDate = dateScope === 'date' ? date : todayStr;

  return {
    tab, setTab, view, setView, dateScope, setDateScope,
    reservations, walkIns, settings, tables,
    date, setDate, search, setSearch, filterStatus, setFilterStatus,
    showModal, setShowModal, editTarget, setEditTarget,
    showWalkInModal, setShowWalkInModal, drawerOpen, setDrawerOpen,
    filtered, waitingCount, todayStr, initialDate, tabs, views,
    handleCreate, handleEdit, handleStatusChange,
    handleWalkInSeat, handleWalkInCancel, handleAddWalkIn, handleSaveSettings,
  };
}
