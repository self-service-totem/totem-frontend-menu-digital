// F4: Loyalty / stamp card
import { getCollection, insertOne, updateOne, findWhere } from '@/lib/mock-db';
import { BRANCH_ID, TENANT_ID } from '@/lib/mock-db';
import type { LoyaltyCard } from '@/lib/types';
import { STAMPS_PER_REWARD } from '@/lib/types';

function delay<T>(v: T, ms = 150): Promise<T> {
  return new Promise((r) => setTimeout(() => r(v), ms));
}

export const loyaltyService = {
  async getCard(customerPhone: string): Promise<LoyaltyCard | null> {
    const cards = findWhere<LoyaltyCard>('loyaltyCards', (c) => c.customerPhone === customerPhone);
    return delay(cards[0] ?? null);
  },

  async getOrCreate(customerPhone: string, customerName: string): Promise<LoyaltyCard> {
    const existing = await loyaltyService.getCard(customerPhone);
    if (existing) return existing;
    const now = new Date().toISOString();
    const card: LoyaltyCard = {
      id: `lc-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      customerPhone,
      customerName,
      stamps: 0,
      totalStampsEarned: 0,
      discountsUsed: 0,
      createdAt: now,
      updatedAt: now,
    };
    return delay(insertOne('loyaltyCards', card));
  },

  async addStamp(customerPhone: string): Promise<LoyaltyCard | null> {
    const cards = getCollection<LoyaltyCard>('loyaltyCards');
    const card = cards.find((c) => c.customerPhone === customerPhone);
    if (!card) return delay(null);
    const newStamps = card.stamps + 1;
    // Reward threshold — reset stamps when reached
    const stamps = newStamps >= STAMPS_PER_REWARD ? 0 : newStamps;
    const discountsUsed = newStamps >= STAMPS_PER_REWARD ? card.discountsUsed + 1 : card.discountsUsed;
    return delay(
      updateOne<LoyaltyCard>('loyaltyCards', card.id, {
        stamps,
        totalStampsEarned: card.totalStampsEarned + 1,
        discountsUsed,
      }),
    );
  },

  async listAll(): Promise<LoyaltyCard[]> {
    return delay(getCollection<LoyaltyCard>('loyaltyCards'));
  },

  stampsUntilReward(card: LoyaltyCard): number {
    return STAMPS_PER_REWARD - card.stamps;
  },
};
