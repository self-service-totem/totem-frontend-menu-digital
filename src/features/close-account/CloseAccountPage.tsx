import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Bill } from '@/types';
import { orderService } from '@/services';
import { useSession } from '@/app/SessionContext';
import { useLabels } from '@/i18n/I18nContext';
import { useNotify } from '@/lib/notifications';
import { AccountTabs, type AccountTab } from '@/components/account/AccountTabs';
import { BillPersonCard } from '@/components/account/BillPersonCard';
import { OrderSummary } from '@/components/account/OrderSummary';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { EmptyState } from '@/components/common/EmptyState';

export function CloseAccountPage() {
  const navigate = useNavigate();
  const { tableId, customer, menuContext } = useSession();
  const { t } = useLabels();
  const notify = useNotify();

  const currency = menuContext?.currency ?? 'BRL';
  const serviceFeeRate = menuContext?.serviceFeeRate ?? 0.1;

  const [tab, setTab] = useState<AccountTab>('mesa');
  const [bill, setBill] = useState<Bill | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!tableId) return;
    orderService.getBill(tableId).then(setBill);
  }, [tableId]);

  const requestClose = async (scope: 'table' | 'mine') => {
    if (!tableId) return;
    setRequesting(true);
    try {
      await orderService.requestCloseBill(tableId, {
        customerName: scope === 'table' ? (customer?.name ?? 'mesa') : (customer?.name ?? ''),
      });
      notify(t('bill.requestSent'), 'success');
    } finally {
      setRequesting(false);
    }
  };

  const Header = (
    <div className="ff-bill-header">
      <h1 className="ff-bill-header__title">{t('bill.title')}</h1>
      <button type="button" className="ff-bill-header__back" onClick={() => navigate(-1)}>
        <i className="bi bi-chevron-left" /> {t('common.back')}
      </button>
    </div>
  );

  if (!bill) {
    return (
      <div className="ff-page">
        {Header}
        <div className="ff-empty">
          <i className="bi bi-arrow-repeat" />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const myAccount = bill.customers.find((c) => c.customerName === customer?.name);
  const myServiceFee = myAccount ? +(myAccount.subtotal * serviceFeeRate).toFixed(2) : 0;
  const myTotal = myAccount ? +(myAccount.subtotal + myServiceFee).toFixed(2) : 0;

  return (
    <div className="ff-page">
      {Header}
      <AccountTabs active={tab} onChange={setTab} />

      {tab === 'mesa' ? (
        <>
          {bill.customers.length === 0 ? (
            <EmptyState icon="bi-receipt" title={t('bill.empty')} />
          ) : (
            bill.customers.map((c) => (
              <BillPersonCard
                key={c.customerName}
                name={c.customerName}
                items={c.items}
                subtotal={c.subtotal}
                currency={currency}
                isMe={c.customerName === customer?.name}
              />
            ))
          )}

          {bill.customers.length > 0 && (
            <>
              <OrderSummary
                subtotal={bill.subtotal}
                serviceFee={bill.serviceFee}
                total={bill.tableTotal}
                currency={currency}
                serviceFeeLabel={t('summary.serviceFee')}
              />
              <div className="ff-sticky-cta">
                <PrimaryButton onClick={() => requestClose('table')} disabled={requesting}>
                  {t('bill.closeTable')}
                </PrimaryButton>
              </div>
            </>
          )}
        </>
      ) : myAccount ? (
        <>
          <BillPersonCard
            name={myAccount.customerName}
            items={myAccount.items}
            subtotal={myAccount.subtotal}
            currency={currency}
            isMe
          />

          <OrderSummary
            subtotal={myAccount.subtotal}
            serviceFee={myServiceFee}
            total={myTotal}
            currency={currency}
            serviceFeeLabel={t('summary.serviceFee')}
          />

          <div className="ff-sticky-cta">
            <PrimaryButton onClick={() => requestClose('mine')} disabled={requesting}>
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
