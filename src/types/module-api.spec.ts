import type { EndpointDefinition, EndpointMap, PaginatedResponse, QueryParameters } from './module-api';

describe('module API types', () => {
  it('models endpoint and paginated response contracts', () => {
    const endpoint: EndpointDefinition<{ id: string }, { name: string }, { name?: string }> = {
      item: { id: 'one' },
      create: { name: 'Ada' },
      update: {},
    };
    const endpoints: EndpointMap = { users: endpoint };
    const response: PaginatedResponse<{ id: string }> = {
      items: [{ id: 'one' }],
      meta: { itemCount: 1, pageCount: 1 },
    };
    const query: QueryParameters = { page: 1 };

    expect([Object.keys(endpoints), endpoint.item, response.meta.itemCount, query.page]).toEqual([
      ['users'],
      { id: 'one' },
      1,
      1,
    ]);
  });
});
