import { getCollection } from '@/lib/mock-db';
import type { Branch, Tenant, DbTable } from '@/lib/types';
import { toJsonApiResponse, resourceId } from '@/lib/jsonapi';
import type { JsonApiResponse, MenuContextAttributes, BusinessAttributes, TableAttributes } from '@/lib/jsonapi';
import { delay } from './api';

// GET /v1/public/menu-context?tableId={tableId}
// Returns a JSON:API response so the contract mirrors the future backend.
// Callers use mapMenuContextResponseToViewModel() to get a flat MenuContext view model.
export const menuContextService = {
  async get(tableId: string): Promise<JsonApiResponse<MenuContextAttributes>> {
    const branch = getCollection<Branch>('branches')[0];
    const tenant = getCollection<Tenant>('tenants')[0];
    const tables = getCollection<DbTable>('tables');
    const table = tables.find((t) => t.id === tableId || t.number === tableId);

    const restaurantName = tenant?.name ?? branch?.name ?? 'Restaurante';
    const currency = (branch?.currency ?? tenant?.currency ?? 'BRL') as MenuContextAttributes['currency'];
    const serviceFeeRate = branch?.serviceFeeRate ?? 0.1;
    const language = 'pt-BR';

    const tableIdResolved = table?.id ?? tableId;
    const tableName = table
      ? `Mesa ${table.number}`
      : tableId.startsWith('mesa-')
        ? `Mesa ${tableId.replace('mesa-', '')}`
        : `Mesa ${tableId}`;

    const businessId = branch?.id ?? tenant?.id ?? 'biz-1';

    const resource = {
      type: 'menu-context' as const,
      id: tableIdResolved,
      attributes: {
        tableId: tableIdResolved,
        tableName,
        restaurantName,
        language,
        currency,
        serviceFeeRate,
        tableValidationCode: table?.validationCode,
      },
      relationships: {
        business: { data: resourceId('business', businessId) },
        table: { data: resourceId('table', tableIdResolved) },
      },
    };

    const included = [
      {
        type: 'business' as const,
        id: businessId,
        attributes: {
          slug: tenant?.slug ?? 'restaurante',
          name: restaurantName,
          currency,
          serviceFeeRate,
          logoUrl: tenant?.logoUrl,
        } satisfies BusinessAttributes,
      },
      {
        type: 'table' as const,
        id: tableIdResolved,
        attributes: {
          number: table?.number ?? tableId,
          businessId,
          branchId: branch?.id ?? '',
          active: table?.active ?? true,
        } satisfies TableAttributes,
      },
    ];

    return delay(toJsonApiResponse(resource, included));
  },
};
