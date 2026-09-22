import crypto from 'crypto';
import { userModel } from '../models/userModel.js';
import { tokenService } from '../services/tokenService.js';
import { emailService } from '../services/emailService.js';
import { passwordService } from '../services/passwordService.js';
import { validationService } from '../services/validationService.js';

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const authController = {
  async register(req, res, next) {
    try {
      const { email, password, user_type, document_type, document_number, full_name, phone_number } = req.body;

      // Check if email already exists
      const existingEmail = await userModel.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'E-mail já cadastrado',
        });
      }

      // Check if document already exists
      const existingDocument = await userModel.findByDocument(document_number);
      if (existingDocument) {
        return res.status(409).json({
          success: false,
          message: 'Documento já cadastrado',
        });
      }

      // Validate document
      if (!validationService.validateDocument(document_type, document_number)) {
        return res.status(400).json({
          success: false,
          message: 'Documento inválido',
        });
      }

      // Validate password strength
      const passwordValidation = passwordService.validateStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Senha fraca',
          errors: passwordValidation.errors,
        });
      }

      // Hash password
      const hashedPassword = await passwordService.hash(password);

      // Generate verification code
      const verificationCode = generateVerificationCode();

      // Create user
      const user = await userModel.create({
        email,
        password: hashedPassword,
        user_type,
        document_type,
        document_number,
        full_name: full_name || null,
        phone_number: phone_number || null,
        code_email_verification: verificationCode,
        verified_email: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Send verification email
      try {
        await emailService.sendVerificationEmail(user, verificationCode);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }

      // Generate tokens
      const tokens = tokenService.generateTokenPair(user);

      res.status(201).json({
        success: true,
        message: 'Usuário cadastrado com sucesso. Verifique seu e-mail para ativar a conta.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            user_type: user.user_type,
            full_name: user.full_name,
            verified_email: user.verified_email,
          },
          ...tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await userModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas',
        });
      }

      if (user.status !== 'ATIVO') {
        return res.status(403).json({
          success: false,
          message: 'Usuário inativo ou bloqueado',
        });
      }

      if (!user.verified_email) {
        return res.status(403).json({
          success: false,
          message: 'E-mail não verificado. Verifique sua caixa de entrada.',
        });
      }

      const isValidPassword = await passwordService.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas',
        });
      }

      const tokens = tokenService.generateTokenPair(user);

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: user.id,
            email: user.email,
            user_type: user.user_type,
            full_name: user.full_name,
            verified_email: user.verified_email,
          },
          ...tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async verifyEmail(req, res, next) {
    try {
      const { code } = req.body;

      const user = await userModel.findByVerificationCode(code);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Código de verificação inválido ou expirado',
        });
      }

      await userModel.verifyEmail(user.id);

      res.json({
        success: true,
        message: 'E-mail verificado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  },

  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;

      const user = await userModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      if (user.verified_email) {
        return res.status(400).json({
          success: false,
          message: 'E-mail já verificado',
        });
      }

      const verificationCode = generateVerificationCode();
      await userModel.updateVerificationCode(user.id, verificationCode);

      try {
        await emailService.sendVerificationEmail(user, verificationCode);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao enviar e-mail de verificação',
        });
      }

      res.json({
        success: true,
        message: 'Código de verificação reenviado',
      });
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await userModel.findByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        return res.json({
          success: true,
          message: 'Se o e-mail existir, você receberá instruções para redefinir a senha',
        });
      }

      const resetToken = generateResetToken();
      await userModel.updateVerificationCode(user.id, resetToken);

      try {
        await emailService.sendPasswordResetEmail(user, resetToken);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao enviar e-mail de redefinição',
        });
      }

      res.json({
        success: true,
        message: 'Se o e-mail existir, você receberá instruções para redefinir a senha',
      });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      const user = await userModel.findByPasswordResetToken(token);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Token inválido ou expirado',
        });
      }

      const passwordValidation = passwordService.validateStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Senha fraca',
          errors: passwordValidation.errors,
        });
      }

      const hashedPassword = await passwordService.hash(password);
      await userModel.updatePassword(user.id, hashedPassword);
      await userModel.updateVerificationCode(user.id, null); // Clear reset token

      res.json({
        success: true,
        message: 'Senha redefinida com sucesso',
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token é obrigatório',
        });
      }

      const decoded = tokenService.verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token inválido ou expirado',
        });
      }

      const user = await userModel.findById(decoded.id);
      if (!user || user.status !== 'ATIVO') {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado ou inativo',
        });
      }

      const tokens = tokenService.generateTokenPair(user);

      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      // With stateless JWT, logout is handled client-side by deleting tokens
      // Optionally, you could implement a token blacklist here
      res.json({
        success: true,
        message: 'Logout realizado com sucesso',
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const user = await userModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            user_type: user.user_type,
            status: user.status,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            bio: user.bio,
            phone_number: user.phone_number,
            document_type: user.document_type,
            document_number: user.document_number,
            verified_email: user.verified_email,
            created_at: user.created_at,
            updated_at: user.updated_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};