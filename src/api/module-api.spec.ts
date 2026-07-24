import type { AxiosInstance } from 'axios';

import { useModuleApi } from './module-api';

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
