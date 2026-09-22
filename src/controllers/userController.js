import { userModel } from '../models/userModel.js';
import { passwordService } from '../services/passwordService.js';
import { uploadService } from '../services/uploadService.js';

export const userController = {
  async getProfile(req, res, next) {
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

  async updateProfile(req, res, next) {
    try {
      const { full_name, bio, phone_number } = req.body;

      const updateData = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (bio !== undefined) updateData.bio = bio;
      if (phone_number !== undefined) updateData.phone_number = phone_number;

      const user = await userModel.update(req.user.id, updateData);

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
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

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo enviado',
        });
      }

      const avatarUrl = uploadService.getFileUrl(req.file.filename);
      const user = await userModel.updateAvatar(req.user.id, avatarUrl);

      res.json({
        success: true,
        message: 'Avatar atualizado com sucesso',
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

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await userModel.findByIdWithPassword(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      const isValidPassword = await passwordService.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Senha atual incorreta',
        });
      }

      const passwordValidation = passwordService.validateStrength(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Nova senha fraca',
          errors: passwordValidation.errors,
        });
      }

      const hashedPassword = await passwordService.hash(newPassword);
      await userModel.updatePassword(req.user.id, hashedPassword);

      res.json({
        success: true,
        message: 'Senha alterada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteAccount(req, res, next) {
    try {
      await userModel.softDelete(req.user.id);

      res.json({
        success: true,
        message: 'Conta excluída com sucesso',
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin routes
  async adminListUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, user_type, status, search } = req.query;

      const users = await userModel.findAll({ page: Number(page), limit: Number(limit), user_type, status, search });
      const total = await userModel.count({ user_type, status, search });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async adminGetUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await userModel.findById(Number(id));
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  async adminUpdateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { email, user_type, status, full_name, bio, phone_number, document_type, document_number } = req.body;

      const user = await userModel.findById(Number(id));
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      const updateData = {};
      if (email !== undefined) updateData.email = email;
      if (user_type !== undefined) updateData.user_type = user_type;
      if (status !== undefined) updateData.status = status;
      if (full_name !== undefined) updateData.full_name = full_name;
      if (bio !== undefined) updateData.bio = bio;
      if (phone_number !== undefined) updateData.phone_number = phone_number;
      if (document_type !== undefined) updateData.document_type = document_type;
      if (document_number !== undefined) updateData.document_number = document_number;

      const updatedUser = await userModel.update(Number(id), updateData);

      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  },

  async adminDeleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await userModel.findById(Number(id));
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      // Prevent deleting self
      if (user.id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível excluir sua própria conta',
        });
      }

      await userModel.softDelete(Number(id));

      res.json({
        success: true,
        message: 'Usuário excluído com sucesso',
      });
    } catch (error) {
      next(error);
    }
  },
};