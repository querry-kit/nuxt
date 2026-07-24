import { ref } from 'vue';

import type { FilteringState, RoutePageRef, StorageLike, TableColumn, TableColumnInput } from './table';

describe('table types', () => {
  it('models storage, columns, filtering, and route page adapters', () => {
    const storage: StorageLike = { getItem: () => null, setItem: () => undefined };
    const input: TableColumnInput<{ id: string }, { header: string }> = { header: 'Name' };
    const column: TableColumn<{ id: string }, { header: string }> = { id: 'id', header: 'ID' };
    const filtering: FilteringState = { operator: 'AND', filters: [] };
    const routePage: RoutePageRef = ref(1);

    expect([storage.getItem('missing'), input.header, column.id, filtering.operator, routePage.value]).toEqual([
      null,
      'Name',
      'id',
      'AND',
      1,
    ]);
  });
});
