import { Router } from 'express';
import { applicationController } from '../controllers/applicationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRole, requireAdmin } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';
import { applicationSchemas } from '../validations/applicationSchemas.js';

const router = Router();

// Protected routes - Profissional
router.post('/', authMiddleware, requireRole('PROFISSIONAL', 'ADMIN'), validate(applicationSchemas.create), applicationController.create);
router.get('/my', authMiddleware, requireRole('PROFISSIONAL', 'ADMIN'), validate(applicationSchemas.listMyApplications), applicationController.listMyApplications);
router.get('/:id', authMiddleware, applicationController.getById);
router.delete('/:id', authMiddleware, requireRole('PROFISSIONAL', 'ADMIN'), applicationController.cancel);

// Protected routes - Empresa (view applications for their opportunities)
router.get('/opportunity/:id', authMiddleware, requireRole('EMPRESA', 'ADMIN'), validate(applicationSchemas.listByOpportunity), applicationController.listByOpportunity);
router.put('/:id/status', authMiddleware, requireRole('EMPRESA', 'ADMIN'), validate(applicationSchemas.updateStatus), applicationController.updateStatus);

// Admin routes
router.get('/admin/all', authMiddleware, requireAdmin, validate(applicationSchemas.adminListAll), applicationController.adminListAll);

export default router;