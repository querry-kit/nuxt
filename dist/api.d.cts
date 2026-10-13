import { AxiosInstance, AxiosResponse } from 'axios';
import { C as CreateApiClientOptions, A as ApiVersion } from './api-BjAQ0AIa.cjs';
import { a as EndpointMap, Q as QueryParameters, P as PaginatedResponse, E as EndpointDefinition } from './module-api-BKXoZbyX.cjs';

/**
 * Creates an Axios instance configured for a Query Kit REST API.
 *
 * The client is intentionally independent from Nuxt runtime configuration and application stores.
 *
 * @param {CreateApiClientOptions} options - Origin and per-request header resolvers owned by the consuming application.
 * @param {ApiVersion} version - API path version appended after `/api`; currently `v1`.
 * @returns An Axios instance whose base URL is `<origin>/api/<version>`.
 */
declare function createApiClient(options: CreateApiClientOptions, version?: ApiVersion): AxiosInstance;

type ItemFor<TMap extends EndpointMap, TEndpoint extends keyof TMap> = TMap[TEndpoint] extends EndpointDefinition<infer TItem> ? TItem : never;
type CreateFor<TMap extends EndpointMap, TEndpoint extends keyof TMap> = TMap[TEndpoint] extends EndpointDefinition<unknown, infer TCreate> ? TCreate : never;
type UpdateFor<TMap extends EndpointMap, TEndpoint extends keyof TMap> = TMap[TEndpoint] extends EndpointDefinition<unknown, unknown, infer TUpdate> ? TUpdate : never;
/**
 * Provides typed Query Kit CRUD methods for one API endpoint.
 *
 * @typeParam TMap - Map associating endpoint names with resource and mutation payload types.
 * @typeParam TEndpoint - Key of the endpoint to expose.
 * @param api - Axios instance targeting the Query Kit API version.
 * @param endpoint - Endpoint name, with an optional leading slash.
 * @returns Typed `query`, `get`, `findById`, `count`, `create`, `update`, and `delete` methods.
 */
declare function useModuleApi<TMap extends EndpointMap, TEndpoint extends keyof TMap & string>(api: AxiosInstance, endpoint: TEndpoint): {
    query(query?: QueryParameters): Promise<AxiosResponse<PaginatedResponse<ItemFor<TMap, TEndpoint>>>>;
    get(id: string | number, query?: QueryParameters): Promise<AxiosResponse<ItemFor<TMap, TEndpoint>>>;
    findById(id: string | number, query?: QueryParameters): Promise<AxiosResponse<ItemFor<TMap, TEndpoint>>>;
    count(query?: QueryParameters): Promise<AxiosResponse<number>>;
    create(data: CreateFor<TMap, TEndpoint>, query?: QueryParameters): Promise<AxiosResponse<ItemFor<TMap, TEndpoint>>>;
    update(id: string | number, data: UpdateFor<TMap, TEndpoint>, query?: QueryParameters): Promise<AxiosResponse<ItemFor<TMap, TEndpoint>>>;
    delete(id: string | number, query?: QueryParameters): Promise<AxiosResponse<ItemFor<TMap, TEndpoint>>>;
};

export { createApiClient, useModuleApi };
