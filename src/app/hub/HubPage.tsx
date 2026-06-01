import { Link } from 'react-router-dom';
import { resetDb, seedDb } from '@/lib/mock-db';
import { useRole } from '@/app/RoleContext';

const customerAreas = [
  { path: '/menu/branch-1/table/140', icon: 'bi-phone', title: 'Menu Digital', desc: 'Cliente – mesa / takeaway', color: '#e11d2a' },
  { path: '/kiosk', icon: 'bi-display', title: 'Kiosk / Totem', desc: 'Autoatendimento', color: '#7c3aed' },
  { path: '/queue-display', icon: 'bi-tv', title: 'Painel de Fila', desc: 'TV / display público', color: '#0284c7' },
];

const operationalAreas = [
  { path: '/kitchen/orders', icon: 'bi-fire', title: 'Cozinha', desc: 'Operação da cozinha', color: '#d97706' },
  { path: '/waiter-staff/tables', icon: 'bi-person-badge', title: 'Garçom', desc: 'Atendimento de piso', color: '#059669' },
  { path: '/cashier/orders', icon: 'bi-cash-register', title: 'Caixa', desc: 'Pagamentos e notas', color: '#9333ea' },
  { path: '/admin/dashboard', icon: 'bi-grid-1x2', title: 'Admin', desc: 'Gestão do restaurante', color: '#475569' },
];

const newAreas = [
  { path: '/delivery', icon: 'bi-bicycle', title: 'Delivery', desc: 'Gestão de entregas + Agregadores', color: '#06b6d4' },
  { path: '/reservations', icon: 'bi-calendar-check', title: 'Reservas', desc: 'Gestão de reservas', color: '#8b5cf6' },
  { path: '/reports', icon: 'bi-bar-chart', title: 'Relatórios', desc: 'Fechamento e métricas', color: '#0f172a' },
  { path: '/login', icon: 'bi-person-lock', title: 'Login / Perfis', desc: 'Trocar usuário e papel', color: '#374151' },
];

function AreaGrid({ areas }: { areas: typeof customerAreas }) {
  return (
    <div className="ff-hub-grid">
      {areas.map((a) => (
        <Link key={a.path} to={a.path} className="ff-hub-card" style={{ borderTopColor: a.color, borderTopWidth: 3 }}>
          <div className="ff-hub-card-icon" style={{ color: a.color }}>
            <i className={a.icon} />
          </div>
          <div className="ff-hub-card-title">{a.title}</div>
          <div className="ff-hub-card-desc">{a.desc}</div>
        </Link>
      ))}
    </div>
  );
}

export function HubPage() {
  const { currentUser, logout } = useRole();

  function handleReset() {
    if (window.confirm('Resetar dados de demonstração? Todas as interações serão apagadas.')) {
      resetDb();
      seedDb();
      window.location.reload();
    }
  }

  return (
    <div className="ff-hub-layout">
      <div className="ff-hub-header">
        <div className="ff-hub-title">🍽 Pertinho do Ceu</div>
        <div className="ff-hub-subtitle">
          {currentUser
            ? `Logado como ${currentUser.name} (${currentUser.role})`
            : 'Prototype — escolha uma área para entrar'}
        </div>
        {currentUser && (
          <button
            onClick={logout}
            style={{ marginTop: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#94a3b8', borderRadius: 8, padding: '4px 14px', cursor: 'pointer', fontSize: 13 }}
          >
            Sair
          </button>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: 900 }}>
        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
          Áreas do cliente
        </div>
        <AreaGrid areas={customerAreas} />

        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', margin: '24px 0 10px' }}>
          Operação
        </div>
        <AreaGrid areas={operationalAreas} />

        <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', margin: '24px 0 10px' }}>
          Novas funcionalidades
        </div>
        <AreaGrid areas={newAreas} />
      </div>

      <button className="ff-hub-reset-btn" onClick={handleReset}>
        <i className="bi bi-arrow-counterclockwise me-1" />
        Resetar dados de demonstração
      </button>
    </div>
  );
}
