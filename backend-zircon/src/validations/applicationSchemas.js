import { z } from 'zod';

export const applicationSchemas = {
  create: z.object({
    body: z.object({
      vacancy_id: z.coerce.number().int().positive('ID da vaga é obrigatório'),
    }).strict(),
  }),

  updateStatus: z.object({
    body: z.object({
      status: z.enum(['EM_ANALISE', 'APROVADA', 'REJEITADA', 'CANCELADA']),
    }).strict(),
  }),

  listMyApplications: z.object({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      status: z.enum(['PENDENTE', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'CANCELADA']).optional(),
    }),
  }),

  listByOpportunity: z.object({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      status: z.enum(['PENDENTE', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'CANCELADA']).optional(),
    }),
  }),

  adminListAll: z.object({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      status: z.enum(['PENDENTE', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'CANCELADA']).optional(),
      user_id: z.coerce.number().int().positive().optional(),
      vacancy_id: z.coerce.number().int().positive().optional(),
    }),
  }),
};