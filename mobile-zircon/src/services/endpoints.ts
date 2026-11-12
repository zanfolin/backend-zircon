import { api } from '@/lib/api';
import type {
  ApiResponse,
  Application,
  AuthSessionData,
  Opportunity,
  Pagination,
  User,
} from '@/types/api';

export const authApi = {
  async login(payload: { email: string; password: string }) {
    const { data } = await api.post<ApiResponse<AuthSessionData>>('/auth/login', payload);
    return data;
  },
  async register(payload: {
    email: string;
    password: string;
    document_number: string;
    full_name?: string;
    phone_number?: string;
  }) {
    const { data } = await api.post<ApiResponse<AuthSessionData>>('/auth/register', {
      ...payload,
      user_type: 'PROFISSIONAL',
      document_type: 'CPF',
    });
    return data;
  },
  async verifyEmail(code: string) {
    const { data } = await api.post<ApiResponse<null>>('/auth/verify-email', { code });
    return data;
  },
  async resendVerification(email: string) {
    const { data } = await api.post<ApiResponse<null>>('/auth/resend-verification', { email });
    return data;
  },
  async forgotPassword(email: string) {
    const { data } = await api.post<ApiResponse<null>>('/auth/forgot-password', { email });
    return data;
  },
  async resetPassword(payload: { token: string; password: string; confirmPassword: string }) {
    const { data } = await api.post<ApiResponse<null>>('/auth/reset-password', payload);
    return data;
  },
  async logout() {
    const { data } = await api.post<ApiResponse<null>>('/auth/logout');
    return data;
  },
  async me() {
    const { data } = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return data.data.user;
  },
};

export const userApi = {
  async getProfile() {
    const { data } = await api.get<ApiResponse<{ user: User }>>('/users/profile');
    return data.data.user;
  },
  async updateProfile(payload: { full_name?: string; bio?: string; phone_number?: string }) {
    const { data } = await api.put<ApiResponse<{ user: User }>>('/users/profile', payload);
    return data.data.user;
  },
  async uploadAvatar(asset: { uri: string; name?: string; type?: string }) {
    const form = new FormData();
    form.append('avatar', {
      uri: asset.uri,
      name: asset.name || 'avatar.jpg',
      type: asset.type || 'image/jpeg',
    } as unknown as Blob);
    const { data } = await api.put<ApiResponse<{ user: User }>>('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.user;
  },
  async changePassword(payload: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    const { data } = await api.put<ApiResponse<null>>('/users/password', payload);
    return data;
  },
  async deleteAccount() {
    const { data } = await api.delete<ApiResponse<null>>('/users/account');
    return data;
  },
};

export const opportunityApi = {
  async list(params?: {
    page?: number;
    limit?: number;
    status?: 'ATIVA';
    company_sector?: string;
    search?: string;
    user_id?: number;
  }) {
    const { data } = await api.get<ApiResponse<{ opportunities: Opportunity[]; pagination: Pagination }>>(
      '/opportunities',
      { params: { status: 'ATIVA', ...params } },
    );
    return data.data;
  },
  async getById(id: number) {
    const { data } = await api.get<ApiResponse<{ opportunity: Opportunity }>>(`/opportunities/${id}`);
    return data.data.opportunity;
  },
  async getSectors() {
    const { data } = await api.get<ApiResponse<{ sectors: string[] }>>('/opportunities/sectors');
    return data.data.sectors;
  },
};

export const applicationApi = {
  async create(vacancy_id: number) {
    const { data } = await api.post<ApiResponse<{ application: Application }>>('/applications', { vacancy_id });
    return data.data.application;
  },
  async listMy(params?: { page?: number; limit?: number }) {
    const { data } = await api.get<ApiResponse<{ applications: Application[]; pagination: Pagination }>>(
      '/applications/my',
      { params },
    );
    return data.data;
  },
  async getById(id: number) {
    const { data } = await api.get<ApiResponse<{ application: Application }>>(`/applications/${id}`);
    return data.data.application;
  },
  async cancel(id: number) {
    const { data } = await api.delete<ApiResponse<null>>(`/applications/${id}`);
    return data;
  },
};
