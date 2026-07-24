import { ref } from 'vue';

import type {
  FilterFieldDefinition,
  FilteringField,
  FilteringFieldOperator,
  FilteringState,
  RoutePageRef,
  SortingField,
  StorageLike,
  TableColumn,
  TableColumnInput,
} from './table';

describe('table types', () => {
  it('models storage, columns, filtering, and route page adapters', () => {
    const storage: StorageLike = { getItem: () => null, setItem: () => undefined };
    const input: TableColumnInput<{ id: string }, { header: string }> = { header: 'Name' };
    const column: TableColumn<{ id: string }, { header: string }> = { id: 'id', header: 'ID' };
    const filterField: FilterFieldDefinition<'select', { multiple: boolean }> = {
      value: 'status',
      label: 'Status',
      type: 'select',
      multiple: true,
    };
    const filteringField: FilteringField<'select', FilteringFieldOperator, string[]> = {
      id: 'status',
      field: filterField.value,
      type: filterField.type,
      operator: 'in',
      value: ['active'],
    };
    const filtering: FilteringState<typeof filteringField> = { operator: 'AND', filters: [filteringField] };
    const sortingField: SortingField<{ disabled?: boolean }> = { value: 'name', label: 'Name' };
    const routePage: RoutePageRef = ref(1);

    expect([
      storage.getItem('missing'),
      input.header,
      column.id,
      filtering.operator,
      sortingField.value,
      routePage.value,
    ]).toEqual([null, 'Name', 'id', 'AND', 'name', 1]);
  });
});
