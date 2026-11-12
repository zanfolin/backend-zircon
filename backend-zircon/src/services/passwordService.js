import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const passwordService = {
  async hash(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  async compare(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  },

  validateStrength(password) {
    const errors = [];

    if (password.length < 8) {
      errors.push('A senha deve ter pelo menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};