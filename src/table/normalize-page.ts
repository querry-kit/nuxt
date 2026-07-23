export function normalisePage(value: unknown): number | undefined {
  const page = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(page) && page > 0 ? page : undefined;
}
