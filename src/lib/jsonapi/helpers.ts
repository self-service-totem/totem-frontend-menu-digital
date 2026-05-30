import type {
  JsonApiResource,
  JsonApiResponse,
  JsonApiCollectionResponse,
} from './types';

/** Wrap a single resource in a JSON:API response envelope. */
export function toJsonApiResponse<T>(
  resource: JsonApiResource<T>,
  included?: JsonApiResource[],
  meta?: Record<string, unknown>,
): JsonApiResponse<T> {
  return {
    data: resource,
    ...(included?.length ? { included } : {}),
    meta: { source: 'mock', ...meta },
  };
}

/** Wrap an array of resources in a JSON:API collection response envelope. */
export function toJsonApiCollectionResponse<T>(
  resources: JsonApiResource<T>[],
  included?: JsonApiResource[],
  meta?: Record<string, unknown>,
): JsonApiCollectionResponse<T> {
  return {
    data: resources,
    ...(included?.length ? { included } : {}),
    meta: { source: 'mock', total: resources.length, ...meta },
  };
}

/** Build a resource identifier object. */
export function resourceId(type: string, id: string) {
  return { type, id };
}
