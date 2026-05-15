import { useLabels } from '@/i18n/I18nContext';

interface AppHeaderProps {
  businessName: string;
  tableName: string;
  customerName?: string;
}

export function AppHeader({ businessName, tableName, customerName }: AppHeaderProps) {
  const { t } = useLabels();
  return (
    <header className="ff-app-header">
      <div className="ff-app-header__brand">
        <span className="ff-app-header__name">{businessName}</span>
        <span className="ff-app-header__table">
          <i className="bi bi-qr-code" aria-hidden /> {tableName}
        </span>
      </div>
      {customerName && (
        <div className="ff-app-header__welcome">
          {t('menu.greeting')}, {customerName.split(' ')[0]} 👋
        </div>
      )}
    </header>
  );
}
