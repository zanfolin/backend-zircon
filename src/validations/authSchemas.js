import { z } from 'zod';
import { validationService } from '../services/validationService.js';

// Custom validation for CPF/CNPJ
const documentValidation = (documentType, documentNumber) => {
  if (!validationService.validateDocument(documentType, documentNumber)) {
    return false;
  }
  return true;
};

export const authSchemas = {
  register: z.object({
    body: z.object({
      email: z.string().email('E-mail inválido'),
      password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
      user_type: z.enum(['ADMIN', 'EMPRESA', 'PROFISSIONAL']).default('PROFISSIONAL'),
      document_type: z.enum(['CPF', 'CNPJ', 'Passaporte']).default('CPF'),
      document_number: z.string().min(1, 'Número do documento é obrigatório'),
      full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
      phone_number: z.string().optional(),
    }).refine((data) => documentValidation(data.document_type, data.document_number), {
      message: 'Documento inválido',
      path: ['document_number'],
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string().email('E-mail inválido'),
      password: z.string().min(1, 'Senha é obrigatória'),
    }),
  }),

  verifyEmail: z.object({
    body: z.object({
      code: z.string().length(6, 'Código deve ter 6 dígitos'),
    }),
  }),

  resendVerification: z.object({
    body: z.object({
      email: z.string().email('E-mail inválido'),
    }),
  }),

  forgotPassword: z.object({
    body: z.object({
      email: z.string().email('E-mail inválido'),
    }),
  }),

  resetPassword: z.object({
    body: z.object({
      token: z.string().min(1, 'Token é obrigatório'),
      password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
      confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
      message: 'As senhas não conferem',
      path: ['confirmPassword'],
    }),
  }),

  refreshToken: z.object({
    body: z.object({
      refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
    }),
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
};