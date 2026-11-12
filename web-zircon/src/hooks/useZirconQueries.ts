import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationApi, authApi, opportunityApi, userApi } from '../services/endpoints';
import { useAuthStore } from '../stores/authStore';
import type { Application, Opportunity, OpportunityStatus } from '../types/api';

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

export function useMyOpportunities(isAdmin: boolean) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['opportunities', isAdmin ? 'admin' : 'my', userId],
    queryFn: async () => {
      const res = isAdmin
        ? await opportunityApi.adminListAll({ page: 1, limit: 100 })
        : await opportunityApi.listMy({ page: 1, limit: 100 });
      return res.opportunities;
    },
  });
}

export function useAllApplications(isAdmin: boolean, opportunities: Opportunity[] | undefined) {
  return useQuery({
    queryKey: [
      'applications',
      isAdmin ? 'admin' : 'company',
      opportunities?.map((o) => `${o.id}:${o.status}`) ?? [],
    ],
    enabled: Boolean(opportunities),
    queryFn: async (): Promise<Application[]> => {
      const oppStatusById = new Map((opportunities || []).map((o) => [o.id, o.status]));
      if (isAdmin) {
        const res = await applicationApi.adminListAll({ page: 1, limit: 100 });
        const detailed = await Promise.all(
          res.applications.map((a) => applicationApi.getById(a.id).catch(() => a)),
        );
        return detailed.map((app) => ({
          ...app,
          opportunity_status: oppStatusById.get(app.vacancy_id) ?? null,
        }));
      }
      if (!opportunities || opportunities.length === 0) return [];
      const lists = await Promise.all(
        opportunities.map(async (opp) => {
          const res = await applicationApi.listByOpportunity(opp.id, { page: 1, limit: 100 });
          return res.applications.map((app) => ({
            ...app,
            job_title: opp.job_title,
            company_sector: opp.company_sector,
            work_modality: opp.work_modality,
            payment_value: opp.payment_value,
            opportunity_status: opp.status,
          }));
        }),
      );
      return lists.flat().sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
  });
}

export function useAdminUsers(enabled: boolean) {
  return useQuery({
    queryKey: ['users', 'admin'],
    enabled,
    queryFn: async () => {
      const res = await userApi.adminListUsers({ page: 1, limit: 100 });
      return res.users;
    },
  });
}

export function useOpportunityMutations() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['opportunities'] });
    qc.invalidateQueries({ queryKey: ['opportunity'] });
    qc.invalidateQueries({ queryKey: ['applications'] });
    qc.invalidateQueries({ queryKey: ['application'] });
  };

  const createMutation = useMutation({
    mutationFn: opportunityApi.create,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof opportunityApi.update>[1] }) =>
      opportunityApi.update(id, payload),
    onSuccess: invalidate,
  });

  const finalizeMutation = useMutation({
    mutationFn: ({ id, winningApplicationId }: { id: number; winningApplicationId?: number }) =>
      opportunityApi.finalize(id, winningApplicationId),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: opportunityApi.remove,
    onSuccess: invalidate,
  });

  const adminStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      winningApplicationId,
    }: {
      id: number;
      status: OpportunityStatus;
      winningApplicationId?: number;
    }) => opportunityApi.adminUpdateStatus(id, status, winningApplicationId),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, finalizeMutation, deleteMutation, adminStatusMutation };
}

export function useApplicationStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'EM_ANALISE' | 'APROVADA' | 'REJEITADA' | 'CANCELADA' }) =>
      applicationApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['application'] });
    },
  });
}
