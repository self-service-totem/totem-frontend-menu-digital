import { useEffect, useState } from 'react';
import { cashbackService } from '@/services';
import type { CashbackSummary } from '@/mocks/cashback';
import { useSession } from '@/app/SessionContext';
import { useLabels } from '@/i18n/I18nContext';
import { useNotify } from '@/lib/notifications';
import { TopBar } from '@/components/layout/TopBar';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { EmptyState } from '@/components/common/EmptyState';
import { formatMoney } from '@/utils/format';

export function CashbackPage() {
  const { t, language } = useLabels();
  const { menuContext } = useSession();
  const notify = useNotify();
  const currency = menuContext?.currency ?? 'BRL';

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
        <div className="ff-cashback-hero__amount">{formatMoney(summary.balance, currency)}</div>
        <div className="ff-cashback-hero__note">
          {t('cashback.note', { rate: summary.ratePct })}
        </div>
      </section>

      <section className="ff-section">
        <h2 className="ff-section-title ff-section-title--lg">{t('cashback.history')}</h2>
      </section>

      {summary.history.length === 0 ? (
        <EmptyState icon="bi-piggy-bank" title={t('cashback.empty')} />
      ) : (
        summary.history.map((entry) => (
          <article key={entry.id} className="ff-row">
            <div className="ff-cashback-row__body">
              <span className="ff-cashback-row__icon" aria-hidden>
                <i className="bi bi-piggy-bank" />
              </span>
              <div>
                <div className="ff-row__main">{entry.description}</div>
                <div className="ff-row__sub">
                  {new Date(entry.date).toLocaleDateString(language)}
                </div>
              </div>
            </div>
            <span className="ff-row__amount">+ {formatMoney(entry.amount, currency)}</span>
          </article>
        ))
      )}

      <div className="ff-cashback-cta">
        <PrimaryButton onClick={() => notify(t('cashback.signupToast'), 'info')}>
          {t('cashback.signup')}
        </PrimaryButton>
      </div>
    </div>
  );
}
