import { useState } from 'react';
import { useLabels } from '@/i18n/I18nContext';
import { LanguageSelector } from '@/components/common/LanguageSelector';

interface AppHeaderProps {
  businessName: string;
  tableName: string;
  customerName?: string;
}

export function AppHeader({ businessName, tableName }: AppHeaderProps) {
  const { t } = useLabels();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="ff-app-header">
      <div className="ff-app-header__info">
        <span className="ff-app-header__name">{businessName}</span>
        <span className="ff-app-header__table">
          <i className="bi bi-geo-alt-fill" aria-hidden /> {tableName}
        </span>
      </div>

      <div className="ff-app-header__lang">
        <button
          type="button"
          className="ff-app-header__lang-btn"
          onClick={() => setLangOpen((v) => !v)}
          aria-label={t('nav.language')}
          aria-expanded={langOpen}
        >
          <i className="bi bi-translate" aria-hidden />
        </button>
        {langOpen && (
          <>
            <div className="ff-app-header__lang-overlay" onClick={() => setLangOpen(false)} />
            <div className="ff-app-header__lang-popup" role="menu">
              <LanguageSelector variant="pills" onSelect={() => setLangOpen(false)} />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
