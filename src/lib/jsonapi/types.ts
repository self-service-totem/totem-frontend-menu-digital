// JSON:API 1.0 structural types.
// Mock services use these shapes so the response contract mirrors the future backend.

export interface JsonApiResourceIdentifier {
  type: string;
  id: string;
}

export interface JsonApiRelationshipOne {
  data: JsonApiResourceIdentifier | null;
}

export interface JsonApiRelationshipMany {
  data: JsonApiResourceIdentifier[];
}

export type JsonApiRelationship = JsonApiRelationshipOne | JsonApiRelationshipMany;

export interface JsonApiResource<TAttr = Record<string, unknown>> {
  type: string;
  id: string;
  attributes: TAttr;
  relationships?: Record<string, JsonApiRelationship>;
}

// Single-resource response
export interface JsonApiResponse<TAttr = Record<string, unknown>> {
  data: JsonApiResource<TAttr>;
  included?: JsonApiResource[];
  meta?: Record<string, unknown>;
}

// Collection response
export interface JsonApiCollectionResponse<TAttr = Record<string, unknown>> {
  data: JsonApiResource<TAttr>[];
  included?: JsonApiResource[];
  meta?: Record<string, unknown>;
}

// Error response
export interface JsonApiErrorObject {
  status: string;
  code?: string;
  title: string;
  detail?: string;
}

export interface JsonApiErrorResponse {
  errors: JsonApiErrorObject[];
  meta?: Record<string, unknown>;
}
