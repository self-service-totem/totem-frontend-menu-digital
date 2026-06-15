import { useEffect, useState } from 'react';
import { loyaltyService } from '@/lib/services/loyaltyService';
import type { LoyaltyCard } from '@/lib/types';
import { STAMPS_PER_REWARD } from '@/lib/types';
import {
  AdminPageHeader,
  AdminCard,
  AdminTable,
  AdminEmptyState,
} from '@/components/admin';
import type { AdminTableColumn } from '@/components/admin';

export function LoyaltySection() {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  useEffect(() => { loyaltyService.listAll().then(setCards); }, []);

  const columns: AdminTableColumn<LoyaltyCard>[] = [
    {
      key: 'customerName',
      label: 'Cliente',
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
      label: 'Selos',
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
      label: 'Total ganho',
      sortable: true,
      align: 'center',
      render: (c) => c.totalStampsEarned,
    },
    {
      key: 'discountsUsed',
      label: 'Descontos usados',
      sortable: true,
      align: 'center',
      render: (c) => c.discountsUsed,
    },
  ];

  return (
    <div style={{ maxWidth: 760 }}>
      <AdminPageHeader
        title="Fidelidade"
        subtitle="Cartões de fidelidade dos clientes"
        actions={
          cards.length > 0
            ? <span className="ff-admin-badge ff-admin-badge--blue">{cards.length} cliente{cards.length !== 1 ? 's' : ''}</span>
            : undefined
        }
      />

      <AdminCard noPad>
        {cards.length === 0 ? (
          <AdminEmptyState
            icon="bi-star"
            title="Nenhum cliente cadastrado"
            message="Os clientes que usarem o programa de fidelidade aparecerão aqui."
          />
        ) : (
          <AdminTable<LoyaltyCard>
            columns={columns}
            rows={cards}
            emptyIcon="bi-star"
            emptyTitle="Nenhum cartão encontrado"
          />
        )}
      </AdminCard>
    </div>
  );
}
