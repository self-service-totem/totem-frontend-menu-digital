import { useEffect, useState } from 'react';
import { cashbackService } from '@/services';
import type { CashbackSummary } from '@/mocks/cashback';
import { TopBar } from '@/components/layout/TopBar';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { formatMoney } from '@/utils/format';
import { useLabels } from '@/i18n/I18nContext';

export function CashbackPage() {
  const { t } = useLabels();
  const [summary, setSummary] = useState<CashbackSummary | null>(null);

  useEffect(() => {
    cashbackService.getSummary().then(setSummary);
  }, []);

  if (!summary) {
    return (
      <div className="ff-page">
        <TopBar title={t('cashback.title')} />
        <div className="ff-empty">
          <i className="bi bi-arrow-repeat" />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-page">
      <TopBar title={t('cashback.title')} />

      <section className="ff-cashback-hero">
        <div className="ff-cashback-hero__label">{t('cashback.balance')}</div>
        <div className="ff-cashback-hero__amount">{formatMoney(summary.balance)}</div>
        <div className="ff-cashback-hero__note">
          {t('cashback.note', { rate: summary.ratePct })}
        </div>
      </section>

      <section className="ff-section">
        <h2 className="ff-section-title ff-section-title--lg">{t('cashback.history')}</h2>
      </section>

      {summary.history.map((entry) => (
        <article key={entry.id} className="ff-row">
          <div>
            <div className="ff-row__main">{entry.description}</div>
            <div className="ff-row__sub">
              {new Date(entry.date).toLocaleDateString()}
            </div>
          </div>
          <span className="ff-row__amount">+ {formatMoney(entry.amount)}</span>
        </article>
      ))}

      <div style={{ padding: '12px 16px' }}>
        <PrimaryButton onClick={() => alert(t('cashback.signup'))}>
          {t('cashback.signup')}
        </PrimaryButton>
      </div>
    </div>
  );
}
