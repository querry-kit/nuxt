describe('root public exports', () => {
  it('re-exports the intended runtime API and no type-only exports', async () => {
    const root = await import('./index');

    expect(Object.keys(root).sort()).toEqual([
      'andWhere',
      'createApiClient',
      'filteringToWhere',
      'isEqual',
      'mergeQuery',
      'parseJson',
      'pathsToFieldsQuery',
      'serializeQuery',
      'sortingToOrderBy',
      'unflatten',
      'useAutocomplete',
      'useModuleApi',
      'useTable',
    ]);
    for (const value of Object.values(root)) expect(value).toEqual(expect.any(Function));
  });
});
