import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  title: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}

export function TopBar({ title, onBack, rightSlot }: TopBarProps) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));
  return (
    <div className="ff-topbar">
      <button
        type="button"
        className="ff-iconbtn"
        onClick={handleBack}
        aria-label="Volver"
      >
        <i className="bi bi-chevron-left" />
      </button>
      <h1 className="ff-topbar__title">{title}</h1>
      <div style={{ width: 40, display: 'flex', justifyContent: 'flex-end' }}>{rightSlot}</div>
    </div>
  );
}
