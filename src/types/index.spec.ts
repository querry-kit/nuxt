import type {
  ApiVersion,
  EndpointMap,
  StorageLike,
  TableColumn,
  UseAutocompleteOptions,
  UseTableOptions,
} from './index';

describe('types public exports', () => {
  it('re-exports all public type contracts', () => {
    const version: ApiVersion = 'v1';
    const endpoints: EndpointMap = {};
    const storage: StorageLike = { getItem: () => null, setItem: () => undefined };
    const column: TableColumn<{ id: string }> = { id: 'id' };
    const autocomplete = {} as UseAutocompleteOptions<{ id: string }>;
    const table = {} as UseTableOptions<{ id: string }>;

    expect([version, endpoints, storage.getItem('value'), column.id, autocomplete, table]).toHaveLength(6);
  });
});
