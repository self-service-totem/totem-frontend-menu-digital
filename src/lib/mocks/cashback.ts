export interface CashbackEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export interface CashbackSummary {
  balance: number;
  ratePct: number;
  history: CashbackEntry[];
}

export const mockCashback: CashbackSummary = {
  balance: 24.55,
  ratePct: 5,
  history: [
    {
      id: 'cb-1',
      date: '2026-05-02',
      description: 'Pedido #1024 — Pertinho do Ceu',
      amount: 6.4,
    },
    {
      id: 'cb-2',
      date: '2026-04-21',
      description: 'Pedido #0987 — Pertinho do Ceu',
      amount: 9.15,
    },
    {
      id: 'cb-3',
      date: '2026-04-09',
      description: 'Pedido #0951 — Pertinho do Ceu',
      amount: 9.0,
    },
  ],
};
