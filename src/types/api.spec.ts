import type { ApiVersion, CreateApiClientOptions } from './api';

describe('API type contracts', () => {
  it('accepts the supported version and client options', () => {
    const version: ApiVersion = 'v1';
    const options: CreateApiClientOptions = { apiBaseUrl: 'https://api.example', getToken: () => 'token' };

    expect([version, options.apiBaseUrl]).toEqual(['v1', 'https://api.example']);
  });
});
