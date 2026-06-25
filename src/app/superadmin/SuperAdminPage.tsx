import { useState, useCallback } from 'react';
import { featureFlagService, type FeatureFlags } from '@/lib/services/featureFlagService';
import { getErrorLog, clearErrorLog, type ErrorEntry } from '@/lib/utils/errorReporter';

// PIN is intentionally hardcoded — this is a dev-only backdoor, not production auth.
const SUPERADMIN_PIN = '9999';

// ── PIN gate ──────────────────────────────────────────────────────────────────

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [input, setInput] = useState('');
  const [shake, setShake]   = useState(false);

  const press = useCallback((digit: string) => {
    if (input.length >= 4) return;
    const next = input + digit;
    setInput(next);
    if (next.length === 4) {
      if (next === SUPERADMIN_PIN) {
        onUnlock();
      } else {
        setShake(true);
        setTimeout(() => { setInput(''); setShake(false); }, 600);
      }
    }
  }, [input, onUnlock]);

  const del = () => setInput((p) => p.slice(0, -1));

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div style={S.page}>
      <div style={S.card}>
        <i className="bi bi-shield-lock" style={{ fontSize: 32, color: 'var(--ff-primary)', marginBottom: 8 }} />
        <p style={S.pinLabel}>Superadmin</p>
        <div style={{ ...S.dots, animation: shake ? 'ff-shake 0.4s ease' : undefined }}>
          {[0,1,2,3].map((i) => (
            <div key={i} style={{ ...S.dot, background: i < input.length ? 'var(--ff-primary)' : 'var(--ff-border)' }} />
          ))}
        </div>
        <div style={S.grid}>
          {KEYS.map((k, i) => (
            k === '' ? <div key={i} /> :
            k === '⌫' ? (
              <button key={i} style={S.keyAlt} onClick={del}>
                <i className="bi bi-backspace" />
              </button>
            ) : (
              <button key={i} style={S.key} onClick={() => press(k)}>{k}</button>
            )
          ))}
        </div>
      </div>
      <style>{`
        @keyframes ff-shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-8px); }
          40%,80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

// ── Module toggle ─────────────────────────────────────────────────────────────

type FlagMeta = { key: keyof FeatureFlags; label: string; icon: string; description: string };

const FLAGS: FlagMeta[] = [
  { key: 'delivery',    label: 'Delivery',       icon: 'bi-bicycle',      description: 'Módulo de pedidos delivery / take-away' },
  { key: 'kiosk',      label: 'Kiosk',           icon: 'bi-display',      description: 'Auto-atendimento por tela de toque' },
  { key: 'reservations',label: 'Reservas',       icon: 'bi-calendar-check', description: 'Sistema de reservas e walk-ins' },
  { key: 'queueDisplay',label: 'Fila / Display',  icon: 'bi-people',       description: 'Painel de chamada de senhas' },
];

function ModulesTab() {
  const [flags, setFlags] = useState<FeatureFlags>(() => featureFlagService.getAll());

  function toggle(key: keyof FeatureFlags) {
    featureFlagService.toggle(key);
    setFlags(featureFlagService.getAll());
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {FLAGS.map(({ key, label, icon, description }) => (
        <div key={key} style={S.row}>
          <i className={`bi ${icon}`} style={{ fontSize: 20, color: 'var(--ff-text-muted)', width: 24 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{label}</div>
            <div style={{ fontSize: 13, color: 'var(--ff-text-muted)' }}>{description}</div>
          </div>
          <button
            style={{ ...S.toggle, background: flags[key] ? 'var(--ff-primary)' : '#d1d5db' }}
            onClick={() => toggle(key)}
            aria-label={`Toggle ${label}`}
          >
            <span style={{ ...S.thumb, transform: flags[key] ? 'translateX(20px)' : 'translateX(2px)' }} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Error log ─────────────────────────────────────────────────────────────────

function ErrorsTab() {
  const [entries, setEntries] = useState<ErrorEntry[]>(() => getErrorLog());

  function clear() { clearErrorLog(); setEntries([]); }

  if (entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--ff-text-muted)' }}>
        <i className="bi bi-check-circle" style={{ fontSize: 32, color: 'var(--ff-success)' }} />
        <p style={{ marginTop: 8 }}>Nenhum erro registrado</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--ff-text-muted)' }}>{entries.length} entradas (últimas 100)</span>
        <button style={S.clearBtn} onClick={clear}>Limpar</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((e) => (
          <div key={e.id} style={S.errorCard}>
            <div style={{ fontSize: 11, color: 'var(--ff-text-muted)', marginBottom: 4 }}>
              {new Date(e.ts).toLocaleString()}
            </div>
            <div style={{ fontSize: 13, wordBreak: 'break-all', fontFamily: 'monospace' }}>{e.message}</div>
            {e.stack && (
              <details style={{ marginTop: 4 }}>
                <summary style={{ fontSize: 11, color: 'var(--ff-text-muted)', cursor: 'pointer' }}>stack trace</summary>
                <pre style={{ fontSize: 10, marginTop: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--ff-text-muted)' }}>{e.stack}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'modules' | 'errors';

export function SuperAdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>('modules');

  if (!unlocked) return <PinGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div style={S.page}>
      <div style={S.panel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <i className="bi bi-shield-lock-fill" style={{ fontSize: 20, color: 'var(--ff-primary)' }} />
          <span style={{ fontWeight: 700, fontSize: 17 }}>Superadmin</span>
          <button style={{ marginLeft: 'auto', ...S.clearBtn }} onClick={() => setUnlocked(false)}>
            <i className="bi bi-lock" /> Bloquear
          </button>
        </div>

        <div style={S.tabs}>
          {(['modules', 'errors'] as Tab[]).map((t) => (
            <button
              key={t}
              style={{ ...S.tabBtn, ...(tab === t ? S.tabActive : {}) }}
              onClick={() => setTab(t)}
            >
              {t === 'modules' ? 'Módulos' : 'Erros'}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          {tab === 'modules' && <ModulesTab />}
          {tab === 'errors'  && <ErrorsTab />}
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--ff-bg-soft)',
    padding: 16,
  } as React.CSSProperties,

  card: {
    background: '#fff',
    borderRadius: 'var(--ff-radius-lg)',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 320,
    boxShadow: 'var(--ff-shadow-card)',
  } as React.CSSProperties,

  panel: {
    background: '#fff',
    borderRadius: 'var(--ff-radius-lg)',
    padding: 24,
    width: '100%',
    maxWidth: 480,
    boxShadow: 'var(--ff-shadow-card)',
  } as React.CSSProperties,

  pinLabel: {
    margin: 0,
    fontWeight: 700,
    fontSize: 18,
    color: 'var(--ff-text)',
  } as React.CSSProperties,

  dots: {
    display: 'flex',
    gap: 12,
  } as React.CSSProperties,

  dot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid var(--ff-border)',
    transition: 'background 0.15s',
  } as React.CSSProperties,

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    width: '100%',
    maxWidth: 240,
  } as React.CSSProperties,

  key: {
    height: 56,
    borderRadius: 'var(--ff-radius-md)',
    border: '1px solid var(--ff-border)',
    background: 'var(--ff-bg-soft)',
    fontSize: 20,
    fontWeight: 600,
    cursor: 'pointer',
    color: 'var(--ff-text)',
    transition: 'background 0.1s',
  } as React.CSSProperties,

  keyAlt: {
    height: 56,
    borderRadius: 'var(--ff-radius-md)',
    border: '1px solid var(--ff-border)',
    background: 'var(--ff-bg-soft)',
    fontSize: 18,
    cursor: 'pointer',
    color: 'var(--ff-text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0',
    borderBottom: '1px solid var(--ff-border)',
  } as React.CSSProperties,

  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    position: 'relative' as const,
    transition: 'background 0.2s',
    flexShrink: 0,
  } as React.CSSProperties,

  thumb: {
    position: 'absolute' as const,
    top: 2,
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s',
  } as React.CSSProperties,

  tabs: {
    display: 'flex',
    borderBottom: '2px solid var(--ff-border)',
    gap: 0,
  } as React.CSSProperties,

  tabBtn: {
    padding: '8px 20px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--ff-text-muted)',
    borderBottom: '2px solid transparent',
    marginBottom: -2,
    transition: 'color 0.15s, border-color 0.15s',
  } as React.CSSProperties,

  tabActive: {
    color: 'var(--ff-primary)',
    borderBottomColor: 'var(--ff-primary)',
  } as React.CSSProperties,

  errorCard: {
    background: 'var(--ff-bg-soft)',
    borderRadius: 'var(--ff-radius-sm)',
    padding: '10px 12px',
    borderLeft: '3px solid var(--ff-primary)',
  } as React.CSSProperties,

  clearBtn: {
    padding: '5px 12px',
    fontSize: 13,
    border: '1px solid var(--ff-border)',
    borderRadius: 'var(--ff-radius-pill)',
    background: 'none',
    cursor: 'pointer',
    color: 'var(--ff-text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  } as React.CSSProperties,
};
