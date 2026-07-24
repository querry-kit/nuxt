import type { InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';

import { createApiClient } from './api-client';

describe('createApiClient', () => {
  it('uses the resolved v1 endpoint and applies request headers', async () => {
    const api = createApiClient({
      apiBaseUrl: 'https://ignored.example/',
      resolveBaseUrl: () => 'https://api.example/',
      requestSource: 'tenant-web',
      getTimezone: () => 'Europe/Berlin',
      getToken: async () => 'secret',
    });
    let captured: InternalAxiosRequestConfig | undefined;
    api.defaults.adapter = async (config) => {
      captured = config;
      return { config, data: {}, headers: {}, status: 200, statusText: 'OK' };
    };

    await api.get('/users');

    expect(api.defaults.baseURL).toBe('https://api.example/api/v1');
    expect(AxiosHeaders.from(captured?.headers).get('Request-Source')).toBe('tenant-web');
    expect(AxiosHeaders.from(captured?.headers).get('Timezone')).toBe('Europe/Berlin');
    expect(AxiosHeaders.from(captured?.headers).get('Authorization')).toBe('Bearer secret');
  });

  it('uses the direct base URL and skips optional headers when their values are absent', async () => {
    const api = createApiClient({
      apiBaseUrl: 'https://api.example',
      getTimezone: () => undefined,
      getToken: () => null,
    });
    let captured: InternalAxiosRequestConfig | undefined;
    api.defaults.adapter = async (config) => {
      captured = config;
      return { config, data: {}, headers: {}, status: 200, statusText: 'OK' };
    };

    await api.get('/status');

    expect(api.defaults.baseURL).toBe('https://api.example/api/v1');
    expect(AxiosHeaders.from(captured?.headers).get('Request-Source')).toBe('web');
    expect(AxiosHeaders.from(captured?.headers).get('Authorization')).toBeUndefined();
  });
});
