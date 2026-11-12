import { api } from '../lib/api';
import type {
  ApiResponse,
  Application,
  ApplicationStatus,
  AuthSessionData,
  Opportunity,
  OpportunityStatus,
  Pagination,
  User,
  UserStatus,
  UserType,
  WorkModality,
} from '../types/api';

export const authApi = {
  async login(payload: { email: string; password: string }) {
    const { data } = await api.post<ApiResponse<AuthSessionData>>('/auth/login', payload);
    return data;
  },
  async register(payload: {
    email: string;
    password: string;
    user_type: UserType;
    document_type: 'CPF' | 'CNPJ' | 'Passaporte';
    document_number: string;
    full_name?: string;
    phone_number?: string;
  }) {
    const { data } = await api.post<ApiResponse<AuthSessionData>>('/auth/register', payload);
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
  async refresh(refreshToken: string) {
    const { data } = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
      refreshToken,
    });
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
  async uploadAvatar(file: File, onProgress?: (pct: number) => void) {
    const form = new FormData();
    form.append('avatar', file);
    const { data } = await api.put<ApiResponse<{ user: User }>>('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (evt.total && onProgress) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
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
  async adminListUsers(params?: {
    page?: number;
    limit?: number;
    user_type?: UserType;
    status?: UserStatus;
    search?: string;
  }) {
    const { data } = await api.get<ApiResponse<{ users: User[]; pagination: Pagination }>>('/users', { params });
    return data.data;
  },
  async adminUpdateUser(
    id: number,
    payload: Partial<
      Pick<User, 'email' | 'user_type' | 'status' | 'full_name' | 'bio' | 'phone_number' | 'document_type' | 'document_number'>
    >,
  ) {
    const { data } = await api.put<ApiResponse<{ user: User }>>(`/users/${id}`, payload);
    return data.data.user;
  },
  async adminDeleteUser(id: number) {
    const { data } = await api.delete<ApiResponse<null>>(`/users/${id}`);
    return data;
  },
};

export const opportunityApi = {
  async listMy(params?: {
    page?: number;
    limit?: number;
    status?: OpportunityStatus;
    work_modality?: WorkModality;
    company_sector?: string;
    search?: string;
  }) {
    const { data } = await api.get<ApiResponse<{ opportunities: Opportunity[]; pagination: Pagination }>>(
      '/opportunities/my',
      { params },
    );
    return data.data;
  },
  async adminListAll(params?: {
    page?: number;
    limit?: number;
    status?: OpportunityStatus;
    work_modality?: WorkModality;
    company_sector?: string;
    search?: string;
  }) {
    const { data } = await api.get<ApiResponse<{ opportunities: Opportunity[]; pagination: Pagination }>>(
      '/opportunities/admin/all',
      { params },
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
  async create(payload: {
    company_sector?: string;
    job_title: string;
    job_description?: string;
    payment_value?: number;
    benefits_text?: string;
    work_modality: WorkModality;
    status: OpportunityStatus;
  }) {
    const { data } = await api.post<ApiResponse<{ opportunity: Opportunity }>>('/opportunities', payload);
    return data.data.opportunity;
  },
  async update(
    id: number,
    payload: Partial<{
      company_sector: string;
      job_title: string;
      job_description: string;
      payment_value: number;
      benefits_text: string;
      work_modality: WorkModality;
      status: OpportunityStatus;
      winning_application_id: number;
    }>,
  ) {
    const { data } = await api.put<ApiResponse<{ opportunity: Opportunity; rejectedCount?: number }>>(
      `/opportunities/${id}`,
      payload,
    );
    return data.data.opportunity;
  },
  async finalize(id: number, winningApplicationId?: number) {
    const { data } = await api.put<ApiResponse<{ opportunity: Opportunity; rejectedCount?: number }>>(
      `/opportunities/${id}`,
      {
        status: 'FINALIZADA',
        ...(winningApplicationId !== undefined ? { winning_application_id: winningApplicationId } : {}),
      },
    );
    return data.data;
  },
  async remove(id: number) {
    const { data } = await api.delete<ApiResponse<null>>(`/opportunities/${id}`);
    return data;
  },
  async adminUpdateStatus(id: number, status: OpportunityStatus, winningApplicationId?: number) {
    const { data } = await api.put<ApiResponse<{ opportunity: Opportunity; rejectedCount?: number }>>(
      `/opportunities/admin/${id}/status`,
      {
        status,
        ...(winningApplicationId !== undefined ? { winning_application_id: winningApplicationId } : {}),
      },
    );
    return data.data.opportunity;
  },
};

export const applicationApi = {
  async listByOpportunity(id: number, params?: { page?: number; limit?: number; status?: ApplicationStatus }) {
    const { data } = await api.get<ApiResponse<{ applications: Application[]; pagination: Pagination }>>(
      `/applications/opportunity/${id}`,
      { params },
    );
    return data.data;
  },
  async getById(id: number) {
    const { data } = await api.get<ApiResponse<{ application: Application }>>(`/applications/${id}`);
    return data.data.application;
  },
  async updateStatus(id: number, status: Exclude<ApplicationStatus, 'PENDENTE'>) {
    const { data } = await api.put<ApiResponse<{ application: Application }>>(`/applications/${id}/status`, { status });
    return data.data.application;
  },
  async adminListAll(params?: {
    page?: number;
    limit?: number;
    status?: ApplicationStatus;
    user_id?: number;
    vacancy_id?: number;
  }) {
    const { data } = await api.get<ApiResponse<{ applications: Application[]; pagination: Pagination }>>(
      '/applications/admin/all',
      { params },
    );
    return data.data;
  },
};
