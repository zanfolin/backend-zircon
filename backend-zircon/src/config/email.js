export const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'your-email@example.com',
    pass: process.env.SMTP_PASS || 'your-email-password',
  },
  from: process.env.SMTP_FROM || 'Zircon <noreply@zircon.com>',
  verificationExpiry: process.env.EMAIL_VERIFICATION_EXPIRY || '10m',
  resetExpiry: process.env.PASSWORD_RESET_EXPIRY || '1h',
  frontendWebUrl: process.env.FRONTEND_WEB_URL || 'http://localhost:5173',
  frontendMobileUrl: process.env.FRONTEND_MOBILE_URL || 'zircon://',
};