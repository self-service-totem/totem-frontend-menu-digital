import { useEffect, useState } from 'react';
import { loyaltyService } from '@/lib/services/loyaltyService';
import type { LoyaltyCard } from '@/lib/types';
import { STAMPS_PER_REWARD } from '@/lib/types';
import { useLabels } from '@/i18n/I18nContext';
import {
  AdminPageHeader,
  AdminCard,
  AdminTable,
  AdminEmptyState,
} from '@/components/admin';
import type { AdminTableColumn } from '@/components/admin';

export function LoyaltySection() {
  const { t } = useLabels();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  useEffect(() => { loyaltyService.listAll().then(setCards); }, []);

  const columns: AdminTableColumn<LoyaltyCard>[] = [
    {
      key: 'customerName',
      label: t('common.customer'),
      sortable: true,
      render: (c) => <strong>{c.customerName}</strong>,
    },
    {
      key: 'customerPhone',
      label: 'Telefone',
      render: (c) => <span style={{ color: '#6b7280' }}>{c.customerPhone}</span>,
    },
    {
      key: 'stamps',
      label: t('adminLoyalty.stamps'),
      render: (c) => (
        <div>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: STAMPS_PER_REWARD }).map((_, i) => (
              <span key={i} style={{ fontSize: 14 }}>{i < c.stamps ? '⭐' : '○'}</span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.stamps}/{STAMPS_PER_REWARD}</div>
        </div>
      ),
    },
    {
      key: 'totalStampsEarned',
      label: t('adminLoyalty.totalEarned'),
      sortable: true,
      align: 'center',
      render: (c) => c.totalStampsEarned,
    },
    {
      key: 'discountsUsed',
      label: t('adminLoyalty.discountsUsed'),
      sortable: true,
      align: 'center',
      render: (c) => c.discountsUsed,
    },
  ];

  const badgeLabel = cards.length === 1
    ? `${cards.length} ${t('adminLoyalty.customerSingular')}`
    : `${cards.length} ${t('adminLoyalty.customerPlural')}`;

  return (
    <div style={{ maxWidth: 760 }}>
      <AdminPageHeader
        title={t('adminLoyalty.title')}
        subtitle={t('adminLoyalty.subtitle')}
        actions={
          cards.length > 0
            ? <span className="ff-admin-badge ff-admin-badge--blue">{badgeLabel}</span>
            : undefined
        }
      />

      <AdminCard noPad>
        {cards.length === 0 ? (
          <AdminEmptyState
            icon="bi-star"
            title={t('adminLoyalty.noCustomers')}
            message={t('adminLoyalty.noCustomersDesc')}
          />
        ) : (
          <AdminTable<LoyaltyCard>
            columns={columns}
            rows={cards}
            emptyIcon="bi-star"
            emptyTitle={t('adminLoyalty.noCard')}
          />
        )}
      </AdminCard>
    </div>
  );
}
