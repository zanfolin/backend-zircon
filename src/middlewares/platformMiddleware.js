export const platformMiddleware = (req, res, next) => {
  // Check for explicit platform header
  const platformHeader = req.headers['x-platform'];

  if (platformHeader && ['mobile', 'web'].includes(platformHeader)) {
    req.platform = platformHeader;
    return next();
  }

  // Fallback to User-Agent detection
  const userAgent = req.headers['user-agent'] || '';

  // Simple mobile detection
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);

  req.platform = isMobile ? 'mobile' : 'web';
  next();
};

export const requirePlatform = (...allowedPlatforms) => {
  return (req, res, next) => {
    if (!req.platform || !allowedPlatforms.includes(req.platform)) {
      return res.status(403).json({
        success: false,
        message: `Acesso restrito para plataforma: ${allowedPlatforms.join(', ')}`,
      });
    }
    next();
  };
};