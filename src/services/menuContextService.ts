import type { MenuContext } from '@/types';
import { buildMockMenuContext } from '@/mocks/business';
import { delay } from './api';

// Cuando exista el backend:
// return request<MenuContext>(`/public/menu-context?tableId=${encodeURIComponent(tableId)}`);
export const menuContextService = {
  async get(tableId: string): Promise<MenuContext> {
    return delay(buildMockMenuContext(tableId));
  },
};
