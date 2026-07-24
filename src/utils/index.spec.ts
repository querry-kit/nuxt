describe('utils public exports', () => {
  it('exports every utility without extra runtime values', async () => {
    const utils = await import('./index');

    expect(Object.keys(utils).sort()).toEqual([
      'andWhere',
      'filteringToWhere',
      'isEqual',
      'mergeQuery',
      'parseJson',
      'pathsToFieldsQuery',
      'serializeQuery',
      'sortingToOrderBy',
      'unflatten',
    ]);
    for (const value of Object.values(utils)) expect(value).toEqual(expect.any(Function));
  });
});
