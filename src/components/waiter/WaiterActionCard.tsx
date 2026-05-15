interface WaiterActionCardProps {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
}

export function WaiterActionCard({ icon, label, onClick, active }: WaiterActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? 'var(--ff-primary)' : '#fff',
        color: active ? '#fff' : 'var(--ff-text)',
        border: '1px solid var(--ff-border)',
        borderRadius: 'var(--ff-radius-md)',
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '0.9rem',
        transition: 'background 120ms ease, color 120ms ease',
      }}
    >
      <i className={`bi ${icon}`} style={{ fontSize: '1.6rem' }} aria-hidden />
      <span>{label}</span>
    </button>
  );
}
