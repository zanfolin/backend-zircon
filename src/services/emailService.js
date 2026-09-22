import nodemailer from 'nodemailer';
import { emailConfig } from '../config/email.js';

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
  }
  return transporter;
};

const sendEmail = async (to, subject, html) => {
  const transport = getTransporter();
  const mailOptions = {
    from: emailConfig.from,
    to,
    subject,
    html,
  };

  return transport.sendMail(mailOptions);
};

export const emailService = {
  async sendVerificationEmail(user, code) {
    const subject = 'Verifique seu e-mail - Zircon';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .code { font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; letter-spacing: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Zircon</h1>
            </div>
            <div class="content">
              <h2>Olá, ${user.full_name || 'Usuário'}!</h2>
              <p>Obrigado por se cadastrar no Zircon. Para completar seu cadastro, use o código de verificação abaixo:</p>
              <div class="code">${code}</div>
              <p>Este código expira em 10 minutos.</p>
              <p>Se você não solicitou este cadastro, por favor ignore este e-mail.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Zircon. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return sendEmail(user.email, subject, html);
  },

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${emailConfig.frontendWebUrl}/reset-password?token=${token}`;
    const subject = 'Redefinição de senha - Zircon';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Zircon</h1>
            </div>
            <div class="content">
              <h2>Olá, ${user.full_name || 'Usuário'}!</h2>
              <p>Você solicitou a redefinição de sua senha. Clique no botão abaixo para criar uma nova senha:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
              </p>
              <p>Ou copie e cole este link no navegador:</p>
              <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
              <p>Este link expira em 1 hora.</p>
              <p>Se você não solicitou esta redefinição, por favor ignore este e-mail.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Zircon. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return sendEmail(user.email, subject, html);
  },

  async sendApplicationNotification(company, professional, opportunity) {
    const subject = `Nova candidatura para ${opportunity.job_title} - Zircon`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Zircon</h1>
            </div>
            <div class="content">
              <h2>Olá, ${company.full_name || 'Empresa'}!</h2>
              <p>Você recebeu uma nova candidatura para a vaga <strong>${opportunity.job_title}</strong>.</p>
              <div class="info">
                <p><strong>Profissional:</strong> ${professional.full_name}</p>
                <p><strong>E-mail:</strong> ${professional.email}</p>
                <p><strong>Telefone:</strong> ${professional.phone_number || 'Não informado'}</p>
                <p><strong>Bio:</strong> ${professional.bio || 'Não informado'}</p>
              </div>
              <p>Acesse o painel da empresa para visualizar o perfil completo e gerenciar a candidatura.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 Zircon. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return sendEmail(company.email, subject, html);
  },

  async sendApplicationStatusEmail(professional, opportunity, status) {
    const statusMessages = {
      APROVADA: {
        title: 'Candidatura Aprovada!',
        message: 'Parabéns! Sua candidatura foi aprovada. A empresa entrará em contato com você em breve.',
        color: '#059669',
      },
      REJEITADA: {
        title: 'Candidatura Não Aprovada',
        message: 'Infelizmente sua candidatura não foi aprovada desta vez. Continue buscando novas oportunidades!',
        color: '#dc2626',
      },
      EM_ANALISE: {
        title: 'Candidatura em Análise',
        message: 'Sua candidatura está sendo analisada pela empresa. Você será notificado quando houver uma decisão.',
        color: '#2563eb',
      },
    };

    const statusInfo = statusMessages[status] || statusMessages.EM_ANALISE;

    const subject = `${statusInfo.title} - ${opportunity.job_title} - Zircon`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${statusInfo.color}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Zircon</h1>
            </div>
            <div class="content">
              <h2>Olá, ${professional.full_name || 'Profissional'}!</h2>
              <h3 style="color: ${statusInfo.color};">${statusInfo.title}</h3>
              <p>${statusInfo.message}</p>
              <div class="info">
                <p><strong>Vaga:</strong> ${opportunity.job_title}</p>
                <p><strong>Empresa:</strong> ${opportunity.company_name || 'Empresa'}</p>
                <p><strong>Modalidade:</strong> ${opportunity.work_modality}</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; 2024 Zircon. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return sendEmail(professional.email, subject, html);
  },
};