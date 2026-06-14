import { useEffect, useState } from 'react';
import { loyaltyService } from '@/lib/services/loyaltyService';
import type { LoyaltyCard } from '@/lib/types';
import { STAMPS_PER_REWARD } from '@/lib/types';

export function LoyaltySection() {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  useEffect(() => { loyaltyService.listAll().then(setCards); }, []);

  return (
    <div className="ff-data-card">
      <div className="ff-data-card-header">
        Cartões fidelidade
        <span className="badge bg-primary">{cards.length}</span>
      </div>
      {cards.length === 0 && <div className="text-center text-muted py-4">Nenhum cliente cadastrado ainda.</div>}
      <table className="table table-hover mb-0">
        <thead>
          <tr><th>Cliente</th><th>Telefone</th><th>Selos</th><th>Total ganho</th><th>Descontos usados</th></tr>
        </thead>
        <tbody>
          {cards.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.customerName}</strong></td>
              <td>{c.customerPhone}</td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: STAMPS_PER_REWARD }).map((_, i) => (
                    <span key={i} style={{ fontSize: 16 }}>{i < c.stamps ? '⭐' : '○'}</span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{c.stamps}/{STAMPS_PER_REWARD}</div>
              </td>
              <td>{c.totalStampsEarned}</td>
              <td>{c.discountsUsed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
