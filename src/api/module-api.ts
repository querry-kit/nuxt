import type { AxiosInstance, AxiosResponse } from 'axios';
import type { EndpointDefinition, EndpointMap, PaginatedResponse, QueryParameters } from '../types/module-api';
import { serializeQuery } from '../utils/serialize-query';

type ItemFor<TMap extends EndpointMap, TEndpoint extends keyof TMap> =
  TMap[TEndpoint] extends EndpointDefinition<infer TItem> ? TItem : never;
type CreateFor<TMap extends EndpointMap, TEndpoint extends keyof TMap> =
  TMap[TEndpoint] extends EndpointDefinition<unknown, infer TCreate> ? TCreate : never;
type UpdateFor<TMap extends EndpointMap, TEndpoint extends keyof TMap> =
  TMap[TEndpoint] extends EndpointDefinition<unknown, unknown, infer TUpdate> ? TUpdate : never;

/**
 * Provides typed Query Kit CRUD methods for one API endpoint.
 *
 * @typeParam TMap - Map associating endpoint names with resource and mutation payload types.
 * @typeParam TEndpoint - Key of the endpoint to expose.
 * @param api - Axios instance targeting the Query Kit API version.
 * @param endpoint - Endpoint name, with an optional leading slash.
 * @returns Typed `query`, `get`, `findById`, `count`, `create`, `update`, and `delete` methods.
 */
export function useModuleApi<TMap extends EndpointMap, TEndpoint extends keyof TMap & string>(
  api: AxiosInstance,
  endpoint: TEndpoint,
) {
  const path = `/${endpoint.replace(/^\/+/, '')}`;
  const withQuery = (query: QueryParameters = {}) => serializeQuery(query);
  const resource = (id: string | number) => `${path}/${encodeURIComponent(String(id))}`;

  return {
    query(query: QueryParameters = {}): Promise<AxiosResponse<PaginatedResponse<ItemFor<TMap, TEndpoint>>>> {
      return api.get(`${path}${withQuery(query)}`);
    },
    get(id: string | number, query: QueryParameters = {}): Promise<AxiosResponse<ItemFor<TMap, TEndpoint>>> {
      return api.get(`${resource(id)}${withQuery(query)}`);
    },
    findById(id: string | number, query: QueryParameters = {}): Promise<AxiosResponse<ItemFor<TMap, TEndpoint>>> {
      return api.get(`${path}/find-by-id/${encodeURIComponent(String(id))}${withQuery(query)}`);
    },
    count(query: QueryParameters = {}): Promise<AxiosResponse<number>> {
      return api.get(`${path}/count${withQuery(query)}`);
    },
    create(
      data: CreateFor<TMap, TEndpoint>,
      query: QueryParameters = {},
    ): Promise<AxiosResponse<ItemFor<TMap, TEndpoint>>> {
      return api.post(`${path}${withQuery(query)}`, data);
    },
    update(
      id: string | number,
      data: UpdateFor<TMap, TEndpoint>,
      query: QueryParameters = {},
    ): Promise<AxiosResponse<ItemFor<TMap, TEndpoint>>> {
      return api.patch(`${resource(id)}${withQuery(query)}`, data);
    },
    delete(id: string | number, query: QueryParameters = {}): Promise<AxiosResponse<ItemFor<TMap, TEndpoint>>> {
      return api.delete(`${resource(id)}${withQuery(query)}`);
    },
  };
}
