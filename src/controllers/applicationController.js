import { applicationModel } from '../models/applicationModel.js';
import { opportunityModel } from '../models/opportunityModel.js';
import { userModel } from '../models/userModel.js';
import { emailService } from '../services/emailService.js';
import { buildPaginatedResponse } from '../utils/apiResponse.js';

export const applicationController = {
  async create(req, res, next) {
    try {
      const { vacancy_id } = req.body;

      // Check if opportunity exists and is active
      const opportunity = await opportunityModel.findById(vacancy_id);
      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message: 'Vaga não encontrada',
        });
      }

      if (opportunity.status !== 'ATIVA') {
        return res.status(400).json({
          success: false,
          message: 'Esta vaga não está mais aceitando candidaturas',
        });
      }

      // Check if user already applied
      const existingApplication = await applicationModel.findByUserAndVacancy(req.user.id, vacancy_id);
      if (existingApplication) {
        return res.status(409).json({
          success: false,
          message: 'Você já se candidatou a esta vaga',
        });
      }

      // Check if user is trying to apply to their own opportunity
      if (opportunity.user_id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Você não pode se candidatar à sua própria vaga',
        });
      }

      // Set expiration date (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      const application = await applicationModel.create({
        user_id: req.user.id,
        vacancy_id,
        status: 'PENDENTE',
        expiration_date: expirationDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Send notification email to company
      try {
        const company = await userModel.findById(opportunity.user_id);
        const professional = await userModel.findById(req.user.id);
        if (company && professional) {
          await emailService.sendApplicationNotification(company, professional, opportunity);
        }
      } catch (emailError) {
        console.error('Failed to send application notification:', emailError);
      }

      res.status(201).json({
        success: true,
        message: 'Candidatura enviada com sucesso',
        data: { application },
      });
    } catch (error) {
      next(error);
    }
  },

  async listMyApplications(req, res, next) {
    try {
      const { page = 1, limit = 20, status } = req.query;

      const filters = {
        page: Number(page),
        limit: Number(limit),
        user_id: req.user.id,
        status,
      };

      const applications = await applicationModel.findAll(filters);
      const total = await applicationModel.count(filters);

      res.json(buildPaginatedResponse({
        message: 'Lista de candidaturas carregada com sucesso',
        collectionKey: 'applications',
        data: applications,
        page,
        limit,
        total,
      }));
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const application = await applicationModel.findByIdWithDetails(Number(id));
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Candidatura não encontrada',
        });
      }

      // Check permissions: professional who applied, company that owns the opportunity, or admin
      const isOwner = application.user_id === req.user.id;
      const isCompany = application.opportunity_user_id === req.user.id;
      const isAdmin = req.user.user_type === 'ADMIN';

      if (!isOwner && !isCompany && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado',
        });
      }

      res.json({
        success: true,
        data: { application },
      });
    } catch (error) {
      next(error);
    }
  },

  async listByOpportunity(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, status } = req.query;

      const opportunity = await opportunityModel.findById(Number(id));
      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message: 'Vaga não encontrada',
        });
      }

      // Check ownership
      if (opportunity.user_id !== req.user.id && req.user.user_type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Você só pode ver candidaturas das suas vagas.',
        });
      }

      const filters = {
        page: Number(page),
        limit: Number(limit),
        vacancy_id: Number(id),
        status,
      };

      const applications = await applicationModel.getByVacancyWithProfessional(Number(id));
      const total = await applicationModel.count(filters);

      res.json(buildPaginatedResponse({
        message: 'Lista de candidaturas da vaga carregada com sucesso',
        collectionKey: 'applications',
        data: applications,
        page,
        limit,
        total,
      }));
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const application = await applicationModel.findByIdWithDetails(Number(id));
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Candidatura não encontrada',
        });
      }

      // Check ownership - only company that owns the opportunity or admin can update status
      const isCompany = application.opportunity_user_id === req.user.id;
      const isAdmin = req.user.user_type === 'ADMIN';

      if (!isCompany && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Apenas a empresa dona da vaga pode alterar o status.',
        });
      }

      // Validate status transition
      const validTransitions = {
        PENDENTE: ['EM_ANALISE', 'APROVADA', 'REJEITADA', 'CANCELADA'],
        EM_ANALISE: ['APROVADA', 'REJEITADA', 'CANCELADA'],
        APROVADA: [],
        REJEITADA: [],
        CANCELADA: [],
      };

      if (!validTransitions[application.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Transição de status inválida: ${application.status} -> ${status}`,
        });
      }

      const updatedApplication = await applicationModel.update(Number(id), { status });

      // Send notification email to professional
      try {
        const professional = await userModel.findById(application.user_id);
        const opportunity = await opportunityModel.findById(application.vacancy_id);
        if (professional && opportunity) {
          await emailService.sendApplicationStatusEmail(professional, opportunity, status);
        }
      } catch (emailError) {
        console.error('Failed to send status notification:', emailError);
      }

      res.json({
        success: true,
        message: 'Status da candidatura atualizado com sucesso',
        data: { application: updatedApplication },
      });
    } catch (error) {
      next(error);
    }
  },

  async cancel(req, res, next) {
    try {
      const { id } = req.params;

      const application = await applicationModel.findById(Number(id));
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Candidatura não encontrada',
        });
      }

      // Check ownership - only professional who applied or admin can cancel
      const isOwner = application.user_id === req.user.id;
      const isAdmin = req.user.user_type === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Você só pode cancelar suas próprias candidaturas.',
        });
      }

      // Can only cancel if not already in final state
      if (['APROVADA', 'REJEITADA', 'CANCELADA'].includes(application.status)) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível cancelar uma candidatura já finalizada',
        });
      }

      await applicationModel.update(Number(id), { status: 'CANCELADA' });

      res.json({
        success: true,
        message: 'Candidatura cancelada com sucesso',
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin routes
  async adminListAll(req, res, next) {
    try {
      const { page = 1, limit = 20, status, user_id, vacancy_id } = req.query;

      const filters = {
        page: Number(page),
        limit: Number(limit),
        status,
        user_id: user_id ? Number(user_id) : undefined,
        vacancy_id: vacancy_id ? Number(vacancy_id) : undefined,
      };

      const applications = await applicationModel.findAll(filters);
      const total = await applicationModel.count(filters);

      res.json(buildPaginatedResponse({
        message: 'Lista de candidaturas carregada com sucesso',
        collectionKey: 'applications',
        data: applications,
        page,
        limit,
        total,
      }));
    } catch (error) {
      next(error);
    }
  },
};