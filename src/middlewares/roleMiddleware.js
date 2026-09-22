export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticação necessária',
      });
    }

    if (!allowedRoles.includes(req.user.user_type)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissão insuficiente.',
      });
    }

    next();
  };
};

export const requireOwnershipOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticação necessária',
      });
    }

    // Admin can access everything
    if (req.user.user_type === 'ADMIN') {
      return next();
    }

    try {
      const resourceUserId = await getResourceUserId(req);

      if (resourceUserId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Você só pode acessar seus próprios recursos.',
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissão',
      });
    }
  };
};

export const requireEmpresaOrAdmin = requireRole('EMPRESA', 'ADMIN');
export const requireProfissionalOrAdmin = requireRole('PROFISSIONAL', 'ADMIN');
export const requireAdmin = requireRole('ADMIN');