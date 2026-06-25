import { useState } from 'react';
import type { FloorTable } from '@/lib/services/waiterStaffService';
import type { MockUser } from '@/lib/types';

interface ReassignModalProps {
  table: FloorTable;
  waiters: MockUser[];
  onSave: (tableId: string, waiterName: string) => void;
  onClose: () => void;
}

export function ReassignModal({ table, waiters, onSave, onClose }: ReassignModalProps) {
  const [selected, setSelected] = useState(table.assignedWaiterName ?? '');

  return (
    <div className="ff-waiter-modal-overlay" onClick={onClose}>
      <div className="ff-waiter-modal-box" onClick={(e) => e.stopPropagation()}>
        <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>
          Reatribuir — Mesa {table.number}
        </h5>
        <div>
          <label className="ff-waiter-modal-label">Garçom responsável</label>
          <select className="form-select form-select-sm" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">— Sem atribuição —</option>
            {waiters.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}
          </select>
        </div>
        <div className="ff-waiter-modal-actions">
          <button className="btn btn-primary flex-1" style={{ fontWeight: 700, borderRadius: 8 }} onClick={() => onSave(table.id, selected)}>
            Salvar
          </button>
          <button className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
