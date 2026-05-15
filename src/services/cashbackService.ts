import { mockCashback, type CashbackSummary } from '@/mocks/cashback';
import { delay } from './api';

export const cashbackService = {
  async getSummary(): Promise<CashbackSummary> {
    return delay(mockCashback);
  },
};
