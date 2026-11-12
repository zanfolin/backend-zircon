import { z } from 'zod';
import { cpf } from 'cpf-cnpj-validator';

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
  if (!/[A-Z]/.test(password)) return 'Inclua pelo menos uma letra maiúscula';
  if (!/[a-z]/.test(password)) return 'Inclua pelo menos uma letra minúscula';
  if (!/[0-9]/.test(password)) return 'Inclua pelo menos um número';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Inclua pelo menos um caractere especial';
  return null;
}

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const registerProfessionalSchema = z
  .object({
    full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    document_number: z.string().min(1, 'CPF é obrigatório'),
    email: z.string().email('E-mail inválido'),
    phone_number: z.string().optional(),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  })
  .superRefine((data, ctx) => {
    const digits = data.document_number.replace(/\D/g, '');
    if (!cpf.isValid(digits)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPF inválido',
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
