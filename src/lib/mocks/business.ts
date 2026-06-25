import type { Business, MenuContext, Table } from '@/lib/types';

export const mockBusiness: Business = {
  id: 'biz-1',
  slug: 'pertinho-do-ceu',
  name: 'Pertinho do Ceu',
  currency: 'BRL',
  serviceFeeRate: 0.1,
};

export const mockTable: Table = {
  id: 'table-140',
  number: '140',
  businessId: 'biz-1',
};

// Lo que devolvería GET /api/public/menu-context?tableId={tableId}.
// El backoffice define restaurantName e idioma; tableId/tableName vienen del QR.
export function buildMockMenuContext(tableId: string): MenuContext {
  return {
    tableId,
    tableName: tableId.startsWith('mesa-')
      ? `Mesa ${tableId.replace('mesa-', '')}`
      : `Mesa ${tableId}`,
    restaurantName: 'Pertinho do Ceu',
    language: 'pt-BR',
    currency: 'BRL',
    serviceFeeRate: 0.1,
  };
}
