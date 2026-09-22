import { z } from 'zod';

export const opportunitySchemas = {
  create: z.object({
    body: z.object({
      company_sector: z.string().max(100, 'Setor deve ter no máximo 100 caracteres').optional(),
      job_title: z.string().min(2, 'Título da vaga deve ter pelo menos 2 caracteres').max(255, 'Título da vaga deve ter no máximo 255 caracteres'),
      job_description: z.string().max(5000, 'Descrição deve ter no máximo 5000 caracteres').optional(),
      payment_value: z.coerce.number().positive('Valor deve ser positivo').max(999999.99, 'Valor muito alto').optional(),
      benefits_text: z.string().max(2000, 'Benefícios devem ter no máximo 2000 caracteres').optional(),
      work_modality: z.enum(['HOME_OFFICE', 'HIBRIDO', 'PRESENCIAL']).default('HOME_OFFICE'),
      status: z.enum(['ATIVA', 'PAUSADA', 'FINALIZADA', 'CANCELADA']).default('ATIVA'),
    }).strict(),
  }),

  update: z.object({
    body: z.object({
      company_sector: z.string().max(100, 'Setor deve ter no máximo 100 caracteres').optional(),
      job_title: z.string().min(2, 'Título da vaga deve ter pelo menos 2 caracteres').max(255, 'Título da vaga deve ter no máximo 255 caracteres').optional(),
      job_description: z.string().max(5000, 'Descrição deve ter no máximo 5000 caracteres').optional(),
      payment_value: z.coerce.number().positive('Valor deve ser positivo').max(999999.99, 'Valor muito alto').optional(),
      benefits_text: z.string().max(2000, 'Benefícios devem ter no máximo 2000 caracteres').optional(),
      work_modality: z.enum(['HOME_OFFICE', 'HIBRIDO', 'PRESENCIAL']).optional(),
      status: z.enum(['ATIVA', 'PAUSADA', 'FINALIZADA', 'CANCELADA']).optional(),
    }).strict(),
  }),

  list: z.object({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      status: z.enum(['ATIVA', 'PAUSADA', 'FINALIZADA', 'CANCELADA']).optional(),
      work_modality: z.enum(['HOME_OFFICE', 'HIBRIDO', 'PRESENCIAL']).optional(),
      company_sector: z.string().optional(),
      search: z.string().optional(),
      user_id: z.coerce.number().int().positive().optional(),
    }),
  }),

  adminUpdateStatus: z.object({
    body: z.object({
      status: z.enum(['ATIVA', 'PAUSADA', 'FINALIZADA', 'CANCELADA']),
    }).strict(),
  }),
};