interface AppHeaderProps {
  businessName: string;
  tableName: string;
  customerName?: string;
}

export function AppHeader({ businessName, tableName }: AppHeaderProps) {
  return (
    <header className="ff-app-header">
      <span className="ff-app-header__name">{businessName}</span>
      <span className="ff-app-header__table">
        <i className="bi bi-clock" aria-hidden /> {tableName}
      </span>
    </header>
  );
}
