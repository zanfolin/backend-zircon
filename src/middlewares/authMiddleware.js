import { tokenService } from '../services/tokenService.js';
import { userModel } from '../models/userModel.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = tokenService.verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado',
      });
    }

    // Fetch user from database to ensure they still exist and are active
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    if (user.status !== 'ATIVO') {
      return res.status(403).json({
        success: false,
        message: 'Usuário inativo ou bloqueado',
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
      status: user.status,
      full_name: user.full_name,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
};

export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = tokenService.verifyAccessToken(token);

    if (!decoded) {
      return next();
    }

    const user = await userModel.findById(decoded.id);

    if (user && user.status === 'ATIVO') {
      req.user = {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        status: user.status,
        full_name: user.full_name,
      };
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};