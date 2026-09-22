import { z } from 'zod';

export const userSchemas = {
  updateProfile: z.object({
    body: z.object({
      full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
      bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
      phone_number: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional(),
    }).strict(),
  }),

  updateAvatar: z.object({
    body: z.object({}).strict(), // File is handled by multer
  }),

  changePassword: z.object({
    body: z.object({
      currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
      newPassword: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres'),
      confirmPassword: z.string(),
    }).refine((data) => data.newPassword === data.confirmPassword, {
      message: 'As senhas não conferem',
      path: ['confirmPassword'],
    }),
  }),

  adminUpdateUser: z.object({
    body: z.object({
      email: z.string().email('E-mail inválido').optional(),
      user_type: z.enum(['ADMIN', 'EMPRESA', 'PROFISSIONAL']).optional(),
      status: z.enum(['ATIVO', 'INATIVO', 'BLOQUEADO']).optional(),
      full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
      bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
      phone_number: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional(),
      document_type: z.enum(['CPF', 'CNPJ', 'Passaporte']).optional(),
      document_number: z.string().min(1, 'Número do documento é obrigatório').optional(),
    }).strict(),
  }),

  adminListUsers: z.object({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      user_type: z.enum(['ADMIN', 'EMPRESA', 'PROFISSIONAL']).optional(),
      status: z.enum(['ATIVO', 'INATIVO', 'BLOQUEADO']).optional(),
      search: z.string().optional(),
    }),
  }),
};