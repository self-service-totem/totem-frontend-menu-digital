import { useLabels } from '@/i18n/I18nContext';
import { formatCurrency as formatBRL } from '@/utils/format';
import { elapsedMins, fmtElapsed, ageSeverity, SEVERITY_STYLE } from '@/lib/utils/useElapsed';
import type { TableGroup } from '@/lib/services/cashierService';
import { CustomerSection } from './CustomerSection';
import { BORDER_COLOR, PAYMENT_STATUS_CONFIG } from './cashierUtils';

interface TableGroupCardProps {
  group: TableGroup;
  collapsed: boolean;
  onToggleCollapse: () => void;
  expandedCustomers: Set<string>;
  onToggleCustomer: (key: string) => void;
  onPayTable: () => void;
  onPayTablePartial: () => void;
  onPayCustomer: (name: string) => void;
  onPayCustomerPartial: (name: string) => void;
}

export function TableGroupCard({
  group, collapsed, onToggleCollapse,
  expandedCustomers, onToggleCustomer,
  onPayTable, onPayTablePartial,
  onPayCustomer, onPayCustomerPartial,
}: TableGroupCardProps) {
  const { t } = useLabels();
  const borderColor = BORDER_COLOR[group.paymentStatus] ?? '#6b7280';
  const statusCfg = PAYMENT_STATUS_CONFIG[group.paymentStatus];
  const unpaidCustomers = group.customers.filter((c) => !c.isPaid);

  const waitMins = group.table.updatedAt ? elapsedMins(group.table.updatedAt) : null;
  const waitSev = waitMins != null ? ageSeverity(waitMins, 15, 30) : 'ok';
  const waitStyle = SEVERITY_STYLE[waitSev];

  return (
    <div className="ff-data-card" style={{ borderLeft: `4px solid ${borderColor}`, padding: 0, overflow: 'hidden', transition: 'box-shadow .2s' }}>
      {/* ── Collapsed / Header row ── */}
      <div
        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, background: collapsed ? '#fff' : '#fafafa', borderBottom: collapsed ? 'none' : '1px solid #e5e7eb', cursor: 'pointer', flexWrap: 'wrap' }}
        onClick={onToggleCollapse}
      >
        {/* Table number */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <i className={`bi bi-chevron-${collapsed ? 'right' : 'down'}`} style={{ fontSize: 12, color: '#9ca3af' }} />
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${borderColor}15`, border: `1.5px solid ${borderColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: borderColor, letterSpacing: '-0.02em' }}>{group.table.number}</span>
          </div>
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>
            {group.paymentStatus === 'PAID' ? t('cashier.status.paid') : group.paymentStatus === 'PARTIALLY_PAID' ? t('cashier.status.partial') : t('cashier.status.pending')}
          </span>
          {waitMins != null && group.paymentStatus !== 'PAID' && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: waitStyle.bg, color: waitStyle.color, border: `1px solid ${waitStyle.border}`, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="bi bi-clock" style={{ fontSize: 10 }} />{fmtElapsed(waitMins)}
            </span>
          )}
        </div>

        {/* Metadata pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#6b7280' }}>
          <span><i className="bi bi-people me-1" />{group.customers.length}</span>
          <span><i className="bi bi-receipt me-1" />{group.activeOrdersCount}</span>
        </div>

        {/* Financial summary — always visible */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {group.paymentStatus !== 'PAID' && group.remaining > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{t('cashier.table.due')}</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#e11d2a', letterSpacing: '-0.01em' }}>{formatBRL(group.remaining)}</div>
            </div>
          )}
          {group.paymentStatus !== 'PAID' && (
            <button
              style={{ padding: '9px 16px', border: 'none', borderRadius: 10, background: '#059669', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={(e) => { e.stopPropagation(); onPayTable(); }}
            >
              <i className="bi bi-check2-all" />{t('cashier.table.receive')}
            </button>
          )}
          {group.paymentStatus === 'PAID' && (
            <span style={{ fontSize: 14, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-check-circle-fill" />{formatBRL(group.totalDue)}
            </span>
          )}
        </div>
      </div>

      {/* ── Expanded: totals bar + customer sections ── */}
      {!collapsed && (
        <>
          {/* Financial totals bar */}
          <div style={{ padding: '10px 16px 10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, flex: 1, flexWrap: 'wrap' }}>
              <span style={{ color: '#6b7280' }}>
                {t('cashier.table.total')} <strong style={{ color: '#1a1a1a' }}>{formatBRL(group.totalDue)}</strong>
              </span>
              {group.totalPaid > 0 && (
                <span style={{ color: '#059669' }}>
                  {t('cashier.table.paid')} <strong>{formatBRL(group.totalPaid)}</strong>
                </span>
              )}
              {group.remaining > 0 && (
                <span style={{ color: '#e11d2a', fontWeight: 700 }}>
                  {t('cashier.table.remaining')} {formatBRL(group.remaining)}
                </span>
              )}
            </div>
            {group.paymentStatus !== 'PAID' && (
              <button
                style={{ fontSize: 12, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}
                onClick={onPayTablePartial}
              >
                <i className="bi bi-scissors me-1" />{t('cashier.table.partialBtn')}
              </button>
            )}
          </div>

          {/* Customer sections */}
          {group.customers.map((customer) => {
            const key = `${group.table.id}::${customer.name}`;
            return (
              <CustomerSection
                key={key}
                customer={customer}
                tableId={group.table.id}
                expanded={expandedCustomers.has(key)}
                onToggle={() => onToggleCustomer(key)}
                onPayCustomer={() => onPayCustomer(customer.name)}
                onPayPartial={() => onPayCustomerPartial(customer.name)}
              />
            );
          })}

          {unpaidCustomers.length === 0 && group.remaining <= 0 && (
            <div style={{ padding: '12px 16px', fontSize: 13, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4' }}>
              <i className="bi bi-check-circle-fill" />{t('cashier.table.allPaid')}
            </div>
          )}
        </>
      )}
    </div>
  );
}
