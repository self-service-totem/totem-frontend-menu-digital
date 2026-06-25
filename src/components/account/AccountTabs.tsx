import { useLabels } from '@/i18n/I18nContext';

export type AccountTab = 'mesa' | 'individual';

interface AccountTabsProps {
  active: AccountTab;
  onChange: (tab: AccountTab) => void;
}

export function AccountTabs({ active, onChange }: AccountTabsProps) {
  const { t } = useLabels();
  return (
    <div className="ff-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={active === 'mesa'}
        className={`ff-tab ${active === 'mesa' ? 'ff-tab--active' : ''}`}
        onClick={() => onChange('mesa')}
      >
        <i className="bi bi-people" />
        {t('bill.tabTable')}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === 'individual'}
        className={`ff-tab ${active === 'individual' ? 'ff-tab--active' : ''}`}
        onClick={() => onChange('individual')}
      >
        <i className="bi bi-person" />
        {t('bill.tabIndividual')}
      </button>
    </div>
  );
}
