describe('api public exports', () => {
  it('exports only the public API functions', async () => {
    const api = await import('./index');

    expect(Object.keys(api).sort()).toEqual(['createApiClient', 'useModuleApi']);
    for (const value of Object.values(api)) expect(value).toEqual(expect.any(Function));
  });
});
