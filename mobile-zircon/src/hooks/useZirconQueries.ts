import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationApi, authApi, opportunityApi } from '@/services/endpoints';
import { useAuthStore } from '@/stores/authStore';
import type { Application, Opportunity } from '@/types/api';

export function useMeQuery() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id);
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: ['me', userId],
    queryFn: async () => {
      const user = await authApi.me();
      setUser(user);
      return user;
    },
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });
}

export function useSectorsQuery() {
  return useQuery({
    queryKey: ['sectors'],
    queryFn: opportunityApi.getSectors,
    staleTime: 120_000,
  });
}

export function useInfiniteOpportunities(filters: { company_sector?: string; search?: string }) {
  return useInfiniteQuery({
    queryKey: ['opportunities', filters],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      return opportunityApi.list({
        page: pageParam,
        limit: 10,
        status: 'ATIVA',
        company_sector: filters.company_sector,
        search: filters.search || undefined,
      });
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
}

export function useOpportunityDetail(id: number | null) {
  return useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => opportunityApi.getById(id!),
    enabled: id !== null && !Number.isNaN(id),
  });
}

export function useMyApplicationsQuery() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['applications', 'my', userId],
    enabled: Boolean(accessToken),
    queryFn: async (): Promise<Application[]> => {
      const res = await applicationApi.listMy({ page: 1, limit: 100 });
      const detailed = await Promise.all(
        res.applications.map((a) => applicationApi.getById(a.id).catch(() => a)),
      );
      return detailed;
    },
  });
}

export function useCompanyOpportunities(companyId: number | null) {
  return useQuery({
    queryKey: ['opportunities', 'company', companyId],
    enabled: companyId !== null && !Number.isNaN(companyId),
    queryFn: async (): Promise<Opportunity[]> => {
      const res = await opportunityApi.list({ page: 1, limit: 50, status: 'ATIVA', user_id: companyId! });
      return res.opportunities;
    },
  });
}

export function useApplyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vacancyId: number) => applicationApi.create(vacancyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}

export function useCancelApplicationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: number) => applicationApi.cancel(applicationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
