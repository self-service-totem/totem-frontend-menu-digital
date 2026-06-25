import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { queueService, type EnrichedQueueTicket } from '@/lib/services/queueService';
import { getCollection } from '@/lib/mock-db';
import type { Tenant, Branch } from '@/lib/types';
import { I18nProvider, useLabels } from '@/i18n/I18nContext';
import { resolveLanguage } from '@/i18n/labels';

// ─── Config ───────────────────────────────────────────────────────────────────

const DISPLAY_CONFIG = {
  readyOrderDisplayMinutes: 10,
  pageRotationSeconds: 8,
  maxPreparingPerPage: 12,
  audioEnabled: true,
} as const;

// ─── Audio ────────────────────────────────────────────────────────────────────

function playReadyChime() {
  try {
    const ctx = new AudioContext();
    const notes = [
      { freq: 1046.5, delay: 0,    dur: 0.25 },
      { freq: 1318.5, delay: 0.12, dur: 0.30 },
      { freq: 1568.0, delay: 0.24, dur: 0.45 },
    ];
    notes.forEach(({ freq, delay, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur + 0.05);
    });
  } catch { /* AudioContext blocked before user interaction */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ReadySize = 'xl' | 'lg' | 'md' | 'sm';
type PrepSize  = 'lg' | 'md' | 'sm';

function readyCardSize(otherCount: number): ReadySize {
  if (otherCount === 0) return 'xl';
  if (otherCount <= 3)  return 'lg';
  if (otherCount <= 7)  return 'md';
  return 'sm';
}

function prepCardSize(total: number): PrepSize {
  if (total <= 4) return 'lg';
  if (total <= 9) return 'md';
  return 'sm';
}

// ─── Now Calling Hero ─────────────────────────────────────────────────────────

function NowCallingHero({ ticket, flash }: { ticket: EnrichedQueueTicket; flash: boolean }) {
  const { t } = useLabels();
  return (
    <div className={`ff-qdp-hero${flash ? ' ff-qdp-ready-anim' : ''}`}>
      <div className="ff-qdp-hero-eyebrow">
        <i className="bi bi-bell-fill" />
        {t('queue.nowCalling')}
      </div>
      <div className="ff-qdp-hero-number">{ticket.ticketNumber}</div>
      <div className="ff-qdp-hero-instruction">
        <i className="bi bi-arrow-right-circle me-2" />
        {t('queue.pickupAtCounter')}
      </div>
    </div>
  );
}

// ─── Ready Card ───────────────────────────────────────────────────────────────

function ReadyCard({ ticket, size, flash }: { ticket: EnrichedQueueTicket; size: ReadySize; flash: boolean }) {
  const { t } = useLabels();
  return (
    <div className={`ff-qdp-ready-card ff-qdp-ready-card--${size}${flash ? ' ff-qdp-ready-anim' : ''}`}>
      <div className="ff-qdp-card-label">{t('queue.ticketLabel')}</div>
      <div className="ff-qdp-card-number">{ticket.ticketNumber}</div>
      <div className="ff-qdp-card-sub">{ticket.orderNumber}</div>
    </div>
  );
}

// ─── Preparing Card ───────────────────────────────────────────────────────────

function PrepCard({ ticket, size }: { ticket: EnrichedQueueTicket; size: PrepSize }) {
  const { t } = useLabels();
  return (
    <div className={`ff-qdp-prep-card ff-qdp-prep-card--${size}`}>
      <div className="ff-qdp-card-label ff-qdp-card-label--prep">{t('queue.ticketLabel')}</div>
      <div className="ff-qdp-card-number ff-qdp-card-number--prep">{ticket.ticketNumber}</div>
    </div>
  );
}

// ─── Empty States ─────────────────────────────────────────────────────────────

function ReadyEmpty() {
  const { t } = useLabels();
  return (
    <div className="ff-qdp-empty">
      <div className="ff-qdp-empty-icon">🧑‍🍳</div>
      <div className="ff-qdp-empty-title">{t('queue.preparingTitle')}</div>
      <div className="ff-qdp-empty-sub">{t('queue.preparingSub')}</div>
    </div>
  );
}

function PrepEmpty() {
  const { t } = useLabels();
  return (
    <div className="ff-qdp-empty ff-qdp-empty--muted">
      <i className="bi bi-check-all ff-qdp-empty-icon" style={{ fontSize: 40, color: '#22c55e' }} />
      <div className="ff-qdp-empty-sub">{t('queue.allReady')}</div>
    </div>
  );
}

function AllEmpty() {
  const { t } = useLabels();
  return (
    <div className="ff-qdp-all-empty">
      <div style={{ fontSize: 80 }}>🍽️</div>
      <div className="ff-qdp-all-empty-title">{t('queue.noActiveTitle')}</div>
      <div className="ff-qdp-all-empty-sub">{t('queue.noActiveSub')}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function QueueDisplayPage() {
  const tenant = getCollection<Tenant>('tenants')[0];
  return (
    <I18nProvider language={resolveLanguage(tenant?.defaultLanguage)}>
      <QueueDisplayInner />
    </I18nProvider>
  );
}

function QueueDisplayInner() {
  const { t, language } = useLabels();
  const [tickets, setTickets]       = useState<EnrichedQueueTicket[]>([]);
  const [now, setNow]               = useState(new Date());
  const [flashIds, setFlashIds]     = useState<Set<string>>(new Set());
  const [prepPage, setPrepPage]     = useState(0);
  const [pageVisible, setPageVisible] = useState(true);

  const navigate        = useNavigate();
  const tenant          = getCollection<Tenant>('tenants')[0];
  const branch          = getCollection<Branch>('branches')[0];
  const prevReadyIds    = useRef<Set<string>>(new Set());

  // ── Polling ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    function load() {
      const data     = queueService.listActiveSync();
      const ready    = data.filter((t) => t.status === 'CALLED' || t.status === 'SERVING');
      const readyIds = new Set(ready.map((t) => t.id));

      const justReady = [...readyIds].filter((id) => !prevReadyIds.current.has(id));
      if (justReady.length > 0 && DISPLAY_CONFIG.audioEnabled) {
        playReadyChime();
        setFlashIds(new Set(justReady));
        setTimeout(() => setFlashIds(new Set()), 2500);
      }

      prevReadyIds.current = readyIds;
      setTickets(data);
      setNow(new Date());
    }
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────────
  const ready     = tickets.filter((t) => t.status === 'CALLED' || t.status === 'SERVING');
  const preparing = tickets.filter((t) => t.status === 'WAITING');

  // Most recently-called ticket = "Now Calling" hero
  const nowCalling = ready.length > 0
    ? [...ready].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
    : null;
  const otherReady = nowCalling ? ready.filter((t) => t.id !== nowCalling.id) : [];

  const rSize        = readyCardSize(otherReady.length);
  const pSize        = prepCardSize(preparing.length);
  const totalPages   = Math.max(1, Math.ceil(preparing.length / DISPLAY_CONFIG.maxPreparingPerPage));
  const safePage     = Math.min(prepPage, totalPages - 1);
  const prepPageItems = preparing.slice(
    safePage * DISPLAY_CONFIG.maxPreparingPerPage,
    (safePage + 1) * DISPLAY_CONFIG.maxPreparingPerPage,
  );
  const totalTickets = ready.length + preparing.length;

  // ── Auto-page rotation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (totalPages <= 1) { setPrepPage(0); return; }
    const id = setInterval(() => {
      setPageVisible(false);
      setTimeout(() => {
        setPrepPage((p) => (p + 1) % totalPages);
        setPageVisible(true);
      }, 380);
    }, DISPLAY_CONFIG.pageRotationSeconds * 1000);
    return () => clearInterval(id);
  }, [totalPages]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="ff-qdp-root">

      {/* ── Header ── */}
      <header className="ff-qdp-header">
        <div className="ff-qdp-brand">
          <div className="ff-qdp-brand-logo">🍽️</div>
          <div>
            <div className="ff-qdp-brand-name">{tenant?.name ?? t('queue.restaurantFallback')}</div>
            {branch?.name && <div className="ff-qdp-brand-branch">{branch.name}</div>}
          </div>
        </div>

        <div className="ff-qdp-header-title">
          <i className="bi bi-tv me-2" />
          {t('queue.headerTitle')}
        </div>

        <div className="ff-qdp-header-right">
          <button className="ff-qdp-home-btn" onClick={() => navigate('/')} title="Hub">
            <i className="bi bi-house" />
          </button>
          <div className="ff-qdp-clock">
            {now.toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="ff-qdp-main">
        {totalTickets === 0 ? (
          <AllEmpty />
        ) : (
          <div className="ff-qdp-columns">

            {/* ── Ready Column ── */}
            <div className="ff-qdp-col-ready">
              <div className="ff-qdp-col-header ff-qdp-col-header--ready">
                <i className="bi bi-check-circle-fill" />
                <span>{t('queue.readyColumn')}</span>
                <span className="ff-qdp-badge ff-qdp-badge--ready">{ready.length}</span>
              </div>

              <div className="ff-qdp-col-body">
                {ready.length === 0 ? (
                  <ReadyEmpty />
                ) : (
                  <>
                    {nowCalling && (
                      <NowCallingHero ticket={nowCalling} flash={flashIds.has(nowCalling.id)} />
                    )}
                    {otherReady.length > 0 && (
                      <div className={`ff-qdp-ready-grid ff-qdp-ready-grid--${rSize}`}>
                        {otherReady.map((t) => (
                          <ReadyCard key={t.id} ticket={t} size={rSize} flash={flashIds.has(t.id)} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── Preparing Column ── */}
            <div className="ff-qdp-col-prep">
              <div className="ff-qdp-col-header ff-qdp-col-header--prep">
                <i className="bi bi-hourglass-split" />
                <span>{t('queue.preparingColumn')}</span>
                <span className="ff-qdp-badge ff-qdp-badge--prep">{preparing.length}</span>
              </div>

              <div className="ff-qdp-col-body">
                {preparing.length === 0 ? (
                  <PrepEmpty />
                ) : (
                  <>
                    <div className={`ff-qdp-prep-grid ff-qdp-prep-grid--${pSize}${pageVisible ? '' : ' ff-qdp-page-exit'}`}>
                      {prepPageItems.map((t) => (
                        <PrepCard key={t.id} ticket={t} size={pSize} />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="ff-qdp-pager">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <span key={i} className={`ff-qdp-pager-dot${i === safePage ? ' active' : ''}`} />
                        ))}
                        <span className="ff-qdp-pager-label">
                          {t('queue.pageOf', { page: safePage + 1, total: totalPages })}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="ff-qdp-footer">
        <span><i className="bi bi-arrow-repeat me-1" />{t('queue.refreshNote')}</span>
        <span className="ff-qdp-footer-sep">·</span>
        <span>{t('queue.checkPrintedTicket')}</span>
      </footer>

    </div>
  );
}
