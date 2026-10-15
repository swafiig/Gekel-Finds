import { ApiUser, request } from './http';
import { toUser, User } from './authApi';

export const usersApi = {
  async getMe(): Promise<User> {
    return toUser(await request<ApiUser>('/users/me'));
  },
  /** Send only the fields you want to change. An empty email removes it. */
  async updateMe(patch: { name?: string; email?: string }): Promise<User> {
    const body: Record<string, string> = {};
    if (patch.name !== undefined) body.full_name = patch.name;
    if (patch.email !== undefined) body.email = patch.email;
    return toUser(await request<ApiUser>('/users/me', { method: 'PATCH', body }));
  },
};
