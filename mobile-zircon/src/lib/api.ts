import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getDefaultHost } from '@/lib/format';
import { useAuthStore } from '@/stores/authStore';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `${getDefaultHost()}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'x-platform': 'mobile',
  },
});

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshingPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const { refreshToken, setSession, clear } = useAuthStore.getState();
  if (!refreshToken) {
    clear();
    throw new Error('Sem refresh token');
  }

  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'x-platform': 'mobile' } },
    );
    const tokens = data.data as { accessToken: string; refreshToken: string };
    setSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    return tokens.accessToken;
  } catch (err) {
    clear();
    throw err;
  }
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['x-platform'] = 'mobile';
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        if (!refreshingPromise) {
          refreshingPromise = performRefresh().finally(() => {
            refreshingPromise = null;
          });
        }
        const newToken = await refreshingPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(err: unknown, fallback = 'Ocorreu um erro inesperado'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; errors?: Array<string | { message?: string }> } | undefined;
    if (data?.errors && data.errors.length > 0) {
      const first = data.errors[0];
      if (typeof first === 'string') return first;
      if (first?.message) return first.message;
    }
    if (data?.message) return data.message;
    if (err.code === 'ERR_NETWORK') {
      return 'Não foi possível conectar ao servidor Zircon. Verifique a URL da API.';
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
