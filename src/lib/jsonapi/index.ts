export type {
  JsonApiResourceIdentifier,
  JsonApiRelationship,
  JsonApiRelationshipOne,
  JsonApiRelationshipMany,
  JsonApiResource,
  JsonApiResponse,
  JsonApiCollectionResponse,
  JsonApiErrorObject,
  JsonApiErrorResponse,
} from './types';

export { toJsonApiResponse, toJsonApiCollectionResponse, resourceId } from './helpers';

export type {
  MenuContextAttributes,
  BusinessAttributes,
  TableAttributes,
  CategoryAttributes,
  ProductAttributes,
} from './mappers';

export {
  mapMenuContextResponseToViewModel,
  mapCategoryResourceToViewModel,
  mapCategoriesResponseToViewModels,
  mapProductResourceToViewModel,
  mapProductsResponseToViewModels,
  mapProductResponseToViewModel,
} from './mappers';
