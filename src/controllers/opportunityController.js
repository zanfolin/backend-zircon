import { opportunityModel } from '../models/opportunityModel.js';
import { applicationModel } from '../models/applicationModel.js';
import { emailService } from '../services/emailService.js';
import { userModel } from '../models/userModel.js';
import { buildPaginatedResponse } from '../utils/apiResponse.js';

export const opportunityController = {
  async create(req, res, next) {
    try {
      const { company_sector, job_title, job_description, payment_value, benefits_text, work_modality, status } = req.body;

      const opportunity = await opportunityModel.create({
        user_id: req.user.id,
        company_sector: company_sector || null,
        job_title,
        job_description: job_description || null,
        payment_value: payment_value || null,
        benefits_text: benefits_text || null,
        work_modality: work_modality || 'HOME_OFFICE',
        status: status || 'ATIVA',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: 'Vaga criada com sucesso',
        data: { opportunity },
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    try {
      const { page = 1, limit = 20, status, work_modality, company_sector, search } = req.query;

      // Only show active opportunities by default for public listing
      const filters = {
        page: Number(page),
        limit: Number(limit),
        status: status || 'ATIVA',
        work_modality,
        company_sector,
        search,
      };

      const opportunities = await opportunityModel.findAll(filters);
      const total = await opportunityModel.count(filters);

      res.json(buildPaginatedResponse({
        message: 'Lista de vagas carregada com sucesso',
        collectionKey: 'opportunities',
        data: opportunities,
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

      const opportunity = await opportunityModel.findByIdWithCompany(Number(id));
      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message: 'Vaga não encontrada',
        });
      }

      res.json({
        success: true,
        data: { opportunity },
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { company_sector, job_title, job_description, payment_value, benefits_text, work_modality, status } = req.body;

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
          message: 'Acesso negado. Você só pode editar suas próprias vagas.',
        });
      }

      const updateData = {};
      if (company_sector !== undefined) updateData.company_sector = company_sector;
      if (job_title !== undefined) updateData.job_title = job_title;
      if (job_description !== undefined) updateData.job_description = job_description;
      if (payment_value !== undefined) updateData.payment_value = payment_value;
      if (benefits_text !== undefined) updateData.benefits_text = benefits_text;
      if (work_modality !== undefined) updateData.work_modality = work_modality;
      if (status !== undefined) updateData.status = status;

      const updatedOpportunity = await opportunityModel.update(Number(id), updateData);

      res.json({
        success: true,
        message: 'Vaga atualizada com sucesso',
        data: { opportunity: updatedOpportunity },
      });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;

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
          message: 'Acesso negado. Você só pode excluir suas próprias vagas.',
        });
      }

      await opportunityModel.softDelete(Number(id));

      res.json({
        success: true,
        message: 'Vaga excluída com sucesso',
      });
    } catch (error) {
      next(error);
    }
  },

  async listMyOpportunities(req, res, next) {
    try {
      const { page = 1, limit = 20, status, work_modality, company_sector, search } = req.query;

      const filters = {
        page: Number(page),
        limit: Number(limit),
        user_id: req.user.id,
        status,
        work_modality,
        company_sector,
        search,
      };

      const opportunities = await opportunityModel.findAll(filters);
      const total = await opportunityModel.count(filters);

      res.json(buildPaginatedResponse({
        message: 'Lista de vagas carregada com sucesso',
        collectionKey: 'opportunities',
        data: opportunities,
        page,
        limit,
        total,
      }));
    } catch (error) {
      next(error);
    }
  },

  async getSectors(req, res, next) {
    try {
      const sectors = await opportunityModel.getSectors();

      res.json({
        success: true,
        data: { sectors: sectors.map(s => s.company_sector) },
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin routes
  async adminListAll(req, res, next) {
    try {
      const { page = 1, limit = 20, status, work_modality, company_sector, search } = req.query;

      const filters = {
        page: Number(page),
        limit: Number(limit),
        status,
        work_modality,
        company_sector,
        search,
      };

      const opportunities = await opportunityModel.findAll(filters);
      const total = await opportunityModel.count(filters);

      res.json(buildPaginatedResponse({
        message: 'Lista de vagas carregada com sucesso',
        collectionKey: 'opportunities',
        data: opportunities,
        page,
        limit,
        total,
      }));
    } catch (error) {
      next(error);
    }
  },

  async adminUpdateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const opportunity = await opportunityModel.findById(Number(id));
      if (!opportunity) {
        return res.status(404).json({
          success: false,
          message: 'Vaga não encontrada',
        });
      }

      const updatedOpportunity = await opportunityModel.update(Number(id), { status });

      res.json({
        success: true,
        message: 'Status da vaga atualizado com sucesso',
        data: { opportunity: updatedOpportunity },
      });
    } catch (error) {
      next(error);
    }
  },
};