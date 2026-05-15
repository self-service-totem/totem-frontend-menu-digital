import { useEffect, useState } from 'react';
import type { Bill } from '@/types';
import { orderService } from '@/services';
import { useSession } from '@/app/SessionContext';
import { useLabels } from '@/i18n/I18nContext';
import { TopBar } from '@/components/layout/TopBar';
import { AccountTabs, type AccountTab } from '@/components/account/AccountTabs';
import { OrderSummary } from '@/components/account/OrderSummary';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { EmptyState } from '@/components/common/EmptyState';
import { formatMoney } from '@/utils/format';

export function CloseAccountPage() {
  const { tableId, customer } = useSession();
  const { t } = useLabels();

  const [tab, setTab] = useState<AccountTab>('mesa');
  const [bill, setBill] = useState<Bill | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    if (!tableId) return;
    orderService.getBill(tableId).then(setBill);
  }, [tableId]);

  const requestClose = async (scope: 'table' | 'mine') => {
    if (!tableId) return;
    setRequesting(true);
    try {
      await orderService.requestCloseBill(tableId, {
        customerName: customer?.name ?? scope === 'table' ? 'mesa' : (customer?.name ?? ''),
      });
      setConfirmation(t('bill.requestSent'));
      setTimeout(() => setConfirmation(null), 3500);
    } finally {
      setRequesting(false);
    }
  };

  if (!bill) {
    return (
      <div className="ff-page">
        <TopBar title={t('bill.title')} />
        <div className="ff-empty">
          <i className="bi bi-arrow-repeat" />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const myAccount = bill.customers.find((c) => c.customerName === customer?.name);
  const myServiceFee = myAccount ? +(myAccount.subtotal * 0.1).toFixed(2) : 0;
  const myTotal = myAccount ? +(myAccount.subtotal + myServiceFee).toFixed(2) : 0;

  return (
    <div className="ff-page">
      <TopBar title={bill.tableName} />
      <AccountTabs active={tab} onChange={setTab} />

      {confirmation && (
        <div
          role="status"
          style={{
            margin: '0 16px 12px',
            padding: 12,
            background: 'var(--ff-primary-soft)',
            color: 'var(--ff-primary)',
            borderRadius: 'var(--ff-radius-md)',
            fontSize: '0.9rem',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          <i className="bi bi-check-circle-fill" /> {confirmation}
        </div>
      )}

      {tab === 'mesa' ? (
        <>
          {bill.customers.length === 0 ? (
            <EmptyState icon="bi-receipt" title={t('bill.empty')} />
          ) : (
            bill.customers.map((c) => (
              <article key={c.customerName} className="ff-person">
                <header className="ff-person__head">
                  <span className="ff-person__name">{c.customerName}</span>
                  <span className="ff-person__total">{formatMoney(c.subtotal)}</span>
                </header>
                {c.items.map((it) => (
                  <div key={`${c.customerName}-${it.productId}`} className="ff-person__line">
                    <span>
                      {it.quantity}× {it.productName}
                    </span>
                    <span>{formatMoney(it.total)}</span>
                  </div>
                ))}
              </article>
            ))
          )}

          {bill.customers.length > 0 && (
            <>
              <OrderSummary
                subtotal={bill.subtotal}
                serviceFee={bill.serviceFee}
                total={bill.tableTotal}
                serviceFeeLabel={t('summary.serviceFee')}
              />
              <div className="ff-sticky-cta">
                <PrimaryButton
                  onClick={() => requestClose('table')}
                  disabled={requesting}
                >
                  {t('bill.closeTable')}
                </PrimaryButton>
              </div>
            </>
          )}
        </>
      ) : myAccount ? (
        <>
          <article className="ff-person">
            <header className="ff-person__head">
              <span className="ff-person__name">{myAccount.customerName}</span>
              <span className="ff-person__total">{formatMoney(myAccount.subtotal)}</span>
            </header>
            {myAccount.items.map((it) => (
              <div key={it.productId} className="ff-person__line">
                <span>
                  {it.quantity}× {it.productName}
                </span>
                <span>{formatMoney(it.total)}</span>
              </div>
            ))}
          </article>

          <OrderSummary
            subtotal={myAccount.subtotal}
            serviceFee={myServiceFee}
            total={myTotal}
            serviceFeeLabel={t('summary.serviceFee')}
          />

          <div className="ff-sticky-cta">
            <PrimaryButton
              onClick={() => requestClose('mine')}
              disabled={requesting}
            >
              {t('bill.closeMine')}
            </PrimaryButton>
          </div>
        </>
      ) : (
        <EmptyState icon="bi-receipt" title={t('bill.empty')} />
      )}
    </div>
  );
}
