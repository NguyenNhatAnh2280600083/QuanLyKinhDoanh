import api from './api';

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string | null;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name?: string | null;
  role_id: number;
  is_active: number;
  created_at: string;
  role: Role;
  permissions: string[];
}

export interface CreateAdminUserRequest {
  username: string;
  email: string;
  full_name?: string;
  password: string;
  role_id: number;
}

export interface UpdateAdminUserRequest {
  email?: string;
  full_name?: string;
  password?: string;
}

export const rbacService = {
  async listUsers() {
    const res = await api.get<AdminUser[]>('/admin/users');
    return res.data;
  },
  async createUser(payload: CreateAdminUserRequest) {
    const res = await api.post<AdminUser>('/admin/users', payload);
    return res.data;
  },
  async updateUser(id: number, payload: UpdateAdminUserRequest) {
    const res = await api.put<AdminUser>(`/admin/users/${id}`, payload);
    return res.data;
  },
  async changeUserRole(id: number, role_id: number) {
    const res = await api.put<AdminUser>(`/admin/users/${id}/role`, { role_id });
    return res.data;
  },
  async lockUser(id: number) {
    const res = await api.put<AdminUser>(`/admin/users/${id}/lock`);
    return res.data;
  },
  async unlockUser(id: number) {
    const res = await api.put<AdminUser>(`/admin/users/${id}/unlock`);
    return res.data;
  },
  async listRoles() {
    const res = await api.get<Role[]>('/admin/roles');
    return res.data;
  },
  async createRole(payload: { name: string; description?: string }) {
    const res = await api.post<Role>('/admin/roles', payload);
    return res.data;
  },
  async updateRole(id: number, payload: { name?: string; description?: string }) {
    const res = await api.put<Role>(`/admin/roles/${id}`, payload);
    return res.data;
  },
  async deleteRole(id: number) {
    const res = await api.delete<{ message: string }>(`/admin/roles/${id}`);
    return res.data;
  },
  async listPermissions() {
    const res = await api.get<Permission[]>('/admin/permissions');
    return res.data;
  },
  async setRolePermissions(role_id: number, permission_ids: number[]) {
    const res = await api.put<Role>(`/admin/roles/${role_id}/permissions`, { permission_ids });
    return res.data;
  },
};
