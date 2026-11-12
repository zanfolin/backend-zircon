import { z } from 'zod';
import { cpf, cnpj } from 'cpf-cnpj-validator';

export function validateDocument(documentType: 'CPF' | 'CNPJ' | 'Passaporte', documentNumber: string): boolean {
  const cleaned = documentNumber.replace(/\D/g, '');
  switch (documentType) {
    case 'CPF':
      return cpf.isValid(cleaned);
    case 'CNPJ':
      return cnpj.isValid(cleaned);
    case 'Passaporte':
      return documentNumber.trim().length >= 6 && documentNumber.trim().length <= 20;
    default:
      return false;
  }
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
  if (!/[A-Z]/.test(password)) return 'Inclua pelo menos uma letra maiúscula';
  if (!/[a-z]/.test(password)) return 'Inclua pelo menos uma letra minúscula';
  if (!/[0-9]/.test(password)) return 'Inclua pelo menos um número';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Inclua pelo menos um caractere especial (!@#$...)';
  return null;
}

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const registerSchema = z
  .object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    document_type: z.enum(['CPF', 'CNPJ', 'Passaporte']).default('CNPJ'),
    document_number: z.string().min(1, 'Número do documento é obrigatório'),
    full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    phone_number: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!validateDocument(data.document_type, data.document_number)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.document_type} inválido`,
        path: ['document_number'],
      });
    }
    const pwErr = validatePasswordStrength(data.password);
    if (pwErr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: pwErr,
        path: ['password'],
      });
    }
  });

export const opportunitySchema = z.object({
  job_title: z.string().min(2, 'Informe um título com pelo menos 2 caracteres').max(255),
  company_sector: z.string().max(100).optional(),
  job_description: z.string().max(5000).optional(),
  payment_value: z.union([z.coerce.number().positive('Valor deve ser positivo').max(999999.99), z.literal('')]).optional(),
  benefits_text: z.string().max(2000).optional(),
  work_modality: z.enum(['HOME_OFFICE', 'HIBRIDO', 'PRESENCIAL']).default('HOME_OFFICE'),
  status: z.enum(['ATIVA', 'PAUSADA', 'FINALIZADA', 'CANCELADA']).default('ATIVA'),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone_number: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional(),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string().min(8, 'A nova senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    const pwErr = validatePasswordStrength(data.newPassword);
    if (pwErr) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: pwErr, path: ['newPassword'] });
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'As senhas não conferem', path: ['confirmPassword'] });
    }
  });
