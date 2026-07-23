import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';

import { createApiClient, useModuleApi } from '../src/api';

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

describe('useModuleApi', () => {
  it('builds every REST request with Query Kit serialization', async () => {
    const get = jest.fn().mockResolvedValue({ data: {} });
    const post = jest.fn().mockResolvedValue({ data: {} });
    const patch = jest.fn().mockResolvedValue({ data: {} });
    const remove = jest.fn().mockResolvedValue({ data: {} });
    const api = { get, post, patch, delete: remove } as unknown as AxiosInstance;
    type Resources = {
      users: { item: { id: string; name: string }; create: { name: string }; update: { name?: string } };
    };
    const users = useModuleApi<Resources, 'users'>(api, 'users');

    await users.query({ where: JSON.stringify({ name: 'Ada' }) });
    await users.get('a/b', { include: { team: true } });
    await users.findById('a');
    await users.count({ where: { active: true } });
    await users.create({ name: 'Ada' }, { dryRun: true });
    await users.update('a', { name: 'Grace' });
    await users.delete('a');

    expect(get).toHaveBeenNthCalledWith(1, '/users?where=%7B%22name%22%3A%22Ada%22%7D');
    expect(get).toHaveBeenNthCalledWith(2, '/users/a%2Fb?include[team]=true');
    expect(get).toHaveBeenNthCalledWith(3, '/users/find-by-id/a');
    expect(get).toHaveBeenNthCalledWith(4, '/users/count?where[active]=true');
    expect(post).toHaveBeenCalledWith('/users?dryRun=true', { name: 'Ada' });
    expect(patch).toHaveBeenCalledWith('/users/a', { name: 'Grace' });
    expect(remove).toHaveBeenCalledWith('/users/a');
  });
});
