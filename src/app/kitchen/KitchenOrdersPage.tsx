import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { kitchenService } from '@/lib/services/kitchenService';
import { getCollection, findById } from '@/lib/mock-db';
import type { KitchenTicket, KitchenTicketStatus, AggregatorPlatform, DbOrder } from '@/lib/types';
import { aggregatorService } from '@/lib/services/aggregatorService';
import { useNotify } from '@/lib/notifications';
import { I18nProvider, useLabels } from '@/i18n/I18nContext';
import { useAdminLanguage } from '@/i18n/useAdminLanguage';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';
import type { LabelKey, LanguageCode } from '@/i18n/labels';

// ─── Audio ───────────────────────────────────────────────────────────────────

function playNewTicketSound(muted: boolean) {
  if (muted) return;
  try {
    const ctx = new AudioContext();
    [0, 180].forEach((delayMs) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delayMs / 1000);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delayMs / 1000 + 0.18);
      osc.start(ctx.currentTime + delayMs / 1000);
      osc.stop(ctx.currentTime + delayMs / 1000 + 0.2);
    });
  } catch { /* AudioContext blocked before user interaction — ignore */ }
}

function playUrgentSound(muted: boolean) {
  if (muted) return;
  try {
    const ctx = new AudioContext();
    [0, 120, 240].forEach((delayMs) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.18, ctx.currentTime + delayMs / 1000);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delayMs / 1000 + 0.14);
      osc.start(ctx.currentTime + delayMs / 1000);
      osc.stop(ctx.currentTime + delayMs / 1000 + 0.15);
    });
  } catch { /* ignored */ }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function elapsedMs(createdAt: string): number {
  return Date.now() - new Date(createdAt).getTime();
}

function formatMinutes(ms: number): string {
  if (ms <= 0) return '—';
  const min = Math.floor(ms / 60000);
  return min > 0 ? `${min} min` : '<1 min';
}

function urgencyLevel(ms: number): 'green' | 'yellow' | 'red' {
  if (ms < 5 * 60000)  return 'green';
  if (ms < 10 * 60000) return 'yellow';
  return 'red';
}

// ─── Clock ───────────────────────────────────────────────────────────────────

function KdsClock() {
  const { language } = useLabels();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="ff-kds-clock">
      {now.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

// ─── Urgency badge (live timer) ───────────────────────────────────────────────

function UrgencyBadge({ createdAt }: { createdAt: string }) {
  const [ms, setMs] = useState(() => elapsedMs(createdAt));
  useEffect(() => {
    const t = setInterval(() => setMs(elapsedMs(createdAt)), 30000);
    return () => clearInterval(t);
  }, [createdAt]);
  const level = urgencyLevel(ms);
  return (
    <span className={`ff-kds-urgency-badge ${level}`}>
      <span className="ff-kds-urgency-dot" />
      {formatMinutes(ms)}
    </span>
  );
}

// ─── Priority badge ───────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<NonNullable<KitchenTicket['priority']>, { icon: string; labelKey: LabelKey }> = {
  URGENT: { icon: '🔥', labelKey: 'kitchen.priority.urgent' },
  VIP:    { icon: '⭐', labelKey: 'kitchen.priority.vip'    },
};

function PriorityBadge({ priority }: { priority: NonNullable<KitchenTicket['priority']> }) {
  const { t } = useLabels();
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className={`ff-kds-priority-badge ${priority.toLowerCase()}`}>
      {cfg.icon} {t(cfg.labelKey)}
    </span>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const NEXT_STATUS: Partial<Record<KitchenTicketStatus, KitchenTicketStatus>> = {
  NEW:       'PREPARING',
  PREPARING: 'READY',
  READY:     'DELIVERED',
};

const ACTION_CONFIG: Record<KitchenTicketStatus, { labelKey: LabelKey; icon: string; cls: string } | null> = {
  NEW:       { labelKey: 'kitchen.action.start',   icon: 'bi-fire',              cls: 'amber' },
  PREPARING: { labelKey: 'kitchen.action.ready',   icon: 'bi-check-circle-fill', cls: 'green' },
  READY:     { labelKey: 'kitchen.action.deliver', icon: 'bi-bag-check',         cls: 'slate' },
  DELIVERED: null,
  CANCELED:  null,
};

// ─── Ticket card ──────────────────────────────────────────────────────────────

interface TicketCardProps {
  ticket: KitchenTicket;
  onStatusChange: (id: string, status: KitchenTicketStatus) => void;
  isExiting?: boolean;
}

function TicketCard({ ticket, onStatusChange, isExiting }: TicketCardProps) {
  const { t }   = useLabels();
  const next    = NEXT_STATUS[ticket.status];
  const action  = ACTION_CONFIG[ticket.status];
  const dbOrder = findById<DbOrder>('orders', ticket.orderId);
  const platform: AggregatorPlatform | undefined = dbOrder?.platform;

  const isKiosk     = dbOrder?.source === 'KIOSK';
  const hasDelivery = !!dbOrder?.deliveryAddress;

  const urgency = (ticket.status === 'NEW' || ticket.status === 'PREPARING')
    ? urgencyLevel(elapsedMs(ticket.createdAt))
    : null;
  const urgencyCls = urgency === 'red' ? ' ff-kds-card--urgency-red' : urgency === 'yellow' ? ' ff-kds-card--urgency-yellow' : '';

  return (
    <div className={`ff-kds-card ${ticket.status.toLowerCase()}${isExiting ? ' exiting' : ''}${urgencyCls}`}>
      {/* Order number + badges */}
      <div className="ff-kds-card-number">
        <span className="ff-kds-order-num">{ticket.orderNumber}</span>
        <div className="ff-kds-card-badges">
          {ticket.priority && <PriorityBadge priority={ticket.priority} />}
          <UrgencyBadge createdAt={ticket.createdAt} />
        </div>
      </div>

      {/* Meta: table / delivery / takeaway / platform */}
      {(ticket.tableNumber || hasDelivery || isKiosk || (platform && platform !== 'DIRECT')) && (
        <div className="ff-kds-card-meta">
          {ticket.tableNumber && (
            <span className="ff-kds-meta-pill">
              <i className="bi bi-table" /> {t('kitchen.meta.table', { n: ticket.tableNumber })}
            </span>
          )}
          {hasDelivery && (
            <span className="ff-kds-meta-pill delivery">
              <i className="bi bi-bicycle" /> {t('kitchen.meta.delivery')}
            </span>
          )}
          {isKiosk && !hasDelivery && (
            <span className="ff-kds-meta-pill takeaway">
              <i className="bi bi-bag" /> {t('kitchen.meta.counter')}
            </span>
          )}
          {platform && platform !== 'DIRECT' && (
            <span
              className="ff-platform-badge"
              style={{ background: aggregatorService.getPlatformColor(platform), fontSize: 10 }}
            >
              {aggregatorService.getPlatformName(platform)}
            </span>
          )}
        </div>
      )}

      {/* Items */}
      <div className="ff-kds-card-divider" />
      <div className="ff-kds-items">
        {ticket.items.map((item, i) => (
          <div key={i} className="ff-kds-item">
            <span className="ff-kds-item-qty">{item.quantity}×</span>
            <div className="ff-kds-item-body">
              <span className="ff-kds-item-name">{item.name}</span>
              {item.customerName && (
                <span className="ff-kds-item-customer">({item.customerName})</span>
              )}
              {item.note && <span className="ff-kds-item-note">{item.note}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Action button */}
      {next && action && (
        <>
          <div className="ff-kds-card-divider" />
          <button
            className={`ff-kds-action-btn ${action.cls}`}
            onClick={() => onStatusChange(ticket.id, next)}
            disabled={isExiting}
          >
            <i className={`bi ${action.icon}`} />
            {t(action.labelKey)}
          </button>
        </>
      )}
    </div>
  );
}

// ─── Column config ────────────────────────────────────────────────────────────

const COL_CONFIG: Record<string, { labelKey: LabelKey; icon: string; accentClass: string; emptyIcon: string; emptyMsgKey: LabelKey }> = {
  NEW:       { labelKey: 'kitchen.col.new',       icon: 'bi-lightning-fill',    accentClass: 'blue',  emptyIcon: 'bi-inbox',         emptyMsgKey: 'kitchen.empty.new' },
  PREPARING: { labelKey: 'kitchen.col.preparing', icon: 'bi-fire',              accentClass: 'amber', emptyIcon: 'bi-hourglass',     emptyMsgKey: 'kitchen.empty.preparing' },
  READY:     { labelKey: 'kitchen.col.ready',     icon: 'bi-check-circle-fill', accentClass: 'green', emptyIcon: 'bi-check2-circle', emptyMsgKey: 'kitchen.empty.ready' },
};

const NOTIFY_LABEL_KEYS: Partial<Record<KitchenTicketStatus, LabelKey>> = {
  PREPARING: 'kitchen.notify.preparing',
  READY:     'kitchen.notify.ready',
  DELIVERED: 'kitchen.notify.delivered',
};

type FilterOption = 'ALL' | KitchenTicketStatus;

const FILTER_TABS: { labelKey: LabelKey; value: FilterOption }[] = [
  { labelKey: 'kitchen.filter.all',   value: 'ALL' },
  { labelKey: 'kitchen.col.new',      value: 'NEW' },
  { labelKey: 'kitchen.col.preparing', value: 'PREPARING' },
  { labelKey: 'kitchen.col.ready',    value: 'READY' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export function KitchenOrdersPage() {
  const { lang, setLang } = useAdminLanguage();
  return (
    <I18nProvider language={lang}>
      <KitchenOrdersInner lang={lang} onLangChange={setLang} />
    </I18nProvider>
  );
}

function KitchenOrdersInner({ lang, onLangChange }: { lang: LanguageCode; onLangChange: (l: LanguageCode) => void }) {
  const { t, language } = useLabels();
  const [tickets, setTickets]       = useState<KitchenTicket[]>([]);
  const [filter, setFilter]         = useState<FilterOption>('ALL');
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [muted, setMuted]           = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(() => new Date());

  const notify       = useNotify();
  const navigate     = useNavigate();
  const prevNewCount = useRef(0);
  const prevNewIds   = useRef<Set<string>>(new Set());
  const mutedRef     = useRef(false);

  // keep ref in sync with state (avoids stale closure in `load`)
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // fullscreen listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  const load = useCallback(async () => {
    const data      = await kitchenService.listTickets('ALL');
    const newTickets = data.filter((t) => t.status === 'NEW');
    const newCount   = newTickets.length;
    const currentIds = new Set(newTickets.map((t) => t.id));

    if (newCount > prevNewCount.current) {
      // detect if any truly new (not seen before) ticket is URGENT
      const hasUrgentNew = newTickets.some(
        (t) => t.priority === 'URGENT' && !prevNewIds.current.has(t.id),
      );
      if (hasUrgentNew) {
        playUrgentSound(mutedRef.current);
      } else {
        playNewTicketSound(mutedRef.current);
      }
    }

    prevNewCount.current = newCount;
    prevNewIds.current   = currentIds;
    setTickets(data);
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  // animated status transition: exit anim → update → reload
  async function handleStatusChange(id: string, status: KitchenTicketStatus) {
    setExitingIds((prev) => new Set([...prev, id]));
    await new Promise((r) => setTimeout(r, 340));
    await kitchenService.updateStatus(id, status);
    const notifyKey = NOTIFY_LABEL_KEYS[status];
    notify(notifyKey ? t(notifyKey) : t('kitchen.notify.statusUpdated'));
    setExitingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    load();
  }

  // ── Metrics ──────────────────────────────────────────────────────────────

  const today        = new Date().toISOString().slice(0, 10);
  const allTickets   = getCollection<KitchenTicket>('kitchenTickets');
  const completedToday = allTickets.filter(
    (t) => t.status === 'DELIVERED' && t.createdAt.startsWith(today),
  ).length;

  const counts = {
    NEW:       tickets.filter((t) => t.status === 'NEW').length,
    PREPARING: tickets.filter((t) => t.status === 'PREPARING').length,
    READY:     tickets.filter((t) => t.status === 'READY').length,
  };

  const preparingTickets = tickets.filter((t) => t.status === 'PREPARING');
  const avgPrepMs = preparingTickets.length > 0
    ? preparingTickets.reduce((sum, t) => sum + elapsedMs(t.createdAt), 0) / preparingTickets.length
    : 0;

  const activeTickets = tickets.filter((t) => t.status === 'NEW' || t.status === 'PREPARING');
  const longestWaitMs = activeTickets.length > 0
    ? Math.max(...activeTickets.map((t) => elapsedMs(t.createdAt)))
    : 0;

  const visible = filter === 'ALL' ? tickets : tickets.filter((t) => t.status === filter);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="ff-kds-layout">

      {/* ── Topbar ── */}
      <div className="ff-kds-topbar">
        <button className="ff-kds-ctrl-btn" onClick={() => navigate('/')} title={t('kitchen.tooltip.hub')}>
          <i className="bi bi-house" />
        </button>

        <div className="ff-kds-topbar-title">
          <i className="bi bi-fire text-warning" />
          {t('kitchen.title')}
        </div>

        <KdsClock />

        <AdminLanguageSelector language={lang} onChange={onLangChange} />

        <button
          className={`ff-kds-ctrl-btn${muted ? ' muted' : ''}`}
          onClick={() => setMuted((m) => !m)}
          title={muted ? t('kitchen.tooltip.unmute') : t('kitchen.tooltip.mute')}
        >
          <i className={`bi ${muted ? 'bi-volume-mute-fill' : 'bi-volume-up-fill'}`} />
        </button>

        <button
          className="ff-kds-ctrl-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? t('kitchen.tooltip.exitFullscreen') : t('kitchen.tooltip.fullscreen')}
        >
          <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'}`} />
        </button>

        <div className="ff-kds-stats-bar">
          <div className="ff-kds-stat-pill blue">
            <span className="ff-kds-stat-pill-count">{counts.NEW}</span>
            <span>{t('kitchen.col.new')}</span>
          </div>
          <div className="ff-kds-stat-pill amber">
            <span className="ff-kds-stat-pill-count">{counts.PREPARING}</span>
            <span>{t('kitchen.col.preparing')}</span>
          </div>
          <div className="ff-kds-stat-pill green">
            <span className="ff-kds-stat-pill-count">{counts.READY}</span>
            <span>{t('kitchen.col.ready')}</span>
          </div>
          <div className="ff-kds-stat-pill slate">
            <span className="ff-kds-stat-pill-count">{completedToday}</span>
            <span>{t('kitchen.stat.delivered')}</span>
          </div>
          {avgPrepMs > 0 && (
            <div className="ff-kds-stat-pill purple">
              <span className="ff-kds-stat-pill-count">{formatMinutes(avgPrepMs)}</span>
              <span>{t('kitchen.stat.avgTime')}</span>
            </div>
          )}
          {longestWaitMs > 0 && (
            <div className={`ff-kds-stat-pill ${longestWaitMs > 10 * 60000 ? 'red' : 'slate'}`}>
              <span className="ff-kds-stat-pill-count">{formatMinutes(longestWaitMs)}</span>
              <span>{t('kitchen.stat.longestWait')}</span>
            </div>
          )}
        </div>

        <div className="ff-kds-live-indicator">
          <span className="ff-kds-live-label">
            <span className="ff-kds-live-dot" />
            {t('kitchen.live')}
          </span>
          <span className="ff-kds-live-time">
            {lastUpdate.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="ff-kds-filter-bar">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`ff-kds-filter-btn${filter === tab.value ? ' active' : ''}`}
            onClick={() => setFilter(tab.value)}
          >
            {t(tab.labelKey)}
            {tab.value !== 'ALL' && (
              <span className="ff-kds-filter-badge">{counts[tab.value as keyof typeof counts] ?? 0}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Column view (ALL) ── */}
      {filter === 'ALL' && (
        <div className="ff-kds-columns">
          {(['NEW', 'PREPARING', 'READY'] as KitchenTicketStatus[]).map((status) => {
            const cfg        = COL_CONFIG[status];
            const colTickets = tickets.filter((t) => t.status === status);
            return (
              <div key={status} className="ff-kds-column">
                <div className={`ff-kds-column-header ${cfg.accentClass}`}>
                  <i className={`bi ${cfg.icon} ff-kds-col-icon ${cfg.accentClass}`} />
                  <span className="ff-kds-column-header-label">{t(cfg.labelKey)}</span>
                  <span className={`ff-kds-column-header-count ${cfg.accentClass}`}>{colTickets.length}</span>
                </div>
                <div className="ff-kds-column-body">
                  {colTickets.length === 0 ? (
                    <div className="ff-kds-empty">
                      <i className={`bi ${cfg.emptyIcon} ff-kds-empty-icon`} />
                      <span className="ff-kds-empty-msg">{t(cfg.emptyMsgKey)}</span>
                    </div>
                  ) : (
                    colTickets.map((t) => (
                      <TicketCard
                        key={t.id}
                        ticket={t}
                        onStatusChange={handleStatusChange}
                        isExiting={exitingIds.has(t.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Filtered list view ── */}
      {filter !== 'ALL' && (
        <div className="ff-kds-list-view">
          {visible.length === 0 ? (
            <div className="ff-kds-empty" style={{ marginTop: 60 }}>
              <i className={`bi ${COL_CONFIG[filter]?.emptyIcon ?? 'bi-inbox'} ff-kds-empty-icon`} style={{ fontSize: 48 }} />
              <span className="ff-kds-empty-msg">{t(COL_CONFIG[filter]?.emptyMsgKey ?? 'kitchen.empty.generic')}</span>
            </div>
          ) : (
            visible.map((t) => (
              <TicketCard
                key={t.id}
                ticket={t}
                onStatusChange={handleStatusChange}
                isExiting={exitingIds.has(t.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
