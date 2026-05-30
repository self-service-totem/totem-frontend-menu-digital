import { Link } from 'react-router-dom';
import { resetDb, seedDb } from '@/lib/mock-db';

const areas = [
  { path: '/menu/branch-1/table/140', icon: 'bi-phone', title: 'Menu Digital', desc: 'Cliente – mesa / takeaway', color: '#e11d2a' },
  { path: '/kiosk', icon: 'bi-display', title: 'Kiosk / Totem', desc: 'Autoatendimento', color: '#7c3aed' },
  { path: '/kitchen/orders', icon: 'bi-fire', title: 'Cozinha', desc: 'Operação da cozinha', color: '#d97706' },
  { path: '/queue-display', icon: 'bi-tv', title: 'Painel de Fila', desc: 'TV / display público', color: '#0284c7' },
  { path: '/waiter-staff/tables', icon: 'bi-person-badge', title: 'Garçom', desc: 'Atendimento de piso', color: '#059669' },
  { path: '/cashier/orders', icon: 'bi-cash-register', title: 'Caixa', desc: 'Pagamentos e notas', color: '#9333ea' },
  { path: '/admin/dashboard', icon: 'bi-grid-1x2', title: 'Admin', desc: 'Gestão do restaurante', color: '#475569' },
];

export function HubPage() {
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
        <div className="ff-hub-subtitle">Prototype — escolha uma área para entrar</div>
      </div>

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

      <button className="ff-hub-reset-btn" onClick={handleReset}>
        <i className="bi bi-arrow-counterclockwise me-1" />
        Resetar dados de demonstração
      </button>
    </div>
  );
}
