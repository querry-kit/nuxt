import type { TableColumn, TableColumnInput } from '../types/table';

/**
 * Fetches Query Kit list data and owns portable table state.
 *
 * Consumers provide route and storage adapters explicitly, keeping the composable usable in Vue and Nuxt alike.
 *
 * @typeParam TItem - Resource shape returned by the endpoint.
 * @param options - Endpoint, reactive columns, and optional routing, persistence, and callback adapters.
 * @returns Reactive table state plus `initialize`, `refresh`, and `updateRow` actions.
 */
export function hasColumnId<TItem extends Record<string, unknown>, TColumn extends TableColumnInput<TItem, object>>(
  column: TColumn,
): column is TColumn & TableColumn<TItem> {
  return typeof column.id === 'string' && column.id.length > 0;
}
