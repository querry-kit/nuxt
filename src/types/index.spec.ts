import type {
  ApiVersion,
  EndpointMap,
  FilterFieldDefinition,
  FilteringFieldOperator,
  SortingField,
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
    const filter: FilterFieldDefinition<'text'> = { value: 'name', label: 'Name', type: 'text' };
    const operator: FilteringFieldOperator = 'equals';
    const sorting: SortingField = { value: 'name', label: 'Name' };
    const autocomplete = {} as UseAutocompleteOptions<{ id: string }>;
    const table = {} as UseTableOptions<{ id: string }>;

    expect([
      version,
      endpoints,
      storage.getItem('value'),
      column.id,
      filter,
      operator,
      sorting,
      autocomplete,
      table,
    ]).toHaveLength(9);
  });
});
